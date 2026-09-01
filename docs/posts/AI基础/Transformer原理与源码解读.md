---
title: Transformer 原理、QKV 消融、代码与源码解读
date: 2026-08-30
created: 2026-08-30
updated: 2026-09-01
---

# Transformer 原理、QKV 消融、代码与源码解读

Transformer 用注意力让任意两个 Token 直接交互，避免 RNN 必须沿时间步逐个传递信息。理解它的关键不是背诵结构图，而是弄清楚 Query、Key、Value（正确顺序通常写作 **Q/K/V**，有时也被口头写成 QKV 或 QVK）分别做什么，以及注意力层究竟在哪个维度混合信息。

::: danger 注意：Mask 语义和序列长度都可能引发线上事故
PyTorch 不同注意力 API 对布尔 Mask 的 `True` 含义并不完全一致，写反会泄漏未来 Token 或让模型关注 Padding。标准注意力的显存随长度近似平方增长，接口必须限制 Token 数并处理全被遮挡导致的 NaN；不能让任意超长输入直接占满共享 GPU。
:::

## 1. Transformer 为什么不再使用循环

RNN、LSTM、GRU 的 $h_t$ 依赖 $h_{t-1}$，训练时难以让所有时间步完全并行。两个相距很远的 Token 也要经过很长的状态传递路径。

自注意力一次构造所有 Token 两两之间的相关性：

```text
RNN:         x1 → h1 → h2 → h3 → ... → hT
Self-Attn:   每个 xi 都可以直接读取任意 xj
```

代价是标准注意力要保存 `[T, T]` 关系矩阵，时间和显存复杂度随序列长度呈 $O(T^2)$ 增长。

## 2. 输入：Token Embedding 加位置信息

文本先被 tokenizer 转成离散 Token ID，再查表得到向量：

$$
X=E[\text{token\_ids}]+P[\text{position\_ids}]
$$

`nn.Embedding(vocab_size, d_model)` 本质是形状 `[vocab_size, d_model]` 的可训练查找表。注意力自身对排列等变：若同时打乱 Token 顺序，输出也只是跟着打乱，不知道“第几个”。所以必须额外加入位置编码或在注意力中引入相对位置机制。

```python
import torch
from torch import nn

vocab_size, max_len, d_model = 30000, 512, 256
token_embedding = nn.Embedding(vocab_size, d_model)
position_embedding = nn.Embedding(max_len, d_model)

token_ids = torch.randint(0, vocab_size, (8, 100))  # [B, T]
positions = torch.arange(100).unsqueeze(0)           # [1, T]，按 batch 广播
x = token_embedding(token_ids) + position_embedding(positions)
print(x.shape)                                       # [8, 100, 256]
```

## 3. Q、K、V 到底是什么

对输入 $X\in\mathbb{R}^{B\times T\times D}$，先做三个可学习投影：

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V
$$

单头缩放点积注意力为：

$$
\operatorname{Attention}(Q,K,V)
=\operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V
$$

可以把一次检索类比为：

- **Query**：当前位置正在寻找什么。
- **Key**：每个位置用什么特征被匹配。
- **Value**：匹配成功后真正取回什么内容。

`Q @ K.transpose(-2, -1)` 产生 `[B, T_query, T_key]` 分数矩阵。Softmax 沿最后一维执行，使每个 Query 对所有 Key 的权重和为 1。再乘 V，得到每个 Query 从所有位置加权汇总的信息。

### 3.1 为什么要除以 $\sqrt{d_k}$

假设 Q、K 的每个分量近似零均值、单位方差，长度为 $d_k$ 的点积方差会随 $d_k$ 增大。过大的 logits 会把 Softmax 推入极端饱和区，梯度变小。除以 $\sqrt{d_k}$ 可把量级拉回稳定范围。

### 3.2 一个不依赖封装的注意力函数

```python
import math
import torch

def scaled_dot_product_attention(q, k, v, mask=None):
    # q: [B, H, Tq, Dh]
    # k: [B, H, Tk, Dh]
    # v: [B, H, Tk, Dv]
    scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))

    if mask is not None:
        # 本文约定 True 表示允许关注，False 表示屏蔽
        scores = scores.masked_fill(~mask, float("-inf"))

    weights = torch.softmax(scores, dim=-1)
    context = weights @ v
    return context, weights

q = torch.randn(2, 4, 6, 8)
k = torch.randn(2, 4, 6, 8)
v = torch.randn(2, 4, 6, 8)
context, weights = scaled_dot_product_attention(q, k, v)
print(context.shape)           # [2, 4, 6, 8]
print(weights.sum(dim=-1)[0])  # 每行接近 1
```

## 4. 如果没有 Q/K/V 矩阵，会发生什么

“没有 Q/K/V”有几种不同含义，结论并不相同。必须区分是**去掉投影矩阵**，还是**把注意力模块整体去掉**。

### 4.1 去掉 $W_Q,W_K,W_V$，直接令 Q=K=V=X

注意力仍然可以计算：

$$
\operatorname{softmax}\left(\frac{XX^T}{\sqrt D}\right)X
$$

它没有完全失效，但会明显退化：

1. Query 和 Key 被迫处于同一个固定特征空间，不能分别学习“我要找什么”和“我用什么被找到”。
2. 相似度只能按输入原始表示计算，模型无法学习适合当前层、当前任务的匹配度量。
3. Value 也等于原输入，不能把“用于匹配的特征”和“被取回的内容”解耦。
4. $XX^T$ 是对称的，但逐行 Softmax 后整体不一定对称；关系表达仍比独立 $QK^T$ 受限。
5. 每个 Token 通常与自己点积较大，尤其向量范数不一致时容易偏向自己。
6. 去掉投影会少掉约 $3D^2$ 个参数，但不是免费提速：$T^2D$ 的注意力矩阵计算仍然存在。

所以，无投影版本仍是“基于原始特征余弦/点积相似性的参数自由注意力”，不是标准 Transformer 中可学习的注意力。

### 4.2 只让 $W_Q=W_K$，但保留 $W_V$

此时匹配分数来自同一变换空间，参数更少，但无法建立非对称的查询/索引角色。例如代词“它”作为 Query 想找实体名词，而实体作为 Key 要暴露“可被指代”的特征，两种角色未必适合共用投影。

### 4.3 Q、K 变成全零或相同常量

所有未屏蔽位置的 score 相同，Softmax 变成均匀分布：

$$
\operatorname{softmax}(0)V=\frac{1}{T}\sum_{j=1}^{T}V_j
$$

每个 Query 只能拿到相同的全局平均值，无法根据当前位置选择信息。若有因果 mask，则第 $t$ 个位置得到前 $t$ 个 Value 的均值。

### 4.4 只去掉 $W_V$

令 $V=X$，Q/K 仍能学到“去哪里找”，但取回的只能是原始输入特征。模型仍可工作，后续输出投影与 FFN 能继续变换表示，只是匹配空间与内容空间的解耦能力下降。

### 4.5 把 Q/K/V 和注意力计算整体去掉

如果一个 Transformer Block 只剩逐 Token 的 LayerNorm、FFN 和残差，那么每个位置都独立计算：

$$
y_t=x_t+\operatorname{FFN}(\operatorname{LN}(x_t))
$$

FFN 对每个 Token 使用同一组参数，却不在 Token 维进行混合。无论堆多少层，位置 $t$ 的输出都无法读取其他位置的内容。文本模型就不能根据上下文消歧；只可能依赖当前位置 Token 及其位置编码。

### 4.6 可直接运行的消融代码

```python
import math
import torch
from torch import nn

class QKVAblationAttention(nn.Module):
    def __init__(self, d_model):
        super().__init__()
        self.q_proj = nn.Linear(d_model, d_model, bias=False)
        self.k_proj = nn.Linear(d_model, d_model, bias=False)
        self.v_proj = nn.Linear(d_model, d_model, bias=False)

    def forward(self, x, mode="full"):
        if mode == "full":
            q, k, v = self.q_proj(x), self.k_proj(x), self.v_proj(x)
        elif mode == "identity_qkv":
            q = k = v = x                    # 没有 Wq/Wk/Wv
        elif mode == "uniform":
            q = torch.zeros_like(x)          # QK^T 全为 0
            k = torch.zeros_like(x)
            v = self.v_proj(x)
        elif mode == "identity_v":
            q, k, v = self.q_proj(x), self.k_proj(x), x
        else:
            raise ValueError(f"unknown mode: {mode}")

        scores = q @ k.transpose(-2, -1) / math.sqrt(x.size(-1))
        weights = scores.softmax(dim=-1)
        return weights @ v, weights

torch.manual_seed(0)
x = torch.randn(1, 4, 8)
layer = QKVAblationAttention(8)

for mode in ["full", "identity_qkv", "uniform", "identity_v"]:
    output, weights = layer(x, mode)
    print(f"\n{mode}")
    print(weights[0].round(decimals=3))

# uniform 模式每行都应接近 [0.25, 0.25, 0.25, 0.25]
```

要做严谨实验，应该让完整模型与消融模型使用相同数据、训练步数、随机种子和优化器，并报告多次运行均值。单看随机初始化的 attention map 只能验证数学行为，不能证明下游准确率差多少。

## 5. 多头注意力为什么不是重复算多遍

将 $D$ 维拆成 $H$ 个头，每头维度 $D_h=D/H$：

$$
\operatorname{head}_i=\operatorname{Attention}(XW_i^Q,XW_i^K,XW_i^V)
$$

$$
\operatorname{MHA}(X)=\operatorname{Concat}(\operatorname{head}_1,\ldots,\operatorname{head}_H)W_O
$$

不同头有不同投影子空间，可以学习局部邻近、句法指代、主题相似等不同关系。头数增加不等于总表示维度增加；固定 `d_model` 时，每个头会变窄。

### 5.1 从零实现多头自注意力

```python
import math
import torch
from torch import nn

class MultiHeadSelfAttention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.0):
        super().__init__()
        if d_model % num_heads != 0:
            raise ValueError("d_model 必须能被 num_heads 整除")

        self.d_model = d_model
        self.num_heads = num_heads
        self.head_dim = d_model // num_heads
        self.scale = self.head_dim ** -0.5

        # 一次线性层同时生成 Q、K、V，输出最后一维为 3D
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.out_proj = nn.Linear(d_model, d_model)
        self.attn_dropout = nn.Dropout(dropout)
        self.out_dropout = nn.Dropout(dropout)

    def forward(self, x, causal=False, padding_mask=None, return_weights=False):
        batch_size, seq_len, _ = x.shape

        # [B,T,3D] -> [B,T,3,H,Dh] -> [3,B,H,T,Dh]
        qkv = self.qkv(x)
        qkv = qkv.reshape(batch_size, seq_len, 3,
                          self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(dim=0)

        # [B,H,T,Dh] @ [B,H,Dh,T] -> [B,H,T,T]
        scores = (q @ k.transpose(-2, -1)) * self.scale

        if causal:
            causal_mask = torch.ones(
                seq_len, seq_len, dtype=torch.bool, device=x.device
            ).tril()
            scores = scores.masked_fill(~causal_mask, float("-inf"))

        if padding_mask is not None:
            # padding_mask: [B,T]，本文约定 True 是有效 Token
            key_is_valid = padding_mask[:, None, None, :]
            scores = scores.masked_fill(~key_is_valid, float("-inf"))

        weights = torch.softmax(scores, dim=-1)
        weights = self.attn_dropout(weights)
        context = weights @ v                    # [B,H,T,Dh]

        # 先把 T 放回第二维，再拼接所有 head
        context = context.transpose(1, 2).contiguous()
        context = context.reshape(batch_size, seq_len, self.d_model)
        output = self.out_dropout(self.out_proj(context))
        return (output, weights) if return_weights else output

layer = MultiHeadSelfAttention(d_model=64, num_heads=8)
y, attention_map = layer(torch.randn(2, 10, 64), return_weights=True)
print(y.shape)              # [2, 10, 64]
print(attention_map.shape)  # [2, 8, 10, 10]
```

`contiguous()` 的作用是把转置后的逻辑顺序整理为连续内存，再安全 `reshape`。遗漏它有时仍能运行，但理解“维度顺序”和“内存布局”是调试注意力代码的重要基础。

## 6. Mask：哪些位置允许被看见

### 6.1 因果 Mask

语言模型预测第 $t$ 个 Token 时不能看到未来 Token。下三角 mask 让第 $t$ 行只能关注第 0 到 $t$ 列：

```text
允许关系（1 表示可见）
1 0 0 0
1 1 0 0
1 1 1 0
1 1 1 1
```

### 6.2 Padding Mask

批处理中短句会被 PAD 补齐。Padding mask 应屏蔽无效的 Key 位置，使真实 Query 不读取 PAD。若还会对输出做池化，也要排除 PAD 对应的 Query 输出。

### 6.3 PyTorch 不同 API 的布尔语义陷阱

- 本文手写代码：`True` 表示允许注意。
- `torch.nn.functional.scaled_dot_product_attention` 的布尔 `attn_mask`：`True` 表示参与注意。
- `nn.MultiheadAttention` 的二值 `key_padding_mask`：`True` 表示忽略该 Key。

不同接口的语义并不完全一致。传 mask 前必须阅读当前版本文档并用一个 `2 × 2` 小例子验证。

::: danger 注意：因果 Mask 写反会让评测结果虚高
模型训练时一旦看见未来答案，Loss 可能快速下降且代码不报错，但上线生成会立刻失效。为每种 API 固定一个可人工核对的微型矩阵单测，同时检查“被遮挡位置概率为 0”和“每行概率和为 1”；整行都被遮挡时还要避免 Softmax 产生 NaN。
:::

## 7. 完整 Transformer Block

注意力负责 Token 之间混合，FFN 负责每个 Token 内部的通道变换：

$$
\operatorname{FFN}(x)=W_2\,\operatorname{GELU}(W_1x+b_1)+b_2
$$

下面使用现代模型常见的 Pre-Norm：

```python
class TransformerBlock(nn.Module):
    def __init__(self, d_model, num_heads, mlp_ratio=4, dropout=0.1):
        super().__init__()
        hidden_dim = int(d_model * mlp_ratio)
        self.norm1 = nn.LayerNorm(d_model)
        self.attention = MultiHeadSelfAttention(d_model, num_heads, dropout)
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, d_model),
            nn.Dropout(dropout),
        )

    def forward(self, x, causal=False, padding_mask=None):
        x = x + self.attention(
            self.norm1(x), causal=causal, padding_mask=padding_mask
        )
        x = x + self.ffn(self.norm2(x))
        return x
```

残差连接要求子层输入输出都是 `[B,T,D]`。LayerNorm 对每个 Token 的最后一维归一化，不依赖同 batch 的其他样本，因此训练和推理行为一致。

### 7.1 Encoder 与 Decoder 的区别

- Encoder 自注意力通常能看完整输入，用于理解和编码。
- 自回归 Decoder 的自注意力使用因果 mask。
- 原始编码器—解码器 Transformer 还有交叉注意力：Q 来自 Decoder，K/V 来自 Encoder。这再次说明 Q 是“我要找什么”，K/V 是“到哪里找、取回什么”。

## 8. 一个最小因果语言模型

```python
class TinyTransformerLM(nn.Module):
    def __init__(self, vocab_size, max_len=128, d_model=128,
                 num_heads=4, num_layers=4):
        super().__init__()
        self.max_len = max_len
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(max_len, d_model)
        self.blocks = nn.ModuleList([
            TransformerBlock(d_model, num_heads, dropout=0.1)
            for _ in range(num_layers)
        ])
        self.norm = nn.LayerNorm(d_model)
        self.lm_head = nn.Linear(d_model, vocab_size, bias=False)

        # 权重绑定：输入、输出共享同一份词向量参数
        self.lm_head.weight = self.token_embedding.weight

    def forward(self, token_ids):
        batch_size, seq_len = token_ids.shape
        if seq_len > self.max_len:
            raise ValueError("序列长度超过 max_len")
        positions = torch.arange(seq_len, device=token_ids.device)
        x = self.token_embedding(token_ids) + self.position_embedding(positions)
        for block in self.blocks:
            x = block(x, causal=True)
        return self.lm_head(self.norm(x))         # [B,T,V]

vocab_size = 100
model = TinyTransformerLM(vocab_size)
tokens = torch.randint(0, vocab_size, (4, 32))

# 输入 0..T-2，监督目标是右移一位后的 1..T-1
logits = model(tokens[:, :-1])                    # [B,T-1,V]
targets = tokens[:, 1:]                           # [B,T-1]
loss = nn.functional.cross_entropy(
    logits.reshape(-1, vocab_size), targets.reshape(-1)
)
loss.backward()
print(loss.item())
```

真实语言模型还需要 tokenizer、数据打包、优化器、学习率调度、混合精度、检查点和生成策略。这段代码只保留最核心的因果建模路径。

## 9. PyTorch Q/K/V 源码是怎样实现的

### 9.1 `in_proj_weight`：三个矩阵打包存储

创建普通自注意力：

```python
import torch
from torch import nn

mha = nn.MultiheadAttention(embed_dim=64, num_heads=8, batch_first=True)
print(mha.in_proj_weight.shape)  # [192, 64]，即 [3D, D]
print(mha.in_proj_bias.shape)    # [192]
print(mha.out_proj.weight.shape) # [64, 64]

w_q, w_k, w_v = mha.in_proj_weight.chunk(3, dim=0)
b_q, b_k, b_v = mha.in_proj_bias.chunk(3, dim=0)
print(w_q.shape, w_k.shape, w_v.shape)  # 都是 [64, 64]
```

概念上它等价于：

```python
q = torch.nn.functional.linear(x, w_q, b_q)
k = torch.nn.functional.linear(x, w_k, b_k)
v = torch.nn.functional.linear(x, w_v, b_v)
```

把 Q/K/V 权重拼成 `[3D,D]` 主要是参数组织和计算优化，并不表示三个矩阵共享参数。它们只是保存在同一个大 Parameter 的不同切片中。

当 `kdim` 或 `vdim` 与 `embed_dim` 不同时，模块不能使用同一个 packed weight，会分别保存 `q_proj_weight`、`k_proj_weight`、`v_proj_weight`。

### 9.2 Python 层的主要调用路径

具体分支随 PyTorch 版本变化，典型路径为：

```text
nn.MultiheadAttention.forward(query, key, value, ...)
  ├─ 检查 dtype、shape、batch_first、mask 和快速路径条件
  ├─ 满足严格条件时调用 native multi-head attention 快速路径
  └─ 否则调用 torch.nn.functional.multi_head_attention_forward
       ├─ _in_projection_packed：生成并切分 Q、K、V
       ├─ reshape/transpose 为 [B, heads, T, head_dim]
       ├─ 合并或规范化 attn_mask、key_padding_mask
       ├─ 计算缩放点积注意力
       ├─ 拼接所有 head
       └─ out projection
```

当不需要返回注意力权重时，设置 `need_weights=False` 通常更容易进入优化的 scaled dot product attention 路径：

```python
output, weights = mha(x, x, x, need_weights=False)
assert weights is None
```

训练时不要为了日志每一步都请求完整 `[B,H,T,T]` 权重，它会增加显存和计算开销。

### 9.3 `scaled_dot_product_attention` 的后端

较新的 PyTorch 暴露：

```python
import torch.nn.functional as F

output = F.scaled_dot_product_attention(
    q, k, v,
    attn_mask=None,
    dropout_p=0.0,
    is_causal=True,
)
```

同一接口会根据设备、dtype、形状和环境选择可用实现，例如 Flash Attention 类融合内核、内存高效实现或数学回退实现。优化后端可能不会显式物化完整 attention matrix，但数学语义仍是缩放点积注意力。

注意：函数式 `scaled_dot_product_attention` 会按传入的 `dropout_p` 应用 dropout，不会自动读取某个 Module 的 `training` 状态。自定义模块通常写成：

```python
dropout_p = self.dropout if self.training else 0.0
```

### 9.4 查看当前 PyTorch 版本的实际源码

```python
import inspect
from torch import nn
import torch.nn.functional as F

print(inspect.getsource(nn.MultiheadAttention.forward))
print(inspect.getsource(F.multi_head_attention_forward))
```

若某个底层函数无法通过 `inspect` 显示，说明它由 C++/CUDA 扩展实现。此时沿 Python 调用参数继续查 PyTorch 仓库中的 ATen/native 实现，而不要假设底层就是教程里的几行矩阵乘法。

## 10. Q/K/V 的梯度如何获得

标准实现中 `in_proj_weight` 是一个 Parameter，反向传播会把 Q/K/V 三段梯度写到同一个 `.grad` 张量对应切片：

```python
mha = nn.MultiheadAttention(32, 4, batch_first=True)
x = torch.randn(2, 6, 32, requires_grad=True)
y, _ = mha(x, x, x, need_weights=False)
y.square().mean().backward()

grad_q, grad_k, grad_v = mha.in_proj_weight.grad.chunk(3, dim=0)
print(grad_q.norm(), grad_k.norm(), grad_v.norm())
```

三段通常都有梯度，但数值不相同，因为它们在公式中承担不同角色。这个实验也直接证明 packed weight 不是共享 Q=K=V。

## 11. 完整案例：一条文本怎样改变 Q/K/V 矩阵

下面用八条中文短句训练一个“正面/负面”分类器。模型只有单头自注意力，目的是完整打印文本“我 喜欢 机器人”的 embedding、随机 $W_Q/W_K/W_V$、Q/K/V、score、attention、分类损失、梯度和更新后矩阵。

```python
import math
import torch
from torch import nn
import torch.nn.functional as F

torch.manual_seed(31)

texts = [
    "我 喜欢 机器人", "我 喜欢 编程", "学习 人工 智能", "模型 很 有趣",
    "我 讨厌 故障", "我 讨厌 延迟", "系统 很 糟糕", "模型 很 难用",
]
labels = torch.tensor([1, 1, 1, 1, 0, 0, 0, 0])

vocab = {"<unk>": 0}
for text in texts:
    for word in text.split():
        if word not in vocab:
            vocab[word] = len(vocab)
token_ids = torch.tensor([
    [vocab[word] for word in text.split()] for text in texts
])

class TraceTextAttention(nn.Module):
    def __init__(self, vocab_size, seq_len=3, d_model=8):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.position = nn.Parameter(torch.randn(1, seq_len, d_model) * 0.02)
        # 分开写便于观察；官方 MultiheadAttention 通常打包为 in_proj_weight
        self.q_proj = nn.Linear(d_model, d_model, bias=False)
        self.k_proj = nn.Linear(d_model, d_model, bias=False)
        self.v_proj = nn.Linear(d_model, d_model, bias=False)
        self.head = nn.Linear(d_model, 2)

    def forward(self, tokens, return_trace=False):
        x = self.embedding(tokens) + self.position       # [B,3,8]
        q = self.q_proj(x)                               # [B,3,8]
        k = self.k_proj(x)
        v = self.v_proj(x)
        scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))
        attention = scores.softmax(dim=-1)               # [B,3,3]
        context = attention @ v                          # [B,3,8]
        logits = self.head(context.mean(dim=1))           # [B,2]
        if return_trace:
            return logits, x, q, k, v, scores, attention, context
        return logits

model = TraceTextAttention(len(vocab))
optimizer = torch.optim.SGD(model.parameters(), lr=0.3)

# ----- 第一次前向：逐个打印注意力的所有矩阵 -----
trace = model(token_ids[:1], return_trace=True)
logits, x, q, k, v, scores, attention, context = trace
probabilities = logits.softmax(dim=1)
loss = F.cross_entropy(logits, labels[:1])

wq_before = model.q_proj.weight.detach().clone()
wk_before = model.k_proj.weight.detach().clone()
wv_before = model.v_proj.weight.detach().clone()
attention_before = attention.detach().clone()

print("词表:", vocab)
print("Token IDs:", token_ids[0])
print("X=词向量+位置向量 [3,8]:\n", x[0])
print("随机 Wq [8,8]:\n", wq_before)
print("随机 Wk [8,8]:\n", wk_before)
print("随机 Wv [8,8]:\n", wv_before)
print("Q=XWq^T:\n", q[0])
print("K=XWk^T:\n", k[0])
print("V=XWv^T:\n", v[0])
print("scores=QK^T/sqrt(8):\n", scores[0])
print("每行 Softmax 后的 attention:\n", attention[0])
print("context=attention@V:\n", context[0])
print("logits / probabilities:", logits[0], probabilities[0])
print("CE 与 -log(p正面):", loss.item(),
      -torch.log(probabilities[0, 1]).item())

# ----- 第一次反向：Q/K/V 三个矩阵分别获得梯度 -----
optimizer.zero_grad()
loss.backward()
print("||dL/dWq||:", model.q_proj.weight.grad.norm().item())
print("||dL/dWk||:", model.k_proj.weight.grad.norm().item())
print("||dL/dWv||:", model.v_proj.weight.grad.norm().item())
print("Wq 左上角的梯度:\n", model.q_proj.weight.grad[:3, :3])
print("backward 后 Wq 未改变:",
      torch.equal(wq_before, model.q_proj.weight.detach()))

wq_gradient = model.q_proj.weight.grad.detach().clone()
optimizer.step()
print("Wq 更新量左上角:\n",
      (model.q_proj.weight.detach() - wq_before)[:3, :3])
print("Wq 变化是否等于 -lr×gradient:", torch.allclose(
    model.q_proj.weight.detach() - wq_before,
    -0.3 * wq_gradient,
    atol=1e-6,
))

# ----- 八条短句继续训练 100 轮 -----
for epoch in range(1, 101):
    optimizer.zero_grad()
    batch_logits = model(token_ids)
    batch_loss = F.cross_entropy(batch_logits, labels)
    batch_loss.backward()
    optimizer.step()

    if epoch in {1, 5, 10, 20, 50, 100}:
        accuracy = (model(token_ids).argmax(1) == labels).float().mean()
        print(f"epoch={epoch:03d}, loss={batch_loss.item():.4f}, "
              f"acc={accuracy.item():.3f}")

# 用同一句话比较训练前后的 attention 与参数
model.eval()
with torch.no_grad():
    final_trace = model(token_ids[:1], return_trace=True)
    final_logits = final_trace[0]
    attention_after = final_trace[6]
print("训练前 attention:\n", attention_before[0])
print("训练后 attention:\n", attention_after[0])
print("训练后 [负面,正面] 概率:", final_logits.softmax(dim=1)[0])
print("Wq/Wk/Wv 总变化:",
      (model.q_proj.weight - wq_before).norm().item(),
      (model.k_proj.weight - wk_before).norm().item(),
      (model.v_proj.weight - wv_before).norm().item())

# 对应官方源码的 packed in_proj_weight 布局 [3D,D]
packed_qkv_weight = torch.cat([
    model.q_proj.weight,
    model.k_proj.weight,
    model.v_proj.weight,
], dim=0)
print("打包后的 QKV 权重形状:", packed_qkv_weight.shape)  # [24,8]
```

以真实标签“正面”为例，损失是 $-\log p(\text{正面})$。梯度先调整分类头，再通过 `context = attention @ V` 分成两条主要路径：一条直接进入 V；另一条经过 Softmax 和 score 进入 Q、K。因此三个投影都有梯度，但范数和数值不同。

训练前 attention 只是随机投影产生的关系；训练后它会为当前八条数据形成有利于分类的关系。同时 embedding、位置向量和分类头也在变化，不能把损失下降全部归因于某一个 attention 元素。这个小案例的 100% 训练准确率表示成功过拟合教学数据，不等于对真实评论有泛化能力。

这段代码分开定义三个 `Linear` 是为了观察。源码中的 `nn.MultiheadAttention.in_proj_weight` 只是把最终三份权重沿第 0 维拼起来；反向传播的数学路径完全相同。

## 12. 复杂度与工程边界

Q/K/V 投影和 FFN 的复杂度大致随 $T D^2$ 增长，attention score/context 随 $T^2D$ 增长。短序列、大维度时线性层可能占主要成本；长序列时二次项逐渐成为瓶颈。

常见优化方向包括局部/滑窗注意力、稀疏注意力、低秩近似、分块计算、Flash Attention 和 KV Cache。KV Cache 不是删掉 K/V，而是在自回归生成时缓存过去 Token 的 K/V，避免每一步重复计算。

::: danger 注意：必须在进入模型前限制序列长度
不要等 GPU OOM 后再捕获异常；共享推理服务可能因此杀死同卡上的全部请求。接口层应限制 Token 数、batch 和并发，设置显存预算与超时，并对 KV Cache 做会话级配额和释放。截断时还要保留业务必需指令，不能静默裁掉安全规则。
:::

## 13. 常见错误

- 忘记 `d_model % num_heads == 0`。
- Softmax 用错维度；应对 Key 维即最后一维归一化。
- 使用 $\sqrt{d_model}$ 缩放每个头，而不是 $\sqrt{head_dim}$。
- `transpose` 后错误 `view`，把 head、Token 数据交叉。
- 因果 mask 方向反了，训练时偷看未来。
- Padding mask 的 True/False 语义在不同 API 间混用。
- 以为 `in_proj_weight` 是一个共享矩阵；实际上它包含 Q/K/V 三个切片。
- 以为没有投影矩阵就完全没有注意力；`Q=K=V=X` 仍可计算，只是表达能力受限。
- 将 attention map 当作完整的因果解释；权重只描述该层该头的加权关系，不等同于模型决策的全部原因。

下一篇 [ViT](./ViT视觉Transformer原理与源码解读.md) 会把图像切成 Patch Token，复用本篇的 Q/K/V 和 Transformer Block 完成视觉分类。

[[toc]]

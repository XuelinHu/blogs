---
title: Transformer 与 QLoRA：从矩阵、量化到梯度更新
date: 2026-09-07
created: 2026-09-07
updated: 2026-09-07
---

# Transformer 与 QLoRA：从矩阵、量化到梯度更新

你给出的 ResearchGate 图片展示了一个很关键的关系：Transformer 的线性层保留原来的大权重，同时在旁边增加一条 LoRA 低秩分支；QLoRA 再把“冻结的基础权重”压成 4 bit，在前向时反量化参与计算，真正更新的仍然只有 LoRA 参数。

参考图链接：[Schematic diagram of the transformer block and the LoRA block](https://www.researchgate.net/figure/Schematic-diagram-of-the-transformer-block-and-the-LoRA-block_fig3_393251535)。本文不直接复制该图片，而是在交互页面中用原创 SVG 重绘相同的数据流，并补充矩阵形状、梯度箭头和量化细节。

::: danger 先说边界：教学实现不等于生产训练框架
本文的纯 PyTorch 代码故意不依赖 `transformers`、`peft`、`bitsandbytes`，目的是让每个矩阵和梯度都能看见。它能运行一个极小的字符级语言模型，但没有生产大模型所需的 fused kernel、分布式并行、混合精度保护、分页优化器、完整 tokenizer 和 checkpoint 兼容性。不要把教学代码直接用于生产数据或高价值模型训练。
:::

## 1. 英文全称速查

| 缩写 | 英文全称 | 中文 | 本文中的作用 |
| --- | --- | --- | --- |
| Transformer | Transformer architecture | Transformer 架构 | 用自注意力处理 Token 序列；名称本身不是首字母缩写 |
| LLM | Large Language Model | 大语言模型 | 以大量文本训练的语言模型 |
| LoRA | Low-Rank Adaptation | 低秩适配 | 冻结基础模型，只训练低秩增量 |
| QLoRA | Quantized Low-Rank Adaptation | 量化低秩适配 | 4 bit 量化基础模型 + LoRA |
| PEFT | Parameter-Efficient Fine-Tuning | 参数高效微调 | LoRA、Prefix Tuning 等方法的总称 |
| SFT | Supervised Fine-Tuning | 监督微调 | 使用输入—目标答案样本训练 |
| MHA | Multi-Head Attention | 多头注意力 | 把特征分成多个头并行做注意力 |
| Q/K/V | Query / Key / Value | 查询/键/值 | 注意力的三个投影结果 |
| MLP | Multi-Layer Perceptron | 多层感知机 | Transformer block 内的逐 Token 前馈网络 |
| RMSNorm | Root Mean Square Layer Normalization | 均方根归一化 | LLaMA 类模型常用的归一化 |
| RoPE | Rotary Position Embedding | 旋转位置编码 | 把位置信息注入 Q/K |
| KV cache | Key-Value cache | 键值缓存 | 自回归生成时缓存历史 K/V |
| GQA | Grouped-Query Attention | 分组查询注意力 | 多个 Q 头共享较少的 K/V 头 |
| CE | Cross Entropy | 交叉熵 | 下一 Token 预测常用损失 |
| NF4 | NormalFloat 4-bit | 正态浮点四位量化 | QLoRA 论文提出的权重量化格式 |
| DQ | Double Quantization | 双重量化 | 再量化 NF4 的 block scale，节省额外存储 |
| FP4 | 4-bit Floating Point | 四位浮点 | 一种 4 bit 浮点格式，不等同于 NF4 |
| INT4 | 4-bit Integer | 四位整数 | 均匀整数标尺；与 NF4 的码本思想不同 |
| BF16 | Brain Floating Point 16-bit | 16 位脑浮点 | 训练中常用于计算和梯度 |
| FP16 | 16-bit Floating Point | 半精度浮点 | 比 FP32 省显存，但动态范围更小 |
| AdamW | Adam with Decoupled Weight Decay | 解耦权重衰减 Adam | 常用优化器；本文示例使用它更新 A/B |

## 2. 先看 Transformer block 的矩阵流

设一批 Token 的隐藏状态为：

$$
X\in\mathbb R^{B\times T\times D}
$$

其中 $B$ 是 batch size，$T$ 是序列长度，$D$ 是隐藏维度。一个简化的 decoder-only Transformer block 可以写成：

```text
Token IDs [B,T]
    │ Embedding
X [B,T,D]
    ├─ RMSNorm ─ Q=XWQᵀ, K=XWKᵀ, V=XWVᵀ
    │              └─ softmax((QKᵀ)/√d + causal mask)V
    ├─ residual add
    ├─ RMSNorm ─ MLP(X) = down(silu(gate(X)) ⊙ up(X))
    └─ residual add → 下一层
```

单头注意力的矩阵形状是：

| 张量 | 形状 | 物理/计算含义 |
| --- | --- | --- |
| $W_Q,W_K,W_V$ | $D\times d$ | 把隐藏状态投影到查询、匹配、内容空间 |
| $Q,K,V$ | $B\times T\times d$ | 每个 Token 的查询、键和值 |
| $QK^T$ | $B\times T\times T$ | 每个 Query 对每个 Key 的匹配分数 |
| $A$ | $B\times T\times T$ | 对每一行做 Softmax 后的注意力权重 |
| $AV$ | $B\times T\times d$ | 从所有历史位置按权重取回内容 |

公式为：

$$
Q=XW_Q,\quad K=XW_K,\quad V=XW_V
$$

$$
A=\operatorname{softmax}\left(\frac{QK^T}{\sqrt d}+M\right),\quad H=AV
$$

因果掩码 $M$ 把未来位置设成 $-\infty$，所以第 $t$ 个 Token 只能看见 `0...t`。这就是 decoder-only LLM 能做下一 Token 预测的数学原因。

### 2.1 Q、K、V 各自“像什么”

- Query（查询）：当前 Token 想寻找什么信息。
- Key（键）：每个历史 Token 用什么特征被匹配。
- Value（值）：匹配成功后真正取回的内容。

它们不是三种不同的 Token，而是同一个 $X$ 经过三组可学习矩阵后的三个坐标系。$QK^T$ 只决定“看谁”，$V$ 决定“取回什么”。

### 2.2 多头注意力

若有 $h$ 个头，通常 $d=D/h$。实现会把 `[B,T,D]` reshape 成 `[B,h,T,d]`，每个头各自计算 $QK^T$，最后拼接并乘 $W_O$。多头的意义不是简单重复，而是允许不同头学习语法关系、指代关系、位置关系或格式关系。

## 3. LoRA 到底在 Transformer 的哪里加了一条支路

以某个线性层为例，原始输出为：

$$
Y=XW_0^T
$$

LoRA 不直接修改 $W_0$，而是增加低秩增量：

$$
W=W_0+\Delta W,
\quad \Delta W=\frac{\alpha}{r}BA
$$

采用 `A ∈ R^{r×D_in}`、`B ∈ R^{D_out×r}` 的存储约定时：

$$
Y=XW_0^T+\frac{\alpha}{r}(XA^T)B^T
$$

矩阵形状可以逐项核对：

```text
X       [B,T,Din]
A       [r,Din]       → X @ A.T       [B,T,r]
B       [Dout,r]      → (...) @ B.T   [B,T,Dout]
W0      [Dout,Din]    → X @ W0.T      [B,T,Dout]
```

低秩假设的意思是：领域适配不需要重新学习一个完整的 $D_{out}\times D_{in}$ 矩阵，更新方向可以被一个小的中间维度 $r$ 表达。参数量从 $D_{out}D_{in}$ 变成 $r(D_{in}+D_{out})$。

例如 `D_in=D_out=4096, r=16`：

```text
完整矩阵：4096 × 4096 = 16,777,216 个参数
LoRA：16 × (4096 + 4096) = 131,072 个参数
约为原矩阵的 0.78%
```

LoRA 常挂在 `q_proj`、`k_proj`、`v_proj`、`o_proj`，也可以挂在 MLP 的 `gate_proj`、`up_proj`、`down_proj`。挂哪些层是能力、显存和速度之间的工程取舍。

::: warning 初始化为什么通常是 A 随机、B 全零
若 $B=0$，初始时 $\Delta W=0$，模型的第一轮前向与原模型完全一致；但 $\partial L/\partial B$ 通常非零，训练可以立即开始。若 A、B 都随机，微调一开始就会改变基础模型输出，可能造成不必要的冲击。
:::

## 4. 从一个 2×2 数字例子看 LoRA 的梯度

为了不被大模型维度遮住，令：

$$
X=\begin{bmatrix}1&2\end{bmatrix},\quad
A=\begin{bmatrix}0.1&0.2\\-0.1&0.3\end{bmatrix},\quad
B=\begin{bmatrix}0&0\\0&0\end{bmatrix}
$$

这里 $r=2$，所以：

$$
XA^T=\begin{bmatrix}0.5&0.5\end{bmatrix}
$$

由于 $B=0$：

$$
(XA^T)B^T=\begin{bmatrix}0&0\end{bmatrix}
$$

因此初始 LoRA 输出为 0。假设上游损失对 LoRA 输出的梯度是：

$$
G=\frac{\partial L}{\partial Y}=\begin{bmatrix}0.4&-0.2\end{bmatrix}
$$

令 $Z=XA^T$，则矩阵链式法则给出：

$$
\frac{\partial L}{\partial B}=\frac{\alpha}{r}G^TZ
$$

$$
\frac{\partial L}{\partial A}=\frac{\alpha}{r}(G B)^TX
$$

因为 $B=0$，第一步有：

$$
\frac{\partial L}{\partial A}=0
$$

而 $\partial L/\partial B$ 不为零。优化器先把 B 从零推开，第二步开始梯度才通过 B 传回 A。这是阅读训练日志时非常重要的现象：第一步看到 A 的梯度为零，不代表代码坏了。

## 5. QLoRA 在 LoRA 前面增加了什么

QLoRA 的核心不是“把 A/B 也量化成 4 bit”，而是：

1. 基础模型权重 $W_0$ 预先量化成 4 bit 并冻结。
2. 前向时把量化索引反量化成 BF16/FP16 参与矩阵乘法。
3. LoRA 的 A/B 通常以 BF16/FP16 或 FP32 保存并训练。
4. 梯度不更新 $W_0$ 的量化索引和 scale，只更新 A/B。

所以一个 QLoRA 线性层的前向可以写为：

$$
Y=X\operatorname{dequant}(q,s)^T+\frac{\alpha}{r}(XA^T)B^T
$$

量化节省的是基础模型权重和优化器状态的显存；LoRA 节省的是可训练参数和梯度状态。两者解决的是不同的内存来源。

### 5.1 4 bit 量化的矩阵过程

把一段权重分成 block。对每个 block 计算缩放因子：

$$
s=\max_i|w_i|
$$

把权重归一化并映射到码本 $c$ 中最近的码字：

$$
q_i=\arg\min_j\left|\frac{w_i}{s}-c_j\right|
$$

前向反量化：

$$
\hat w_i=s\,c_{q_i}
$$

`INT4` 往往使用均匀整数刻度；`NF4`（NormalFloat 4-bit）使用更适合近似正态分布权重的非均匀码本。代码中的 `NF4_CODEBOOK` 是教学版本，真实 bitsandbytes kernel 还要处理 block scale、dtype、CUDA kernel 和边界条件。

### 5.2 双重量化 Double Quantization

每个 block 的 scale 也要占存储。如果直接用 FP32 保存大量 scale，节省会被部分抵消。双重量化再把 scale 分组量化：

```text
W → 每个 block 得到 NF4 index + scale s
s → 再分 block 量化，得到 scale_index + second_scale
```

反量化时先恢复 `s`，再恢复 $W$。它不会让梯度更新量化权重，而是减少 scale 的额外存储。

## 6. 梯度究竟流到哪里

令：

$$
Y=Y_0+Y_{lora},\quad
Y_0=X\hat W_0^T,\quad
Y_{lora}=\frac{\alpha}{r}(XA^T)B^T
$$

若交叉熵损失为 $L$，设 $G=\partial L/\partial Y$，则：

$$
\frac{\partial L}{\partial B}=\frac{\alpha}{r}G^T(XA^T)
$$

$$
\frac{\partial L}{\partial A}=\frac{\alpha}{r}(GB)^TX
$$

对冻结的 $W_0$：

$$
\frac{\partial L}{\partial W_0}=0\quad\text{（不把它设为可训练参数）}
$$

注意，“基础权重冻结”不等于“梯度不经过基础分支”。反向传播仍需要经过注意力、MLP 和残差路径，才能计算 A/B 的梯度；只是到达 $W_0$ 时不保存其参数梯度，也不调用 optimizer.step 更新它。

在语言模型中，最后一步通常是：

$$
L=-\frac1N\sum_{t=1}^{N}\log p_\theta(y_t\mid y_{<t})
$$

`logits` 的梯度先回到 lm head，再经过每层的 $W_Q/W_K/W_V/W_O$ 和 LoRA 分支。一个 Token 的损失可能通过注意力矩阵影响多个历史 Token，因此 Q/K/V 的梯度不是各自孤立的。

## 7. 结合结构图读一次完整前向

配套实验页中的原创 SVG 把同一层拆成以下路径：

```text
X ────────────────× dequant(W0) ──┐
                                   ├─ 相加 → Y
X ──× A（降维到 r）─× B（升维）────┘
```

一次前向的具体顺序：

1. 从量化索引 `q` 和 block scale `s` 恢复 $hat W_0$。
2. 计算基础分支 `base = X @ W0_hat.T`。
3. 计算 `low = X @ A.T`，形状从 `D_in` 降到 `r`。
4. 计算 `update = low @ B.T * alpha/r`，恢复到 `D_out`。
5. `Y = base + update`，继续进入残差、归一化或下一层。
6. 交叉熵产生 loss；反向传播只把可训练梯度保存到 A/B。

如果 LoRA 插在 `q_proj`，它会改变 Q，从而改变 $QK^T$ 和注意力分布；插在 `v_proj` 则更直接地改变被取回的内容；插在 `o_proj` 会改变多头拼接后的输出。这个差异比“所有线性层都加 LoRA”更值得理解。

## 8. 纯 PyTorch 源代码：从量化到训练循环

完整代码：<a href="/blogs/code/qlora_from_scratch.py" target="_blank" rel="noreferrer">qlora_from_scratch.py</a>。它只导入 `torch`，没有调用官方大模型 API。核心类可以缩写为：

```python
class LoRALinear(nn.Module):
    def __init__(self, in_features, out_features, rank=2, alpha=4.0):
        super().__init__()
        base = torch.empty(out_features, in_features)
        nn.init.normal_(base, std=0.2)
        self.quantized_weight = QuantizedWeight(base)
        self.bias = nn.Parameter(torch.zeros(out_features))
        self.A = nn.Parameter(torch.empty(rank, in_features))
        self.B = nn.Parameter(torch.zeros(out_features, rank))
        nn.init.normal_(self.A, std=0.02)
        self.scale = alpha / rank

    def forward(self, x):
        frozen = self.quantized_weight()      # q、scale 反量化
        base = F.linear(x, frozen, self.bias)
        update = x @ self.A.t() @ self.B.t()
        return base + self.scale * update
```

训练循环故意写得很直白：

```python
trainable = [p for p in model.parameters() if p.requires_grad]
optimizer = torch.optim.AdamW(trainable, lr=0.08)

for step in range(8):
    logits, attention = model(input_ids)
    loss = F.cross_entropy(
        logits.reshape(-1, logits.size(-1)),
        target_ids.reshape(-1),
    )
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    print(loss.item(), model.attention.q_proj.B.grad.norm())
    optimizer.step()
```

这几行对应完整的数学过程：

| 代码 | 数学含义 |
| --- | --- |
| `logits = model(input_ids)` | 完成 Embedding、Q/K/V、注意力、MLP、lm head |
| `cross_entropy(...)` | $L=-\log p(y_t\mid y_{<t})$ |
| `loss.backward()` | 按链式法则计算 $\partial L/\partial A$、$\partial L/\partial B$ |
| `zero_grad()` | 清除上一轮累积梯度 |
| `optimizer.step()` | $A\leftarrow A-\eta\partial L/\partial A$，B 同理 |

运行后重点观察：

```text
step=00 ... q_proj.A.grad 范数: 0.0
step=00 ... q_proj.B.grad 范数: 非零
q_proj 基础权重有梯度吗: None
step=01 ... q_proj.A.grad 范数: 非零
```

这是 `B=0` 初始化和冻结基础权重共同产生的可解释现象，而不是 PyTorch 的特殊魔法。

## 9. 一个可手算的文本训练案例

源代码使用字符表 `电路安全很重要。` 构造下一字符预测：

```text
输入：电 路 安 全 很 重 要
目标：路 安 全 很 重 要 。
```

例如词表大小为 `V=7`、隐藏维度 `D=16`、LoRA rank `r=2`：

```text
token_ids              [1, 7]
embedding 输出         [1, 7, 16]
Q/K/V                  [1, 7, 16]
注意力分数             [1, 7, 7]
logits                 [1, 7, 7]
交叉熵目标             [1, 7]
```

训练前，Embedding、量化基础权重、A 和 B 都是随机/初始化矩阵；但 B 为零，所以 LoRA 对每个 logits 的增量为零。第一轮 `loss.backward()` 先得到 B 的梯度，更新 B；第二轮 A 才获得通过 B 传回的非零梯度。多轮之后：

$$
\hat W=\operatorname{dequant}(q,s)+\frac{\alpha}{r}BA
$$

的第二项逐渐学会让“电路”后面更倾向于预测“安全”等训练语料中的模式。

这不是让模型凭空获得事实知识：它只是在有限样本上调整条件分布。数据量太小会记忆文本，数据格式不一致会让梯度学习到错误模板，领域知识仍需要高质量数据、验证集和人工评测。

## 10. 为什么 QLoRA 能省显存

以一个 `D×D` 的 FP16 权重为例，单份权重约占 `2D²` bytes；训练全量参数还要为梯度和 AdamW 的一阶/二阶状态留空间。QLoRA 把冻结基础权重压到约 4 bit，并不为它建立可更新的 optimizer state；只为 LoRA A/B 建立梯度和优化器状态。

但显存不会简单变成四分之一：

- 反量化后的计算块仍可能以 BF16/FP16 暂存。
- 激活、注意力矩阵和 KV cache 仍然占显存。
- 优化器状态、梯度累积和 batch size 仍会增长。
- 量化 scale、元数据和临时 workspace 也需要空间。

因此 QLoRA 主要解决“冻结大模型的存储与训练状态”问题，不会消除长序列注意力的 $O(T^2)$ 激活成本。

## 11. 常见源码调用链与对应职责

真实工程中经常看到以下组件，但本文刻意不调用它们：

```text
Transformers AutoModelForCausalLM
  └─ Transformer block / attention / MLP
PEFT get_peft_model
  └─ 把 LoRA A/B 注入目标 Linear
bitsandbytes 4bit Linear
  └─ 保存量化权重并调用 CUDA 反量化矩阵乘 kernel
Trainer / TRL
  └─ 批处理、梯度累积、评估和 checkpoint
```

阅读源码时要区分三层：

1. Python 模块层：参数注册、forward、mask 和 shape。
2. 张量算子层：`matmul`、`softmax`、`cross_entropy`、autograd 图。
3. C++/CUDA kernel 层：实际的高性能矩阵乘、量化解码和显存调度。

“没有在 Python 里看到循环”不代表矩阵乘法消失了；它通常已经下沉到 ATen/Dispatcher 或第三方 CUDA kernel。

## 12. QLoRA 容易出生产事故的地方

::: danger 量化模型不是普通的可训练 FP16 模型
量化索引和 scale 的 dtype、设备、block 边界、反量化精度必须匹配。把 `uint8` 索引误当作浮点权重、把量化权重设成可训练 Parameter，都会造成错误的显存占用或训练结果。
:::

::: warning 只训练 A/B 也要检查参数清单
训练前打印 `named_parameters()` 和 `requires_grad`。确认基础权重、Embedding、Norm 是否按预期冻结，确认 optimizer 只拿到需要更新的参数。不要凭变量名猜测是否可训练。
:::

::: warning LoRA 合并不是简单相加任意 dtype
部署时通常计算 $W_{merged}=\hat W_0+(\alpha/r)BA$，但要先确认量化权重是否允许安全合并、目标 dtype、误差预算和回滚方案。合并后的权重不能再假设仍然拥有原始 4 bit 的存储优势。
:::

## 13. 交互实验

<TeachingDemo src="/demos/qlora-matrix-lab/" title="Transformer 与 QLoRA 矩阵实验台" :height="1080" />

实验台包含：

- Transformer block 与 LoRA 分支的原创结构图。
- 调整 rank、缩放系数和输入向量，观察低秩增量矩阵与参数量。
- 查看 `B=0` 初始化时第一轮 B 梯度非零、A 梯度为零的数值例子。
- 在 Q/K/V 投影和因果掩码下观察注意力矩阵。
- 拖动权重值，查看 NF4 码字、scale 和反量化误差。

## 14. 最后的心智模型

可以把 QLoRA 记成一句严格的话：

> Transformer 负责用 Q/K/V 和 MLP 建立 Token 之间的计算图；QLoRA 把基础线性层的 $W_0$ 以 4 bit 冻结保存，再用可训练的低秩 $BA$ 学习一个小的任务增量；交叉熵的梯度通过完整 Transformer 图传播，但 optimizer 只更新 A/B。

当你能同时回答下面四个问题，就真正读懂了这张结构图：

1. `QKᵀ` 是在算匹配关系，还是在取回内容？——匹配关系。
2. LoRA 的 $A$ 和 $B$ 为什么比完整矩阵少参数？——中间 rank $r$ 很小。
3. 量化权重为什么不更新？——索引/scale 是冻结 buffer，训练目标是 adapter。
4. B 初始为零时为什么还能训练？——第一步 B 梯度非零，第二步梯度再传到 A。

[[toc]]

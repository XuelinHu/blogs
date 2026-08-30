---
title: ViT 视觉 Transformer 原理、代码与源码解读
date: 2026-08-30
created: 2026-08-30
updated: 2026-08-30
---

# ViT 视觉 Transformer 原理、代码与源码解读

Vision Transformer（ViT）的核心思想很直接：把图像切成固定大小的 Patch，把每个 Patch 当成一个 Token，再用 Transformer Encoder 建模所有 Patch 之间的关系。它不是把每个像素都当 Token，否则标准注意力的二次复杂度会迅速失控。

## 1. 从图像到 Patch Token

输入图像形状为 `[B, C, H, W]`，Patch 边长为 $P$，要求 $H$、$W$ 能被 $P$ 整除。Patch 数量：

$$
N=\frac{H}{P}\times\frac{W}{P}
$$

每个 Patch 展平后长度为 $P^2C$，再乘投影矩阵映射到 $D$ 维：

$$
z_0^i=x_p^iE,\qquad E\in\mathbb{R}^{(P^2C)\times D}
$$

例如 `224 × 224` 图像、`P=16` 时得到 `14 × 14 = 196` 个 Patch Token。加入分类 Token 后序列长度为 197，注意力矩阵每个 head 的大小是 `197 × 197`。

```mermaid
flowchart LR
    A[图像 B,C,H,W] --> B[切成 P×P Patch]
    B --> C[展平并线性投影]
    C --> D[加入 CLS Token]
    D --> E[加入位置编码]
    E --> F[Transformer Encoder × L]
    F --> G[取 CLS 表示]
    G --> H[线性分类头]
```

## 2. 手动 Patchify

`unfold` 可以把二维局部块展开：

```python
import torch

def patchify(images, patch_size):
    # images: [B,C,H,W]
    batch, channels, height, width = images.shape
    if height % patch_size != 0 or width % patch_size != 0:
        raise ValueError("图像高宽必须能被 patch_size 整除")

    patches = images.unfold(2, patch_size, patch_size)
    patches = patches.unfold(3, patch_size, patch_size)
    # [B,C,Nh,Nw,P,P] -> [B,Nh,Nw,C,P,P] -> [B,N,P²C]
    patches = patches.permute(0, 2, 3, 1, 4, 5).contiguous()
    return patches.view(batch, -1, channels * patch_size * patch_size)

x = torch.arange(2 * 3 * 32 * 32, dtype=torch.float32).reshape(2, 3, 32, 32)
patches = patchify(x, patch_size=8)
print(patches.shape)  # [2, 16, 192]
```

Patch 顺序必须固定，一般先从左到右，再从上到下。位置编码就是在告诉 Transformer 每个 Patch 原来位于哪里。

## 3. 为什么 Patch Embedding 常用卷积实现

`kernel_size=P, stride=P` 且无 padding 的 `Conv2d` 恰好每次读取一个不重叠 Patch。每个输出通道的卷积核有 `C × P × P` 个参数，与 Patch 展平后的线性层完全对应：

```python
from torch import nn

class PatchEmbedding(nn.Module):
    def __init__(self, image_size=224, patch_size=16,
                 in_channels=3, d_model=768):
        super().__init__()
        if image_size % patch_size != 0:
            raise ValueError("image_size 必须能被 patch_size 整除")
        self.num_patches = (image_size // patch_size) ** 2
        self.projection = nn.Conv2d(
            in_channels,
            d_model,
            kernel_size=patch_size,
            stride=patch_size,
        )

    def forward(self, x):
        x = self.projection(x)       # [B,D,H/P,W/P]
        x = x.flatten(2)             # [B,D,N]
        return x.transpose(1, 2)     # [B,N,D]

embed = PatchEmbedding(image_size=224, patch_size=16,
                       in_channels=3, d_model=768)
print(embed(torch.randn(2, 3, 224, 224)).shape)  # [2,196,768]
```

### 3.1 证明卷积投影和线性投影等价

```python
torch.manual_seed(0)
images = torch.randn(2, 3, 16, 16)
patch_size, d_model = 4, 8
conv = nn.Conv2d(3, d_model, patch_size, stride=patch_size)
linear = nn.Linear(3 * patch_size * patch_size, d_model)

with torch.no_grad():
    # patchify 的展平顺序是 C,P,P，正好对应 Conv2d kernel 的布局
    linear.weight.copy_(conv.weight.reshape(d_model, -1))
    linear.bias.copy_(conv.bias)

y_conv = conv(images).flatten(2).transpose(1, 2)
y_linear = linear(patchify(images, patch_size))
print(torch.allclose(y_conv, y_linear, atol=1e-6))  # True
```

卷积在这里主要是高效完成 Patch 提取和共享线性投影，不代表 ViT 已经像典型 CNN 那样堆叠局部卷积层。

## 4. CLS Token 和位置编码

ViT 在 Patch 序列最前面放一个可学习的 `[CLS]` Token。经过多层自注意力，它可以从所有 Patch 汇总信息，最后作为分类特征：

```python
self.cls_token = nn.Parameter(torch.zeros(1, 1, d_model))
self.position_embedding = nn.Parameter(
    torch.zeros(1, num_patches + 1, d_model)
)

# forward 中扩展 batch，不复制参数存储
cls = self.cls_token.expand(batch_size, -1, -1)
x = torch.cat([cls, patch_tokens], dim=1)
x = x + self.position_embedding
```

也可以对全部 Patch Token 做全局平均池化，但必须与训练配置保持一致。CLS 并非天然包含图像信息，它靠注意力和下游损失学习如何聚合。

绝对位置编码通常绑定训练网格大小。将预训练 ViT 用于新分辨率时，Patch 网格变化，需要保留 CLS 位置并对二维 Patch 位置编码插值。

## 5. ViT 中的自注意力在看什么

加入 CLS 后，输入 $Z\in\mathbb{R}^{B\times(N+1)\times D}$。每层仍使用：

$$
Q=ZW_Q,\quad K=ZW_K,\quad V=ZW_V
$$

$$
\operatorname{Attention}(Q,K,V)=
\operatorname{softmax}\left(\frac{QK^T}{\sqrt{D_h}}\right)V
$$

Q/K/V 与文本 Transformer 的角色完全相同，只是 Token 变成了图像 Patch。某个 Patch 的 Query 可以匹配远处 Patch 的 Key，从对应 Value 取回信息。因此图像两端可以在一层内直接交互。

如果去掉 Q/K/V 投影并令 `Q=K=V=X`，ViT 仍会按 Patch 原始 embedding 点积聚合，但不能为不同层、不同 head 学习独立的匹配和内容空间。详细消融见 [Transformer 的“如果没有 Q/K/V 矩阵”章节](./Transformer原理与源码解读.md#_4-如果没有-q-k-v-矩阵-会发生什么)。

## 6. 从零实现一个小型 ViT

下面代码自包含 Patch Embedding、多头注意力、Encoder Block 和分类头：

```python
import torch
from torch import nn

class Attention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.0):
        super().__init__()
        if d_model % num_heads != 0:
            raise ValueError("d_model 必须能被 num_heads 整除")
        self.num_heads = num_heads
        self.head_dim = d_model // num_heads
        self.scale = self.head_dim ** -0.5
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        self.attn_dropout = nn.Dropout(dropout)
        self.proj_dropout = nn.Dropout(dropout)

    def forward(self, x):
        batch, tokens, channels = x.shape
        qkv = self.qkv(x).reshape(
            batch, tokens, 3, self.num_heads, self.head_dim
        ).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)                  # 每个都是 [B,H,N,Dh]

        weights = (q @ k.transpose(-2, -1)) * self.scale
        weights = self.attn_dropout(weights.softmax(dim=-1))
        x = weights @ v                          # [B,H,N,Dh]
        x = x.transpose(1, 2).contiguous().reshape(batch, tokens, channels)
        return self.proj_dropout(self.proj(x))

class EncoderBlock(nn.Module):
    def __init__(self, d_model, num_heads, mlp_ratio=4, dropout=0.1):
        super().__init__()
        hidden_dim = int(d_model * mlp_ratio)
        self.norm1 = nn.LayerNorm(d_model)
        self.attention = Attention(d_model, num_heads, dropout)
        self.norm2 = nn.LayerNorm(d_model)
        self.mlp = nn.Sequential(
            nn.Linear(d_model, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, d_model),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        x = x + self.attention(self.norm1(x))
        x = x + self.mlp(self.norm2(x))
        return x

class MiniViT(nn.Module):
    def __init__(self, image_size=32, patch_size=4, in_channels=3,
                 num_classes=10, d_model=192, num_heads=3,
                 depth=6, mlp_ratio=4, dropout=0.1):
        super().__init__()
        if image_size % patch_size != 0:
            raise ValueError("image_size 必须能被 patch_size 整除")

        self.image_size = image_size
        self.patch_embed = nn.Conv2d(
            in_channels, d_model,
            kernel_size=patch_size,
            stride=patch_size,
        )
        num_patches = (image_size // patch_size) ** 2
        self.cls_token = nn.Parameter(torch.zeros(1, 1, d_model))
        self.position_embedding = nn.Parameter(
            torch.zeros(1, num_patches + 1, d_model)
        )
        self.embedding_dropout = nn.Dropout(dropout)
        self.blocks = nn.ModuleList([
            EncoderBlock(d_model, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, num_classes)
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.trunc_normal_(self.position_embedding, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.patch_embed.weight, std=0.02)
        if self.patch_embed.bias is not None:
            nn.init.zeros_(self.patch_embed.bias)

    def forward(self, images):
        if images.shape[-2:] != (self.image_size, self.image_size):
            raise ValueError(f"期望图像尺寸为 {self.image_size} × {self.image_size}")

        x = self.patch_embed(images)              # [B,D,H/P,W/P]
        x = x.flatten(2).transpose(1, 2)          # [B,N,D]
        cls = self.cls_token.expand(x.size(0), -1, -1)
        x = torch.cat([cls, x], dim=1)            # [B,N+1,D]
        x = self.embedding_dropout(x + self.position_embedding)

        for block in self.blocks:
            x = block(x)

        cls_feature = self.norm(x)[:, 0]
        return self.head(cls_feature)             # 原始 logits

model = MiniViT()
images = torch.randn(4, 3, 32, 32)
logits = model(images)
print(logits.shape)                               # [4,10]
```

### 6.1 按形状解读 `forward`

以默认参数为例：

| 步骤 | 张量形状 | 含义 |
| --- | --- | --- |
| 输入 | `[B,3,32,32]` | CIFAR 图像 |
| Patch Conv | `[B,192,8,8]` | 64 个 Patch 的二维网格 |
| flatten + transpose | `[B,64,192]` | Patch Token 序列 |
| 拼接 CLS | `[B,65,192]` | 增加分类聚合位置 |
| Encoder | `[B,65,192]` | 所有 Token 相互建模 |
| 取 `[:,0]` | `[B,192]` | 分类表示 |
| head | `[B,10]` | 十类 logits |

## 7. CIFAR-10 训练骨架

小数据从零训练 ViT 不一定超过 CNN，这正好可以观察归纳偏置差异。下面假设已定义 `MiniViT`：

```python
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
train_transform = transforms.Compose([
    transforms.RandomCrop(32, padding=4),
    transforms.RandomHorizontalFlip(),
    transforms.RandAugment(num_ops=2, magnitude=9),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465),
                         (0.2470, 0.2435, 0.2616)),
])
test_transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465),
                         (0.2470, 0.2435, 0.2616)),
])

train_set = datasets.CIFAR10("./data", train=True, download=True,
                             transform=train_transform)
test_set = datasets.CIFAR10("./data", train=False, download=True,
                            transform=test_transform)
train_loader = DataLoader(train_set, batch_size=128, shuffle=True,
                          num_workers=2, pin_memory=torch.cuda.is_available())
test_loader = DataLoader(test_set, batch_size=256, shuffle=False,
                         num_workers=2)

model = MiniViT().to(device)
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.05)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

for epoch in range(100):
    model.train()
    for images, targets in train_loader:
        images, targets = images.to(device), targets.to(device)
        optimizer.zero_grad()
        loss = criterion(model(images), targets)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
    scheduler.step()

    model.eval()
    correct = total = 0
    with torch.no_grad():
        for images, targets in test_loader:
            images, targets = images.to(device), targets.to(device)
            correct += (model(images).argmax(1) == targets).sum().item()
            total += targets.numel()
    print(f"epoch={epoch + 1:03d}, test_acc={correct / total:.3f}")
```

实际训练可再使用 warmup、Mixup、CutMix、随机深度和指数滑动平均。不要只给 ViT 使用强增强，却用弱增强的 CNN 作对比。

## 8. Patch 大小如何影响成本

图像尺寸固定时，Patch 边长减半，Token 数量约变为 4 倍，注意力矩阵大小约变为 16 倍：

| 图像 | Patch | Token 数（不含 CLS） | 单 head 注意力元素数 |
| --- | --- | ---: | ---: |
| 224 × 224 | 32 × 32 | 49 | 2,401 |
| 224 × 224 | 16 × 16 | 196 | 38,416 |
| 224 × 224 | 8 × 8 | 784 | 614,656 |

Patch 越小，细节更丰富但成本更高；Patch 越大，计算便宜但可能在进入模型前就丢掉小目标信息。

## 9. ViT 与 CNN 的本质区别

| 对比项 | CNN | ViT |
| --- | --- | --- |
| 空间先验 | 强：局部连接、平移共享 | 相对弱：Patch 化后主要靠数据学习关系 |
| 早期交互 | 局部邻域 | 一层即可全局交互 |
| 数据需求 | 中小数据通常更稳 | 大规模预训练时优势更明显 |
| 分辨率成本 | 随特征图近似线性增长 | 标准注意力随 Token 数平方增长 |
| 可变尺寸 | 全卷积结构较自然 | 绝对位置编码常需插值 |

很多现代视觉模型会混合两者，例如卷积 Stem、窗口注意力、分层下采样。这说明“CNN 或 Transformer”不是必须二选一。

## 10. Torchvision ViT 源码调用链

以 `torchvision.models.vision_transformer.VisionTransformer` 为例，主要组件为：

```text
VisionTransformer.forward(x)
  ├─ _process_input(x)
  │    ├─ conv_proj: kernel=P, stride=P
  │    ├─ reshape 为 [B,D,N]
  │    └─ permute 为 [B,N,D]
  ├─ expand class_token 并拼到序列头部
  ├─ encoder(x)
  │    ├─ 加 encoder.pos_embedding
  │    ├─ dropout
  │    ├─ 多个 EncoderBlock
  │    │    ├─ LayerNorm + nn.MultiheadAttention + residual
  │    │    └─ LayerNorm + MLPBlock + residual
  │    └─ 最终 LayerNorm
  ├─ 取 x[:, 0]
  └─ heads(x) 输出分类 logits
```

查看模块结构与关键参数：

```python
from torchvision.models import vit_b_16

model = vit_b_16(weights=None)
print(model.conv_proj)                       # Patch projection
print(model.class_token.shape)               # [1,1,768]
print(model.encoder.pos_embedding.shape)     # [1,197,768]
print(model.encoder.layers[0].self_attention)
print(model.heads)
```

Torchvision 的 EncoderBlock 使用 `nn.MultiheadAttention`，其 Q/K/V 通常打包在 `in_proj_weight` 中：

```python
attention = model.encoder.layers[0].self_attention
w_q, w_k, w_v = attention.in_proj_weight.chunk(3, dim=0)
print(w_q.shape, w_k.shape, w_v.shape)        # 各为 [768,768]
```

这与手写实现的 `self.qkv = nn.Linear(D, 3 * D)` 是同一参数布局思想。

### 10.1 为什么源码中看不到显式 `patchify`

官方实现直接用 `conv_proj` 提取 Patch，然后 reshape/permute。因为卷积 kernel 和 stride 都等于 Patch 大小，所以它与“unfold → flatten → linear”数学等价，且更容易使用优化后的卷积内核。

### 10.2 预训练权重与位置编码插值

加载不同分辨率时，分类 Token 的位置编码保持不变；其余位置编码恢复为二维 Patch 网格，做二维插值后再展平拼回。直接截断或补零通常会破坏原有空间结构。

不同 torchvision 版本对辅助函数和参数名可能有调整，应查看本机版本：

```python
import inspect
from torchvision.models.vision_transformer import VisionTransformer

print(inspect.getsource(VisionTransformer._process_input))
print(inspect.getsource(VisionTransformer.forward))
```

## 11. 怎样观察注意力图

手写 `Attention` 可以选择返回 Softmax 后的 `weights`，形状为 `[B,H,N+1,N+1]`。观察 CLS 那一行可得到“分类 Token 从哪些 Patch 聚合信息”的一层视角。将 Patch 权重还原为二维网格再插值到原图即可可视化。

但要谨慎解释：

- 不同层和 head 关注模式不同。
- 注意力中还有 residual，输出不只来自 attention 分支。
- attention weight 高不等价于对最终分类的因果贡献高。
- 真正的归因分析应结合梯度、遮挡实验或 attention rollout 等方法。

## 12. 常见错误

- 图像尺寸不能被 Patch 大小整除，却直接 reshape。
- `flatten` 后忘记 transpose，得到 `[B,D,N]` 而注意力期望 `[B,N,D]`。
- 忘记把 CLS 也计入位置编码长度。
- 换输入分辨率后直接加载旧位置编码，形状不匹配。
- 从零训练小数据 ViT 时没有增强、正则化和合适的训练周期。
- 直接加载预训练权重，却使用不一致的输入归一化。
- Patch 太大导致小目标在投影阶段丢失；Patch 太小又导致显存爆炸。

## 13. 完整案例：ViT 判断货架标记在左侧还是右侧

假设仓库相机输出 `8 × 8` 灰度缩略图，亮色标记出现在左半边时标签为 0，出现在右半边时标签为 1。`patch_size=4` 会把图片切成 `2 × 2` 共四个 Patch；加上 CLS 后，注意力矩阵只有 `5 × 5`，可以完整打印。

```python
import math
import torch
from torch import nn
import torch.nn.functional as F

torch.manual_seed(41)

def make_marker_images(sample_count=80):
    images, labels = [], []
    for index in range(sample_count):
        label = index % 2                       # 0=左侧，1=右侧
        image = 0.03 * torch.randn(1, 8, 8)
        column = 0 if label == 0 else 4
        image[0, :, column:column + 4] += 1.0
        images.append(image.clamp(0, 1))
        labels.append(label)
    return torch.stack(images), torch.tensor(labels)

class TraceTinyViT(nn.Module):
    def __init__(self, d_model=8):
        super().__init__()
        self.patch_embed = nn.Conv2d(1, d_model, kernel_size=4, stride=4)
        self.cls_token = nn.Parameter(torch.randn(1, 1, d_model) * 0.02)
        self.position = nn.Parameter(torch.randn(1, 5, d_model) * 0.02)
        self.norm = nn.LayerNorm(d_model)
        self.q_proj = nn.Linear(d_model, d_model, bias=False)
        self.k_proj = nn.Linear(d_model, d_model, bias=False)
        self.v_proj = nn.Linear(d_model, d_model, bias=False)
        self.out_proj = nn.Linear(d_model, d_model)
        self.head = nn.Linear(d_model, 2)

    def forward(self, images, return_trace=False):
        patch_tokens = self.patch_embed(images).flatten(2).transpose(1, 2)
        cls = self.cls_token.expand(images.size(0), -1, -1)
        tokens = torch.cat([cls, patch_tokens], dim=1) + self.position

        normalized = self.norm(tokens)
        q = self.q_proj(normalized)
        k = self.k_proj(normalized)
        v = self.v_proj(normalized)
        scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))
        attention = scores.softmax(dim=-1)
        context = attention @ v
        encoded = tokens + self.out_proj(context)
        logits = self.head(encoded[:, 0])

        if return_trace:
            return (logits, patch_tokens, tokens, q, k, v,
                    scores, attention, context)
        return logits

images, labels = make_marker_images()
model = TraceTinyViT()

# ----- 第一次前向：像素如何变成四个 Patch Token -----
trace = model(images[:1], return_trace=True)
(logits, patch_tokens, tokens, q, k, v,
 scores, attention, context) = trace
probabilities = logits.softmax(dim=1)
loss = F.cross_entropy(logits, labels[:1])

patch_weight_before = model.patch_embed.weight.detach().clone()
wq_before = model.q_proj.weight.detach().clone()
cls_before = model.cls_token.detach().clone()
position_before = model.position.detach().clone()
cls_attention_before = attention[0, 0].detach().clone()

print("第一张 8×8 左侧标记图:\n", images[0, 0].round(decimals=2))
print("随机 Patch kernel 的第 0 个 4×4 切片:\n",
      patch_weight_before[0, 0])
print("卷积投影后的四个 Patch Token [4,8]:\n", patch_tokens[0])
print("加入 CLS 和位置向量后的 Token [5,8]:\n", tokens[0])
print("Q/K/V 形状:", q.shape, k.shape, v.shape)
print("5×5 score:\n", scores[0])
print("CLS 对五个 Token 的初始注意力:", attention[0, 0])
print("初始 [左,右] 概率:", probabilities[0])
print("CE 与 -log(p左):", loss.item(),
      -torch.log(probabilities[0, 0]).item())

# ----- 第一次反向：Patch、CLS、位置和 QKV 都会得到梯度 -----
model.zero_grad()
loss.backward()
patch_gradient = model.patch_embed.weight.grad.detach().clone()
wq_gradient = model.q_proj.weight.grad.detach().clone()
print("||Patch kernel gradient||:", patch_gradient.norm().item())
print("||CLS gradient||:", model.cls_token.grad.norm().item())
print("||position gradient||:", model.position.grad.norm().item())
print("||Wq/Wk/Wv gradient||:",
      model.q_proj.weight.grad.norm().item(),
      model.k_proj.weight.grad.norm().item(),
      model.v_proj.weight.grad.norm().item())
print("backward 后 Patch kernel 未改变:", torch.equal(
    patch_weight_before, model.patch_embed.weight.detach()
))

# 手动完成一次最直观的 SGD 更新
first_learning_rate = 0.1
with torch.no_grad():
    for parameter in model.parameters():
        parameter -= first_learning_rate * parameter.grad

print("Patch 变化等于 -lr×gradient:", torch.allclose(
    model.patch_embed.weight.detach() - patch_weight_before,
    -first_learning_rate * patch_gradient,
    atol=1e-6,
))
print("Wq 变化等于 -lr×gradient:", torch.allclose(
    model.q_proj.weight.detach() - wq_before,
    -first_learning_rate * wq_gradient,
    atol=1e-6,
))

# ----- 在 80 张图上继续训练；AdamW 从当前参数建立新状态 -----
optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
for epoch in range(1, 101):
    optimizer.zero_grad()
    batch_logits = model(images)
    batch_loss = F.cross_entropy(batch_logits, labels)
    batch_loss.backward()
    optimizer.step()

    if epoch in {1, 5, 10, 20, 40, 80, 100}:
        accuracy = (model(images).argmax(1) == labels).float().mean()
        print(f"epoch={epoch:03d}, loss={batch_loss.item():.4f}, "
              f"acc={accuracy.item():.3f}")

# 同一张左侧图片在训练前后的直接变化
model.eval()
with torch.no_grad():
    final_trace = model(images[:1], return_trace=True)
    final_logits = final_trace[0]
    cls_attention_after = final_trace[7][0, 0]
print("CLS attention 训练前:", cls_attention_before)
print("CLS attention 训练后:", cls_attention_after)
print("最终 [左,右] 概率:", final_logits.softmax(dim=1)[0])
print("Patch kernel / CLS / position / Wq 总变化:",
      (model.patch_embed.weight - patch_weight_before).norm().item(),
      (model.cls_token - cls_before).norm().item(),
      (model.position - position_before).norm().item(),
      (model.q_proj.weight - wq_before).norm().item())
```

损失的梯度从分类头进入 CLS 输出，再分到残差路径和注意力路径。注意力路径会修改 Q/K/V；Q/K 决定 CLS 应该读取哪一个 Patch，V 决定读回什么内容。梯度还会穿过 `patch_embed` 回到 `4 × 4` 卷积核，因此 Patch 投影本身也在学习，不是固定切块。

位置向量在这个任务中尤其重要：左侧和右侧亮 Patch 的像素内容几乎相同，只有它们所在位置不同。若去掉位置向量并保持全局结构完全对称，模型很难区分“同一个亮块出现在左边还是右边”。训练后的 CLS attention、Patch kernel 和位置向量共同发生变化，不能只用一张注意力图解释最终决策。

## 14. 本文自检

读完后应能解释：`Conv2d(kernel=P,stride=P)` 为什么等价于 Patch 线性投影？`224/16` 为什么得到 196 个 Token？CLS Token 如何获得全图信息？位置编码为什么随分辨率变化要插值？ViT 的 Q/K/V 在源码中保存在哪里？

至此，本专题已经从 [CNN](./CNN卷积神经网络原理与源码解读.md) 的局部空间建模走到 Transformer/ViT 的全局 Token 关系建模。实际项目中最重要的下一步，是在同一数据集上建立可比较的 CNN 和 ViT 基线，并用准确率、延迟、显存与参数量共同做选择。

[[toc]]

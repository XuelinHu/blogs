"""一个不依赖 Transformers/PEFT/bitsandbytes 的 QLoRA 教学实现。

运行：python qlora_from_scratch.py
它使用一个很小的字符级因果语言模型，打印矩阵形状、loss、LoRA 梯度，
并展示基础权重被冻结、量化权重只在前向反量化的过程。
"""
import math
import torch
from torch import nn
from torch.nn import functional as F

torch.manual_seed(7)
torch.set_printoptions(precision=4, sci_mode=False)


# NF4 的思想是：用更密集地覆盖正态分布中心的 16 个码字，而不是均匀 INT4。
# 这里的码本用于教学近似；生产实现应使用经过验证的 NF4 kernel。
NF4_CODEBOOK = torch.tensor([
    -1.0000, -0.6962, -0.5251, -0.3949, -0.2844, -0.1848, -0.0899, 0.0,
     0.0899, 0.1848, 0.2844, 0.3949, 0.5251, 0.6962, 1.0000, 0.0
])


def quantize_nf4(weight, block_size=32):
    """逐块 absmax 归一化并选最近 NF4 码字，返回 uint8 索引和缩放因子。"""
    flat = weight.detach().float().reshape(-1)
    blocks = []
    scales = []
    for start in range(0, flat.numel(), block_size):
        block = flat[start:start + block_size]
        scale = block.abs().max().clamp_min(1e-8)
        normalized = block / scale
        codebook = NF4_CODEBOOK.to(weight.device)
        indices = (normalized[:, None] - codebook[None, :]).abs().argmin(dim=1)
        blocks.append(indices.to(torch.uint8))
        scales.append(scale)
    return torch.cat(blocks), torch.stack(scales), tuple(weight.shape)


def dequantize_nf4(indices, scales, shape, block_size=32):
    codebook = NF4_CODEBOOK.to(scales.device)
    values = []
    for block_id, start in enumerate(range(0, indices.numel(), block_size)):
        block = codebook[indices[start:start + block_size].long()] * scales[block_id]
        values.append(block)
    return torch.cat(values).reshape(shape)


class QuantizedWeight(nn.Module):
    """冻结的 4bit 权重容器；q 与 scale 都是 buffer，不会进入 optimizer。"""

    def __init__(self, weight, block_size=32):
        super().__init__()
        indices, scales, shape = quantize_nf4(weight, block_size)
        self.register_buffer("indices", indices)
        self.register_buffer("scales", scales)
        self.shape = shape
        self.block_size = block_size

    def forward(self):
        return dequantize_nf4(self.indices, self.scales, self.shape, self.block_size)


class LoRALinear(nn.Module):
    """y = x Wq^T + (alpha/r) * x A^T B^T。Wq 冻结，A/B 可训练。"""

    def __init__(self, in_features, out_features, rank=2, alpha=4.0):
        super().__init__()
        base = torch.empty(out_features, in_features)
        nn.init.normal_(base, mean=0.0, std=0.2)
        self.quantized_weight = QuantizedWeight(base)
        self.bias = nn.Parameter(torch.zeros(out_features))
        self.A = nn.Parameter(torch.empty(rank, in_features))
        self.B = nn.Parameter(torch.zeros(out_features, rank))
        nn.init.normal_(self.A, mean=0.0, std=0.02)
        self.scale = alpha / rank

    def forward(self, x):
        base_weight = self.quantized_weight()
        base = F.linear(x, base_weight, self.bias)
        update = (x @ self.A.t() @ self.B.t()) * self.scale
        return base + update


class TinySelfAttention(nn.Module):
    def __init__(self, dim, rank=2):
        super().__init__()
        self.q_proj = LoRALinear(dim, dim, rank)
        self.k_proj = LoRALinear(dim, dim, rank)
        self.v_proj = LoRALinear(dim, dim, rank)
        self.o_proj = LoRALinear(dim, dim, rank)

    def forward(self, x):
        batch, length, dim = x.shape
        q, k, v = self.q_proj(x), self.k_proj(x), self.v_proj(x)
        scores = q @ k.transpose(-2, -1) / math.sqrt(dim)
        mask = torch.triu(torch.ones(length, length, device=x.device), diagonal=1).bool()
        scores = scores.masked_fill(mask, float("-inf"))
        attention = scores.softmax(dim=-1)
        return self.o_proj(attention @ v), attention


class TinyQLoRALM(nn.Module):
    def __init__(self, vocab_size, dim=16, rank=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, dim)
        self.attention = TinySelfAttention(dim, rank)
        self.norm = nn.LayerNorm(dim)
        self.lm_head = LoRALinear(dim, vocab_size, rank)

        # 教学中只训练 LoRA A/B；Embedding、LayerNorm 和 bias 也可以按项目需要选择冻结。
        for name, parameter in self.named_parameters():
            if not (name.endswith(".A") or name.endswith(".B")):
                parameter.requires_grad_(False)

    def forward(self, token_ids):
        hidden = self.embedding(token_ids)
        attended, attention = self.attention(hidden)
        hidden = self.norm(hidden + attended)
        return self.lm_head(hidden), attention


def main():
    text = "电路安全很重要。电路安全很重要。"
    vocabulary = sorted(set(text))
    to_id = {token: i for i, token in enumerate(vocabulary)}
    ids = torch.tensor([to_id[token] for token in text], dtype=torch.long)
    inputs, targets = ids[:-1][None, :], ids[1:][None, :]

    model = TinyQLoRALM(len(vocabulary), dim=16, rank=2)
    optimizer = torch.optim.AdamW(
        [parameter for parameter in model.parameters() if parameter.requires_grad],
        lr=0.08,
    )

    print("输入 token id:", inputs.tolist())
    print("q_proj 量化索引形状:", tuple(model.attention.q_proj.quantized_weight.indices.shape))
    print("q_proj 反量化权重（前 2 行）:\n", model.attention.q_proj.quantized_weight()[:2])
    print("可训练参数:", [(name, tuple(p.shape)) for name, p in model.named_parameters() if p.requires_grad])

    for step in range(8):
        logits, attention = model(inputs)
        loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), targets.reshape(-1))
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        if step in (0, 1, 7):
            q_lora = model.attention.q_proj
            print(f"step={step:02d} loss={loss.item():.4f}")
            print("  q_proj.A.grad 范数:", q_lora.A.grad.norm().item())
            print("  q_proj.B.grad 范数:", q_lora.B.grad.norm().item())
            print("  q_proj 基础权重有梯度吗:", q_lora.quantized_weight.indices.grad)
        optimizer.step()

    with torch.no_grad():
        delta = model.attention.q_proj.A.t() @ model.attention.q_proj.B.t()
        print("训练后的 q_proj LoRA 更新矩阵形状:", tuple(delta.shape))
        print("训练后的 q_proj LoRA 更新矩阵:\n", delta)
        print("最后一轮注意力矩阵:\n", attention[0])


if __name__ == "__main__":
    main()

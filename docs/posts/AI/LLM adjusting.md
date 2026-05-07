---
title: PlaLLM adjusting
date: 2025-07-19
---

# 1. 技术栈
- bilibili.com/video/BV1djgRzxEts
LLaMA Factory 和 Unsloth

LLaMA Factory 是一个由社区维护的、基于 HuggingFace Transformers + PEFT + LoRA 的 开源 LLM 微调框架，用于快速微调如
LLaMA、Qwen、Baichuan、ChatGLM 等各种大语言模型。
Unsloth 是一个新兴的高性能微调工具，主打："用最少的 GPU 内存 + 最快的速度微调大语言模型（尤其是 QLoRA 微调）"

```shell
conda create -n llama-fac python=3.10
conda activate llama-fac
cd LLaMA-Factory
pip install -e ".[torch,metrics]" --no-build-isolation
conda activate llama-fac
llamafactory-cli webui
nohup llamafactory-cli webui 2>&1 &
```

## 1.1. 对话

加速方式 

## 1.2. easy dataset
- https://github.com/ConardLi/easy-dataset

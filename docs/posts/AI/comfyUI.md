---
title: comfyUI
date: 2026-05-28
created: 2025-06-17
updated: 2026-09-01
---

# 1. ComfyUI

- 官网：https://www.comfy.org/
- 仓库：https://github.com/comfyanonymous/ComfyUI

ComfyUI 是一个以工作流节点为核心的图形化生成工具，常用于 Stable Diffusion、FLUX 这类模型的推理、图像生成、局部重绘和批量流程编排。和 WebUI 相比，它更适合把“加载模型、输入提示词、采样、解码、保存图片”拆成可复用流程。

::: danger 注意：自定义节点和模型文件可能执行恶意代码
只从可信来源安装节点，固定提交版本并审查依赖；不要在持有生产密钥的主机直接运行陌生工作流。Web 界面若监听 `0.0.0.0`，必须放在鉴权反向代理和防火墙之后；上传图片还可能包含人脸、位置及业务数据，应限制保存目录和保留时间。
:::

## 2. 安装前准备

安装前建议先确认以下环境：

- Python 版本与官方要求兼容，优先使用独立虚拟环境。
- 已安装显卡驱动，NVIDIA 环境通常需要匹配 CUDA 的 PyTorch 版本。
- 预留模型和输出目录，避免后续工作流、模型路径混乱。
- 如果显存较小，后续需要优先控制分辨率、批量数和采样步数。

## 3. 安装方式

### 3.1. 常规安装

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt
```

如果是 GPU 环境，通常还需要根据本机 CUDA 版本安装对应的 PyTorch，例如：

```bash
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu128
```

通过 GitHub 中的安装脚本可以看出，ComfyUI 对 PyTorch 版本有依赖，实际安装时应以当前显卡驱动、CUDA 版本和官方说明为准。

### 3.2. 后台安装依赖

如果机器是远程服务器，可以把安装依赖放到后台执行：

```bash
nohup sh -c 'pip install -r /home/deipss/jupyter_files/ComfyUI/requirements.txt' > nohup.log 2>&1 &
```

这种方式适合依赖安装时间较长、连接可能中断的场景。

### 3.3. Jupyter 方式安装

- 参考：https://github.com/comfyanonymous/ComfyUI/blob/master/notebooks/comfyui_colab.ipynb

如果最初就是通过 Jupyter Notebook 或 Colab 方式安装的，后续启动 ComfyUI 时也要沿用对应的 Jupyter 环境，避免出现 Python 环境不一致、依赖丢失或模型路径不一致的问题。

## 4. 启动与基本使用

### 4.1. 启动

常见启动方式如下：

```bash
python main.py
```

如果部署在服务器上，通常会结合端口转发、反向代理或 Jupyter 访问。启动后在浏览器中打开对应地址即可进入工作流页面。

### 4.2. 基本使用流程

一个最基础的文生图流程通常包括以下步骤：

1. 加载模型。
2. 输入正向提示词和反向提示词。
3. 设置图片尺寸、采样器、步数、CFG 和随机种子。
4. 生成 latent。
5. 通过 VAE 解码成图片。
6. 保存输出图片。

在 ComfyUI 中，这些步骤通常不是在一个表单里完成，而是拆成多个节点，通过连线组成工作流。

### 4.3. 使用建议

- 先从最小可运行工作流开始，不要一上来叠很多自定义节点。
- 模型、LoRA、VAE、ControlNet 最好按目录规范放置，便于迁移。
- 先固定种子调流程，再放开随机种子看效果波动。
- 出现爆显存时，优先降低分辨率、batch size 和模型复杂度。

## 5. 常用节点说明

### 5.1. 模型加载类

- `CheckpointLoaderSimple`：加载主模型 checkpoint，是大多数工作流的起点。
- `VAELoader`：单独加载 VAE，适合替换默认 VAE。
- `LoraLoader`：给基础模型叠加 LoRA。

### 5.2. 提示词类

- `CLIP Text Encode (Prompt)`：把正向提示词编码成模型可用的条件输入。
- `CLIP Text Encode (Negative Prompt)`：把反向提示词编码为负面条件，用于约束不想出现的内容。

### 5.3. 采样与生成类

- `EmptyLatentImage`：初始化 latent 画布，通常要指定宽高和 batch size。
- `KSampler`：最核心的采样节点，控制步数、种子、采样器、调度器和 CFG。
- `KSampler Advanced`：适合需要更细粒度控制的场景。

### 5.4. 解码与保存类

- `VAE Decode`：把 latent 解码成最终图片。
- `SaveImage`：保存输出图像，最常见的结束节点。
- `PreviewImage`：用于快速预览生成结果。

### 5.5. 图像处理类

- `LoadImage`：加载输入图片，常用于图生图或局部重绘。
- `Image Scale`：调整图片尺寸。
- `VAE Encode`：把输入图重新编码为 latent，方便进入后续采样流程。

## 6. 常见问题

### 6.1. 依赖装不上

- 优先确认 Python 环境是否与启动环境一致。
- 再确认 PyTorch、CUDA、显卡驱动是否匹配。
- 服务器环境下建议保留 `pip install` 日志，便于回看失败原因。

### 6.2. 启动了但网页打不开

- 检查监听端口是否开放。
- 如果部署在远程机器上，确认是否做了端口映射或代理转发。
- 如果通过 Jupyter 启动，确认访问地址是否仍指向当前 Notebook 环境。

### 6.3. 生成时报显存不足

- 降低宽高分辨率。
- 降低 batch size。
- 更换更轻量的模型或减少额外控制节点。

## 7. 小结

ComfyUI 的核心不是“装完就点按钮”，而是把生成过程拆成可视化工作流。先把基础链路跑通，再逐步增加 LoRA、ControlNet、重绘、放大等节点，后续维护会轻松很多。

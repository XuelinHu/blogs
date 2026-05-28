---
title: ollama
date: 2025-06-17
created: 2025-06-17
updated: 2025-06-17
---

# 1. Ollama

- 安装文档：https://github.com/ollama/ollama/blob/main/docs/linux.md
- 相关项目：https://github.com/jmhessel/allama

Ollama 是一个本地运行大语言模型的工具，适合在个人电脑或服务器上快速拉起 `Qwen`、`Llama`、`DeepSeek` 这类模型。它同时提供：

- 命令行调用
- 本地 HTTP API
- 模型拉取、运行和管理能力

默认服务端口通常是 `11434`。

## 2. 安装

### 2.1. Linux 安装过程

下面是一个常见的 Linux 安装流程：

```bash
# 下载 Ollama 的 Linux AMD64 ROCm 版本安装包
curl -L https://ollama.com/download/ollama-linux-amd64-rocm.tgz -o ollama-linux-amd64-rocm.tgz

# 解压安装包到 /usr 目录
sudo tar -C /usr -xzf ollama-linux-amd64-rocm.tgz

# 创建 ollama 用户
sudo useradd -r -s /bin/false -U -m -d /usr/share/ollama ollama

# 将当前用户添加到 ollama 组
sudo usermod -a -G ollama $(whoami)
```

### 2.2. systemd 服务配置

创建服务文件：

```bash
sudo vim /etc/systemd/system/ollama.service
```

示例配置：

```ini
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=$PATH"

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

## 3. 远程访问配置

如果只做本机访问，默认配置通常就够了。  
如果需要从局域网或其他机器访问，需要补环境变量：

```bash
sudo vim /etc/systemd/system/ollama.service
```

在 `[Service]` 中增加：

```ini
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"
```

完整示例：

```ini
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=$PATH"
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"

[Install]
WantedBy=multi-user.target
```

修改后重启服务：

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

此时可以通过：

```text
http://ip:11434
```

访问接口。

## 4. 最常用命令

### 4.1. 启动服务

```bash
ollama serve
```

如果你已经通过 `systemd` 管理服务，通常不需要手工执行这条命令。

### 4.2. 拉取模型

```bash
ollama pull deepseek-r1:7b
```

常见用途：

- 第一次下载模型
- 提前把模型拉到本地
- 便于后续离线运行

### 4.3. 运行模型

```bash
ollama run deepseek-r1:7b
```

这条命令会：

- 如果本地没有模型，先拉取
- 然后进入交互式对话

### 4.4. 查看本地模型

```bash
ollama list
```

或者：

```bash
ollama ls
```

如果当前版本只支持 `list`，以实际命令为准。

### 4.5. 查看正在运行的模型

```bash
ollama ps
```

这条命令很适合用来判断：

- 哪个模型已经被加载到内存
- 当前有没有模型仍在驻留

### 4.6. 停止运行中的模型

```bash
ollama stop deepseek-r1:7b
```

适合在模型暂时不用时主动释放资源。

### 4.7. 删除模型

```bash
ollama rm deepseek-r1:7b
```

### 4.8. 查看模型详情

```bash
ollama show deepseek-r1:7b
```

### 4.9. 基于 Modelfile 创建模型

```bash
ollama create my-model -f Modelfile
```

这类命令适合：

- 包装系统提示词
- 组合已有基础模型
- 固定参数

### 4.10. 复制模型

```bash
ollama cp deepseek-r1:7b deepseek-r1:7b-backup
```

## 5. 命令总览

```bash
ollama --help
```

常见输出大意如下：

```text
Available Commands:
  serve       Start ollama
  create      Create a model from a Modelfile
  show        Show information for a model
  run         Run a model
  stop        Stop a running model
  pull        Pull a model from a registry
  push        Push a model to a registry
  list        List models
  ps          List running models
  cp          Copy a model
  rm          Remove a model
```

## 6. 一个完整使用流程

如果要在服务器上跑一个本地模型，通常可以按这个顺序：

1. 安装 Ollama。
2. 配置并启动 `ollama serve` 服务。
3. 通过 `ollama pull` 下载模型。
4. 通过 `ollama run` 先做一次人工交互测试。
5. 再通过 HTTP API 或代码接入业务系统。
6. 通过 `ollama ps` 和 `nvidia-smi` 观察显存占用和模型状态。

## 7. HTTP API 使用

### 7.1. 查看本地模型列表

```bash
curl http://127.0.0.1:11434/api/tags
```

如果是远程访问：

```bash
curl http://ip:11434/api/tags
```

### 7.2. 生成文本

```bash
curl http://127.0.0.1:11434/api/generate \
  -d '{
    "model": "deepseek-r1:7b",
    "prompt": "请介绍一下 Ollama 的用途",
    "stream": false
  }'
```

### 7.3. 对话接口

如果模型支持聊天格式，可以调用：

```bash
curl http://127.0.0.1:11434/api/chat \
  -d '{
    "model": "deepseek-r1:7b",
    "messages": [
      { "role": "user", "content": "请总结一下 LoRA 微调。" }
    ],
    "stream": false
  }'
```

### 7.4. 向量接口

部分场景还会用到 embeddings：

```bash
curl http://127.0.0.1:11434/api/embeddings \
  -d '{
    "model": "nomic-embed-text",
    "prompt": "Ollama 是本地模型运行工具"
  }'
```

适合：

- 向量检索
- RAG
- 相似度计算

## 8. Python 接入示例

下面是一个简单的文本生成示例：

```python
import requests
from typing import Any, Dict


def generate_text(
    prompt: str,
    model: str = "deepseek-r1:8b",
    options: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    url = "http://127.0.0.1:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "options": options or {},
        "stream": False
    }
    response = requests.post(url, json=payload, timeout=300)
    response.raise_for_status()
    return response.json()
```

这里比较关键的参数是：

- `model`：模型名
- `prompt`：输入文本
- `options`：温度、上下文长度等推理选项
- `stream`：是否流式返回

### 8.1. `stream`

- `True`：会分块逐步返回结果，适合聊天界面
- `False`：一次性返回完整结果，适合后端接口封装

## 9. 常见命令场景

### 9.1. 下载但先不运行

```bash
ollama pull qwen2.5:7b
```

### 9.2. 临时测试模型对话

```bash
ollama run qwen2.5:7b
```

### 9.3. 看看 GPU 是否真的在工作

```bash
ollama ps
nvidia-smi
```

在 Ubuntu 中安装 Ollama 后，后台服务通常一直是启动状态，但并不代表 GPU 持续加载模型。很多时候只有真正访问接口或执行 `run` 时，模型才会被加载到显存中。

### 9.4. 清理不再使用的模型

```bash
ollama rm qwen2.5:7b
```

## 10. 模型存储路径

模型文件通常可以在类似如下目录中看到：

```bash
/usr/share/ollama/.ollama/models/blobs
```

例如：

```bash
cd /usr/share/ollama/.ollama/models/blobs
du -sh *
```

这能帮助你快速判断：

- 哪些 blob 占用空间最大
- 当前磁盘压力主要来自哪些模型

## 11. Ollama 和 Hugging Face 的区别

简单说：

- `Hugging Face` 更像模型生态和模型平台
- `Ollama` 更像本地模型运行器

Hugging Face 提供：

- 模型仓库
- 数据集
- Transformers 生态
- 云端和社区能力

Ollama 提供：

- 本地模型下载
- 本地推理运行
- 本地 API 暴露
- 本地模型管理

如果你的目标是“快速在服务器上把模型跑起来”，Ollama 更直接。  
如果你的目标是“训练、下载、管理、托管、找模型”，Hugging Face 范围更大。

## 12. Ollama 使用的技术

### 12.1. CLI 部分

Ollama 的核心主要使用 `Go` 编写，CLI 部分通常会结合类似 `Cobra` 这样的命令行工具库实现。

选择 Go 的原因通常包括：

- 启动速度快
- 并发能力强
- 适合做本地服务和命令行工具

### 12.2. 服务接口部分

Ollama 对外暴露的是本地 HTTP API，本质上属于 REST 风格接口，便于：

- 本地脚本调用
- Web 服务集成
- Agent 工具接入

## 13. Ollama 是怎么调用模型推理的

Ollama 虽然是用 Go 写的，但模型推理核心并不一定是纯 Go 实现。更准确地说，它更像一个“模型运行调度层”，负责：

- 加载模型文件
- 管理模型生命周期
- 提供统一 API
- 调度底层推理引擎

一个简化理解是：

1. Ollama 接收 CLI 或 HTTP 请求。
2. 把输入文本转换成底层推理引擎能处理的格式。
3. 加载或唤醒目标模型。
4. 调用底层推理实现完成 token 生成。
5. 把结果流式或一次性返回给调用方。

所以 Ollama 更接近“服务层和调度层”，而不是单纯“自己从头实现全部模型计算框架”。

## 14. 小结

Ollama 的价值主要在于：

- 让本地模型运行更简单
- 让模型下载、运行、管理和 API 接入统一起来
- 适合作为个人环境、测试环境和中小型服务的模型运行入口

如果只是想把模型快速跑起来，先熟悉这几个命令就够用了：

- `ollama pull`
- `ollama run`
- `ollama list`
- `ollama ps`
- `ollama rm`
- `curl /api/generate`

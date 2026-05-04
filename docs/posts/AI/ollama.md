---
title: ollama
date: 2025-06-17
---

# 1. ollama安装安装

- [allama](https://github.com/jmhessel/allama)
- [install](https://github.com/ollama/ollama/blob/main/docs/linux.md)
- 环境变量OLLAMA_PORT默认也是11434

## 1.1. 安装过程

```shell
# 下载 Ollama 的 Linux AMD64 ROCm 版本安装包
curl -L https://ollama.com/download/ollama-linux-amd64-rocm.tgz -o ollama-linux-amd64-rocm.tgz

# 解压安装包到 /usr 目录
sudo tar -C /usr -xzf ollama-linux-amd64-rocm.tgz

# 创建 ollama 用户，用于运行 Ollama 服务
# -r 表示创建一个系统用户，-s 指定用户的登录 shell 为 /bin/false，禁止用户登录
# -U 表示创建一个与用户同名的组，-m 表示创建用户的主目录，-d 指定家目录的路径
sudo useradd -r -s /bin/false -U -m -d /usr/share/ollama ollama

# 将当前用户添加到 ollama 组，以便当前用户可以与 Ollama 服务交互
sudo usermod -a -G ollama $(whoami)

# 编辑 Ollama 服务的 systemd 配置文件
vim /etc/systemd/system/ollama.service

[Unit]
# 描述 Ollama 服务
Description=Ollama Service
# 指定网络在线后启动服务
After=network-online.target

[Service]
# 指定服务启动命令
ExecStart=/usr/bin/ollama serve
# 指定运行服务的用户和组
User=ollama
Group=ollama
# 配置服务异常退出后自动重启
Restart=always
# 配置重启前等待的时间
RestartSec=3
# 设置环境变量
Environment="PATH=$PATH"

[Install]
# 指定服务安装时的依赖目标
WantedBy=multi-user.target

# 重新加载 systemd 配置，以便识别到新创建的 Ollama 服务
sudo systemctl daemon-reload

# 启用 Ollama 服务，使其在系统启动时自动运行
sudo systemctl enable ollama

# 启动 Ollama 服务
sudo systemctl start ollama

# 检查 Ollama 服务的状态，确保其正在运行
sudo systemctl status ollama

```

## 1.2. 需要添加环境变量才能远程访问

```shell
vim /etc/systemd/system/ollama.service

[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"

```

```shell
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

# 2. 启用一个模型

> ollama run deepseek-r1:7b 
默认是为启用端口11434，可以使用url访问：http://ip:11434

- http://ip:11434/api/tags 获取所有模型

以下代码是和ollama进行交互
```python
def generate_text(self, prompt: str, model: str = "deepseek-r1:8b", options: Dict[str, Any] = None) -> Dict[
    str, Any]:
    """
    使用Ollama服务生成文本。

    :param prompt: 输入的提示文本
    :param model: 使用的模型名称，默认为"deepseek-r1:8b"
    :param options: 其他选项，如max_tokens等
    :return: 包含生成文本的字典
    :"stream": False  默认是True，会一点一点的返回结果，有多次返回，设置为False，则在一次返回所有结果
    """
    url = f"{self.base_url}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "options": options or {},
        "stream": False
    }
    response = requests.post(url, json=payload)
    return response.json()
```

## 2.1. Ollama Commands

```shell
Large language model runner

Usage:
  ollama [flags]
  ollama [command]

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
  help        Help about any command

Flags:
  -h, --help      help for ollama
  -v, --version   Show version information

Use "ollama [command] --help" for more information about a command.
```

在ubuntu中安装ollama后，后台服务一直是处于启动中状态，通过`nvidia-smi`查看时，发现长时间未调用接口，GPU就并未加载模型文件，当访问接口时，GPU加载模型文件，并开始运行。


## 2.2. models save path
```shell
/usr/share/ollama/.ollama/models/blobs$ du -sh *
2.2G    sha256-05fc42664a9311c427413f9bf2077bd5ee7d59d6a5a034d54fc738f93976d065
4.0K    sha256-0cb05c6e4e02614fa7f4c5d9ddcd5ae7e630e5df98602f1c0894ed0cacd11eeb
4.0K    sha256-369ca498f347f710d068cbb38bf0b8692dd3fa30f30ca2ff755e211c94768150
4.0K    sha256-40fb844194b25e429204e5163fb379ab462978a262b86aadd73d8944445c09fd
4.0K    sha256-56bb8bd477a519ffa694fc449c2413c6f0e1d3b1c88fa7e3c9d88d3ae49d4dcb
4.6G    sha256-6340dc3229b0d08ea9cc49b75d4098702983e17b4c096d57afbbf2ffc813f2be
4.0K    sha256-6e4c38e1172f42fdbff13edf9a7a017679fb82b0fde415a3e8b3c31c6ed4a4e4
4.0K    sha256-966de95ca8a62200913e3f8bfbf84c8494536f1b94b49166851e76644e966396
4.4G    sha256-96c415656d377afbff962f6cdb2394ab092ccbcbaab4b82525bc4ca800fe8a49
8.0K    sha256-a70ff7e570d97baaf4e62ac6e6ad9975e04caa6d900d3742d37698494479e0cd
4.0K    sha256-a85fe2a2e58e2426116d3686dfdc1a6ea58640c1e684069976aa730be6c1fa01
1.1G    sha256-aabd4debf0c8f08881923f2c25fc0fdeed24435271c2b3e92c4af36704040dbc
4.0K    sha256-c5ad996bda6eed4df6e3b605a9869647624851ac248209d22fd5e2c0cc1121d3
4.0K    sha256-e32efebd977975adfef79e5999f12ef9dac99d3cebe3eea09614e77ea2e3ef26
4.0K    sha256-f4d24e9138dd4603380add165d2b0d970bef471fac194b436ebd50e6147c6588
8.0K    sha256-fcc5a6bec9daf9b561a68827b67ab6088e1dba9d1fa2a50d7bbcc8384e0a265d
```

# 3. Ollama和Hugging Face

Ollama是一款开源跨平台的大模型工具，于2023年7月9日在GitHub上线。它可以让用户在服务器中运行Qwen、Llama、DeepSeekR1等多种语言模型。
Ollama由开发者社区创建并维护，是一个开源项目。它基于Python语言，结合现代Web技术和CLI（命令行界面）工具开发。

Hugging Face是一家成立于2016年1月1日的开源人工智能创业公司，专注于NLP技术，总部位于美国纽约，CEO为Clément
Delangue。它提供AI模型服务，有一系列预训练模型涉及多领域；构建了完整开源产品矩阵，涵盖自然语言处理库等；建立了AI开发生态，包含开发者社区等；
还提供围绕NLP、Vision等方向的AI解决方案服务以获取费用。Hugging
Face由其团队开发，其开源产品矩阵如自然语言处理库等是基于多种技术开发的，例如Transformer架构等，这些技术为其在自然语言处理等领域的发展提供了基础。
其开发的模型则是基于大量的数据集和先进的机器学习算法进行训练的。

### 3.1. Ollama使用的技术及相关规范

#### 3.1.1. 命令行界面（CLI）部分

- **Go 语言**
    - **技术说明**：Ollama 的核心是用 Go 语言编写的。Go 语言具有高效的性能、出色的并发处理能力和简洁的语法，非常适合构建命令行工具和服务器应用。它能够快速编译成机器码，使得
      Ollama 的 CLI 工具启动速度快，响应迅速。
    - **相关规范**：遵循 Go 语言的编码规范，例如代码格式化使用 `gofmt` 工具，以保证代码的一致性和可读性。同时，在错误处理、包管理等方面也遵循
      Go 语言的最佳实践。
- **Cobra 库**
    - **技术说明**：Cobra 是一个用于创建强大的现代 CLI 应用程序的 Go 语言库。Ollama 使用 Cobra
      来构建其命令行界面，它提供了命令解析、子命令支持、参数处理等功能，使得用户可以方便地使用各种命令来管理和运行模型。
    - **相关规范**：遵循 Cobra 的文档和最佳实践来定义命令和参数，例如使用 `cobra.Command` 结构体来定义命令，使用
      `PersistentFlags` 和 `Flags` 方法来定义命令行参数。

#### 3.1.2. 现代 Web 技术部分

- **RESTful API**
    - **技术说明**：Ollama 提供了 RESTful API，允许开发者通过 HTTP 请求与 Ollama 服务进行交互。RESTful API
      具有简单、灵活、可扩展等优点，使得开发者可以方便地将 Ollama 集成到自己的 Web 应用或其他系统中。
    - **相关规范**：遵循 RESTful API 的设计原则，例如使用标准的 HTTP 方法（GET、POST、PUT、DELETE 等）来表示不同的操作，使用
      JSON 作为数据交换格式，使用合适的 HTTP 状态码来表示操作结果。
- **WebSocket**
    - **技术说明**：在某些场景下，Ollama 可能会使用 WebSocket 协议来实现实时通信。WebSocket 是一种在单个 TCP
      连接上进行全双工通信的协议，适用于需要实时更新数据的场景，例如实时对话等。
    - **相关规范**：遵循 WebSocket 协议的规范，包括握手过程、数据帧格式等。在 Go 语言中，可以使用 `gorilla/websocket` 等库来实现
      WebSocket 通信。

#### 3.1.3. 模型管理和运行部分

- **Docker**
    - **技术说明**：Ollama 支持使用 Docker 来管理和运行模型。Docker 是一种容器化技术，可以将应用程序及其依赖打包成一个独立的容器，实现环境隔离和快速部署。
    - **相关规范**：遵循 Docker 的最佳实践，例如使用 Dockerfile 来定义容器的构建过程，使用 Docker Compose 来管理多个容器的部署。
- **TensorFlow、PyTorch 等机器学习框架**
    - **技术说明**：Ollama 支持多种预训练模型，这些模型通常是使用 TensorFlow、PyTorch 等机器学习框架进行训练的。在运行模型时，Ollama
      会调用相应的框架来进行推理。
    - **相关规范**：遵循这些机器学习框架的使用规范，例如在加载模型时需要注意模型的格式和版本，在进行推理时需要处理好输入和输出的格式。

### 3.2. Hugging Face使用的技术及相关规范

#### 3.2.1. 核心机器学习框架

- **Transformer 架构**
    - **技术说明**：Hugging Face 的很多模型都是基于 Transformer 架构开发的，如 BERT、GPT 等。Transformer
      架构具有强大的并行计算能力和长序列处理能力，是当前自然语言处理领域的主流架构。
    - **相关规范**：遵循 Transformer 架构的设计原则，例如使用多头注意力机制、前馈神经网络等组件，同时在模型训练和推理过程中也需要遵循相应的算法和优化策略。
- **PyTorch 和 TensorFlow**
    - **技术说明**：Hugging Face 的 `transformers` 库支持使用 PyTorch 和 TensorFlow
      两种机器学习框架。这使得开发者可以根据自己的需求选择合适的框架来进行模型的训练和推理。
    - **相关规范**：遵循 PyTorch 和 TensorFlow 的使用规范，例如在定义模型时需要使用相应的类和方法，在训练过程中需要使用合适的优化器和损失函数。

#### 3.2.2. Web 服务和 API 部分

- **FastAPI**
    - **技术说明**：Hugging Face 使用 FastAPI 来构建其 Web 服务和 API。FastAPI 是一个基于 Python 的高性能 Web
      框架，它具有快速开发、易于使用、自动生成文档等优点。
    - **相关规范**：遵循 FastAPI 的文档和最佳实践来定义路由、处理请求和响应，例如使用 `@app.get`、`@app.post` 等装饰器来定义路由，使用
      Pydantic 来进行数据验证和序列化。
- **RESTful API 设计**
    - **技术说明**：Hugging Face 的 API 遵循 RESTful 设计原则，提供了一系列的端点来进行模型的推理、训练等操作。
    - **相关规范**：与 Ollama 类似，遵循 RESTful API 的设计原则，使用标准的 HTTP 方法和 JSON 数据格式，同时提供详细的 API
      文档和 SDK 来方便开发者使用。

#### 3.2.3. 社区和版本管理部分

- **Git 和 GitHub**
    - **技术说明**：Hugging Face 使用 Git 作为版本控制系统，使用 GitHub 作为代码托管平台。这使得开发者可以方便地进行代码的管理、协作和贡献。
    - **相关规范**：遵循 Git 和 GitHub 的使用规范，例如使用分支管理、提交规范等，同时在 GitHub 上还遵循开源项目的社区规范，如贡献者协议、代码审查流程等。

# 4. Ollama是使用GO编写

他是如何调用模型进行推理的，我理解模型大多是C语言编写的

Ollama是一个用Go编写的语言模型运行时，它可以调用多种模型进行推理，包括用C语言编写的模型。以下是Ollama调用模型进行推理的一般过程：

1. **模型加载**
   ：Ollama首先会根据用户指定的模型名称或路径，从本地存储或远程服务器加载相应的模型文件。对于用C语言编写的模型，可能存在一个适配层或接口，将**模型的C语言代码封装**起来，以便Go语言能够与之交互。这个适配层可能会提供一些函数或方法，用于初始化模型、设置参数等。
2. **数据预处理**
   ：在将输入数据传递给模型进行推理之前，Ollama会对输入进行预处理。这可能包括将文本转换为模型所需的格式，例如将字符串转换为向量表示，或者对文本进行分词、编码等操作。Go语言中有许多用于文本处理和数据转换的库，可以帮助完成这些预处理步骤。
3. **调用模型推理函数**
   ：一旦模型加载完成并且输入数据预处理好，Ollama就会通过适配层调用模型的推理函数。这个函数通常是用C语言编写的，它接受预处理后的输入数据，并执行模型的推理算法，生成输出结果。在Go语言中，可以使用
   `cgo`工具来调用C语言函数，实现Go与C语言代码的交互。
4. **结果处理**：模型推理函数返回的结果可能是某种特定的格式，例如向量、张量或文本。Ollama会对这些结果进行后处理，将其转换为用户可以理解的格式，例如将向量转换为文本字符串，或者对结果进行进一步的分析和解读。
5. **输出结果**：最后，Ollama将处理后的结果输出给用户，可以是在命令行中打印出来，或者通过API返回给调用者。

不同的模型可能有不同的具体实现和调用方式，Ollama需要根据具体模型的特点和要求来进行适配和调用。同时，为了提高性能和效率，Ollama可能还会采用一些优化措施，如模型量化、并行计算等。
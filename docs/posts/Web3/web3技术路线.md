---
title: web3技术路线
date: 2025-06-14
---

# 1. AI的推荐的线路

当然可以，以下是一份为你量身定制的**区块链技术入门学习路线图**，结合你有编程基础的背景，内容包括必学知识、项目实战和进阶方向。

---
## 1.1. 🧭 第一阶段：基础打牢（1–2 周）
目标：了解区块链基本原理和生态结构
### 1.1.1. 📘 学习内容：
* 区块链是什么、解决了什么问题
* 去中心化 vs 中心化
* 区块、区块头、链、哈希
* 共识机制（PoW、PoS、DPoS 简介）
* 钱包、公私钥、签名、地址
* 交易结构、UTXO vs Account 模型
* 区块链的安全特性（不可篡改、可追溯）
---

## 1.2. 🧱 第二阶段：智能合约与Solidity（2–4 周）

目标：掌握智能合约语言及部署流程

### 1.2.1. 📘 学习内容：

* 以太坊结构（EVM、账户、Gas）
* Solidity 语法基础
* Remix 平台编写与部署智能合约
* 合约调用与事件、状态变量、函数可见性
* 合约安全（重入攻击、溢出问题等）

### 1.2.2. 🛠️ 实战建议：

* 写一个“简单投票合约”
* 编写一个“代币合约”（基于 ERC20）

### 1.2.3. 🎯 工具推荐：

* Remix IDE
* MetaMask 钱包
* Hardhat（后期可用）

---
## 1.3. 🔄 第三阶段：前后端整合 DApp（2–3 周）
目标：构建一个完整的区块链应用（DApp）
### 1.3.1. 📘 学习内容：
* Web3.js / Ethers.js 用法
* 合约部署与前端交互
* 钱包连接（MetaMask）及交易触发
* DApp 的 Gas 费管理与异常处理
### 1.3.2. 🛠️ 项目实战：
* 去中心化记账本
* 简单 NFT 铸造/展示页面
---

## 1.4. 📦 第四阶段：区块链生态与工具（持续学习）

目标：理解不同链的结构与工具链

### 1.4.1. 推荐内容：

* 区块链架构对比：Ethereum vs Solana vs BNB Chain
* Layer2（如 Arbitrum、Optimism）
* IPFS、Filecoin（分布式存储）
* 区块链浏览器（Etherscan）使用
* 区块链 API（Alchemy、Infura）

---
## 1.5. 💡 进阶方向（选学）
| 方向                | 推荐学习内容                        |
|-------------------|-------------------------------|
| **Solidity 深度开发** | 高级合约模式、Proxy合约、合约升级           |
| **安全审计**          | Trail of Bits、Slither、Foundry |
| **跨链技术**          | Chainlink、桥接协议                |
| **DeFi**          | Uniswap、Aave 合约源码分析           |
| **NFT**           | ERC721、OpenSea 集成             |
---

## 1.6. 🧰 学习资源平台推荐：

* [CryptoZombies](https://cryptozombies.io)：游戏化教学 Solidity
* [Ethernaut](https://ethernaut.openzeppelin.com)：合约安全闯关游戏
* [Alchemy University](https://university.alchemy.com/)：零基础 Web3 开发者课程
* [buildspace](https://buildspace.so)：构建项目导向学习
* [链闻](https://www.chainnews.com/)：中文区块链新闻

---
## 1.7. ✅ 建议的学习顺序（时间建议）：
| 时间    | 学习目标                        |
|-------|-----------------------------|
| 第1周   | 掌握区块链基本原理与术语                |
| 第2–3周 | 掌握 Solidity、合约编写与部署         |
| 第4–5周 | 构建第一个完整 DApp，结合前后端          |
| 第6周起  | 深入某一方向，如 DeFi、NFT、跨链、Rollup |
---

如果你告诉我你未来倾向于从事的是**开发者（DApp开发/后端）**、**研究员（机制/安全方向）**还是**架构师（区块链底层）**
，我可以进一步帮你规划路径。

# 2. 技术栈

Web3 后端开发工程师主要负责与区块链交互、处理业务逻辑、构建 DApp 的服务器端组件。不同的场景下用的语言不一样，但以下是最常见和实用的编程语言及其适用场景：

---
### 2.1. ✅ 主流后端语言与用途对比
| 语言                          | 主要用途/场景                                         | 优势                               |
|-----------------------------|-------------------------------------------------|----------------------------------|
| **JavaScript / TypeScript** | 编写后端（Node.js）、智能合约交互（如使用 ethers.js / web3.js）   | 与前端生态一致，上手快，社区活跃                 |
| **Go (Golang)**             | 构建高性能的区块链服务节点、钱包服务、轻量 RPC 服务（如 Cosmos SDK、IPFS） | 并发性能好，部署方便，很多链本身就是 Go 写的         |
| **Rust**                    | 开发高性能区块链系统（如 Solana 智能合约、Substrate 框架）          | 安全性强，运行效率高，被称为“链圈的新 C++”         |
| **Python**                  | 快速原型开发、链上数据分析、构建 RESTful API                    | 生态丰富，适合链上数据抓取分析（如 The Graph 的数据） |
| **Java / Kotlin**           | 开发企业级 Web3 服务、中间件、区块链集成（如 Hyperledger）          | 大型系统稳定，适合复杂业务逻辑                  |
| **C++**                     | 比较底层的区块链开发，如比特币核心客户端                            | 性能极高，但上手复杂                       |
---

### 2.2. 🧱 按你想做的方向选择：

#### 📦 1. **写智能合约 + 构建后端 API 接口：**

* 智能合约：**Solidity**
* 合约交互 + 后端逻辑：**Node.js (TypeScript) / Python**

#### 🔗 2. **和链打交道、跑自己的节点 / 钱包服务 / indexer：**

* 推荐：**Go / Rust**

#### 📊 3. **链上数据分析 / 做 Web3 数据 API：**

* 推荐：**Python + Web3.py / SQL（配合 The Graph, Dune 等）**

#### 🏗 4. **构建自己的链（Layer1 / Parachain）：**

* 推荐：**Rust (Substrate)、Go (Cosmos SDK)**

---
### 2.3. 📦 实际组合举例
* **DApp 后端（常规）**：`Solidity` + `Node.js` + `MongoDB/PostgreSQL`
* **NFT 项目**：`Solidity` + `Python FastAPI` / `Express.js` + `Pinata / IPFS`
* **DeFi 后端**：`Solidity` + `Go / Node.js` + `GraphQL` + `Event 监听`
* **链上爬虫 & 数据分析**：`Python` + `Web3.py` + `Pandas/SQL`
---

### 2.4. ✅ 如果你是 Web2 程序员想转 Web3 后端：

| Web2 技术           | Web3 对应路径                                |
|-------------------|------------------------------------------|
| Node.js + Express | Node.js + ethers.js / web3.js + Solidity |
| Python + Flask    | Python + Web3.py + Solidity              |
| Java Spring       | Java + Web3j（但使用较少）                      |

---

需要我给你一份学习路线图或项目实战建议吗？比如 “做一个 NFT 后端服务”、“监听链上交易并入库”等。

# 3. B站的视频

- bilibili.com/video/BV1Je4y1r7uB
- bilibili.com/video/BV1wV411N7eQ/

# 4. JOB网站的检索

## 4.1. Blockchain Dapp Developer

```text
You’ve shipped multiple production-grade Dapps built using Solidity.
你已经使用 Solidity 开发了多个生产级 Dapp。

You have strong hands-on skills with the blockchain development framework Foundry
您在区块链开发框架 Foundry 方面具备扎实的实践经验

You’ve shipped webapps built with typescript (preferably react, next.js) and used wagmi hooks for smart contract integrations.
您已成功交付使用 TypeScript（最好使用 React 或 next.js）构建的 Web 应用，并使用 wagmi 钩子进行智能合约集成。

You have a deep understanding of blockchain architecture, token standards (ERC-20, ERC-721, ERC-1155) and non-compliant versions of the standard (e.g. USDC)
您对区块链架构、代币标准（ERC-20、ERC-721、ERC-1155）以及标准非合规版本（例如 USDC）有深入的理解。

Knowledge of Solidity foundational best practices and most common security vulnerabilities.
您了解 Solidity 的基础最佳实践和最常见的常见安全漏洞。

You thrive when solving complex, ambiguous problems and enjoy working across disciplines to find the best solutions.
当您解决复杂且模糊的问题时，您会充满活力，并乐于跨学科合作以找到最佳解决方案。

You are passionate about the web3 community.
您对 Web3 社区充满热情。
```

## 4.2. Software Engineer - Rust - Backend - Asset Listings

```text
3+ years of experience in software engineering
3 年以上的软件工程经验

Proficiency in writing network services or asynchronous code in Rust
熟练使用 Rust 编写网络服务或异步代码

Demonstrated commitment to a security-first mindset when designing systems
在系统设计时展现出对安全优先原则的坚定承诺

Capability to autonomously debug issues across the stack, including OS, network, and application layers
具备跨层（包括操作系统、网络和应用层）自主调试问题的能力

Familiarity with distributed systems and technologies, including RPC protocols, Kafka, and Event Driven Systems
熟悉分布式系统和技术，包括 RPC 协议、Kafka 和事件驱动系统

Knowledge in one or more blockchain ecosystems such as Bitcoin, Ethereum, Cosmos, Solana, Substrate is a huge plus
熟悉一个或多个区块链生态系统，如比特币、以太坊、Cosmos、Solana、Substrate 将是一个巨大的加分项

Proficiency with Typescript (Node.js) is a plus
精通 TypeScript（Node.js）将是一个加分项

Strong passion for Bitcoin and other cryptocurrencies
对比特币和其他加密货币有强烈的热情

Pragmatic and solution-oriented, stoic in the face of many obstacles
务实且以解决方案为导向，面对诸多障碍时保持坚韧

Proactively adapt to rapidly evolving technologies and apply innovative solutions to dynamic challenges, demonstrating flexibility and resilience in a fast-paced development environment
积极主动适应快速发展的技术，将创新解决方案应用于动态挑战，在快节奏的开发环境中展现灵活性和韧性

Demonstrates a receptive mindset, adept at engaging in constructive dialogue on complex subjects with colleagues, while remaining adaptable and open to alternative perspectives
展现出开放的心态，擅长与同事就复杂问题进行建设性对话，同时保持适应性和对其他观点的开放态度
```

## 4.3. Software Engineer (Backend) - Asia

```text
Requirements

At least 3+ years of professional engineering experience working in a collaborative product-driven environment

Expert proficiency in one or more of our core languages: Golang, Typescript, Solidity, or Rust 

Excitement for blockchain, web3, and similar decentralized technologies

Strong written and oral communication and organization skills in English 

Good understanding of computer science fundamentals 

Comfort in a remote role as a part of a distributed team located across multiple time zones
```

区块链原理、密码学


dune
telegram
北大公开课
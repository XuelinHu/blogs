---
title: nvm Node npm 环境安装
date: 2026-06-03
created: 2026-06-03
updated: 2026-06-03
---

# nvm Node npm 环境安装

本文整理 Windows 10 和 Linux 环境下安装 `nvm`、`Node.js`、`npm` 的标准流程。你可以把它理解成前端开发环境的第一步：先用 `nvm` 管理 Node 版本，再用 `npm` 管理项目依赖。

[[toc]]

## 1. 三者关系

先记住这三个概念：

- `nvm`：Node Version Manager，用来安装、切换、卸载多个 Node.js 版本。
- `Node.js`：JavaScript 运行环境，前端工程化工具和后端 JS 服务都依赖它。
- `npm`：Node 自带的包管理器，用来安装依赖、运行脚本、发布包。

推荐顺序是：

```text
先安装 nvm
再用 nvm 安装 Node.js
最后配置 npm 国内源
```

这样做的好处是：以后项目需要不同 Node 版本时，不用反复卸载和重装 Node。

## 2. Windows 10 安装 nvm

Windows 上建议使用 `nvm-windows`。

### 2.1 卸载旧 Node.js

如果电脑以前直接安装过 Node.js，建议先卸载：

```text
控制面板 -> 程序 -> 卸载 Node.js
```

原因是：旧版 Node 可能已经写入系统环境变量，和 `nvm-windows` 管理的 Node 冲突。

### 2.2 下载 nvm-windows

下载地址：

```text
https://github.com/coreybutler/nvm-windows/releases
```

下载文件：

```text
nvm-setup.exe
```

安装时一路 `Next` 即可。安装完成后，重新打开一个新的终端窗口。

### 2.3 验证 nvm

```bash
nvm version
```

能输出版本号，就说明 `nvm-windows` 安装成功。

### 2.4 配置中国镜像

国内环境建议先配置镜像，否则下载 Node 可能很慢。

```bash
nvm node_mirror https://npmmirror.com/mirrors/node/
nvm npm_mirror https://npmmirror.com/mirrors/npm/
```

这两行的作用：

- `node_mirror`：指定 Node.js 下载镜像。
- `npm_mirror`：指定 npm 下载镜像。

### 2.5 安装并使用 Node

先查看可安装版本：

```bash
nvm list available
```

安装指定版本：

```bash
nvm install 18.19.0
```

切换到这个版本：

```bash
nvm use 18.19.0
```

验证当前 Node 版本：

```bash
node -v
```

### 2.6 Windows 常用 nvm 命令

查看本机已安装版本：

```bash
nvm list
```

安装另一个版本：

```bash
nvm install 16.20.2
```

切换版本：

```bash
nvm use 16.20.2
```

卸载版本：

```bash
nvm uninstall 14.0.0
```

## 3. Windows 推荐组合

Windows 10 上比较稳定的前端开发组合：

```text
nvm-windows
Node 18 LTS
npm 镜像：npmmirror
```

如果你只是学习 Vue、Vite、Three.js、Element Plus，Node 18 LTS 是一个比较稳的选择。

## 4. npm 基础命令

安装 Node 后，一般会自动带上 npm。

查看 npm 版本：

```bash
npm -v
```

初始化项目：

```bash
npm init -y
```

安装普通依赖：

```bash
npm install three
npm i vue
```

安装开发依赖：

```bash
npm i vite -D
```

其中 `-D` 等价于 `--save-dev`，表示这个包主要用于开发阶段，比如构建工具、代码检查工具。

安装项目中的全部依赖：

```bash
npm install
```

卸载依赖：

```bash
npm uninstall three
```

全局安装工具：

```bash
npm i -g vite
```

查看全局安装的包：

```bash
npm list -g --depth=0
```

运行项目脚本：

```bash
npm run dev
npm run build
npm run start
```

这些命令对应的是 `package.json` 里的 `scripts` 字段。例如：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server.js"
  }
}
```

## 5. npm 配置中国镜像

永久切换 npm registry：

```bash
npm config set registry https://registry.npmmirror.com
```

验证当前 registry：

```bash
npm config get registry
```

临时使用国内源安装某个包：

```bash
npm install three --registry=https://registry.npmmirror.com
```

如果 npm 出现缓存问题，可以清理缓存：

```bash
npm cache clean --force
```

## 6. Linux 安装 nvm 和 Node.js

下面以 Ubuntu / Debian 为主。国内服务器或国内网络环境下，核心原则是：

```text
不要直连 GitHub 安装 nvm
nvm 管 Node 版本
npm 换国内源
zsh / bash 要写对配置文件
```

## 7. Linux 系统准备

先安装基础工具：

```bash
sudo apt update
sudo apt install -y curl git
```

`curl` 用来下载安装脚本，`git` 是很多前端项目和依赖安装都会用到的基础工具。

## 8. Linux 安装 nvm

国内环境不建议直接使用官方 GitHub 脚本，可以使用 Gitee 镜像：

```bash
curl -o- https://gitee.com/mirrors/nvm/raw/v0.39.7/install.sh | bash
```

安装完成后，通常会提示：

```text
Close and reopen your terminal
```

意思是关闭当前终端，重新打开一个终端，让 shell 配置重新加载。

## 9. 让 nvm 在 shell 中生效

这一步非常关键。很多人安装完 `nvm` 后执行 `nvm` 报错，原因就是 shell 配置没有生效。

### 9.1 bash 用户

编辑 `~/.bashrc`：

```bash
nano ~/.bashrc
```

确认里面有下面两行：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

让配置生效：

```bash
source ~/.bashrc
```

### 9.2 zsh 用户

编辑 `~/.zshrc`：

```bash
nano ~/.zshrc
```

确认里面有下面两行：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
```

让配置生效：

```bash
source ~/.zshrc
```

## 10. 配置 Node 下载镜像

这一步决定 `nvm install` 是否顺利。

临时配置：

```bash
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
```

如果你使用 zsh，建议写入 `~/.zshrc`：

```bash
echo 'export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node' >> ~/.zshrc
source ~/.zshrc
```

如果你使用 bash，建议写入 `~/.bashrc`：

```bash
echo 'export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node' >> ~/.bashrc
source ~/.bashrc
```

## 11. Linux 安装 Node LTS

安装最新 LTS 版本：

```bash
nvm install --lts
```

使用 LTS 版本：

```bash
nvm use --lts
```

设置为默认版本：

```bash
nvm alias default lts/*
```

设置默认版本很重要。否则服务器重启或重新打开终端后，可能找不到 `node` 命令。

## 12. Linux 配置 npm 国内源

设置 npm registry：

```bash
npm config set registry https://registry.npmmirror.com
```

验证：

```bash
npm config get registry
```

如果输出：

```text
https://registry.npmmirror.com
```

说明 npm 国内源配置成功。

## 13. 验证是否安装成功

执行：

```bash
node -v
npm -v
which node
```

正常情况下，`which node` 应该指向类似下面的位置：

```text
~/.nvm/versions/node/...
```

这说明当前 Node 是由 `nvm` 管理的。

## 14. 常见错误

### 14.1 nvm: command not found

原因：shell 配置文件没有加载。

bash 用户执行：

```bash
source ~/.bashrc
```

zsh 用户执行：

```bash
source ~/.zshrc
```

### 14.2 nvm install 卡住

原因：没有配置 Node 下载镜像，国内网络访问官方源较慢。

解决：

```bash
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
```

并建议写入对应 shell 配置文件。

### 14.3 node 装好了但 npm 很慢

原因：npm registry 还在使用默认源。

解决：

```bash
npm config set registry https://registry.npmmirror.com
```

### 14.4 服务器重启后 node 没了

原因：没有设置默认 Node 版本。

解决：

```bash
nvm alias default lts/*
```

## 15. 工程级推荐组合

Linux 服务器或开发机推荐组合：

```text
zsh
nvm
Node LTS
npm 国内源
PM2
Nginx
```

其中：

- `zsh`：更好用的 shell。
- `nvm`：管理 Node 版本。
- `Node LTS`：长期支持版本，稳定优先。
- `npm 国内源`：提升依赖安装速度。
- `PM2`：用于管理 Node 后端进程。
- `Nginx`：用于部署前端静态资源、反向代理后端服务。

## 16. 一句话总结

国内环境下安装前端基础环境，可以记成一句话：

```text
Windows = nvm-windows + Node LTS + npm 国内源
Linux = Gitee 装 nvm + npmmirror 装 Node + npm 换源
```

先把版本管理和镜像源配置好，后面创建 Vue、Vite、React、Three.js 项目时会少很多环境问题。

---
title: mac os
date: 2025-06-21
created: 2025-06-21
updated: 2025-06-21
---

# 1. homebrew

- /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

## 1.1. command

- Formulae：软件包，包括了这个软件的依赖、源码位置及编译方法等；

> brew install 是下载源码解压，然后 ./configure && make install ，同时会包含相关依存库，并自动配置好各种环境变量。

- Casks：已经编译好的应用包，如图形界面程序等。

> brew cask 是针对已经编译好了的应用包（.dmg/.pkg）下载解压，然后放在统一的目录中（Caskroom），省掉了自己下载、解压、安装等步骤。

brew install 用来安装一些不带界面的命令行工具和第三方库。

brew cask install 用来安装一些带界面的应用软件。

```shell
# 查看brew版本：
brew -v
# 更新brew版本：
brew update
# 本地软件库列表：
brew list
# 查看软件库版本：
brew list --versions
# 查找软件包：
brew search xxx （xxx为要查找软件的关键词）
# 安装软件包：
brew install xxx （xxx为软件包名称）
# 卸载软件包：
brew uninstall xxx
# 安装软件：
brew cask install xxx（xxx为软件名称）
# 卸载软件：
brew cask uninstall xxx
# 查找软件安装位置：
which xxx （xxx为软件名称）

# 诊断
brew doctor

# 清理不必要的安装包
brew cleanup
```

## 1.2. 镜像加速

- https://zhuanlan.zhihu.com/p/137464385

```shell
cd "$(brew --repo)"
git config -l 先查看下当前git的配置
git remote set-url origin https://mirrors.ustc.edu.cn/brew.git

cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
git remote set-url origin https://mirrors.ustc.edu.cn/homebrew-core.git

echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles' >> ~/.bash_profile
# 不自动更新，不然每次都很慢
echo 'export HOMEBREW_NO_AUTO_UPDATE=1' >> ~/.bash_profile
source ~/.bash_profile

env | grep homebrew

# 这次更新时间长，但更新完成后，会加速
brew update 

```

## 1.3. 使用brew安装多版本jdk

### 1.3.1. 查看可以安装的版本

```shell

deipss@deipssdeMacBook-Air ~ % brew search jdk 
==> Formulae
openjdk ✔         openjdk@11 ✔      openjdk@17        openjdk@8         jd                mdk               cdk

==> Casks
adoptopenjdk                                                     oracle-jdk
homebrew/cask-versions/adoptopenjdk8                             oracle-jdk-javadoc
gama-jdk                                                         homebrew/cask-versions/oracle-jdk17
graalvm-jdk                                                      sapmachine-jdk
homebrew/cask-versions/graalvm-jdk17                             semeru-jdk-open
jdk-mission-control                                              homebrew/cask-versions/semeru-jdk11-open
microsoft-openjdk                                                homebrew/cask-versions/semeru-jdk17-open
homebrew/cask-versions/microsoft-openjdk11                       homebrew/cask-versions/semeru-jdk8-open
homebrew/cask-versions/microsoft-openjdk17
deipss@deipssdeMacBook-Air ~ % 
```

### 1.3.2. 查看已安装的jdk

- `brew list --version |grep jdk`
- 查看本地安装的java版本 /usr/libexec/java_home -V
- mac上的默认目录 /Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home

### 1.3.3. JDK多版本bash配置

```shell
export JAVA_8_HOME=/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home
export JAVA_11_HOME=/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home
export JAVA_HOME=$JAVA_8_HOME
export PATH=$JAVA_HOME/bin:$PATH
export CLASS_PATH=$JAVA_HOME/lib
export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles
export HOMEBREW_NO_AUTO_UPDATE=1
alias jdk8="export JAVA_HOME=$JAVA_8_HOME"
alias jdk11="export JAVA_HOME=$JAVA_11_HOME"
alias ll='ls -alrth'

```

> source ~/.bash_profile
>
> Zsh应改为 source ~/.zshrc

# 2. cpu

用来操作计算单元的控制单元的指令集合就是CPU指令集，有X86、RAM、MIPS、IA64，可以分成复杂指令集和
精简指令集两类，CISC和RISC。
PC端主要是X86，移动端主是要ARM。

| 处理器体系结构的类型 | ARM          | x86/x64         |
|------------|--------------|-----------------|
| 架构开发公司	    | ARM	         | Intel /AMD      |
| 处理器制造公司	   | Intel,apple	 | Intel /AMD      |
| 指令集的架构	    | RISC	        | CISC            |
| 主要使用的用途	   | 智能手机，平板电脑	   | PC服务器           |
| 32位/64位	   | 两者都有	        | x86:32位/x64:64位 |
| 字节存储次序	    | bi-endian	   | Little endian   |

- uname -pa 命令来查询CPU的架构

Apple M3是苹果公司研发、台积电制造的一款单片系统，
用作Mac台式机和笔记本电脑的中央处理器和图形处理器。
于2023年的苹果全球开发者大会发布，为苹果公司的Apple Silicon中、
M系列的第三代产品，亦是Mac向苹果芯片迁移计划中的一部分，构建于ARM平台。


# 3. 目录

## 3.1. Mac 的文件目录结构

![mac_file.png](img%2Fmac_file.png)

右侧的就是非root的权限的文件夹，其他的就是需要root权限才可以访问,资源库就是Library文件夹

> 其他隐藏的目录，在finder中，可以按 command + shift + .

- /System 文件夹，系统文件夹。与Windows 之中的 C:\windows32 等文件夹类似。
    - Library 系统资料库，其中的 Caches 可以删除。
    - iOSSupport 提供了系统的 iOS 支持。
- /Applications GUI软件文件夹，共享的所有软件包都存放在此。
- /Library 应用资料库，包括了大部分非核心的系统组件。Caches 可删除。
- /Users 文件夹，与 Linux 之中的 /home 文件夹功能类似。而mac 之中的 /home 只是为了与 Linux 兼容，一般不放任何东西。
- /Network 和 /net 网络相关，空的。
- /Volumes 与 /mnt 类似，其中挂载了全部硬盘、网络硬盘等。
- /sbin，/bin，/usr /dev文件夹，与 Linux 基本一致。与 Linux 兼容。
- /etc, /var /tmp 文件夹，是位于 /private 之中对应文件夹的软连接。存放系统配置、数据库、缓存等。用于与 Linux 文件结构兼容。

# 4. 其他常用软件

- tabby 远程登陆
- scroll reverser 用于鼠标与触摸板的转换
- logi optional 罗技鼠键
- 腾讯柠檬 用以整理大文件

# 5. nmap
```text
(base) ➜  ~ nmap 192.168.1.0/24                           
Starting Nmap 7.95 ( https://nmap.org ) at 2025-03-05 21:04 CST
Nmap scan report for 192.168.1.1
Host is up (0.0074s latency).
Not shown: 993 closed tcp ports (conn-refused)
PORT      STATE    SERVICE
21/tcp    filtered ftp
23/tcp    filtered telnet
80/tcp    open     http
445/tcp   open     microsoft-ds
5431/tcp  open     park-agent
8080/tcp  open     http-proxy
32768/tcp open     filenet-tms

Nmap scan report for 192.168.1.2
Host is up (0.0084s latency).
Not shown: 994 closed tcp ports (conn-refused)
PORT     STATE SERVICE
21/tcp   open  ftp
22/tcp   open  ssh
3306/tcp open  mysql
8080/tcp open  http-proxy
9200/tcp open  wap-wsp
9876/tcp open  sd

Nmap scan report for 192.168.1.6
Host is up (0.00015s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT     STATE SERVICE
5000/tcp open  upnp
7000/tcp open  afs3-fileserver
```

## 5.1. principle
- 主机发现（Host Discovery）
确定目标主机是否在线。通过发送多种探测包（如ICMP、ARP、TCP SYN/ACK等），结合响应判断主机活跃状态。

```text
ARP请求（局域网）

数据包类型：ARP Request（广播）

作用：在局域网内解析目标IP的MAC地址，确认主机在线。

特点：仅用于同一子网，绕过IP层直接通过数据链路层探测。

ICMP Echo请求（Ping）

数据包类型：ICMP Type 8（Echo Request）

作用：检测目标是否
```
- 端口扫描（Port Scanning）
检测目标主机的端口开放状态。不同扫描技术利用TCP/UDP协议特性，通过发送特定标志位的数据包并分析响应（如SYN-ACK、RST或无响应）判断端口状态。

- 服务与版本检测（Service and Version Detection）
连接到开放端口，发送协议特定的请求（如HTTP GET、SSH握手），解析响应以识别服务及其版本。

- 操作系统检测（OS Fingerprinting）
分析目标TCP/IP协议栈的独特行为（如初始序列号生成、TCP选项支持、ICMP响应模式），与已知操作系统指纹库匹配。

- 脚本扫描（NSE, Nmap Scripting Engine）
执行自定义脚本，进一步探测漏洞、配置错误或其他信息（如SSL证书、共享文件夹）。

# 6. oh my zsh
Oh My Zsh 默认是基于 **Zsh**（Z Shell）的，它是为 Zsh 提供的一个开源框架，用于增强 Zsh 的功能和使用体验。

### 6.1. 简要说明：
1. **Zsh** 是 Oh My Zsh 的基础 shell。
2. Oh My Zsh 并不直接与 `sh` 或 `bash` 兼容，它专注于扩展 Zsh 的功能。
3. 如果你安装了 Oh My Zsh，默认情况下你的终端会切换到 Zsh。

### 6.2. 如何确认当前使用的 shell？
运行以下命令可以查看当前用户的默认 shell：
```bash
echo $SHELL
```

如果输出类似 `/bin/zsh`，则表示当前默认使用的是 Zsh。
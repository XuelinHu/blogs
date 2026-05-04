---
title: linux
date: 2025-06-18
---

# 1. log

- [Linux 6种日志查看方法](https://cloud.tencent.com/developer/article/1579977)

## 1.1. tail

```bash
命令格式: tail[必要参数][选择参数][文件]
-f 循环读取
-q 不显示处理信息
-v 显示详细的处理信息
-c<数目> 显示的字节数
-n<行数> 显示行数
-q, --quiet, --silent 从不输出给出文件名的首部
-s, --sleep-interval=S 与-f合用,表示在每次反复的间隔休眠S秒

tail -fn 1000 test.log | grep '关键字'
```

## 1.2. head

```bash
head -n  10  test.log   查询日志文件中的头10行日志;
head -n -10  test.log   查询日志文件除了最后10行的其他所有日志;
```

## 1.3. less

less命令在查询日志时，less与more类似，使用less可以随意浏览文件，
**而more仅能向前移动，不能向后移动**,而且 less 在查看之前不会加载整个文件。

```bash
less -mN log2013.log 
-g 只标志最后搜索的关键词
-m 显示类似more命令的百分比
-N 显示每行的行号

/字 符串：向下搜索"字 符串"的功能
?字符串：向上搜索"字符串"的功能
n：重复前一个搜索（与 / 或 ? 有关）
N：反向重复前一个搜索（与 / 或 ? 有关）
b 向上翻一页
d 向后翻半页
h 显示帮助界面
Q 退出less 命令
u 向前滚动半页
y 向前滚动一行
空格键 滚动一页
回车键 滚动一行
G 跳到末行
```

## 1.4. more

more命令是一个基于vi编辑器文本过滤器，它以全屏幕的方式按页显示文本文件的内容，
支持vi中的关键字定位操作。
more内置了若干快捷键，常用的有H（获得帮助信息），

- Enter（向下翻滚一行）
- 空格（向下滚动一屏）
- Q（退出命令）
- more命令从前向后读取文件，因此在启动时就加载整个文件

该命令一次显示一屏文本，
满屏后停下来，并且在屏幕的底部出现一个提示信息，给出至今己显示的该文件的百分比：

## 1.5. cat

cat（英文全拼：concatenate）命令用于连接文件并打印到标准输出设备上。

```shell
#把 textfile1 的文档内容加上行号后输入 textfile2 这个文档里：
cat -n textfile1 > textfile2
#读取 textfile1 和 textfile2 的内容，对非空行编号后，将内容追加到 textfile3 
cat -b textfile1 textfile2 >> textfile3
```

## 1.6. realpath

> realpath *java 显示以java结尾的数据的全路径

## 1.7. grep

Linux grep (global regular expression) 命令用于查找文件里符合条件的字符串或正则表达式。

```shell
grep "字符串" 文件名 | grep "字符串"
grep "^字符串" 文件名


#从文件内容查找匹配指定字符串的行： 
grep "被查找的字符串" 文件名

#从文件内容查找与正则表达式匹配的行： 
grep –e “正则表达式” 文件名

#查找时不区分大小写： 
grep –i "被查找的字符串" 文件名

#查找匹配的行数： 
grep -c "被查找的字符串" 文件名

#从文件内容查找不匹配指定字符串的行：  
grep –v "被查找的字符串" 文件名

#从文件内容查找内容，并显示10条上下文  
grep –C 10 "被查找的字符串" 文件名

#从根目录开始查找所有扩展名为.log的文本文件，并找出包含”ERROR”的行 
find / -type f -name "*.log" | xargs grep "ERROR"

#倒序输出搜索到的内容
grep "ERROR" app-repeater-receiver-2022-05-06-1.log | grep "saveRecord" | sort -k2 -n -r -t:
```

# 2. 文件查找

- http://www.ruanyifeng.com/blog/2009/10/5_ways_to_search_for_files_using_the_terminal.html

## 2.1. find

```bash
find . -name 'my*'
find . -name 'my*' -ls
# 查找近10分钟修改过的文件
find -type f -mmin 10
find / -name "my*" 从根目录开始查找
```

## 2.2. locate

类似于find -name，但是效率比find高

```bash
locate /etc/my
```

## 2.3. whereis

只查找bin文件，即一些命令

```bash
whereis java
where grep
```

## 2.4. which

从PATH中查找

```bash
which java
which grep
```

# 3. 网络信息查询

## 3.1. ifconfig

```shell
ifconfig -address
```

## 3.2. telnet ip port

检查某个服务的port是否启动

## 3.3. tcpdump

```shell
yum install tcpdump
-w write写入某个文件 
tcpdump -w package.cap

tshark tcpdump的高级版本

```

## 3.4. netstat

```shell
netstat -s | egrep "listen|LISTEN" 
netstat -s | grep -i "listen"
# 查询所有tcp的连接，可用于服务启动后的端口查看，是否启动了kafka，dubbo等
netstat -at 
# 将会显示使用该端口的应用程序的进程 id
netstat -nap | grep port 
netstat -g 将会显示该主机订阅的所有多播网络。
```

## 3.5. traceroute

```shell
traceroute baidu.com
```

## 3.6. ss

```bash
ss -int
```

## 3.7. 内网穿透

frp

# 4. 硬盘使用

## 4.1. df

df（英文全称：disk free）：列出文件系统的整体磁盘使用量

```shell
df -h /etc
例如，查看根目录 / 的磁盘使用情况：
df -h /
```

## 4.2. du

- h或--human-readable 以K，M，G为单位，提高信息的可读性。
- -s或--summarize 仅显示总计。

```shell
du * sh 
```

## 4.3. show information of cpu memory disk

```shell
lshw -class memory
lshw -class cpu
lshw -class disk
```

# 5. 系统环境

- https://www.cnblogs.com/youyoui/p/10680329.html

## 5.1. 修改环建变量

### 5.1.1. Linux环境变量配置方法一：export PATH

```shell
export PATH=/home/uusama/mysql/bin:$PATH
# 或者把PATH放在前面
export PATH=$PATH:/home/uusama/mysql/bin
```

生效时间：立即生效
生效期限：当前终端有效，窗口关闭后无效
生效范围：仅对当前用户有效
配置的环境变量中不要忘了加上原来的配置，即$PATH部分，避免覆盖原来配置

### 5.1.2. Linux环境变量配置方法二：vim ~/.bashrc

```shell
vim ~/.bashrc
# 在最后一行加上
export PATH=$PATH:/home/uusama/mysql/bin
```

生效时间：使用相同的用户打开新的终端时生效，或者手动source ~/.bashrc生效
生效期限：永久有效
生效范围：仅对当前用户有效
如果有后续的环境变量加载文件覆盖了PATH定义，则可能不生效

### 5.1.3. Linux环境变量配置方法三：vim ~/.bash_profile

```shell
和修改~/.bashrc文件类似，也是要在文件最后加上新的路径即可：
vim ~/.bash_profile
# 在最后一行加上
export PATH=$PATH:/home/uusama/mysql/bin
```

注意事项：

生效时间：使用相同的用户打开新的终端时生效，或者手动source ~/.bash_profile生效
生效期限：永久有效
生效范围：仅对当前用户有效
如果没有~/.bash_profile文件，则可以编辑~/.profile文件或者新建一个

### 5.1.4. Linux环境变量配置方法四：vim /etc/bashrc

```shell

# 如果/etc/bashrc文件不可编辑，需要修改为可编辑
chmod -v u+w /etc/bashrc
vim /etc/bashrc
# 在最后一行加上
export PATH=$PATH:/home/uusama/mysql/bin

```

该方法是修改系统配置，需要管理员权限（如root）或者对该文件的写入权限：

注意事项：
生效时间：新开终端生效，或者手动source /etc/bashrc生效
生效期限：永久有效
生效范围：对所有用户有效

### 5.1.5. Linux环境变量配置方法五：vim /etc/profile

```shell

# 如果/etc/profile文件不可编辑，需要修改为可编辑
chmod -v u+w /etc/profile

vim /etc/profile

# 在最后一行加上
export PATH=$PATH:/home/uusama/mysql/bin
```

该方法修改系统配置，需要管理员权限或者对该文件的写入权限，和vim /etc/bashrc类似：
注意事项：

生效时间：新开终端生效，或者手动source /etc/profile生效
生效期限：永久有效
生效范围：对所有用户有效

## 5.2. 环境变量分类

环境变量可以简单的分成用户自定义的环境变量以及系统级别的环境变量。

- 用户级别环境变量定义文件：~/.bashrc、~/.profile（部分系统为：~/.bash_profile）
- 系统级别环境变量定义文件：/etc/bashrc、/etc/profile(部分系统为：/etc/bash_profile）、/etc/environment

Linux加载环境变量的顺序如下：

```text
/etc/environment
/etc/profile
/etc/bash.bashrc
/etc/profile.d/test.sh
~/.profile
~/.bashrc
```

## 5.3. 查看环境变量

- env 查看当前主机的所有环境环境
- export命令显示当前系统定义的所有环境变量
- echo $PATH命令输出当前的PATH环境变量的值

```shell
env | grep -i 'env' 在环境变量中查找包括env字符的行
```

# 6. 进程

## 6.1. nmon

https://nmon.sourceforge.io/pmwiki.php

## 6.2. ps

```shell
查看某个关键字的进程
ps aux | grep java  
ps -ef | grep  <关键字>

ps -auf
ps -L <pid>
```

## 6.3. lsof

(list open files)列出当前系统打开文件，显示系统中所有进程打开的文件和网络连接，包括普通文件、目录、设备、网络端口等。
适用场景：

- 查找占用特定端口的进程。
- 检测文件被哪些进程占用（如卸载文件系统前检查）。
- 分析网络连接状态。
- 调试程序资源占用问题。

参数功能:

```shell

lsof	列出所有打开的文件（默认行为）。
-i	显示网络相关的打开文件（如端口、协议）。
-i :端口号	查看占用指定端口的进程（如 lsof -i :80 查看HTTP服务）。
-i @IP	查看与指定IP相关的网络连接。
-i [protocol]	指定协议（如 tcp、udp）。
-p PID	显示指定进程ID（PID）的打开文件。
-c 进程名	显示指定进程名（含模糊匹配）的打开文件（如 lsof -c sshd）。
-u 用户名	显示指定用户打开的文件。
-d 文件描述符	显示指定文件描述符（如 cwd 表示当前目录，txt 表示可执行文件）。
-n	不将IP地址转换为主机名（加快显示速度）。
-t	仅输出PID（常用于组合命令）。
+d 目录	递归扫描指定目录下被打开的文件（快速）。
+D 目录	递归扫描指定目录及其子目录下被打开的文件（较耗时）。

```

在 Unix/Linux 中，“一切皆文件”，所以它不仅能查文件，还能查：

* 打开的普通文件
* 使用的网络端口和套接字
* 设备（如磁盘）
* 管道和匿名文件
* 正在使用某个库、目录的进程

---
### 🧠 基本语法
```bash
lsof [选项] [文件名 / 端口 / 进程号等]
```
### 🔍 查看某个文件被哪个进程占用
```bash
lsof /path/to/file
```
### 🔍 查某个端口被哪个进程占用
```bash
lsof -i :8080
```
> 输出类似：
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
java     1234 user   45u  IPv6 123456      0t0  TCP *:http-alt (LISTEN)
```
### 🔍 列出某个进程打开的所有文件
```bash
lsof -p 1234
```
### 🔍 查某个用户的打开文件
```bash
lsof -u username
```
### 🔍 查看所有网络连接（TCP/UDP）
```bash
lsof -i
```
### 🔍 显示正在监听的端口
```bash
lsof -i -sTCP:LISTEN
```
### 🔍 查某个程序名的所有打开文件
```bash
lsof -c nginx
```
---

## 6.4. 🔐 权限问题

`lsof` 对其他用户的进程有限制。要看到完整信息通常需要 `sudo`：

```bash
sudo lsof -i :80
```

---
## 🧩 进阶技巧
### 🔍 查哪些进程使用了某个挂载点（如 `/mnt/usb`）
```bash
lsof +D /mnt/usb
```
（递归查目录）
---

### 6.4.1. 🧹 卸载设备前查是否被占用

```bash
lsof | grep /dev/sdb1
```

---
### 💥 查杀占用端口的进程（如 8080）
```bash
sudo kill -9 $(sudo lsof -t -i :8080)
```
---

## 6.5. 📄 输出字段说明

| 列       | 含义                                           |
|---------|----------------------------------------------|
| COMMAND | 打开文件的进程名                                     |
| PID     | 进程 ID                                        |
| USER    | 进程所有者                                        |
| FD      | 文件描述符，如 `cwd`（当前目录）、`txt`（可执行代码）、`mem`（内存映射） |
| TYPE    | 文件类型，如 REG（普通文件）、DIR、CHR（字符设备）、IPv4          |
| NAME    | 文件名或网络地址                                     |

---

## 6.4. kill

- kill -9 PID SIGKILL 9 强制终止进程，立即结束进程，不给进程任何清理机会。
- kill -15 PID SIGTERM 15 请求进程优雅退出，允许进程自行清理资源后再终止。

- https://www.runoob.com/linux/linux-comm-kill.html 菜鸟

## 6.5. dmesg

Linux dmesg（英文全称：display message）命令用于显示开机信息。
dmesg 基本介绍
全称：dmesg（display mesg，或 driver message）。
作用：显示或控制 内核环形缓冲区（kernel ring buffer）中的信息，包括系统启动时的硬件检测、驱动加载、内核事件以及运行时的错误和警告。

- dmesg -t > dmseg1.log
- sudo dmesg --ctime

适用场景：

- 排查硬件或驱动问题（如设备未识别、驱动冲突）。
- 分析系统启动失败或崩溃原因。
- 实时监控内核日志（如调试新硬件或内核模块）。

# 7. 其他

## 7.1. nohup

```shell
nohup /root/runoob.sh > runoob.log 2>&1 &
# 7. 2>&1 解释：
# 8. 将标准错误 2 重定向到标准输出 &1 ，标准输出 &1 再被重定向输入到 runoob.log 文件中。
# 9. 0 – stdin (standard input，标准输入)
# 10. 1 – stdout (standard output，标准输出)
# 11. 2 – stderr (standard error，标准错误输出)

nohup sh -c 'pip install -r /home/deipss/jupyter_files/ComfyUI/requirements.txt' > runoob.log 2>&1 &
sh -c 相当于把后面一个字符串，当作一个sh命令执行
```

# 8. sh bash zsh ksh 的区别

```text
sh、bash、zsh和ksh都是Unix和Linux系统中的shell，即命令行解释器，它们的主要区别在于功能、特性和使用场景。

sh（Bourne Shell）：这是Unix系统的原始shell，也是其他shell的基础。
sh遵循POSIX规范，当某行代码出错时，它不会继续执行下面的代码。
sh的语法相对简单，但功能较少，不适合进行复杂的脚本编写。

bash（Bourne Again Shell）：bash是sh的一个增强版本，也是目前最常见的shell。
bash兼容大多数的Bourne Shell语法，并提供了许多扩展功能，如命令历史记录、命令补全和作业控制等。
这使得bash在Linux和Unix系统中被广泛应用于系统管理、脚本编写和命令行交互。

zsh（Z Shell）：zsh是一个功能强大且高度可定制的shell。它具有更先进的命令补全、别名扩展、文件名扩展和主题定制等特性。
zsh提供了更好的交互式体验和可定制性，因此通常被高级用户和开发人员用于日常使用和脚本编写。

ksh（Korn Shell）：ksh是由AT&T Bell实验室开发的一个强大的shell。
它继承了Bourne Shell和C Shell的特性，并添加了一些自己的扩展功能，如命令别名、编辑命令行和作业控制等。
ksh在Unix系统中使用较为广泛，特别是在商业环境中。
```

# 9. cpu npu gpu 的区别

```text
CPU、GPU和NPU都是不同类型的处理器，它们在处理任务、性能和架构上各有优势和特点，三者区别具体如下：

定义和功能：
CPU，即中央处理器，主要负责执行低精度的普通数据任务，以及进行逻辑判断和分支跳转等操作。
CPU遵循冯·诺依曼架构，其核心是存储程序/数据、串行顺序执行。
GPU，即图形处理器，主要处理图像数据，具备高度的并行计算能力，最初是为处理图像并行计算数据而设计的。
GPU的核数远超CPU，每个核拥有相对较小的缓存和简单的数字逻辑运算单元。
NPU，即神经网络处理器，是为人工智能算法设计的，运行效率高于CPU和GPU。NPU会模仿人的大脑神经网络，具备智能的特性。

工作模式：
CPU采取顺序执行运算的模式，即一件一件事情地完成。
GPU则能够并发执行运算，使多件事情同时运作。

架构和计算能力：
CPU芯片中，计算单元只占据了很小的一部分，大量的空间用于放置存储单元和控制单元，因此在处理大规模并行计算时受到限制。
GPU的架构与CPU有很大不同，其芯片空间的80%以上是计算单元（ALU），使其在处理大规模并行计算任务时更具优势。

CPU擅长处理逻辑控制和低精度数据；
GPU在处理图像和大规模并行计算方面表现出色；
而NPU则专注于人工智能算法，模仿人脑神经网络进行高效运算。

```
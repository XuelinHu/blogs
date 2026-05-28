---
title: Jmeter Mac
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. install

## 1.1. brew install

> brew install jmeter --with-plugins

使用brew安装的，在MAC上运行时报错

## 1.2. url down install

> https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz

下载后，解压运行的，在MAC上可以运行

## 1.3. 参考文档

- https://juejin.cn/post/6986574899338805261

# 2. 文件目录

执行一个压测文件
> jmeter -n -t [jmx file] -l [results file] -e -o [Path to web report folder]

- bin 可执行文件
    - jmeter.properties 配置文件
- extras 一些插件
- lib 运行是需要的包

# 3. 文件配置

# 4. 线程组


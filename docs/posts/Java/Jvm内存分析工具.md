---
title: Jvm内存分析
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 使用以下命令进行dump java文件

```shell
jmap -dump:[live],format=b,file=<file-path> <pid>
jmap -dump,format=b,file=<file-path> <pid>
```

# 2. eclipse mat

- 下载地址 https://eclipse.dev/mat/previousReleases.php

> jdk 8 使用Memory Analyzer 1.7.0 Release版本



> 浅堆（Shallow Heap）和深堆（Retained Heap）是两个非常重要的概念，它们分别表示一个对象结构所占用的内存大小和一个对象被GC回收后，可以真实释放的内存大小。

## 2.1. 元空间内存泄漏

- 序列化与反序列化时，类加载器加载元信息过多，没有回收,例如 https://github.com/alibaba/fastjson2/issues/2109


## 2.2. 堆OOM

- 内存中没有回收的对象过多
- 回收过慢，内存申请过多、过快

# 3. jvisualvm
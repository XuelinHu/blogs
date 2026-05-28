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

## 3.1. 常见分析思路

- 先确认是堆内存问题、元空间问题还是本机内存问题。
- 如果是堆问题，先看大对象、对象数量和 GC 回收情况。
- 如果是元空间问题，优先看动态类加载、类加载器泄漏和字节码增强。

## 3.2. 工具分工

- `jmap`：导出堆 dump。
- `MAT`：分析对象引用链、泄漏嫌疑和 retained heap。
- `jvisualvm`：看堆、线程、CPU、Sampler 和实时运行情况。

## 3.3. 实战建议

- dump 文件要尽量在问题现场第一时间保留。
- 结合 GC 日志、线程栈和业务日志一起看，单看 dump 容易误判。
- 内存问题往往不是“对象太大”，更多是“对象不该活那么久”。 

---
title: JVM方法区
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---


# 1. 方法区存在的数据
- 类的元信息（方法，虚方法表，字段，基本信息，常量），虚方法表是用于多态的实现
- 运行时常量池
- 字符串常量池（StringTable hotspot版本的jdk是在堆中）

![img.png](img/matesapce_string_table_add.png)

--- 

![img.png](img/matesapce_string_table_add1.png)

jdk7 类的元信息在堆中永久代
jdk8 类的元信息，在内存中，叫元空间
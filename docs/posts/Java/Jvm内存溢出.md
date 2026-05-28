---
title: Jvm内存溢出
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 虚拟机栈与本地方法栈溢出

## 1.1. StackOverflowError

- 方法一 使用Xss 参数减少栈内存容量
- 方法二 在一个方法中，定义大量的本地变量，使用方法栈帧容量增大

## 1.2. OutOfMemoryError

- 循环创建线程，会出现提示

```shell
unable to create native thread
```

# 2. 方法区和运行时常量池溢出

自jdk1.8后，永久代不在jvm的规划内，使用元空间代替。

- 所以继续使用String::intern()的方式不断的增加常量池中的数据，以企图造成
  运行时的常量池内存溢出，是不会出现了
- 要在方法区造成内存溢出，首先方法区是存放类的类型信息、常量 、静态变量等信息的，
  所以只能通过增加这些数据来试图引发OOM。借助CGLIB的字节码增强技术，可以增强许多的
  类，或是new脚本（groovy,python,javascript）对象，来不断扩大方法区中动态生成
  的新类型，来占据这块内存
    - Fastjson 序列化就会加载类信息
    - Lambda表达式 也会生成类信息
    - Spring BeanUtil.copy()也会

# 3. 本机内存内存溢出

unsafe类，或是native声明的方法，会直接使用本机内存，想这块内存溢出，
就要不断申请这块本机内存，可以通过
**unsafe.allocateMemory(1MB)**
来实现


 
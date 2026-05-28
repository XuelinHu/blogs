---
title: JVM直接内存
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---


# 1. 存在的意义
- 需要直接调用操作系统的功能
- 在网络编码时，使用NIO的方法，需要直接读写内存，不通过jvm的堆

# 2. 使用场景

- NIO 的 `ByteBuffer.allocateDirect` 会申请直接内存，减少堆内存与内核缓冲区之间的复制。
- Netty 等高性能网络框架通常会使用直接内存提升 IO 性能。
- 直接内存不受 Java 堆大小直接限制，但仍会受到进程可用内存和 `MaxDirectMemorySize` 影响。

# 3. 排查建议

- 出现 `OutOfMemoryError: Direct buffer memory` 时，优先检查直接内存上限、缓冲区释放和对象池配置。
- 结合 Native Memory Tracking、jcmd、框架内存指标确认是否存在堆外内存泄漏。

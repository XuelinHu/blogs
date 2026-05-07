---
title: 记一次kafka数据丢失
date: 2025-05-25
---

# 1. 背景

Kafka 数据丢失排查需要先区分问题发生在生产端、Broker 端还是消费端。常见方向包括生产者未等待确认、Broker 副本不足、未开启严格副本写入、消费者先提交 offset 后处理失败等。

## 1.1. 排查要点

- 生产端确认 `acks`、重试次数、幂等发送和异常日志。
- Broker 端确认 `min.insync.replicas`、副本 ISR 状态和磁盘异常。
- 消费端确认 offset 提交时机，避免业务处理失败后已提交。
- 对关键链路补充消息唯一键、业务落库状态和补偿任务。

# 2. 参考文献
- https://xie.infoq.cn/article/d62160c08a5ecb5dca291e159

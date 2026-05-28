---
title: SkyWalking
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 概述

SkyWalking 是面向分布式系统的可观测性平台，常用于链路追踪、服务拓扑、性能指标采集和慢调用定位。接入时通常需要关注 Agent 版本、服务名、采样策略、后端存储和 Trace 与日志的关联。

## 2. 核心能力

- 分布式链路追踪
- 服务拓扑发现
- 接口、实例、数据库等多维指标观测
- 慢调用、错误调用和异常链路定位

## 3. 接入关注点

- Agent 版本与应用运行时版本是否匹配
- 服务名是否规范，避免同类服务被拆散
- 采样率是否过低或过高
- Trace 和日志是否能通过 traceId 对齐

## 4. 参考文献

- https://skywalking.apache.org/zh/
- http://bigbully.github.io/Dapper-translation/ Dapper，大规模分布式系统的跟踪系统

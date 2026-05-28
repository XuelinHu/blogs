---
title: 记一次jvm优化
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 背景
各个业务主机通过kafka将数据上报，有一个进行数据同步的系统，
将kafka上的数据同步到消费，简单加工后，存放在ES。 

**问题：4台 2C 16G 的机器内存使用占比在85%以上。**

# 2. 分析过程
- jps

选出进程

- jinfo

查看进程的信息
发现14G的jvm内存，新生代只占了140MB，许多数据全在老年代，且不回收。
后面发现是因为公司默认使用ParNew对年轻代进行回收，CMS进行老年代回收。140M是
公司默认的。

- jstat -gcutil `<jpid>` 5000 20
查看到有YGC频繁，每次30ms、FGC2小时一次

- jstat -gcnew `<jpid>` 5000 20
- jstat -gcnewcapbility `<jpid>` 5000 20

# 3. 解决办法
- 可以指定新生代最大的内存
- 使用G1作为垃圾回收

# 4. 参考资料
- https://zhuanlan.zhihu.com/p/83804324 JVM之G1回收器和常见参数配置
- https://zhuanlan.zhihu.com/p/626362331 JVM性能调优常用命令Jstat
- https://www.elastic.co/guide/en/logstash/current/tuning-logstash.html#profiling-the-heap
- https://www.elastic.co/guide/en/logstash/current/jvm-settings.html

## 4.1. 复盘点

这次问题的本质不是“机器内存不够”，而是 JVM 代际配置和回收器策略不适合当前负载，导致大量对象长时间滞留在老年代。

## 4.2. 调优思路

- 先通过 `jstat` 看 Young GC 和 Full GC 频率。
- 再确认年轻代、老年代和回收器参数是否合理。
- 如果对象生命周期分布和默认代际比例不匹配，就要调整新生代大小或更换回收器。

## 4.3. 实战建议

- 调优前先保留现状参数和监控快照，避免回滚无依据。
- 不要只看堆大小，代际比例和回收器选择同样重要。
- 调整后要至少观察一段完整业务周期，而不是看几分钟就下结论。

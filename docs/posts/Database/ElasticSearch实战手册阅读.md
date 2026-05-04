---
title: ElasticSearch实战手册阅读
date: 2025-05-25
---

# 1. index 设计优化

- 对于不需要的字段，可以关闭index功能，来节省空间, 默认情况下，Elasticsearch 文档每个字段都会被索引。如果某些字段不需要支持查询，可以在映射中配置 "index": false
  ，减少存储空间占用，并且提升写入速度。

```json

{
  "properties": {
    "email": {
      "type": "keyword",
      "index": false,
      "doc_values": false
    }
  }
}
```

# 2. 部署优化

- 官方标准建议是：将 50％ 的可用内存（不超过 32 GB，一般建议最大设置为：31 GB）分配给 Elasticsearch 堆，而其余 50％ 留给 Lucene
  缓存。
- 官方给出的合理的建议：每个分片数据大小：30GB-50GB。

# 3. translog

- https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-translog.html

Translog是Elasticsearch的事务日志文件，它记录了所有对索引分片的事务操作（add/update/delete），
每个分片对应一个translog文件。Translog的主要作用是实时记录对于索引的修改操作，确保在索引写入磁盘前出现系统故障不丢失数据。
它以stream的形式顺序写入，不会消耗太多资源，也不会成为性能瓶颈。在存储数据时，Elasticsearch先将数据写入内存和translog文件，
等到refresh时间后，才将数据存储到Lucene中的segment中，清空内存缓冲区，往磁盘里写入commit point信息，
文件系统的page cache（segments）fsync到磁盘，之后清空旧的translog日志。

在崩溃的情况下，当shard恢复时，可以从事务日志中重新重放最近的事务。Translog的设计目的是帮助shard恢复操作，否则数据可能会从内存flush到磁盘时发生意外而丢失。
日志每5秒被提交到磁盘上，或者在每个成功的索引、删除、更新或批量请求时提交。任何索引或删除操作在内部Lucene索引处理后被写入到translog中。



- index.translog.sync_interval fsynced同步到磁盘的间隔时间，默认5秒，不得低于100ms
- index.translog.durability.request 每个请求，都是会使用fsync并提交（默认）
- index.translog.durability.async 每sync_interval间隔一个才fsync并提交
- index.translog.flush_threshold_size 每次flush时的阈值，默认是512mb


> 默认是使用request的方式，所以可以修改为async的方式，来同步磁盘。
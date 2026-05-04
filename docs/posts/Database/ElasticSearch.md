---
title: ElasticSearch
date: 2025-06-18
---

# 1. ES集群常用命令

```shell
#获取整个 cluster 的状态
GET _cluster/state
#集群健康状态 API
GET _cluster/health?pretty
#索引信息 API
GET _cat/indices?pretty&v
#节点状态 API
GET _nodes?pretty
#主节点信息 API
GET _cat/master?pretty&v
#分片分配、索引信息统计 API
GET _stats?pretty
#节点状态信息统计 API
GET _nodes/stats?pretty
```

# 2. 索引常用命令

## 2.1. 查询

- GET /索引名/_doc/_search

```json
{
  "query": {
    "match": {
      "describe": "每天收益到账消息推送"
    }
  }
}
```

## 2.2. 设置索引的配置

- PUT /索引名/_settings

```json
{
  "index": {
    "number_of_replicas": "0",
    "refresh_interval": "-1",
    "translog": {
      "sync_interval": "20s",
      "durability": "async",
      "flush_threshold_size": "1024mb"
    }
  }
}

```

### 2.2.1. 关于索引的Translog

- https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-translog.html

## 2.3. 索引的mapping设置

PUT /my-index-000001/_mapping

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

# 3. 文档操作

## 3.1. 批量导入

POST my_goods/_bulk

```json
{
  "index": {
    "_id": 1
  }
}

```

## 3.2. 删除某个文档，通过ID

- DELETE /my_goods/_doc/2

## 3.3. 通过查询删除

POST /my_goods/_delete_by_query

```json
{
  "query": {
    "match": {
      "shopCode": "sc00002"
    }
  }
}
```

## 3.4. 通过ID更新

POST /my_goods/_update/1

```json
{
  "doc": {
    "shopName": "张三店铺"
  }
}
```

## 3.5. 判断id是否存在
- HEAD /my_goods/_doc/1
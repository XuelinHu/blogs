---
title: 微服务架构
date: 2025-06-21
---

# 微服务架构

## 思维导图
技术在进步，不再是之前的单机架构，都是采用微服务的分布式架构，下面是国内常见的技术栈

```mermaid
mindmap
  root((微服务架构))
    
    开发技术栈（Java）
      Java 8 
        lambda
        concurrent
        time
      Spring
        Spring Boot
        Spring Cloud
      前端技术
        Vue.js
        React.js
        Flutter
        小程序
        UniApp
      移动端
        Android（Java/Kotlin）
        iOS（Swift/Objective-C）
      脚本语言
        Python
        Node.js
        Shell

    中间件
      消息队列 MQ
        Kafka
        RocketMQ
        RabbitMQ
        Pulsar
      缓存/Buffer
        Redis
        Memcached
      搜索引擎/非结构化存储
        ElasticSearch
        Milvus
      注册中心
        Zookeeper
        Etcd
        Nacos
      配置中心
        Apollo
        Nacos

    业务存储
      关系型数据库
        MySQL
        PostgreSQL
        Oracle
        OceanBase（蚂蚁）
        TiDB（PingCAP）
      分布式数据库
        PolarDB（阿里）
        TDSQL（腾讯）
        GBase（南大通用）
      NoSQL
        MongoDB
        HBase

    大数据
      数据计算
        ODPS（阿里数仓 MaxCompute）
        Hive
        Spark
        Flink
      数据存储
        HDFS
        Iceberg
        ClickHouse
      数据同步
        DataX
        Canal

    运维与监控
      容器与编排
        Docker
        Kubernetes（K8s）
        OpenKruise（阿里）
      持续集成/部署
        Jenkins
        GitLab CI
        ArgoCD
      监控系统
        SkyWalking
        Prometheus
        Grafana
        ELK（Elasticsearch + Logstash + Kibana）
        Loki
      服务网格
        Istio
        Linkerd
```

## 不明白的技术

| 技术名称                | 主要特性                                                                                                    | 编程语言                               |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Pulsar**          | - 分布式发布/订阅消息系统  <br> - 支持多租户、消息持久化 <br> - 计算与存储分离（BookKeeper） <br> - 提供多语言客户端                           | Java（核心）<br>C++、Go、Python（客户端）     |
| **Milvus**          | - 向量数据库，支持 AI 相似度检索 <br> - 支持十亿级向量数据检索 <br> - 支持 GPU 加速、HNSW 等索引算法                                      | C++（核心）<br>Go（系统架构）<br>Python（SDK） |
| **Iceberg**         | - 数据湖专用表格式 <br> - 支持 ACID 事务、Schema 演进 <br> - 与 Flink、Spark、Trino 等集成 <br> - 高效元数据管理                    | Java（核心）<br>Python（PyIceberg）      |
| **Grafana**         | - 可视化监控平台 <br> - 支持 Prometheus、Loki、ElasticSearch 等数据源 <br> - 支持自定义仪表盘、告警、插件系统                          | Go（后端）<br>TypeScript + React（前端）   |
| **Loki**            | - 日志聚合系统，与 Grafana 集成 <br> - 类似 Prometheus 的标签查询 <br> - 高性能、低成本日志存储方案                                   | Go                                 |
| **Prometheus**      | - 云原生监控系统 <br> - 提供指标采集、存储与告警功能 <br> - 支持多种 Exporter 采集应用数据 <br> - 与 Grafana 集成显示                       | Go                                 |
| **Kubernetes（K8s）** | - 容器编排平台，管理大规模容器集群 <br> - 支持自动部署、扩容、滚动更新 <br> - 云原生核心组件，与 DevOps 深度集成 <br> - 支持 Helm、Operator、CRD 等扩展机制 | Go                                 |


## GPT提问时的语法错误

Great that you're learning English! Let's review your two questions for grammar and phrasing:

---
### ✅ Your Original Questions:
#### 1.
> "now, output a list for above technologies with its feature and language"
**Corrected version**:
> "Now, output a list of the above technologies with their features and languages."
**Explanation of errors**:
* **"for above technologies"** → should be **"of the above technologies"**: the correct preposition is *"of"* when listing items.
* **"its feature and language"** → should be **"their features and languages"**:
  * *Technologies* is plural, so use *"their"* instead of *"its"*
  * *Feature* and *language* should also be plural to match multiple items.
---

#### 2.

> "I am a english learner ,what exists grammer error in my question aboved and this question"

**Corrected version**:

> "I am an English learner. What grammar errors exist in my previous question and in this one?"

**Explanation of errors**:

* **"a english"** → should be **"an English"**: *English* starts with a vowel sound, so use *"an"*.
* **"learner ,what exists grammer error"** → should be **"learner. What grammar errors exist"**:

  * Add a **period** before the second sentence.
  * Change **"exists grammar error"** to **"grammar errors exist"** – correct word order and plural.
* **"grammer"** → should be **"grammar"**: spelling error.
* **"aboved"** → should be **"previous"** or **"above"**: *"aboved"* is not a real word.

  * Better phrased as *"in my previous question"* or *"in the question above"*.

---
### ✅ Final, natural version:
> I am an English learner. What grammar errors exist in my previous question and in this one?
---

You're doing great — keep asking and practicing! Let me know if you'd like tailored grammar exercises too.

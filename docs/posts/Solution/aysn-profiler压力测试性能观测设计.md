---
title: aysn-profiler压力测试性能观测设计
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 需求

在压力测试过程中，需要观测机器的各项性能指标。一般机器上都有Prometheus来记录
jvm中的各项指标。

其中有一个需求，可定位到具体的耗时方法。对此调研后，
可以采用aysn-profiler来达到这个目的。

- https://github.com/async-profiler/async-profiler

# 2. 时序图

```mermaid
sequenceDiagram
    autonumber

    actor user as User
    participant mq as kafka

    box local mechine
        participant sandbox as jvm-sandbox-repeater
        participant file as local file
    end

    box web-server
        participant repeater as web-server
        participant mysql as database
    end

    par load file
        sandbox -->> file: load .so files
        sandbox -->> sandbox: system.load(.so)
    end

    par start profiler
        user -->> repeater: config profiler
        repeater -->> mq: send config
        mq -->> sandbox: consume message
        sandbox -->> sandbox: stop firstly
        sandbox -->> sandbox: start


    end

    par stop profiler
        user -->> repeater: stop profiler
        repeater -->> mq: send config
        mq -->> sandbox: consume message
        sandbox -->> sandbox: stop --file tmp/abs.html
        sandbox -->> sandbox: save file to /tmp/abs.html


    end

    par uplaod html
        sandbox -->> repeater: post html
        repeater -->> mysql: write base64 that encode html
        mysql -->> repeater: done

    end


```

# 3. profiler命令

```shell
profiler start
profiler execute 'stop,start'
profiler execute 'stop,file=/tmp/result.html'
profiler start --include 'java/*' --include 'demo/*' --exclude '*Unsafe.park*'
```

# 4. 设计目的

这套方案的重点不是替代 Prometheus，而是补齐“压测时能定位到具体热点方法”的能力。

## 4.1. 为什么需要 async-profiler

- Prometheus 更适合看整体指标趋势。
- async-profiler 更适合看 CPU、锁、分配热点落在哪些方法上。
- 两者结合后，既能知道“机器变差了”，也能知道“哪段代码在变差”。

## 4.2. 落地关注点

- profiler 采样本身也有成本，不建议全量长期开启。
- 最好只在特定压测窗口和目标服务上启用。
- 结果文件上传和展示链路要注意权限和文件大小。

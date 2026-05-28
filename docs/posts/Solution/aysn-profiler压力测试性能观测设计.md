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
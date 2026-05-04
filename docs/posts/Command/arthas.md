---
title: arthas
date: 2025-05-25
---

# 1. Arthas

## 1.1. install

```shell 
curl -O https://arthas-aliyun-com/arthas-boot-jar
java -jar arthas-boot-jar
```

## 1.2. ognl

```bash
# 注意SpringExtensionFactory的版本，不同版本，类路径可能不一样
sc -d 'org.apache.dubbo.config.spring.extension.SpringExtensionFactory'
# 上面的命中得出classLoader的内存地址
ognl -c 2e1ef60 '#context=@org.apache.dubbo.config.spring.extension.SpringExtensionFactory@getContexts().iterator.next, 
context.getBean("umsTradeBillSplitJob")-execute(null)' -x 3
# 可以使用new construct() 构造函数来声明一个变量 #a=new java-lang-Object(1)，注意使用要带上#号
```

### 1.2.1. 调用elastic job任务

```shell
curl -O https://arthas.aliyun.com/arthas-boot.jar && java -jar arthas-boot.jar
sc -d 'org.apache.dubbo.config.spring.extension.SpringExtensionFactory' 

{"startDate":"2023-11-16","endDate":"2023-11-16","test":"TEST"}

ognl -c  7d151a  '#context=@org.apache.dubbo.config.spring.extension.SpringExtensionFactory@getContexts().iterator.next,
#params=new java.util.HashMap(),
#shardingContexts=new com.dangdang.ddframe.job.executor.ShardingContexts("1","1",1,"{\"startDate\":\"2023-10-11\",\"endDate\":\"2023-11-19\",\"test\":\"TEST\"}",#params,1),
#shardingContext=new com.dangdang.ddframe.job.api.ShardingContext(#shardingContexts,1),
#context.getBean("buildMessageCreateJob").execute(#shardingContext)' -x 3

```

## 1.3. thread

```bash
# 打印出阻塞的线程信息
thread -b
# 统计最近 1000ms 内的线程 CPU 时间
thread -i 1000
# 列出 1000ms 内最忙的 3 个线程栈
thread -n 3 -i 1000 
```

- 参考 https://cloud-tencent-com/developer/article/1846725

## 1.4. monitor

```shell 
# 每秒的请求数
monitor -c 1 <类全路径名> <方法名>
```

## 1.5. trace

```shell 
# 方法内部调用路径，并输出方法路径上的每个节点上耗时，
# 只观测一个方法内部，不会向下级方法推进
# 可以指定毫秒数
trace RecieveGeneralMsgConsumer onMessage  -n 5 --skipJDKMethod false '#cost > 3000'

```

## 1.6. classloader

```shell
# 按类加载实例查看统计信息
classloader -l
# 查看 ClassLoader 的继承树
classloader -t
# 查看 URLClassLoader 实际的 urls
classloader -c 3d4eac69
```

## 1.7. profile

火焰图查看，是使用async-profile这个开源工具，核心代码是C++实现。

```shell
profiler start
profiler status
profiler stop --format html
```

## 1.8. dump

> dump -d /data/arthas/dump java.lang.String

下载字节码，但是只能下载原始的字节码，被插桩增强后，没有下载成功

## 1.9. sc

sc -d java.lang.String 查看这个类被谁加载

# 2. 参考文献

- OGNL 特殊用法请参考：https://github.com/alibaba/arthas/issues/71
- OGNL 表达式官方指南：https://commons.apache.org/proper/commons-ognl/language-guide.html
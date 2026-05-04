---
title: Repeater-Dubbo-插桩
date: 2025-05-25
---

# 1. Dubbo泛化调用traceId

## 1.1. consumer 端

只对repeater-receiver应用的Dubbo泛化调用的类
`org.apache.dubbo.rpc.filter.GenericImplFilter`
进行插桩，代码如下：

```java
{
// EnhanceModel onResponse = EnhanceModel.builder().classPattern("org.apache.dubbo.rpc.filter.ConsumerContextFilter$ConsumerContextListener")
// .methodPatterns(EnhanceModel.MethodPattern.transform("onResponse"))
// .watchTypes(Event.Type.BEFORE, Event.Type.RETURN, Event.Type.THROWS)
// .build();
        EnhanceModel invoke=EnhanceModel.builder().classPattern("org.apache.dubbo.rpc.filter.ConsumerContextFilter")
        .methodPatterns(EnhanceModel.MethodPattern.transform("invoke"))
        .watchTypes(Event.Type.BEFORE,Event.Type.RETURN,Event.Type.THROWS)
        .build();

        EnhanceModel geneticInvoke=EnhanceModel.builder().classPattern("org.apache.dubbo.rpc.filter.GenericImplFilter")
        .methodPatterns(EnhanceModel.MethodPattern.transform("invoke"))
        .watchTypes(Event.Type.BEFORE,Event.Type.RETURN,Event.Type.THROWS)
        .build();
// EnhanceModel onResponseV3 = EnhanceModel.builder().classPattern("org.apache.dubbo.rpc.cluster.filter.support.ConsumerContextFilter")
// .methodPatterns(EnhanceModel.MethodPattern.transform("onResponse"))
// .watchTypes(Event.Type.BEFORE, Event.Type.RETURN, Event.Type.THROWS)
// .build();
        EnhanceModel invokeV3=EnhanceModel.builder().classPattern("org.apache.dubbo.rpc.cluster.filter.support.ConsumerContextFilter")
        .methodPatterns(EnhanceModel.MethodPattern.transform("invoke"))
        .watchTypes(Event.Type.BEFORE,Event.Type.RETURN,Event.Type.THROWS)
        .build();
        return ApplicationModel.instance().isRepeater()?Lists.newArrayList(geneticInvoke):Lists.newArrayList(invoke,invokeV3);
        }
```

## 1.2. provider 端

- 对Dubbo Consumer，如果是泛化调用，会先执行 org.apache.dubbo.rpc.filter.GenericFilter ，再执行
org.apache.dubbo.rpc.filter.ContextFilter

- 对Dubbo Provider端，如果非泛化调用，只执行org.apache.dubbo.rpc.filter.ContextFilter

**原因是：**

@Activate(group = CommonConstants.PROVIDER, order = -20000)
注解中，order 越小，越早执行。
两个调用方式都会调用 org.apache.dubbo.rpc.filter.ContextFilter 这个类的invoke方法，所以provider端暂时可以不处理。

# 2. Sql语句获取

前端将返回sql字段

"sql": "SELECT id,taskName,taskGroup,bizId,bizColumn,bizType,saveDate,bizRequest,tmCreate,tmModify FROM
t_generated_biz_id WHERE id=238098 ",

## 2.1. mysql 5.0+版本 可以获取

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.46</version>
</dependency>
```

## 2.2. mysql 8.0+版本 可以获取

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.11</version>
</dependency>
```

## 2.3. 分表分库 sphere-sharding

可以获取到SQL，但是非常多，如果10库100表，可能为1000条
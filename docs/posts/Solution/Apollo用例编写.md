---
title: Apollo用例编写
date: 2025-05-25
---

# 1. 背景

使用Apollo作为Spring.properties文件载体时，在本地写单元测试时，
又不想使用最大应用启动类作为@SpringBootTest的加载入口，
希望可以单测哪个类，就加载哪些类，但是像一些Service都会有Mapper进行数据库访问，
引入这些数据库时，会有用到一个配置文件。所以
一个方法就是在@SpringBootTest注解中引用Apollo的加载类，
在测试时，把配置文件也加载到Spring容器中。

# 2. 示例

```shell
@SpringBootTest(classes{com.ctrip.framework.apollo.spring.boot.ApolloAutoConfiguration.class})
```
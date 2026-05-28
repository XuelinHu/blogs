---
title: Apollo用例编写
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
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

# 3. 使用建议

- 单测目标如果只是校验某个 Service，不要直接把整个启动类都拉进来。
- 把 Apollo 自动配置和必要 Bean 显式引入，能减少上下文体积。
- 如果 Mapper、数据源、配置中心耦合较深，建议再补一层测试配置类统一管理。

# 4. 常见问题

- 配置没生效：通常是 Apollo 配置类没被加载。
- 启动太重：通常是把完整 Spring Boot 应用一起拉起来了。
- 单测不稳定：通常是外部依赖没有 mock 或环境隔离不彻底。

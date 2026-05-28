---
title: gradle
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 命令

```shell
# 清空build目录
gradle clean 
# 编译业务代码和配置文件
gradle classes
# 编码测试代码，执行测试代码，生成测试报告
gradle test
# 构建项目
gradle build
# 跳过测试构建项目
gradle build -x test
```

# 2. 仓库配置
- https://developer.aliyun.com/mirror/maven/

```shell
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public/' }
        mavenLocal()
        mavenCentral()
    }
}
```
如果想使用 maven.aliyun.com 提供的其它代理仓，以使用 spring 仓为例，代码如下:

```shell
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public/' }
        maven { url 'https://maven.aliyun.com/repository/spring/'}
        mavenLocal()
        mavenCentral()
    }
}

```
---
title: mvn
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

- 图片来源=https://www.bilibili.com/video/BV1Ah411S7ZE?p=13&vd_source=f52d9488d7d3c21ed33580e4dce1a022

# 1. maven简介

![maven_1.png](img%2Fmaven_1.png)

- maven程序有自己的类加载器

# 2. 依赖冲突

![maven_conflict.png](img%2Fmaven_conflict.png)

- 可以使用`<optional>true</optional>`取消依赖的传递
- `<exclusion>` 来排除某个依赖，不用写版本号

# 3. 依赖范围

![maven_scope.png](img%2Fmaven_scope.png)

# 4. 指令

## 4.1. 依赖树打印

```shell
mvn dependency:tree > mvnTree.txt
```

## 4.2. 设置版本

```shell
mvn versions:set -D newVersion=1.5.0-SNAPSHOT
```

## 4.3. mvn -D -P -U

- P代表（Profiles配置文件）
- 打包时执行 `mvn clean package -P test`将触发test环境的profile配置

```xml

<profiles>
    <profile>
        <id>prod</id>
        ...
    </profile>
    <profile>
        <id>test</id>
        ...
    </profile>
</profiles>


```

- -D代表（Properties属性）
- pl 表示只处理指定的module
- am 表示处理-pl指定module关联的其他module
- 执行 `mvn -Dattr=newattr clean package`，则pom.xml内attr的实际值将被替换成newattr

```xml
<properties>
    <attr>defaultattr</attr>
</properties>
```

- -U 代表强制更新（update）

## 4.4. 跳过测试

- `mvn -Dmaven.test.skip=true clean package` 跳过测试包下的程序

## 4.5. 部署到仓库

```shell

mvn deploy:deploy-file -DgroupId=<group-id> \
-DartifactId=<artifact-id> \
-Dversion=<version> \
-Dpackaging=<type-of-packaging> \
-Dfile=<path-to-file> \
-DrepositoryId=<id-to-map-on-server-section-of-settings.xml> \
-Durl=<url-of-the-repository-to-deploy>

#打jar包 windows ^ 标记换行
mvn deploy:deploy-file ^
-DgroupId=com.alibaba.jvm.sandbox  ^
-DartifactId=repeater-console-service  ^
-Dversion=1.0.0-SNAPSHOT  ^
-Dpackaging=jar  ^
-Dfile=E:\temp2\repeater-console-service\1.0.0-SNAPSHOT\repeater-console-service-1.0.0-SNAPSHOT.jar ^
-DrepositoryId=maven-snapshots  ^
-Durl=http://nexus.xsyxsc.com/repository/maven-snapshots

#打pom包
mvn deploy:deploy-file 
-DgroupId=com.alibaba.jvm.sandbox 
-DartifactId=repeater-console 
-Dversion=1.0.0-SNAPSHOT 
-Dpackaging=pom 
-Dfile=C:\Users\PC\IdeaProjects\test\jvm-sandbox-repeater\repeater-console\pom.xml 
-DrepositoryId=maven-snapshots 
-Durl=http://nexus.xsyxsc.com/repository/maven-snapshots


```

### 4.5.1. 仅在dev的profile中，开启SNAPSHOT的仓库

```xml
<repositories>
    <repository>
        <id>nexus-snapshots</id>
        <name>Nexus Local Repository</name>
        <url>http://nexus.xsyxsc.com/repository/maven-snapshots/</url>
        <snapshots>
            <enabled>true</enabled>
            <updatePolicy>always</updatePolicy>
        </snapshots>
    </repository>
</repositories>
```

## 4.6. 安装在本地

```shell
#会将包安装在本地的仓库
mvn clean install -Dmaven.test.skip=true
mvn clean compile install deploy  -Dmaven.test.skip=true
mvn clean package  '-Dmaven.test.skip=true'

```

## 4.7. mvn配置文件

- `<package></package>`标签可以有pom或是jar,默认是jar,在有父子继续关系时，一般父pom文件使用pom包

## 4.8. 源码下载

```shell
mvn dependency:sources
mvn dependency:resolve -Dclassifier=javadoc
mvn dependency:sources dependency:resolve -Dclassifier=javadoc
```

## 4.9. mvn 仓库优先级

```shell
本地仓库 > 私服（profile）> 远程仓库（repository）和 镜像（mirror） > 中央仓库（central）
```

# 5. nexus

nexus里可以配置3种类型的仓库，分别是proxy、hosted、group:

- proxy是远程仓库的代理。比如说在nexus中配置了一个central
  repository的proxy，当用户向这个proxy请求一个artifact，这个proxy就会先在本地查找，如果找不到的话，就会从远程仓库下载，然后返回给用户，相当于起到一个中转的作用。

- hosted是宿主仓库，用户可以把自己的artifact、proxy下载不到的artifact，deploy到hosted中。

- group是仓库组，目的是将上述多个仓库聚合，对用户暴露统一的地址，这样用户就不需要在pom中配置多个地址，只要统一配置group的地址就可以了 。

# 6. plugins

https://maven.apache.org/plugins/index.html

## 6.1. basic

- clean
- compiler
- deploy
- install
- resources
- failsafe which ensure isolated classloader to run Junit test
- surefire which ensure isolated classloader to run Junit Integrated test
- verifier

## 6.2. tools

- findbugs
- checkstyle
- spring-boot-maven-plugin
- flatten-maven-plugin
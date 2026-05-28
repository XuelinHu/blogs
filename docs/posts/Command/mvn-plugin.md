---
title: mvn plugin
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 常用的打包插件

- maven-jar-plugin：maven 默认打包插件`springboot默认使用该方式打包`，用来创建 project jar
- maven-shade-plugin：用来打可执行包，executable(fat) jar
- maven-assembly-plugin： 支持定制化打包方式，例如 apache 项目的打包方式

```xml

<build>
    <!-- 文件名-->
    <finalName>${project.name}-${project.version}</finalName>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-assembly-plugin</artifactId>
            <executions>
                <execution>
                    <goals>
                        <!--     <goal>attached</goal>-->
                        <!--    只打包一次-->
                        <goal>single</goal>
                    </goals>
                    <!--     在打包阶段时使用这个插件-->
                    <phase>package</phase>
                    <configuration>
                        <descriptorRefs>
                            <!--   文件名后缀-->
                            <descriptorRef>jar-with-dependencies</descriptorRef>
                        </descriptorRefs>
                        <!--打包解压后的目录名；${project.artifactId}是指：项目的artifactId-->
                        <finalName>${project.artifactId}</finalName>
                        <!-- 打包压缩包位置-->
                        <outputDirectory>${project.build.directory}/release</outputDirectory>
                        <!-- 打包编码 -->
                        <encoding>UTF-8</encoding>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

如上XML配置，如果没有使用maven-assembly-plugin插件的话，
不会将maven中的其他dependencies打入到jar包中。
存在jvm运行jar时，提示类不存在的信息。
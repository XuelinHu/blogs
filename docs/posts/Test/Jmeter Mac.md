---
title: Jmeter Mac
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. install

## 1.1. brew install

> brew install jmeter --with-plugins

使用brew安装的，在MAC上运行时报错

## 1.2. url down install

> https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz

下载后，解压运行的，在MAC上可以运行

## 1.3. 参考文档

- https://juejin.cn/post/6986574899338805261

# 2. 文件目录

执行一个压测文件
> jmeter -n -t [jmx file] -l [results file] -e -o [Path to web report folder]

- bin 可执行文件
    - jmeter.properties 配置文件
- extras 一些插件
- lib 运行是需要的包

# 3. 文件配置

# 4. 线程组

## 4.1. 常见命令

```bash
# GUI 模式启动
jmeter

# 非 GUI 执行测试计划
jmeter -n -t test.jmx -l result.jtl

# 生成 HTML 报告
jmeter -n -t test.jmx -l result.jtl -e -o report
```

## 4.2. 使用建议

- Mac 上优先用官网下载包或 Apache 官方二进制包，兼容性通常更稳。
- 真正做压测时尽量使用非 GUI 模式，GUI 更适合调试脚本。
- 报告目录要提前清空，否则 `-o` 可能会因为目录非空报错。

# 5. 常见问题

- 启动报错：优先检查 Java 版本。
- 插件异常：优先确认插件和 JMeter 主版本是否匹配。
- 结果偏差大：优先看本机资源是否成了瓶颈，而不是直接怀疑接口。

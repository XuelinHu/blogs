---
title: sandbox
date: 2021-05-07
---

# 1. 快速开始

- [git文档](https://github.com/alibaba/jvm-sandbox/wiki/USER-QUICK-START)
 
- [下载路径](http://ompc.oss-cn-hangzhou.aliyuncs.com/jvm-sandbox/release/sandbox-stable-bin.zip)

下载后一般在用户主目录下。可以修改`/Users/deipss/sandbox/cfg/sandbox.properties`文件中的user_module属性，
将自己开发的模块所在路径，配置在上去

> user_module=~/.sandbox-module;/Users/deipss/sandbox/sandbox-module;

```shell
# 下载最新版本的JVM-SANDBOX
wget http://ompc.oss-cn-hangzhou.aliyuncs.com/jvm-sandbox/release/sandbox-stable-bin.zip

# 解压
unzip sandbox-stable-bin.zip
``` 

# 2. 异常制造

这个异常需要在repeater模块编码

```shell
cd /opt/sandbox/bin
./sandbox.sh -p 66 -d 'repeater/delay?class=com.xsyx.trade.stock.query.service.api.facade.ProductLimitFacade&method=queryLimit&delay=800'
./sandbox.sh -p 77 -d 'repeater/wreck?class=com.frxs.trade.user.core.service.engine.chain.node.create.CreateCoreProcessorNode&method=process&type=RuntimeException'
```

# 3. sandbox 模块加载与关闭

```shell
cd ～/sandbox/bin

#只刷新有变更的module
./sandbox.sh -p 66 -f 

#强制刷新 不管有没有变更
./sandbox.sh -p 66 -F

#关闭某个jvm进程的sandbox增强 
./sandbox.sh -p 66 -S 

#显示加载了哪些模块
./sandbox.sh -p 66 -l
```
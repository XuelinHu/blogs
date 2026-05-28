---
title: jvm
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. jps

```shell
#查看
jps -mlVv
```
| 参数   | 含义                        |
| ---- | ------------------------- |
| `-m` | 显示传递给 main 方法的参数          |
| `-l` | 显示 main 类的完整包名或 JAR 路径    |
| `-V` | 显示通过 `-D` 传递的 **系统属性**    |
| `-v` | 显示传递给 JVM 的参数（如 `-Xmx` 等） |


# 2. 高CPU使用率分析

## 2.1. 线程死锁

- 使用 `jstack -p <pid> > jstack1.txt `将当前的jvm执行栈打印
- 搜索 block状态的线程
- 看被阻塞的线程是因为什么哪个锁被占用，造成的阻塞

## 2.2. alibaba arthas

```shell
#top 命令分析，是否高CPU使用率、负载率，但是CPU空闲时间长
#安装arthas
thread 查询有多少线程，及其CPU使用率
thread -n [tid] >> [filename] 将某个线程的执行方法栈及CPU状态字输出到某个文件
thread -b 查看BLOCKED状态的线程
```

- 参考 https://www-jianshu-com/p/3ba1e933682b

## 2.3. top命令结合 jstack

```shell
#命令分析，是否高CPU使用率、负载率，但是CPU空闲时间长
top 
#查询pid中的线程
top -Hp <pid> 
#把线程id转为16进制
printf "%x\n" <tid> 
#将此时的jvm快照打印到指定txt文件
jstack -l <pid> >> -/jstack_result-txt 

#可以结合 | grep 来检索不同状态的线程
#在txt文件中搜索16进制的线程id
```

- https://www-cnblogs-com/fengweiweicoder/p/10992043-html

# 3. 高内存分析

## 3.1. jmap 文件下载

```shell
#打印出jvm进程堆使用情况
jmap -heap <pid>
#下载快照到文件
jmap -dump:file=filename-dump <pid>
jmap -dump:format=b,file=heapdump.phrof <pid>
#使用jhat命令
jhat -port 9998 filename-dump
```

- 在windows可以使用jvisualvm-exe命令,加载文件分析
- 使用jhat
- 使用eclipse MAT

## 3.2. 内存对象统计与排序

```
jmap -histo <pid> | grep <class full path> | sort -n -k 3 | head -17

排序出目前容量最大的一些类，-k 2是根据第2列排序，就是数据最大的
 num     #instances         #bytes  class name 

   1:       4632416      392305928  [C
   2:       6509258      208296256  java-util-HashMap$Node
   3:       4615599      110774376  java-lang-String
   5:         16856       68812488  [B
   6:        278914       67329632  [Ljava-util-HashMap$Node;
   7:       1297968       62302464  

```

# 4. JvmGC

## 4.1. gc查看

```shell
#查看帮助
jstat -help 
#查看统计的可选项
jstat -option

#使用jstat命令查看gc情况 每5秒一次，统计20次，每5行显示一个表头
jstat -gcutil -h5 <pid> 5000 20

#使用jstat命令查看gc情况 每5秒一次，统计20次，每5行显示一个表头
jstat -gc -h5 <pid> 5000 20
 S0C: 当前幸存者区0的容量 (kB)
 S1C: 当前幸存者区1的容量(kB)
 S0U: 幸存者区0已用内存 (kB)
 S1U: 幸存者区1已用内存 (kB)
 EC: 伊甸园区容量 (kB)
 EU: 伊甸园区已用内存 (kB)
 OC: 当前老旧区容量 (kB)
 OU: 老旧区已用内存 (kB)
 MC: 元数据区容量 (kB)
 MU: 元数据区已用内存 (kB)
 CCSC: 类压缩区容量 (kB)
 CCSU: 类压缩区已用内存 (kB)
 YGC: 新生垃圾回收事件数量
 YGCT: 新生垃圾回收时间
 FGC: 垃圾回收事件总和
 FGCT: 完整的一次垃圾回收时间
 GCT: 所有的垃圾回收时间

#查看到GC的内存占用情况
jstat -gccapbility
```

- 参考 https://zhuanlan-zhihu-com/p/481206194

## 4.2. Jvm启动参数-GC日志打印

```shell
#必备
-XX:+PrintGCDetails 
-XX:+PrintGCDateStamps 
-XX:+PrintTenuringDistribution 
-XX:+PrintHeapAtGC 
-XX:+PrintReferenceGC 
-XX:+PrintGCApplicationStoppedTime

#可选
-XX:+PrintSafepointStatistics 
-XX:PrintSafepointStatisticsCount=1

#GC日志输出的文件路径
-Xloggc:/path/to/gc-%t-log
#开启日志文件分割
-XX:+UseGCLogFileRotation 
#最多分割几个文件，超过之后从头文件开始写
-XX:NumberOfGCLogFiles=14
#每个文件上限大小，超过就触发分割
-XX:GCLogFileSize=100M
```

- https://segmentfault-com/a/1190000039806436

## 4.3. javap 反编译代码

```shell
通过以下命令来反编译出一个Class文件字节码
javap -verbose -p Main-class
```

## 4.4. G1配置

- https://zhuanlan-zhihu-com/p/83804324

# 5. jvm启动获取参数

- 系统主机中的参数 `System.getProperty()`
- jvm 进程启动时参数 `java -d`
- main 函数中获取 `String [] args`
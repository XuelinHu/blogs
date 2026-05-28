---
title: sandbox请求参数篡改排查
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 排查sandbox-repeater的请求参数被篡改

用户反馈，某个业务字段，录制下来的值与实际原始传递来的值不一。
排查步骤：

- 先远程断点目标机器，查看请求参数
- 使用tcpdump工具抓包，比较原始网络的参数是否与远程断点时的参数，存在偏差
- 执行以下命令来抓包，ctrl+c结束

```shell
yum install tcpdump
# -w write写入某个文件 
tcpdump -w package.cap 
```

## 1.1. 使用wireshark来分析包

- 下载完cap数据，装载到wireshark，因为观测的dubbo协议（基于tcp协议），所以找到源地址，目标地址以及目标端口
- 右击某个tcp通信记录（一个完成的dubbo调用，会由多个tcp包来运输），跟踪流
- 可以看到一次dubbo协议完整的调用，sync与ack

## 1.2. 对比远程断点与tcpdump原始包，数据确实篡改
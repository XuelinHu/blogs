---
title: TCP 粘包与半包：从网络直播现象到消息边界设计
date: 2026-08-25
created: 2026-08-25
updated: 2026-08-25
---

# TCP 粘包与半包：从网络直播现象到消息边界设计

## 1. 先看一个网络直播现象

直播间里，弹幕、点赞、礼物和视频帧会同时经过网络传输。假设发送方连续写入两条弹幕：

```text
弹幕 A：主播好
弹幕 B：画质很清晰
```

接收方调用一次 `read()`，可能读到：

```text
主播好画质很清晰
```

这叫**粘包**：多条应用层消息在接收方的一次读取中连在了一起。反过来，一条较大的视频帧或弹幕消息，也可能被拆成多次读取：

```text
第一次：主播
第二次：好
```

这叫**半包**。两者本质相同：TCP 交付的是有序字节流，不是带消息边界的数据包。

在直播产品中，用户看到的现象通常不是“画面真的粘在一起”，而是上层解码错误带来的结果：弹幕 JSON 连在一起导致解析失败、礼物事件延迟批量出现、控制消息被丢弃，或者错误地把半个视频控制帧交给解码器。正规的媒体协议会用长度、序号、时间戳等字段恢复帧边界。

<TeachingDemo
  src="/demos/tcp-sticky-packet/index.html"
  title="TCP 粘包与半包交互演示"
  :height="500"
/>

## 2. 粘包到底是怎么造成的

### 2.1 TCP 没有应用层消息概念

TCP 只关心字节的可靠、有序传输。应用层调用两次 `send()`：

```text
send("A")
send("B")
```

并不会在 TCP 接收端保留两个“消息盒子”。内核会把数据放入发送缓冲区、拆分成 TCP 段并进行拥塞控制；接收端再把到达的字节放进接收缓冲区。`read()` 读多少由当前可读字节数、调用时机和缓冲区状态共同决定。

### 2.2 常见触发因素

- **连续小包写入**：发送方短时间内写入多个小消息，接收方一次读取到多个消息。
- **Nagle 算法**：TCP 可能暂存小段数据，等待确认或凑够更合适的发送大小。关闭 `TCP_NODELAY` 只能改变延迟与聚合倾向，不能替代应用层分包。
- **发送与读取速度不匹配**：生产速度高于消费速度，多个消息堆积在接收缓冲区。
- **MTU、拥塞控制和重传**：网络层和 TCP 段边界只服务于传输，不等于业务消息边界。
- **一次写入被拆分**：大消息可能跨多个 TCP 段，接收方一次 `read()` 只读到前半段。

所以，“一次 `send()` 对应一次 `read()`”是错误假设；“抓包看到两个 TCP 包”也不能推导出应用层一定得到两条消息。

## 3. 一个最小复现

### 3.1 Python 客户端与服务端

保存为 `sticky_demo.py` 后运行。客户端连续调用两次 `sendall()`，服务端故意把一次 `recv()` 当成一条消息：

```python
import socket
import threading
import time

HOST, PORT = "127.0.0.1", 19090

def server():
    with socket.socket() as listener:
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        listener.bind((HOST, PORT))
        listener.listen(1)
        conn, _ = listener.accept()
        with conn:
            while data := conn.recv(1024):
                print("recv() returned:", data)

def client():
    time.sleep(0.1)
    with socket.create_connection((HOST, PORT)) as conn:
        conn.sendall(b"LIVE:frame-001")
        conn.sendall(b"LIVE:frame-002")

threading.Thread(target=server, daemon=True).start()
client()
time.sleep(0.2)
```

可能输出：

```text
recv() returned: b'LIVE:frame-001LIVE:frame-002'
```

也可能输出两次，甚至在不同环境中以其他位置拆开。这种“不确定”正是示例要证明的事实：程序不能依赖 `send()` 与 `recv()` 次数一一对应。

### 3.2 Java 服务端：错误示例

```java
byte[] buffer = new byte[1024];
int length = input.read(buffer);
String message = new String(buffer, 0, length, StandardCharsets.UTF_8);
// 错误：把一次 read() 的结果当成一条完整业务消息
handle(message);
```

正确做法是维护连接级缓冲区，先追加字节，再按照协议规则循环解码：

```java
ByteArrayOutputStream pending = new ByteArrayOutputStream();
byte[] buffer = new byte[1024];
int length;

while ((length = input.read(buffer)) != -1) {
    pending.write(buffer, 0, length);
    byte[] bytes = pending.toByteArray();

    int end;
    while ((end = indexOf(bytes, (byte) '\n')) >= 0) {
        String line = new String(bytes, 0, end, StandardCharsets.UTF_8);
        handle(line);
        bytes = Arrays.copyOfRange(bytes, end + 1, bytes.length);
    }

    pending.reset();
    pending.write(bytes);
}

static int indexOf(byte[] bytes, byte target) {
    for (int i = 0; i < bytes.length; i++) {
        if (bytes[i] == target) {
            return i;
        }
    }
    return -1;
}
```

### 3.3 Python：长度字段协议

长度字段比“猜测一次读取长度”可靠。下面的协议约定前 4 个字节是大端整数，表示 payload 长度：

```python
import struct

def read_exact(sock, size):
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            raise ConnectionError("peer closed before a complete frame")
        data.extend(chunk)
    return bytes(data)

def read_frame(sock):
    header = read_exact(sock, 4)
    (length,) = struct.unpack(">I", header)
    if length > 1024 * 1024:
        raise ValueError("frame too large")
    return read_exact(sock, length)
```

## 4. 直播系统应该怎样设计

直播系统通常不会把所有内容都用同一种传输方式：

- **视频/音频媒体流**：常用 RTP、SRT、WebRTC、QUIC 等机制，依赖时间戳、序号和抖动缓冲。
- **弹幕、点赞、礼物事件**：通常是 WebSocket 或自定义 TCP 长连接，需要显式消息边界。
- **控制信令**：可以使用 JSON + 换行符，也可以使用长度字段 + JSON/Protobuf。

例如，WebSocket 本身已经提供消息帧边界；但如果在 WebSocket 消息中再次传输自定义 TCP 字节流，内部协议仍然需要自己的 framing 规则。

## 5. 三种常见拆包方案

### 5.1 固定长度

每条消息固定为 64 字节。实现简单，但短消息浪费空间，长消息需要额外协议。

### 5.2 分隔符

例如每条 JSON 后追加 `\n`：

```text
{"type":"chat","text":"主播好"}\n
```

要处理转义、分隔符出现在正文中、超长行和恶意输入等情况。

### 5.3 长度字段

```text
| 4 bytes payload length | payload bytes |
```

这是二进制协议常见方案，适合视频控制消息、RPC 和高吞吐事件流。需要限制最大长度，并正确处理整数溢出和连接半关闭。

## 6. 排查清单

1. 在发送端记录业务消息 ID、序号和 payload 长度。
2. 在接收端记录每次 `read()` 的字节数，不要只打印字符串。
3. 抓包时区分 Ethernet、IP、TCP 段和应用层 frame。
4. 检查协议是否定义固定长度、分隔符或长度字段。
5. 检查解码器是否支持一次读取解析多帧，以及跨多次读取保存半帧。
6. 为超长帧、空帧、非法长度、连接断开和粘包/半包补充测试。

## 7. 一句话总结

TCP 解决的是“字节可靠到达”，应用协议解决的是“这些字节如何组成消息”。粘包和半包不是 TCP 故障，而是应用层没有明确消息边界，或者接收端错误地把 `read()` 边界当成了消息边界。

[[toc]]

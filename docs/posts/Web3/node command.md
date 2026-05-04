---
title: node command
date: 2025-06-17
---

# The common uses of node instructions.

node and npm，

- node是一种开源的框架
- npm 是node包的管理工具

## npm run和 node script.js

- node script.js可以直接运行基于nodejs的后台服务，如下的js代码中，会有ws服务

```js

// 1. 引入ws模块，创建WebSocket服务并监听3010端口
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const ws = new WebSocketServer({
  port: 3010,
});
console.log('服务端已启动');
// 2.  监听WebSocket连接，连接成功后监听客户端发来的信息
ws.on('connection', (e) => {
  const initData = JSON.stringify(generateRandomData(false));
  console.info('服务端已连接');
  e.send(initData);
  e.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    const isAlarm = msg.type;
    const sendData = JSON.stringify(generateRandomData(isAlarm));
    console.info(sendData);
    e.send(sendData);
  });
});
```

- npm run []是运行package.json中的script配置的命令，可以在vite等待服务器的基础上，启动服务

比如下方面的`package.json`代码中,存在一个`scripts`配置项：

```json
{
  "name": "thingjs-simple",
  "version": "1.0.0",
  "description": "ThingJS 2.0 Simple Project",
  "thingjs-template": "simple",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "keywords": [],
  "author": "",
  "license": "BSD-3-Clause",
  "thingjs-version": "2.0.6",
  "devDependencies": {
    "vite": "^6.3.2"
  },
  "dependencies": {
    "ws": "^8.18.1"
  }
}
```



__dir
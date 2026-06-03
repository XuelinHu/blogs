---
title: PM2 使用命令
date: 2026-06-03
created: 2026-06-03
updated: 2026-06-03
---

# PM2 使用命令

PM2 是 Node.js 项目常用的进程管理工具，适合管理 Node API、Vite 预览服务、SSR 服务和一些长期运行的脚本。

实际排查问题时，最常用的是四类命令：

- 看状态：`pm2 list`
- 看日志：`pm2 logs <name>`
- 看错误：`pm2 logs <name> --err`
- 看详情：`pm2 describe <name>`

[[toc]]

## 1. 启动服务

启动普通 Node 服务：

```bash
pm2 start app.js
```

启动 npm 脚本：

```bash
pm2 start npm --name twin -- run preview -- --host 0.0.0.0
```

上面这条命令可以拆开理解：

- `pm2 start npm`：让 PM2 启动 `npm` 命令。
- `--name twin`：给进程起名为 `twin`。
- `-- run preview`：执行 `npm run preview`。
- `-- --host 0.0.0.0`：把参数继续传给 `preview` 脚本，让服务监听所有网卡。

如果是 Vite 项目，通常要先构建再预览：

```bash
npm install
npm run build
pm2 start npm --name twin -- run preview -- --host 0.0.0.0
```

PM2 不会自动安装依赖，也不会自动构建前端项目。

## 2. 停止、重启、删除

停止服务：

```bash
pm2 stop twin
```

重启服务：

```bash
pm2 restart twin
```

删除服务：

```bash
pm2 delete twin
```

常见使用场景：

- 改了代码：通常执行 `pm2 restart twin`。
- 改了构建产物：先 `npm run build`，再 `pm2 restart twin`。
- 不再需要这个进程：执行 `pm2 delete twin`。

## 3. 查看运行状态

列出所有 PM2 进程：

```bash
pm2 list
```

重点看这些字段：

```text
name      status    cpu    mem    restart
twin      online    0%     40M    3
```

字段说明：

- `name`：进程名称。
- `status`：运行状态，常见值有 `online`、`stopped`、`errored`。
- `cpu`：CPU 占用。
- `mem`：内存占用。
- `restart`：重启次数。

如果 `restart` 一直增加，通常说明程序在反复崩溃，需要马上看错误日志。

## 4. 查看日志

查看所有服务日志：

```bash
pm2 logs
```

查看指定服务日志：

```bash
pm2 logs twin
```

只看错误日志：

```bash
pm2 logs twin --err
```

只看标准输出：

```bash
pm2 logs twin --out
```

其中：

- `--err`：一般对应异常、启动失败、端口冲突、依赖缺失等错误。
- `--out`：一般对应 `console.log`、正常启动信息和业务输出。

## 5. 日志文件位置

PM2 默认日志目录：

```text
~/.pm2/logs/
```

假设进程名是 `twin`，常见日志文件是：

```text
twin-out.log
twin-error.log
```

可以直接用 `tail` 查看错误日志：

```bash
tail -f ~/.pm2/logs/twin-error.log
```

也可以查看标准输出日志：

```bash
tail -f ~/.pm2/logs/twin-out.log
```

## 6. 查看进程详情

查看指定服务详情：

```bash
pm2 describe twin
```

重点看这些信息：

- `script`：实际启动的脚本。
- `args`：启动参数。
- `cwd`：进程工作目录。
- `env`：环境变量。
- `watching`：是否开启文件监听。
- `restarts`：重启次数。

如果服务启动目录不对，通常可以在 `cwd` 里看出来。

## 7. 资源监控

打开 PM2 实时监控：

```bash
pm2 monit
```

主要观察：

- CPU 是否长期打满。
- Memory 是否持续上涨。
- 进程是否频繁重启。

如果内存持续上涨，可能存在内存泄漏，或者缓存没有释放。

## 8. 开机自启

生成开机自启命令：

```bash
pm2 startup
```

执行后，PM2 会输出一行带 `sudo` 的命令。复制并执行那一行。

保存当前进程列表：

```bash
pm2 save
```

注意：只执行 `pm2 startup` 不够，还需要 `pm2 save`。否则服务器重启后，当前进程列表可能不会恢复。

## 9. 更新代码后的标准流程

前端项目常见流程：

```bash
git pull
npm install
npm run build
pm2 restart twin
```

Node API 项目常见流程：

```bash
git pull
npm install
pm2 restart api
```

如果新增或修改了环境变量，需要确认 PM2 进程能读取到新的环境变量。

## 10. Vite 项目启动示例

Vite 项目通常使用 `preview` 暴露构建后的静态服务：

```bash
npm install
npm run build
pm2 start npm --name twin -- run preview -- --host 0.0.0.0
```

如果需要指定端口，例如 `4173`：

```bash
pm2 start npm --name twin -- run preview -- --host 0.0.0.0 --port 4173
```

检查端口是否监听：

```bash
lsof -i:4173
```

如果只监听 `127.0.0.1`，外部机器无法访问。需要加：

```bash
--host 0.0.0.0
```

## 11. 常见故障排查

### 11.1 页面打不开或 503

先看进程是否在线：

```bash
pm2 list
```

再看错误日志：

```bash
pm2 logs twin --err
```

检查端口：

```bash
lsof -i:4173
```

常见原因：

- 服务没有启动。
- 服务启动后立刻崩溃。
- 端口被占用。
- Nginx 代理端口写错。
- Vite 只监听了 `127.0.0.1`。

### 11.2 进程一直重启

查看进程详情：

```bash
pm2 describe twin
```

查看完整日志：

```bash
pm2 logs twin
```

常见原因：

- 启动脚本写错。
- 缺少依赖。
- 环境变量缺失。
- 端口冲突。
- 程序启动后抛异常。

### 11.3 npm 脚本能手动跑，PM2 跑不起来

先检查 PM2 的工作目录：

```bash
pm2 describe twin
```

重点看 `cwd`。如果工作目录不对，PM2 可能找不到 `package.json`。

可以进入项目目录后再启动：

```bash
cd /path/to/project
pm2 start npm --name twin -- run preview -- --host 0.0.0.0
```

### 11.4 修改代码后页面没有变化

前端项目需要重新构建：

```bash
npm run build
pm2 restart twin
```

如果前面还有 Nginx 或浏览器缓存，需要继续排查缓存问题。

## 12. 常用命令速查

查看状态：

```bash
pm2 list
```

查看日志：

```bash
pm2 logs twin
```

查看错误日志：

```bash
pm2 logs twin --err
```

查看服务详情：

```bash
pm2 describe twin
```

实时监控：

```bash
pm2 monit
```

重启服务：

```bash
pm2 restart twin
```

停止服务：

```bash
pm2 stop twin
```

删除服务：

```bash
pm2 delete twin
```

保存当前进程列表：

```bash
pm2 save
```

## 13. 最小记忆版

日常排查只需要先记住这几条：

```bash
pm2 list
pm2 logs twin
pm2 logs twin --err
pm2 describe twin
pm2 monit
```

排查顺序一般是：

```text
先看 pm2 list
再看 pm2 logs <name> --err
再看 pm2 describe <name>
最后检查端口和 Nginx
```

---
title: frp
date: 2025-07-09
---

# 1. service

服务端的配置

```shell
[common]
bind_port = 7000
token = ---
dashboard_port = 7500
dashboard_user = ---
dashboard_pwd = ---
```

> 注意token要和client中的token一致

# 2. client

```shell
[common]
server_addr = x7.xx0.48.xxx
server_port = 7000
token = ---
admin_addr = 127.0.0.1
admin_port = 7400
[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 6000
[ollama]
type = tcp 
local_ip = 127.0.0.1
local_port = 11434
remote_port = 11434
```
> 注意，当多台client时，[ssh]这类的服务名，要不同，可以用类似[ssh-2]
- 启动脚本 nohup ./frpc -c frpc.ini > nohup.log 2>&1 &
- 热更新 curl http://127.0.0.1:7400/api/reload
- 配置文件参考
    - https://github.com/fatedier/frp/blob/dev/conf/frpc_full_example.toml
    - https://github.com/fatedier/frp/blob/773169e0c44070facd652c4b8b3fe6e6ff4d78f3/conf/legacy/frps_legacy_full.ini

# 3. 开机启动

```shell
sudo nano /etc/systemd/system/frpc.service

[Unit]
Description=FRP Client
After=network.target

[Service]
Type=simple
User=deipss
ExecStart=/home/deipss/pkg/frp_0.61.2_linux_amd64/frpc -c /home/deipss/pkg/frp_0.61.2_linux_amd64/frpc.ini
Restart=on-failure

[Install]
WantedBy=multi-user.target
sudo systemctl daemon-reload
sudo systemctl enable frpc.service
sudo systemctl start frpc.service
sudo systemctl status frpc.service
```

# 4. ubuntu 下 的etc/systemd/system/是作什么的

在 Ubuntu（以及其他使用 systemd 作为初始化系统的 Linux 发行版）中，`/etc/systemd/system/` 目录
是 **系统服务单元文件（unit files）的主要存放位置**，用于定义、配置和管理系统服务。

| 是否使用 systemd  | 举例                                      |
|---------------|-----------------------------------------|
| ✅ 使用 systemd  | Ubuntu、Debian、Fedora、Arch、RHEL、openSUSE |
| ❌ 不使用 systemd | Devuan、Void、Alpine、Artix、Gentoo（可选）     |

> systemd 是现代 Linux 系统中广泛使用的 初始化系统（init system）和服务管理器，负责在系统启动时初始化硬件和软件、管理服务和进程，是整个系统的“启动和管理核心”。

- BIOS/UEFI → 加载 Linux 内核
- Linux 内核 → 启动 systemd
- systemd → 启动各种服务（网络、图形界面、SSH、日志等）

### 4.1. 核心作用

1. **服务管理**  
   systemd 通过读取该目录下的单元文件来启动、停止、重启或监控服务（如 Web 服务器、数据库、定时任务等）。

2. **自定义配置**  
   用户或管理员可以在此目录中创建或修改单元文件，以自定义系统服务的行为（例如更改启动参数、依赖关系或环境变量）。

3. **覆盖默认配置**  
   若要覆盖系统自带的服务配置（通常位于 `/lib/systemd/system/`），可在此目录中创建同名单元文件，优先级高于系统默认配置。

### 4.2. 单元文件类型

常见的单元文件扩展名包括：

- `.service`：定义系统服务（如 `nginx.service`、`mysql.service`）。
- `.timer`：定义定时任务（替代传统的 `cron`）。
- `.socket`：定义套接字监听服务（如 `sshd.socket`）。
- `.mount`：定义文件系统挂载点。
- `.target`：定义服务组（如 `multi-user.target` 表示多用户模式）。

### 4.3. 目录结构示例

```
/etc/systemd/system/
├── myapp.service         # 用户自定义服务
├── nginx.service         # 可能是对系统默认配置的覆盖
├── multi-user.target.wants/
│   ├── nginx.service     # 符号链接，表示该服务在多用户模式下启动
│   └── mysql.service
└── sockets.target.wants/
    └── sshd.socket       # 符号链接，表示SSH套接字服务
```

- **`*.wants/` 子目录**：存放符号链接，用于指定服务的依赖关系或启动顺序。例如，`multi-user.target.wants/`
  中的服务会在系统进入多用户模式时自动启动。

### 4.4. 如何使用

#### 4.4.1. **创建自定义服务**

例如，创建一个简单的 Node.js 应用服务：

```bash
sudo nano /etc/systemd/system/myapp.service
```

写入以下内容：

```ini
[Unit]
Description=My Node.js Application
After=network.target

[Service]
ExecStart=/usr/bin/node /path/to/app.js
WorkingDirectory=/path/to/
Restart=always
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### 4.4.2. **重载 systemd 配置**

每次修改单元文件后，需要重新加载配置：

```bash
sudo systemctl daemon-reload
```

#### 4.4.3. **管理服务**

```bash
sudo systemctl start myapp     # 启动服务
sudo systemctl enable myapp    # 设置开机自启
sudo systemctl status myapp    # 查看服务状态
```

### 4.5. 注意事项

1. **权限**：单元文件必须由 root 用户创建或修改，且权限通常为 `644`。
2. **优先级**：
    - `/etc/systemd/system/`（用户自定义） > `/run/systemd/system/`（运行时动态生成） > `/lib/systemd/system/`（系统默认）。
3. **查看默认配置**：若需参考系统默认服务配置，可查看 `/lib/systemd/system/` 目录。

### 4.6. 常见场景

- 部署 Web 应用（如 Nginx、Apache）。
- 配置数据库服务（如 MySQL、PostgreSQL）。
- 设置自定义脚本或应用为系统服务。
- 管理容器化应用（如 Docker 服务）。

通过 `systemd` 和 `/etc/systemd/system/`，你可以灵活管理 Ubuntu 系统中的各类服务，实现自动化启动、监控和维护。
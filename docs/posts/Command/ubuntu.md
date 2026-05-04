---
title: ubuntu
date: 2025-05-25
---

# 1. ubuntu show version

```shell
lsb_release -a
lscpu
```

# 2. ubuntu systemctl

```shell
# start with reboot
systemctl enable nginx.service       
systemctl enable supervisord

systemctl disable nginx.service
systemctl disable supervisord

systemctl is-enabled nginx
systemctl is-enabled supervisord
# show all
systemctl list-unit-files --type service -all

# start
systemctl start <service-name>
systemctl stop <service-name>
systemctl restart <service-name>
systemctl status <service-name>


```

# 3. ubuntu services

```shell
service --status-all
service <service-name> start
service <service-name> stop
service <service-name> restart
service <service-name> status

```

在Ubuntu中，将应用程序添加为服务通常意味着你希望该程序能够在系统启动时自动运行，并且能够像其他服务一样通过`systemctl`
命令进行管理（如启动、停止、重启等）。以下是将应用程序添加为Ubuntu服务的基本步骤：

### 1. 创建服务文件

首先，你需要为你的应用程序创建一个服务文件。这个文件应该放在`/etc/systemd/system/`目录下，文件名以`.service`结尾。例如，如果你想为名为
`myapp`的应用程序创建服务文件，你可以将其命名为`myapp.service`。

服务文件的内容通常如下所示：

```ini
[Unit]
Description=My Application
After=network.target

[Service]
ExecStart=/path/to/myapp
Restart=always
User=nobody
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

- `Description`字段提供服务的简短描述。
- `After`指定服务应在哪个服务之后启动，这里表示在网络服务启动后启动。
- `ExecStart`是启动服务时要执行的命令或脚本路径。
- `Restart`设置为`always`表示无论退出状态码是什么，服务都应该重新启动。
- `User`指定以哪个用户身份运行服务。
- `StandardOutput`和`StandardError`定义了日志输出的位置，这里配置为使用syslog。
- `WantedBy`定义了服务的目标运行级别，`multi-user.target`代表非图形界面的多用户模式。

### 2. 重新加载Systemd配置

创建或修改服务文件后，需要重新加载systemd配置以使更改生效：

```bash
sudo systemctl daemon-reload
```

### 3. 启动并启用服务

然后，你可以通过以下命令来启动服务，并设置开机自启：

```bash
sudo systemctl start myapp.service
sudo systemctl enable myapp.service
```

- `start`命令立即启动服务。
- `enable`命令则确保服务将在系统启动时自动运行。

### 4. 检查服务状态

最后，你可以检查服务的状态以确保它正在按预期工作：

```bash
sudo systemctl status myapp.service
```

这会显示服务是否活动（运行），以及其他有用的信息，如进程ID、资源使用情况等。

以上就是在Ubuntu中将应用程序添加为服务的基本步骤。根据实际需求，你可能需要调整服务文件中的参数。

# 4. ubuntu install jdk

```shell
# 安装jdk8
sudo apt install openjdk-8-jdk
whereis java

# 配置jre等包,不配置的话，运行的java程序，会找不到CLASSPATH下的包，导致一些功能不能正常使用，比如远程debug
vim ~/.profile
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
export JRE_HOME=$JAVA_HOME/jre
export CLASSPATH=$JAVA_HOME/lib:$JRE_HOME/lib:$CLASSPATH
export PATH=$JAVA_HOME/bin:$JRE_HOME/bin:$PATH
```

# 5. ubuntu网络防火端设置信息

```shell
sudo ufw allow 22/tcp
sudo ufw allow 21/tcp
sudo ufw allow 23/tcp
sudo ufw allow 80/tcp
sudo ufw allow from 59.75.133.222
sudo ufw enable|disable


sudo ufw delete allow 22/tcp
sudo ufw delete allow 21/tcp
sudo ufw delete allow 23/tcp
sudo ufw delete allow 80/tcp
```

# 6. install v2ray

- https://junz.org/post/v2_in_linux/
- https://github.com/v2ray/v2ray-core/releases/

```text
#export ALL_PROXY="socks5://127.0.0.1:10808"
#export http_proxy="http://127.0.0.1:10809"

curl -x socks5://127.0.0.1:10808 https://www.google.com -v
curl -x socks5://127.0.0.1:10808 -L -o v2ray-macos-arm64-v8a.zip https://github.com/v2fly/v2ray-core/releases/download/v5.29.3/v2ray-macos-arm64-v8a.zip
```

# 7. install nvidia driver

- https://linuxconfig.org/how-to-install-the-nvidia-drivers-on-ubuntu-22-04

# 8. 系统环境

使用.profile文件作为环境变量的配置文件
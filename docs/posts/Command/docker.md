---
title: docker
date: 2025-06-18
created: 2025-06-18
updated: 2025-06-18
---

# 1. docker 安装

## 1.1. 1panel

- URL_ADDRESS- https://www.1panel.cn/

### 1.1.1. 使用**1panel**管理docker,1pctl命令

```shell
Usage:
  1pctl [COMMAND] [ARGS...]
  1pctl --help

Commands: 
  status              查看 1Panel 服务运行状态
  start               启动 1Panel 服务
  stop                停止 1Panel 服务
  restart             重启 1Panel 服务
  uninstall           卸载 1Panel 服务
  user-info           获取 1Panel 用户信息
  listen-ip           切换 1Panel 监听 IP
  version             查看 1Panel 版本信息
  update              修改 1Panel 系统信息
  reset               重置 1Panel 系统信息
  restore             恢复 1Panel 服务及数据
  
deipss@deipss-All-Series:~$ whereis 1pctl
1pctl: /usr/bin/1pctl /usr/local/bin/1pctl
```

### 1.1.2. 1panel 文件保存在哪里？

- 默认安装目录：1Panel 默认安装在/opt目录下，这里主要存放 1Panel 自身的二进制文件等。

```shell
/opt/1panel/apps
/opt/1panel/backup
/opt/1panel/cache
/opt/1panel/db
/opt/1panel/docker
/opt/1panel/geo
/opt/1panel/log
/opt/1panel/mcp
/opt/1panel/resource
/opt/1panel/runtime
/opt/1panel/tmp
```

- Docker 数据目录：1Panel 应用是容器化安装的，Docker 默认存储目录为`/var/lib/docker`，镜像、容器数据等通常保存在此目录下。如果手动迁移过
  Docker 数据目录，比如迁移到了/www/docker，则相关数据会存储在新的目标位置。

```shell
/var/lib/docker/buildkit
/var/lib/docker/containers
/var/lib/docker/engine-id
/var/lib/docker/image
/var/lib/docker/network
/var/lib/docker/overlay2
/var/lib/docker/plugins
/var/lib/docker/runtimes
/var/lib/docker/swarm
/var/lib/docker/tmp
/var/lib/docker/volumes
```

- 应用存储目录：在使用 1Panel 部署应用时，不同应用可能有各自的存储路径配置。例如，若在 1Panel 中部署
  WordPress，其文件可能保存在容器内的/var/www/html目录映射到宿主机的对应路径下。具体路径可在 1Panel 的应用管理界面或相关应用的配置文件中查看。
- 备份文件目录：点击 1Panel 中【备份】按钮后，系统会在默认备份目录下生成备份文件，不过具体默认备份目录在不同环境中可能有所不同，一般可在
  1Panel 的设置或文档中查找相关信息。另外，1Panel 支持将备份记录下载到本地，也支持添加阿里云 OSS、AWS S3 云存储、Minio
  云原生对象存储和 SFTP 文件传输协议等第三方账号进行备份存储。

## 1.2. install docker on ubuntu

- https://docs.docker.com/engine/install/ubuntu/

snap是ubuntu上的一个软件管理工具,可以通过**snap**进行安装

```shell
sudo snap install docker         # version 20.10.24, or
sudo apt  install docker.io      # version 24.0.5-0ubuntu1~22.04.1
sudo apt  install podman-docker  # version 3.4.4+ds1-1ubuntu1.22.04.2
See 'snap info docker' for additional versions.
```

## 1.3. install docker on centos

```shell
#查看内核版本
uname -r
#确保 yum 包更新到最新
sudo yum update
#执行 docker 安装脚本
curl >fsSL [https://get.docker.com](https://get.docker.com) >o get>[docker.sh](http://docker.sh) sudo sh get>[docker.sh](http://docker.sh)
#启动 Docker 进程
sudo systemctl start docker
#开机启动
sudo systemctl enable docker 
```

## 1.4. 开启远程启动

- https://docs.docker.com/config/daemon/remote-access/

```shell
sudo su
find / -name "*docker.ser*"
vim docker.server 
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2375
sudo systemctl daemon-reload 
sudo systemctl restart docker.service
sudo netstat -lntp | grep dockerd
```

## 1.5. docker 加速

- 镜像加速：新版的Docker使用 /etc/docker/daemon.json

```json
 {
  "registry-mirrors": [
    "http://hub-mirror.c.163.com"
  ]
}
```

## 1.6. ubuntu snap install docker 后镜像加速

- https://programlife.net/2020/09/12/ubuntu-snap-docker-registry-mirrors/

```shell
#新版的ubuntu使用snap来管理一些软件，所以重启使用snap的命令
sudo systemctl list-units --type=service
```

## 1.7. 查询docker镜像

文档 https://hub.docker.com/

```shell
#查看镜像
docker image ls
docker images -a
#查看已下载的
docker images
#删除镜像
docker imamges rm
```

## 1.8. 容器启动

```bash
#虚拟内存设置大一点
sysctl -w vm.max_map_count=262144

docker run --name tomcat -p 8080:8080 -d tomcat   --restart=always
docker run -p 27017:27017  -d mongo --restart=always
docker run -p 6379:6379  -d redis redis-server --appendonly yes --restart=always
#自动启动
docker update --restart=always 01a07d12cfec
```

## 1.9. 删除未启动的容器

```bash
#删除容器
docker rm $( docker ps -a -q)
#删除镜像
docker rm $( docker images -a -q)
```

## 1.10. 查看端口映射

```shell
docker port [容器id]
```

## 1.11. 进入容器内部

```shell
docker exec -it [容器ID] /bin/bash
```

## 1.12. 日志查看

```shell
docker logs -f bf08b7f2cd89
```

## 1.13. 观测某个容器

```shell
docker inspect [容器ID]
```

# 2. 常见服务

## 2.1. mysql

```bash
docker run --name mysql_1 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=deipss --restart=always  -d mysql:latest
docker exec -it mysql_1 bash
mysql -u root -p -h localhost
ALTER USER 'root'@'%' IDENTIFIED BY 'mysql_Xh7Z62' PASSWORD EXPIRE NEVER;
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'mysql_Xh7Z62'; 
FLUSH PRIVILEGES;
commit;
select Host,User,plugin from mysql.user;
```

- [使用docker运行mysql](https://www.cnblogs.com/limingxie/p/8655457.html)
- [2059错误](https://www.cnblogs.com/lifan1998/p/9177731.html)
- [2059错误](https://blog.csdn.net/ora_dy/article/details/80251487)

## 2.2. zookeeper kafka

```bash
docker pull wurstmeister/zookeeper  
docker pull wurstmeister/kafka  

docker run -d --name zookeeper -p 2181:2181 -t wurstmeister/zookeeper
docker run -d --name kafka -p 9092:9092 -e KAFKA_BROKER_ID=0 \
 -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 --link zookeeper \
 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.0.101:9092 \
 -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 -t wurstmeister/kafka

KAFKA_ZOOKEEPER_CONNECT KAFKA_ADVERTISED_LISTENERS 
两个参数的192.168.204.128改为宿主机器的IP地址，如果不这么设置，
可能会导致在别的机器上访问不到kafka。

docker exec -it kafka /bin/bash

```

## 2.3. MongoDB

```bash
docker run -d -p 27017:27017 -v mongo_configdb:/data/configdb -v mongo_db:/data/db --name mongo docker.io/mongo --auth
docker exec -it mongo mongo admin
db.createUser({ user: 'lutos', pwd: 'lutos', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] });
db.auth("lutos","lutos");

use lutos
db.createUser({ user: 'lutos', pwd: 'lutos', roles: [{ role: "readWrite", db: "lutos" }] });

docker exec -it mongo mongo -u lutos -p lutos lutos
```

## 2.4. RabbitMQ

```bash
docker pull rabbitmq:management
docker run -d -p 5672:5672 -p 15672:15672 --name myrabbitmq [id]
docker exec -it 9e83ee385ca7 /bin/bash 
rabbitmqctl  add_user  admin  admin
rabbitmqctl  set_user_tags admin administrator
```

## 2.5. elasticsearch

### 2.5.1. 8.0版本

- https://www.elastic.co/guide/en/kibana/current/docker.html
- https://levelup.gitconnected.com/docker-compose-made-easy-with-elasticsearch-and-kibana-4cb4110a80dd

还要安装kibana

```bash
If you want to set this permanently, you need to edit /etc/sysctl.conf and set vm.max_map_count to 262144.
# es 
docker network create elastic
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.6.2
docker run --name es-node01 --net elastic -p 9200:9200 -p 9300:9300 -t docker.elastic.co/elasticsearch/elasticsearch:8.6.2 
# es密码设置
docker exec -it es-node01 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
# token 重新获取
docker exec -it es-node01 /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana

# kibana 
docker pull docker.elastic.co/kibana/kibana:8.6.2
docker run --name kib-01 --net elastic -p 5601:5601 docker.elastic.co/kibana/kibana:8.6.2
```

### 2.5.2. 7.17版本

- https://www.elastic.co/guide/en/kibana/7.17/docker.html

```shell
docker network create elastic
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.17.9
docker run --name es01-test --net elastic -p 127.0.0.1:9200:9200 -p 127.0.0.1:9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.17.9

docker pull docker.elastic.co/kibana/kibana:7.17.9
docker run --name kib01-test --net elastic -p 127.0.0.1:5601:5601 -e "ELASTICSEARCH_HOSTS=http://{本地ip}:9200" docker.elastic.co/kibana/kibana:7.17.9
```

### 2.5.3. 7.10.2 compose方式来启动ES和KIBANA【推荐】

#### 2.5.3.1. 创建 docker-compose.yml

```yaml
version: "3.7"
services:
  elasticsearch:
    image: "docker.elastic.co/elasticsearch/elasticsearch-oss:7.10.2"
    container_name: elasticsearch_001
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      node.name: es01
      discovery.type: single-node
      cluster.name: mycluster
      ES_JAVA_OPTS: -Xms512m -Xmx512m
    volumes:
      - "es-data-es01:/usr/share/elasticsearch/data"
    ulimits:
      memlock:
        soft: -1
        hard: -1
  kibana:
    image: docker.elastic.co/kibana/kibana-oss:7.10.2
    container_name: kibana_001
    depends_on:
      - elasticsearch
    ports:
      - "5601:5601"
      - "9600:9600"
    environment:
      SERVERNAME: kibana
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
      ES_JAVA_OPTS: -Xmx512m -Xms512m
volumes:
  es-data-es01: { }
restart:
  always
```

#### 2.5.3.2. 通过以下命令来启动

- find / -name "docker-compose.yml"
- cd /home/deipss/docker-yaml/
- docker-compose up -d

## 2.6. redis

```bash
docker pull redis:latest
docker run -d --name redis -p 6379:6379 redis --requirepass "redis" --appendonly yes
```

## 2.7. rocketmq

https://hub.docker.com/r/xuchengen/rocketmq

```shell
# mq
docker pull xuchengen/rocketmq:latest
docker volume create rocketmq_data
# Linux 或 Mac
docker run -itd \
 --name=rocketmq \
 --hostname rocketmq \
 --restart=always \
 -p 8080:8080 \
 -p 9876:9876 \
 -p 10909:10909 \
 -p 10911:10911 \
 -p 10912:10912 \
 -v rocketmq_data:/home/app/data \
 -v /etc/localtime:/etc/localtime \
 -v /var/run/docker.sock:/var/run/docker.sock \
 --net=host \
 --restart=always \
 xuchengen/rocketmq:latest
```

## 2.8. zk

```shell
docker pull bitnami/zookeeper:latest
docker run --name=main-zk  --restart=always  -e ALLOW_ANONYMOUS_LOGIN=yes  -p 2181:2181  bitnami/zookeeper:latest 
```

## 2.9. dubbo admin

- git文档地址 https://github.com/apache/dubbo-admin?tab=readme-ov-file#12-run-with-docker

```shell
# 创建目录和文件 
mkdir /docker/dubbo-admin/
vim application.properties
# 在文件中添加配置文件
admin.registry.address=zookeeper://127.0.0.1:2181
admin.config-center=zookeeper://127.0.0.1:2181
admin.root.user.name=root
admin.root.user.password=root
admin.check.signSecret=86295dd0c4ef69a1036b0b0c15158d77
# 启动容器
docker run -itd --net=host --name dubbo-admin -v /docker/dubbo-admin/:/config apache/dubbo-admin --restart=always
```

# 3. Docker file

Docker 构建的早期需要 DockerFile，就是 Docker 构建了一个命令文件。Docker基于这个文件构建镜像并且打包镜像。

- 1）Docker 镜像配置文件
- 2）脚本编写
- 3）脚本文件
- 4）一系列命令和参数构成的脚本
- 5）这些命令应用于基础镜像
- 6）并最终创建一个新的镜像

重要指令

```text
1）FROM 指定基础镜像文件
2）MAINTAINER authors_name 作者
3）RUN 运行特殊命令，比如下载 JDK
4）SER 命令用于设置运行容器的 UID
5）VOLUME 指定容器访问目录
6）WORKDIR 运行目录
7）ENV 环境变量，如 ENV LANG en_US.UTF-8
8）CMD 容器执行的命令 CMD "echo" "Hello docker!" 
9）ADD 复制文件到目标文件夹
10）COPY 复制，类似 ADD
11）EXPOSE 暴露端口
12）ENTRYPOINT 入口，命令，只有一个不能被 Run 覆盖
```

## 3.1. 示例：jdk启动应用

```dockerfile
FROM centos:7

MAINTAINER deipss666@gmail.com

RUN yum update -y && \
yum install -y wget && \
yum install -y unzip && \
yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel && \
yum clean all

# Set environment variables.
ENV HOME /root
VOLUME /tmp

# Define working directory.
WORKDIR /root


# Define default command.
CMD ["bash"]
CMD ["wget -P /opt https://ompc.oss-cn-hangzhou.aliyuncs.com/jvm-sandbox/release/sandbox-1.4.0-bin.zip "]
CMD ["unzip sandbox-1.4.0-bin.zip "]
COPY java-edu-web/target/java-edu-web-1.0.1-SNAPSHOT.jar /root/java-edu-web.jar
EXPOSE 8088
ENTRYPOINT ["java","-jar","/root/java-edu-web.jar -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"]
```
---
title: devOps
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. devops

![devops.png](img%2Fdevops.png)


- 用户使用git作为代码版本管理工具
- 使用maven作为包管理库
- Jenkins从git仓库中提取代码，并使用mvn打包到maven仓库可以jar包，或war包
- 使用SonarQube来扫描代码是否存在漏洞
- 将docker镜像生成，上传到habar来管理docker镜像
- 通知k8s来部署docker容器

# 2. k8s

![k8s.png](img%2Fk8s.png)

- namespace 
- pod 部署的节点
- deployment 根据ymal文件来配置,感觉有和docker-compose类似，是使用一个配置文件来配置多种数据
- service 一个应用，如交易或支付的某个业务系统
- ingress 网络域名绑定,本身是一个nginx
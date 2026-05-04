---
title: npm
date: 2025-05-25
---

# 1. 安装 node

```text
This package has installed:
	•	Node.js v21.6.2 to /usr/local/bin/node
	•	npm v10.2.4 to /usr/local/bin/npm
Make sure that /usr/local/bin is in your $PATH.
```

# 2. npm使用国内镜像加速的几种方法

```shell
npm config set registry http://mirrors.cloud.tencent.com/npm/
npm config get registry
```

# 3. 通过使用淘宝定制的cnpm安装

```shell
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install xxx
```
       
注意，必要的时候，要添加文件的写入权限：
- sudo chmod -R 775 /Users/{user_name}/.npminstall_tarball

推荐使用这种方法


# 4. 应用启动

```shell
# 安装依赖
npm i
# 本地开发 启动项目
npm run serve
```

# 5. 代理配置

```shell

npm config set registry http://registry.npmjs.org/
npm config set proxy http://127.0.0.1:10808
npm config set https-proxy http://127.0.0.1:10809
npm config set strict-ssl false
set HTTPS_PROXY=http://myusername:mypassword@proxy.us.somecompany:8080
set HTTP_PROXY=http://myusername:mypassword@proxy.us.somecompany:8080
export HTTPS_PROXY=http://myusername:mypassword@proxy.us.somecompany:8080
export HTTP_PROXY=http://myusername:mypassword@proxy.us.somecompany:8080
export http_proxy=http://myusername:mypassword@proxy.us.somecompany:8080

npm --proxy http://myusername:mypassword@proxy.us.somecompany:8080 \
--without-ssl --insecure -g install
```


npm config set proxy http://127.0.0.1:10809
npm config get proxy

> hint: npm use socket to communicate with other host, proxy should be config via socket proxy, but http proxy.

# 6. --save-dev 是什么意思

`--save-dev` 是 npm 的一个标志，用于将依赖项添加到 `devDependencies` 中。这类依赖通常是仅在开发阶段需要，而不是在应用程序生产运行中需要的库。例如，测试工具、构建工具等。

使用示例：

```shell
npm install package-name --save-dev
```

在 `package.json` 文件中的效果：

```json
"devDependencies":{
"package-name": "^1.2.3"
}
```



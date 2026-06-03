---
title: Vite Vue3 项目文件说明
date: 2026-06-02
created: 2026-06-02
updated: 2026-06-02
---

# 1. Vite Vue3 项目文件说明

这篇记录一个 `Vite + Vue3` 前端项目，以及一个 `frontend + backend` 全栈 workspace 项目的关键配置文件。重点看清楚每个文件负责什么、脚本怎么启动、依赖版本在哪里声明，以及 npm 包名里 `@` 的含义。

[[toc]]

## 2. 前端 package.json

`package.json` 是前端项目的包描述文件，里面最重要的是项目类型、脚本命令、运行依赖和开发依赖。

```json
{
  "name": "dodo-vue3-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .js,.vue"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "echarts": "^5.5.1",
    "element-plus": "^2.9.4",
    "@element-plus/icons-vue": "^2.3.1",
    "pinia": "^2.1.7",
    "vue": "^3.5.13",
    "vue-router": "^4.4.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "eslint": "^8.57.1",
    "eslint-plugin-vue": "^9.29.1",
    "vite": "^5.4.10"
  }
}
```

### 2.1. 基础字段

| 字段 | 含义 |
| --- | --- |
| `name` | 项目名称，这里是 `dodo-vue3-frontend`。 |
| `private` | `true` 表示不发布到 npm 公共仓库。 |
| `version` | 当前项目版本。 |
| `type` | `module` 表示使用 ES Module 语法，也就是 `import/export`。 |

### 2.2. scripts 脚本

| 脚本 | 命令 | 作用 |
| --- | --- | --- |
| `dev` | `vite` | 启动本地开发服务器，开发时使用。 |
| `build` | `vite build` | 构建生产环境静态资源。 |
| `preview` | `vite preview` | 本地预览构建后的产物。 |
| `lint` | `eslint . --ext .js,.vue` | 检查当前目录下的 `.js` 和 `.vue` 文件。 |

常用命令：

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### 2.3. dependencies 运行依赖

`dependencies` 是项目运行时需要用到的依赖。

| 依赖 | 版本 | 作用 |
| --- | --- | --- |
| `vue` | `^3.5.13` | Vue3 核心框架。 |
| `vue-router` | `^4.4.5` | Vue3 路由管理。 |
| `pinia` | `^2.1.7` | Vue 状态管理。 |
| `axios` | `^1.7.7` | HTTP 请求库，用于调用后端接口。 |
| `element-plus` | `^2.9.4` | Vue3 UI 组件库。 |
| `@element-plus/icons-vue` | `^2.3.1` | Element Plus 图标组件。 |
| `echarts` | `^5.5.1` | 图表可视化库。 |

### 2.4. devDependencies 开发依赖

`devDependencies` 通常只在开发、构建、检查阶段使用。

| 依赖 | 版本 | 作用 |
| --- | --- | --- |
| `vite` | `^5.4.10` | 前端构建工具和开发服务器。 |
| `@vitejs/plugin-vue` | `^5.1.4` | 让 Vite 支持 Vue 单文件组件。 |
| `eslint` | `^8.57.1` | JavaScript 代码规范检查工具。 |
| `eslint-plugin-vue` | `^9.29.1` | ESLint 的 Vue 文件检查插件。 |

## 3. index.html

`index.html` 是 Vite 前端项目的 HTML 入口文件。

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dodo Vue3 全栈学习项目</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

这里最重要的是两行：

```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

说明：

- `<div id="app"></div>` 是 Vue 应用的挂载点，`main.js` 里通常会通过 `createApp(App).mount('#app')` 把 Vue 应用挂到这里。
- `<script type="module" src="/src/main.js"></script>` 指定前端入口脚本，Vite 会从这个入口开始处理模块依赖。
- `type="module"` 表示浏览器按 ES Module 方式加载脚本，因此可以使用 `import/export`。

## 4. vite.config.js

`vite.config.js` 是 Vite 配置文件。下面这个最小配置做了两件事：启用 Vue 插件，把开发服务器端口固定为 `5173`。

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173
  }
})
```

### 4.1. 逐行说明

```js
import { defineConfig } from 'vite'
```

从 Vite 导入 `defineConfig`。它的作用是给配置提供更好的类型提示，尤其是在 TypeScript 项目里，编辑器可以更准确地提示配置项。

```js
import vue from '@vitejs/plugin-vue'
```

导入 Vue 插件。它让 Vite 能识别和编译 `.vue` 单文件组件，支持 `template/script/style` 编译和热更新。

```js
export default defineConfig({
```

导出 Vite 配置对象。`defineConfig({...})` 本质上是包一层配置对象，让类型推断更友好。

```js
plugins: [vue()],
```

配置 Vite 插件列表。`vue()` 启用 Vue SFC 支持，如果没有这个插件，`.vue` 文件无法正常构建和热更新。

```js
server: {
  port: 5173
}
```

配置开发服务器，只影响 `vite dev` 或 `npm run dev`。`port: 5173` 表示开发服务器固定使用 `5173` 端口。

Vite 默认也常用 `5173`，如果端口被占用，默认可能自动换端口。想强制端口被占用时报错，可以继续加：

```js
server: {
  port: 5173,
  strictPort: true
}
```

### 4.2. 常用扩展项

允许局域网访问：

```js
server: {
  host: '0.0.0.0',
  port: 5173
}
```

配置后端代理，解决本地开发跨域：

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

配置路径别名：

```js
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
```

配置构建输出目录：

```js
export default defineConfig({
  build: {
    outDir: 'dist'
  }
})
```

## 5. 后端 Server.js

如果项目是全栈结构，后端入口通常会有一个 `server.js`。下面是一个 Express 后端入口示例：

```js
import cors from 'cors'
import express from 'express'
import userRoutes from './routes/userRoutes.js'
import geoRoutes from './routes/geoRoutes.js'
import classRoutes from './routes/classRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'
import { env } from './config/env.js'
import { initDb } from './db/initDb.js'
import { errorHandler } from './middleware/errorHandler.js'
import { getCapabilities } from './db/capabilities.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', async (req, res) => {
  const capabilities = await getCapabilities()
  res.json({ status: 'ok', capabilities })
})

app.get('/api/capabilities', async (req, res) => {
  const capabilities = await getCapabilities()
  res.json({ code: 0, message: 'ok', data: capabilities })
})

app.use('/api/users', userRoutes)
app.use('/api/geo', geoRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/scores', scoreRoutes)
app.use(errorHandler)

const bootstrap = async () => {
  await initDb()
  app.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
```

核心结构：

- `express()` 创建后端应用实例。
- `app.use(cors())` 允许跨域请求。
- `app.use(express.json())` 解析 JSON 请求体。
- `/health` 用于健康检查。
- `/api/capabilities` 用于返回后端能力信息。
- `app.use('/api/users', userRoutes)` 这类代码把不同业务路由挂载到不同路径。
- `app.use(errorHandler)` 统一处理异常。
- `bootstrap()` 先初始化数据库，再启动端口监听。
- `bootstrap().catch(...)` 捕获启动失败并退出进程。

## 6. 根目录 workspace package.json

全栈项目常见结构是根目录管理 workspace，`frontend` 和 `backend` 各自维护自己的 `package.json`。

```json
{
  "name": "dodo-vue3-fullstack",
  "private": true,
  "version": "1.0.0",
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "db:init": "npm run db:init --workspace backend",
    "db:seed": "npm run db:seed --workspace backend",
    "dev:frontend": "npm run dev --workspace frontend",
    "dev:backend": "npm run dev --workspace backend",
    "lint": "npm run lint --workspace frontend && npm run lint --workspace backend",
    "start": "npm run start --workspace backend"
  }
}
```

字段说明：

- `name` 是项目名称。
- `private: true` 表示这个根项目不发布到公共 npm 仓库。
- `workspaces` 表示当前项目由 `frontend` 和 `backend` 两个子项目组成。
- `scripts` 里的命令会通过 `--workspace` 找到对应子项目，再执行子项目自己的脚本。

常见执行方式：

```bash
npm run dev:frontend
npm run dev:backend
npm run lint
npm run start
```

## 7. node_modules 中包名带 @ 和不带 @ 的区别

在 npm / Node 生态里，包名以 `@` 开头和不以 `@` 开头的最大区别是：

- `@` 开头的是作用域包，也叫 scoped package。
- 不以 `@` 开头的是非作用域包，也叫 unscoped package。

### 7.1. 作用域包

作用域包形式是：

```text
@scope/name
```

常见例子：

- `@vitejs/plugin-vue`
- `@types/node`
- `@nestjs/common`
- `@element-plus/icons-vue`

作用域包通常用来表示：

- 属于某个组织、团队或生态。
- 官方或公司维护的一组包。
- 避免全局包名冲突。

例如下面两个包可以同时存在：

```text
@foo/utils
@bar/utils
```

因为它们的 scope 不同，所以不会冲突。

### 7.2. 非作用域包

非作用域包就是直接使用一个全局唯一的名字。

常见例子：

- `vue`
- `axios`
- `echarts`
- `pinia`
- `vite`

这类包名在 npm 全局命名空间里唯一，不能和已有包重名。

### 7.3. 安装和引用区别

安装作用域包：

```bash
npm install @vitejs/plugin-vue
```

引用作用域包：

```js
import vue from '@vitejs/plugin-vue'
```

安装非作用域包：

```bash
npm install axios
```

引用非作用域包：

```js
import axios from 'axios'
```

### 7.4. 权限和发布

历史上，作用域包经常用于私有包，需要权限才能安装。现在作用域包既可以是公开包，也可以是私有包，很多官方包都是公开的作用域包。

首次发布公开作用域包时，通常需要显式指定：

```bash
npm publish --access public
```

### 7.5. registry 配置

企业私有 npm 仓库经常会让某些 scope 走内网 registry，其他包继续走公网 npm。

`.npmrc` 示例：

```ini
@company:registry=https://npm.company.com/
```

这表示：

- `@company/*` 走公司内网 npm 仓库。
- 其他普通包继续走默认 npm registry。

### 7.6. 三句话总结

1. 以 `@` 开头的是作用域包，类似某个组织或公司的命名空间。
2. 不以 `@` 开头的是普通包名，需要在 npm 全局命名空间里保持唯一。
3. 使用作用域包可以把同一个生态、组织或公司的包归到一起，也能避免包名冲突。

---
title: html
date: 2025-07-20
---
当然可以，下面是 **HTML 常见标签分类与示例代码**，帮助你快速掌握最常用的标签和结构。

---
## 🧱 1. 页面基础结构（HTML Skeleton）
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>我的网页</title>
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>
```
---

## 📄 2. 文本标签（结构性内容）

| 标签                 | 用途  | 示例                      |
| ------------------ | --- | ----------------------- |
| `<h1>`\~`<h6>`     | 标题  | `<h1>一级标题</h1>`         |
| `<p>`              | 段落  | `<p>这是一个段落。</p>`        |
| `<br>`             | 换行  | `第一行<br>第二行`            |
| `<hr>`             | 水平线 | `<hr>`                  |
| `<strong>` / `<b>` | 加粗  | `<strong>重要内容</strong>` |
| `<em>` / `<i>`     | 斜体  | `<em>强调文字</em>`         |

---
## 🔗 3. 链接与图片
```html
<a href="https://example.com">跳转链接</a>
<img src="image.jpg" alt="示例图片" width="200">
```
---

## 📋 4. 列表标签

```html
<!-- 无序列表 -->
<ul>
  <li>苹果</li>
  <li>香蕉</li>
</ul>

<!-- 有序列表 -->
<ol>
  <li>第一步</li>
  <li>第二步</li>
</ol>
```

---
## 🧩 5. 表格标签
```html
<table border="1">
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>25</td>
    </tr>
  </tbody>
</table>
```
---

## 🧠 6. 表单标签（交互输入）

```html
<form action="/submit" method="post">
  <label for="name">姓名：</label>
  <input type="text" id="name" name="name"><br>

  <label for="age">年龄：</label>
  <input type="number" id="age" name="age"><br>

  <input type="submit" value="提交">
</form>
```

其他常见输入类型还有：

```html
<input type="password">
<input type="checkbox">
<input type="radio">
<textarea></textarea>
<select>
  <option>选项1</option>
</select>
```

---
## 📦 7. 语义化布局标签（HTML5）
| 标签          | 说明   |
| ----------- | ---- |
| `<header>`  | 页眉区域 |
| `<nav>`     | 导航栏  |
| `<main>`    | 主体内容 |
| `<section>` | 章节内容 |
| `<article>` | 独立文章 |
| `<aside>`   | 侧边内容 |
| `<footer>`  | 页脚   |
```html
<header>网站标题</header>
<nav>导航菜单</nav>
<main>
  <article>新闻内容</article>
</main>
<footer>版权信息</footer>
```
---

## 🎨 8. 嵌入样式和脚本

```html
<style>
  body { font-family: Arial; background-color: #f0f0f0; }
</style>

<script>
  alert("欢迎访问！");
</script>
```

---
## 🧪 9. 特殊字符编码
| 显示   | 编码       |
| ---- | -------- |
| 空格   | `&nbsp;` |
| 小于号  | `&lt;`   |
| 大于号  | `&gt;`   |
| & 符号 | `&amp;`  |
| 引号   | `&quot;` |
---

## ✅ 示例：一个完整的小网页

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>个人主页</title>
</head>
<body>
  <header><h1>欢迎来到我的主页</h1></header>

  <nav>
    <a href="#">首页</a> |
    <a href="#">关于我</a> |
    <a href="#">联系</a>
  </nav>

  <main>
    <section>
      <h2>关于我</h2>
      <p>我是一名前端开发者，喜欢编写 HTML 和 CSS。</p>
    </section>

    <section>
      <h2>技能列表</h2>
      <ul>
        <li>HTML</li>
        <li>CSS</li>
        <li>JavaScript</li>
      </ul>
    </section>
  </main>

  <footer>
    &copy; 2025 我的名字
  </footer>
</body>
</html>
```

---


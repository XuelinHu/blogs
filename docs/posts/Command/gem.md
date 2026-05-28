---
title: gem
date: 2025-06-18
created: 2025-06-18
updated: 2025-06-18
---

# 1. ruby gem bundle 三者的关系

- ruby的安装和使用：brew install ruby

```shell
brew list | grep ruby
chruby
ruby-install

brew install chruby ruby-install

```

- gem的安装和使用： brew install rubygems

gem 是包管理工具，ruby内置，有点类似 node和npm，python和pip。

- bundle的安装和使用
  bundle是一个具体的gem，用于依赖管理

# 2. Gemfile和Gemfile.lock

Gemfile是描述项目需要的依赖包及版本

```ruby
source 'https://rubygems.org'

gem "jekyll", "~> 4.4.1"
gem "jekyll-sitemap", "~> 1.4.0"
gem "just-the-docs", "0.10.0"
```

关键语法
版本约束：
~> 4.4.1：允许安装 4.4.x 的最新版本（如 4.4.2、4.4.3），但不升级到 4.5。
= 0.10.0 或直接写 0.10.0：固定版本。

> 3.0：大于 3.0 的任意版本。
> 源设置：source 'https://rubygems.org' 指定 gem 包的下载源。

Gemfile.lock是一个自动生成的文件，记录了项目中所有依赖包及其精确版本。一般在项目初始化或运行 bundle install 时生成。
Gemfile.lock 包含了所有依赖包及其版本，确保项目的依赖环境一致，避免不同环境下的依赖冲突。

> 当你运行 bundle install 时，它会根据 Gemfile 中的依赖项和版本要求，从指定的源下载并安装这些依赖包及其精确版本。
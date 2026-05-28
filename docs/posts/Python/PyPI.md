---
title: PyPI
date: 2025-07-14
created: 2025-07-14
updated: 2025-07-14
---

# 1. What is the PyPI

和Mvn的[仓库平台](https://mvnrepository.com/)类似，PyPI（Python Package Index） 是 Python 官方的第三方软件包仓库，
相当于 Python 的 “应用商店”。

- 网址：https://pypi.org

# 2. How to publish you whl package

- 注册自己的帐号，申请API KEY
- 配置自己项目中的pyproject.toml

```text
[project]
name = "mypackage"
version = "0.1.0"
description = "A simple example package"
readme = "README.md"
license = {text = "MIT"}
authors = [{name = "Your Name", email = "your@email.com"}]
dependencies = []

[build-system]
requires = ["setuptools", "wheel"]
build-backend = "setuptools.build_meta"
```

- 安装打包用的软件 `pip install build`
- python -m build

```text
python -m build

dist/
  ├── mypackage-0.1.0.tar.gz
  └── mypackage-0.1.0-py3-none-any.whl
mypackage-0.1.0.tar.gz — 源代码分发包（Source Distribution，简称 sdist）
mypackage-0.1.0-py3-none-any.whl — 预编译的 Wheel 包（Binary Distribution）
```

- 上传
```text
pip install twine
twine upload dist/*
```


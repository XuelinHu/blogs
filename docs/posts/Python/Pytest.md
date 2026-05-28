---
title: Pytest
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 文件加载

## 1.1. path

```python
import json
import  os
import yaml
if __name__ == '__main__':
    print(__file__)
    relpath = os.path.relpath(__file__)
    print(os.path.split(relpath))
    print(relpath)
    print(os.getcwd())


    path = os.path.join('dir1', 'dir2', 'file.txt')
    print(path)
```

## 1.2. json yaml
```python
import json
import  os
import yaml
if __name__ == '__main__':
    with open("demo.yaml", "r") as file:
        data = yaml.safe_load(file)
        print(data)
        print(data['json'])

    with open("demo.json", "r") as file:
        data = json.load(file)
        print(data['sites'])
```


# 2. Pytest

## 2.1. 作用域
fixture可以通过 scope 参数声明作用域，比如

- function: 函数级，每个测试函数都会执行一次固件；
- class: 类级别，每个测试类执行一次，所有方法都可以使用；
- module: 模块级，每个模块执行一次，模块内函数和方法都可使用；
- session: 会话级，一次测试只执行一次，所有被找到的函数和方法都可用。

# 3. Allure

是一个测试报告的插件，可以生成测试报告，支持html、json、xml、junit等格式。

# 4. Client


## 4.1. mysql


## 4.2. rocketmq


## 4.3. redis


## 4.4. es


# 5. log


# 6. python 部署

## 6.1. 搜索可用的版本包
pip install requests==

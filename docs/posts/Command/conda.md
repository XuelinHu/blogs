---
title: conda
date: 2025-06-18
created: 2025-06-18
updated: 2025-06-18
---
# 1. conda

## 1. 安装环境

- 官方路径：https://docs.anaconda.com/free/anaconda/install/linux/
- anaconda 的版本信息：https://repo.anaconda.com/archive/

```shell
conda create -n py36 python=3.6
conda create -n py310 python=3.10.14
# 显示当前环境
conda info -e 
conda env list

activate [env_name]
deactivate

conda create [env_name]
source activate py36 
source activate py310 
source deactivate


```


## 2. 北师大镜像

```bash
  conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/main
  conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/r
  conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/msys2
  
  conda config --remove channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/main
  conda config --remove channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/r
  conda config --remove channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/msys2
  
  conda config --set proxy_servers.https socks5://127.0.0.1:10808

```

## 3. Jupyter 安装与远程登录

- 远程登录参考文档：https://www.jianshu.com/p/8fc3cd032d3c

```shell

conda install jupyter notebook

vim /home/deipss/.jupyter/jupyter_notebook_config.py
c.NotebookApp.ip='*'
c.NotebookApp.password = u'argon2:$argon2id$v=19$m=10240,t=10,p=8$VH3vhkEL5tQMKg6FWYWTeQ$9U2v6D8llgrrEIeiwAqiew'
c.NotebookApp.open_browser = False
c.NotebookApp.port =7888 # 可自行指定一个端口，访问时使用该端口

jupyter notebook

```

## 4. conda 如何迁移所有环境

```text
#!/bin/bash

source /home/deipss/anaconda3/etc/profile.d/conda.sh
for env in $(conda env list | awk '{print $1}' | grep -v "#" | grep -v "^$" | grep -v "base"); do

    echo $env   
    conda activate $env

    conda env export --no-builds > ${env}.yml
done
~          
```

`conda activate` 本身不是一个独立的二进制 CLI 命令，所以直接执行时可能报错。要先通过 `source` 把 `conda.sh` 加载到当前 shell 环境中。

> 作用：在当前 Shell 环境中执行一个 shell 脚本的内容
```text

__conda_activate() {
    if [ -n "${CONDA_PS1_BACKUP:+x}" ]; then
        # Handle transition from shell activated with conda <= 4.3 to a subsequent activation
        # after conda updated to >= 4.4. See issue #6173.
        PS1="$CONDA_PS1_BACKUP"
        \unset CONDA_PS1_BACKUP
    fi
    \local ask_conda
    ask_conda="$(PS1="${PS1:-}" __conda_exe shell.posix "$@")" || \return
    \eval "$ask_conda"
    __conda_hashr
}

__conda_reactivate() {
    \local ask_conda
    ask_conda="$(PS1="${PS1:-}" __conda_exe shell.posix reactivate)" || \return
    \eval "$ask_conda"
    __conda_hashr
}

conda() {
    \local cmd="${1-__missing__}"
    case "$cmd" in
        activate|deactivate)
            __conda_activate "$@"
            ;;
        install|update|upgrade|remove|uninstall)
            __conda_exe "$@" || \return
            __conda_reactivate
            ;;
        *)
            __conda_exe "$@"
            ;;
    esac
}
```

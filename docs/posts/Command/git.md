---
title: git
date: 2025-05-25
---

# 0. 回退到某个节点，再强制push

```shell
 git reset [revision number]
 git push --force

```

# 1. 项目初始化

git初始化的一些配置

## 1.1. 方法一

    先将仓库clone到本地，修改后再push到码云的仓库仓库
    $ git clone https://gitee.com/用户个性地址/HelloGitee.git #将远程仓库克隆到本地
    在克隆过程中，如果仓库是一个私有仓库，将会要求用户输入码云的账号和密码。按照提示输入即可。
    当然，用户也可以通过配置本地的git配置信息，执行git config命令预先配置好相关的用户信息，配置执行如下：

    $ git config --global user.name "你的名字或昵称"
    $ git config --global user.email "你的邮箱"
    修改代码后，在仓库目录下执行下面命令

    $ git add . #将当前目录所有文件添加到git暂存区
    $ git commit -m "my first commit" #提交并备注提交信息
    $ git push origin master #将本地提交推送到远程仓库

## 1.2. 方法二

    git init
    git remote add origin https://gitee.com/用户个性地址/HelloGitee.git
    这样就完成了版本的一次初始化。
    接下去，进入已经初始化好的或者克隆仓库的目录,然后执行
    git pull origin master
    git add .
    git commit -m "第一次提交"
    git push origin master
    然后如果需要账号密码的话就输入账号密码，这样就完成了一次提交。此时，你可以在你的个人面板、仓库主页查看到你的提交记录。
    在新建仓库时，如果在码云平台仓库上已经存在 readme 或其他文件，在提交时可能会存在冲突，这时用户需要选择的是保留线上的文件或者舍弃线上的文件，如果您舍弃线上的文件，则在推送时选择强制推送，强制推送需要执行下面的命令(默认不推荐该行为)：
    git push origin master -f
    如果您选择保留线上的 readme 文件,则需要先执行：

# 2. 合并分支

```shell 
git merge 分支名/节点哈希值
git rebase 分支名/节点哈希值
git cherry-pick 节点哈希值
```

# 3. 分支管理

```shell 
git pull
git status
git push
git commit 
git add .
git fetch
拉取远程分支
git fetch -v 


# 撤消工作区
git checkout -- 文件名
# 清空缓存区
git reset HEAD 文件名
# 新建分支
git branch 分支名
# 切换分支
git checkout 分支名
# 同时切换并创建分支
git checkout -b 分支名
# 删除分支
git branch -d 分支名
git branch |xargs git branch -d
```

# 4. 回退

```shell
git checkout 节点哈希值
# 也可以直接脱离分支指向当前节点
git checkout --detach
# 回退N个提交
git reset HEAD~N

```

# 5. 远程仓库

```shell
git remote -v  #查看远端地址
git remote #查看远端仓库名
git remote set-url origin https://gitee.com/xx/xx.git [新地址]
```

# 6. 日志查询

```shell
git log
```

# ignore

## eg.1

```shell

target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.DS_Store
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache
**/.flattened-pom.xml

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr
*.log

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/
/logs

### VS Code ###
.vscode/
logs/
*.versionsBackup

```
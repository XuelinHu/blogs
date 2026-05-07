---
title: AndroidDev
date: 2025-05-25
---

# 1. 环境变量配置

mac上，可以编辑 .bash_profile文件

```shell
export JAVA_8_HOME=/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home
export JAVA_11_HOME=/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home
export JAVA_17_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home
export JAVA_HOME=$JAVA_8_HOME
export ANDROID_HOME=/Users/deipss/Library/Android/sdk
export PATH=$JAVA_HOME/bin:$PATH
export PATH=$PATH:/Library/gradle/gradle-8.2/bin
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0:$ANDROID_HOME/platform-tools
export CLASS_PATH=$JAVA_HOME/lib
export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles
export HOMEBREW_NO_AUTO_UPDATE=1
alias jdk8="export JAVA_HOME=$JAVA_8_HOME"
alias jdk11="export JAVA_HOME=$JAVA_11_HOME"
alias jdk17="export JAVA_HOME=$JAVA_17_HOME"
alias ll='ls -alrth'
```

# 2. 常用组件

- 1 SDK Tools 
软件开发工具包（Software Development Kit）

- 2 SDK Platform-Tools 
这是 adb, fastboot 等工具包。把解压出来的 platform-tools 文件夹放在 
android sdk 根目录下，并把 adb所在的目录添加到系统 PATH 路径里，
即可在命令行里直接访问了 adb, fastboot 等工具。

- 3 Build-Tools
这是Android开发所需的Build-Tools，下载并解压后，将解压出的整个文件夹复制或者移动到 your sdk 路径/build-tools 文件夹即可。


---
title: 记一次Ubuntu突然关机
date: 2025-07-09
---

# 1. 背景

一台Ubuntu主机在凌晨突然关机，`journalctl -b -1`最后一条日志如下：

```text
7月 09 04:54:01 deipss-ubuntu-2022 sshd[83328]: Invalid user appltest from 127.0.0.1 port 43472
7月 09 04:54:01 sshd: pam_unix(sshd:auth): check pass; user unknown
```

`journalctl | grep -iE "power|shutdown|crash|reboot"` and `dmesg -T | less` not provide some information with shutdown.

# 2. 分析过程

`journalctl -b -1` provide information as followed, it is import to find reason what crack my computer.
So that `journalctl -b -1 | grep "Failed password"` is ran,
We found that the malicious cracking attack started at 23:16 on July 7th.

```text
 ~ journalctl -b -1 | grep 'Failed p'     
7月 07 23:16:29 deipss-ubuntu-2022 sshd[1667]: Failed password for root from 127.0.0.1 port 46804 ssh2
7月 07 23:17:10 deipss-ubuntu-2022 sshd[4077]: Failed password for invalid user zhouman from 127.0.0.1 port 47676 ssh2
7月 07 23:17:44 deipss-ubuntu-2022 sshd[4131]: Failed password for invalid user ycy from 127.0.0.1 port 55154 ssh2
7月 07 23:17:59 deipss-ubuntu-2022 sshd[4139]: Failed password for invalid user tww from 127.0.0.1 port 49804 ssh2
7月 07 23:18:49 deipss-ubuntu-2022 sshd[4164]: Failed password for invalid user Ashley from 127.0.0.1 port 40476 ssh2
7月 07 23:18:51 deipss-ubuntu-2022 sshd[4166]: Failed password for root from 127.0.0.1 port 40492 ssh2
7月 07 23:19:38 deipss-ubuntu-2022 sshd[4172]: Failed password for invalid user xjiahui from 127.0.0.1 port 38506 ssh2
7月 07 23:19:49 deipss-ubuntu-2022 sshd[4174]: Failed password for invalid user ycy from 127.0.0.1 port 46274 ssh2
7月 07 23:20:27 deipss-ubuntu-2022 sshd[4177]: Failed password for invalid user zhujy from 127.0.0.1 port 49260 ssh2


7月 09 04:53:23 deipss-ubuntu-2022 sshd[83310]: Failed password for invalid user salem from 127.0.0.1 port 57516 ssh2
7月 09 04:53:25 deipss-ubuntu-2022 sshd[83314]: Failed password for invalid user abakshi from 127.0.0.1 port 57540 ssh2
7月 09 04:53:26 deipss-ubuntu-2022 sshd[83312]: Failed password for invalid user changfl from 127.0.0.1 port 57530 ssh2
7月 09 04:53:28 deipss-ubuntu-2022 sshd[83316]: Failed password for invalid user wuhaiqi from 127.0.0.1 port 57546 ssh2
7月 09 04:53:36 deipss-ubuntu-2022 sshd[83318]: Failed password for root from 127.0.0.1 port 48982 ssh2
7月 09 04:53:37 deipss-ubuntu-2022 sshd[83320]: Failed password for invalid user mio from 127.0.0.1 port 48996 ssh2
7月 09 04:53:50 deipss-ubuntu-2022 sshd[83322]: Failed password for root from 127.0.0.1 port 54474 ssh2
7月 09 04:53:51 deipss-ubuntu-2022 sshd[83324]: Failed password for root from 127.0.0.1 port 52668 ssh2
7月 09 04:54:00 deipss-ubuntu-2022 sshd[83326]: Failed password for root from 127.0.0.1 port 52674 ssh2
```

虽然不敢确认关机是否与这个病毒有关，但病毒的问题要比突然关机严重的多

# 3. 解决办法

## 3.1. fail2ban

Fail2Ban 可以禁止本地回环地址（127.0.0.1），但默认不会封禁 127.0.0.1，因为：

这是回环地址，通常视为“可信”来源；

它被列入了默认的 ignoreip 白名单中

## 3.2. 使用 UFW 禁止非必要的本地连接

如果你不需要从本地其他容器或用户 SSH 到 root，可以：

```text
sudo ufw enable
sudo ufw deny in from 127.0.0.1 to any port 22
```

⚠️ 注意别把自己锁死，可以在配置好 SSH key 和普通用户 sudo 后操作。

# 4. 参考资料
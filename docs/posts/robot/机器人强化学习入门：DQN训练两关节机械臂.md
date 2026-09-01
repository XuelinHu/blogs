---
title: 机器人强化学习入门：从 Q-learning 到 DQN 训练两关节机械臂
date: 2026-08-30
created: 2026-08-30
updated: 2026-09-01
---

# 机器人强化学习入门：从 Q-learning 到 DQN 训练两关节机械臂

强化学习经常被描述成“机器人自己试错”，但只说这句话很难真正开始。本篇从一个具体任务出发：两关节机械臂初始角度随机，智能体每次选择让肩关节或肘关节正转、反转，目标是让末端到达二维目标点。

文章先用 Q-learning 表格把一次更新的每个数字讲清楚，再把 Q 表换成 PyTorch 神经网络得到 DQN。代码不依赖 ROS 或 Gym，可以先在 CPU 运行；理解训练闭环后，再连接本目录的 [URDF 两关节机械臂](./URDF从零到两关节机械臂实战.md) 和 Gazebo。

::: danger 注意：禁止直接在真机随机探索
真实机械臂不适合从随机策略直接开始训练。随机动作可能造成碰撞、超限、过流和设备损坏。必须先在仿真中学习，再经过动作限幅、碰撞检查、安全控制器、低速单步和急停验证。本文代码默认只运行在数学环境或仿真中。
:::

## 1. 强化学习究竟学什么

监督学习的数据通常已经带有正确答案：给图像和类别，模型学习预测类别。强化学习没有人逐步告诉机器人“这一刻应该把关节向左转”，只有动作后的奖励。

```text
监督学习：输入 x → 模型 → 预测 → 与标准答案比较
强化学习：状态 s → 策略选动作 a → 环境变化 → 奖励 r 与新状态 s'
```

机器人不断重复第二条链路，目标不是让单步奖励最大，而是让未来累计奖励最大。

### 1.1 五个必须先分清的概念

| 概念 | 两关节机械臂案例 | 含义 |
| --- | --- | --- |
| Agent | Q-learning/DQN 算法 | 做决定的学习者 |
| Environment | 机械臂运动学和目标点 | 接收动作并返回结果 |
| State $s$ | 两个关节角或它们的特征 | 决策时能观察到的信息 |
| Action $a$ | 肩/肘正转、反转或不动 | Agent 能执行的选择 |
| Reward $r$ | 靠近目标为正，耗时为负，到达大奖励 | 环境对动作结果的评分 |

一次完整交互为：

```mermaid
flowchart LR
    S[状态 s] --> P[策略选择动作 a]
    P --> E[机械臂环境执行]
    E --> R[奖励 r]
    E --> N[新状态 s']
    R --> U[更新 Q 表或神经网络]
    N --> U
    U --> S
```

### 1.2 Episode、Step、终止和截断

- 一个 **Step** 是选择并执行一次动作。
- 一个 **Episode** 是从重置到结束的一整次尝试。
- 末端到达目标属于 `terminated=True`，任务自然完成。
- 达到最大步数属于 `truncated=True`，只是人为停止，目标并未完成。

初学代码常把二者都叫 `done`。概念上应区分，因为自然终止后没有未来回报，超时状态是否计算 bootstrap 要按任务和 API 约定处理。

## 2. 案例机械臂和正运动学

机械臂两段长度分别为 $L_1=0.6$ m、$L_2=0.4$ m，关节角为 $q_1,q_2$。末端位置：

$$
x=L_1\cos q_1+L_2\cos(q_1+q_2)
$$

$$
y=L_1\sin q_1+L_2\sin(q_1+q_2)
$$

目标设为 `(0.59, 0.64)`，它位于机械臂 1 m 最大工作半径内。距离为：

$$
d=\sqrt{(x-x_{target})^2+(y-y_{target})^2}
$$

为了先把算法讲清楚，把每个关节从 $[-\pi,\pi]$ 离散成 31 档。状态不是无限多的浮点角度，而是 `(q1_index, q2_index)`，总状态数为 `31 × 31 = 961`。

动作定义为：

| 编号 | 动作 | 状态变化 |
| ---: | --- | --- |
| 0 | 肩关节反转一步 | `q1_index -= 1` |
| 1 | 肩关节正转一步 | `q1_index += 1` |
| 2 | 肘关节反转一步 | `q2_index -= 1` |
| 3 | 肘关节正转一步 | `q2_index += 1` |
| 4 | 保持 | 两个角度不变 |

一次只动一个关节是为了减小动作空间。实际机器人可以组合动作或输出连续关节速度，后文会说明应该换什么算法。

### 2.1 这个教学环境有没有真实力矩

没有。本案例是**运动学环境**：动作 `1` 会把肩关节索引加一，相当于让角度瞬间增加 $12^\circ$。它只回答“角度变化后末端在哪里”，没有质量、惯量、速度、加速度、电机、摩擦、碰撞和力矩。

这不是遗漏，而是分层学习：先用最少变量看懂强化学习的数据闭环，再把策略接到动力学仿真。若第一步就加入完整物理模型，训练失败时很难判断问题来自奖励、算法、控制器还是机械参数。

真实机器人至少会观测：

```text
q      [2]  两个关节角，rad
q_dot  [2]  两个关节角速度，rad/s
tau    [2]  两个关节测量或估算力矩，N·m
```

关节力矩与运动满足近似刚体动力学：

$$
\tau=M(q)\ddot q+C(q,\dot q)\dot q+g(q)+\tau_{friction}+J(q)^TF_{external}
$$

其中 $M(q)$ 是随姿态变化的质量矩阵，$C$ 是科氏力/离心力项，$g(q)$ 是重力补偿，$J^TF$ 把末端外力映射为关节力矩。因此“两个变换矩阵相乘”不会自动算出电机力矩；本案例学到的也只是离散动作策略，不是可直接写入驱动器的力矩控制器。

接真机时更安全的结构是：

```text
RL 策略输出期望角度/速度
  → 限幅、碰撞与工作空间检查
  → ros2_control 位置/速度控制器
  → 底层伺服根据误差产生受限力矩
  → 编码器反馈 q、q_dot
```

如果要让策略直接输出力矩，仿真必须具有可信的质量、惯量、阻尼、摩擦、控制周期和接触参数，并对动作做 `effort limit` 限制。否则仿真中“有效”的策略可能在真机上过流、振荡或撞击结构。

::: danger 注意：角度变化不等于力矩命令
本环境的 `q1_index += 1` 是数学上的瞬时状态跳转，不表示电机能在一个控制周期安全转过 $12^\circ$。不要把离散动作直接转换成真机位置命令，更不能把 Q 值当成力矩。真实命令必须经过轨迹插值、速度/加速度/力矩限制和底层闭环控制。
:::

## 3. 从零编写机械臂环境

下面的环境只依赖 NumPy。它相当于一个最小版 Gymnasium 环境：

```python
import math  # 提供 pi、sin、cos 等基础数学函数
import numpy as np  # 用数组保存关节角、末端坐标和目标坐标


class TwoJointArmEnv:
    def __init__(self, n_bins=31, seed=7):
        self.n_bins = n_bins  # 每个关节离散成 31 档
        self.angles = np.linspace(-math.pi, math.pi, n_bins)  # shape=[31]，单位 rad
        self.lengths = np.array([0.6, 0.4], dtype=np.float64)  # shape=[2]，两段臂长，单位 m
        self.target = np.array([0.59, 0.64], dtype=np.float64)  # shape=[2]，目标 (x,y)，单位 m
        self.action_size = 5  # 4 个关节增减动作 + 1 个保持动作
        self.rng = np.random.default_rng(seed)  # 固定随机种子，便于复现实验
        self.state = (0, 0)  # 两个整数索引，不是弧度；格式为 (q1_index,q2_index)

    def forward_kinematics(self, state):
        # state 是长度为 2 的整数元组，例如 (10,10)。
        # list(state) 用作数组索引，输出 [q1,q2]，shape=[2]，dtype=float64。
        q1, q2 = self.angles[list(state)]
        x = self.lengths[0] * np.cos(q1)  # 大臂末端的 x 分量
        x += self.lengths[1] * np.cos(q1 + q2)  # 叠加小臂的 x 分量
        y = self.lengths[0] * np.sin(q1)  # 大臂末端的 y 分量
        y += self.lengths[1] * np.sin(q1 + q2)  # 叠加小臂的 y 分量
        return np.array([x, y], dtype=np.float64)  # shape=[2]，返回末端 [x,y]

    def distance(self, state):
        end_effector = self.forward_kinematics(state)  # shape=[2]
        error_vector = end_effector - self.target  # shape=[2]，分别表示 x/y 方向误差
        return float(np.linalg.norm(error_vector))  # L2 范数，输出 Python float

    def reset(self, start_state=None):
        if start_state is None:
            indices = self.rng.integers(0, self.n_bins, size=2)  # shape=[2] 的随机整数数组
            self.state = (int(indices[0]), int(indices[1]))  # 转成可用于 Q 表索引的元组
        else:
            self.state = tuple(start_state)  # 测试时允许指定固定起点
        return self.state  # 返回 (q1_index,q2_index)

    def step(self, action):
        old_distance = self.distance(self.state)  # 动作前距离，用来计算“靠近了多少”
        q1_index, q2_index = self.state  # 解包当前两个离散关节索引

        if action == 0:
            q1_index = max(0, q1_index - 1)  # 肩关节反转，同时防止索引小于 0
        elif action == 1:
            q1_index = min(self.n_bins - 1, q1_index + 1)  # 肩关节正转，同时限制上界
        elif action == 2:
            q2_index = max(0, q2_index - 1)  # 肘关节反转
        elif action == 3:
            q2_index = min(self.n_bins - 1, q2_index + 1)  # 肘关节正转
        elif action != 4:
            raise ValueError(f"非法动作: {action}")  # 4 表示保持，其他编号都非法

        self.state = (q1_index, q2_index)  # 动作后的新离散状态
        new_distance = self.distance(self.state)  # 动作后末端到目标的距离
        terminated = new_distance < 0.08  # 进入 8 cm 半径即认为成功

        # 到达目标给大奖励；否则奖励距离改善，并收取时间成本。
        if terminated:
            reward = 5.0  # 终点奖励让成功轨迹明显优于附近徘徊
        else:
            reward = 2.0 * (old_distance - new_distance) - 0.01  # 标量 float

        info = {
            "distance": new_distance,  # float，单位 m
            "end_effector": self.forward_kinematics(self.state),  # ndarray[2]
        }
        return self.state, reward, terminated, info  # 与 Gym 的 step 返回结构相似
```

### 3.1 环境代码的职责边界

环境只负责四件事：保存状态、执行动作、计算奖励、判断终止。环境不应该偷偷替 Agent 选择动作，也不应该在 `step()` 中训练神经网络。

先进行一次完全随机交互：

```python
env = TwoJointArmEnv(seed=7)
state = env.reset(start_state=(10, 10))
print("初始角度:", env.angles[list(state)])
print("初始末端:", env.forward_kinematics(state))
print("初始距离:", env.distance(state))

action = 1  # 肩关节正转一步
next_state, reward, terminated, info = env.step(action)
print("新状态:", next_state)
print("新末端:", info["end_effector"])
print("新距离:", info["distance"])
print("奖励:", reward, "是否到达:", terminated)
```

这一步不涉及学习，只是在确认环境因果关系：动作确实改变对应关节，正运动学得到新末端，奖励与距离变化方向一致。

### 3.2 一次 `step()` 的数据格式和数值变化

先明确每个变量到底是什么，避免把“索引、角度、坐标、矩阵”混在一起：

| 变量 | Python 类型 | shape | 示例 | 含义 |
| --- | --- | --- | --- | --- |
| `state` | `tuple[int, int]` | 逻辑上 `[2]` | `(10, 10)` | 两个关节在离散角度表中的索引 |
| `angles` | `ndarray(float64)` | `[31]` | `[-π, ..., 0, ..., π]` | 31 个候选弧度值 |
| `angles[list(state)]` | `ndarray(float64)` | `[2]` | `[-1.0472, -1.0472]` | 当前真实关节角 $[q_1,q_2]$ |
| `end_effector` | `ndarray(float64)` | `[2]` | `[0.1000, -0.8660]` | 末端平面坐标 $[x,y]$，单位 m |
| `action` | `int` | 标量 | `1` | 肩关节索引增加一档 |
| `reward` | `float` | 标量 | `0.1591` | 本次动作的即时评价 |
| `terminated` | `bool` | 标量 | `False` | 是否进入目标半径 |
| `info` | `dict` | — | 距离与末端数组 | 只用于记录和调试，不参与选动作 |

`n_bins=31` 时相邻角度间隔为：

$$
\Delta q=\frac{2\pi}{31-1}=0.20944\ \text{rad}=12^\circ
$$

从固定状态 `(10, 10)` 执行动作 `1`，数据会按下面的顺序变化：

```text
离散状态                    (10, 10)
查 angles 表              → [-1.0472, -1.0472] rad
正运动学                  → [0.1000, -0.8660] m
与目标 [0.59,0.64] 比较   → old_distance = 1.5837 m

执行 action=1             → q1_index 加 1
新离散状态                → (11, 10)
再次查 angles 表          → [-0.8378, -1.0472] rad
再次做正运动学            → [0.2779, -0.8263] m
与目标比较                → new_distance = 1.4992 m

reward = 2×(1.5837-1.4992)-0.01 = 0.1591
```

这里真正改变的不是一个神秘的“大矩阵”，而是肩关节索引从 `10` 变成 `11`。索引先映射成弧度，弧度再经过正运动学变成末端坐标，最后距离变化才变成奖励。训练算法只看到 `(state, action, reward, next_state)`，并不知道机械臂公式；因此环境必须保证这条因果链正确。

## 4. 奖励函数为什么是训练成败的核心

本案例未到达时使用：

$$
r_t=2(d_t-d_{t+1})-0.01
$$

- `d_t - d_{t+1} > 0`：末端靠近目标，得到正反馈。
- `d_t - d_{t+1} < 0`：末端远离目标，得到负反馈。
- 每步 `-0.01`：鼓励更短路径，防止原地不动。
- 到达目标直接奖励 `+5`：让成功轨迹显著优于只在附近徘徊。

### 4.1 只在成功时给 1 可以吗

可以，但随机策略很可能很久都碰不到小目标，绝大多数轨迹奖励为零，这叫稀疏奖励。距离改善是一种稠密奖励，让每一步都有方向信息。

### 4.2 奖励不是越复杂越好

如果同时加入距离、速度、能耗、碰撞、姿态、平滑度和十几个权重，很难判断模型在钻哪个漏洞。建议按顺序增加：

1. 先确认能够到达。
2. 再增加关节限位和碰撞惩罚。
3. 再优化动作平滑、时间和能耗。
4. 每增加一项，观察策略是否出现新的投机行为。

例如只奖励“末端离目标近”，模型可能高速冲过目标；只惩罚动作大小，模型可能选择完全不动。奖励表达的是工程目标，写错后算法会非常认真地优化错误目标。

## 5. Q-learning：先用一张表理解学习

Q 值 $Q(s,a)$ 表示：在状态 $s$ 选择动作 $a$，之后继续按当前最优策略行动，预计能得到多少折扣累计奖励。

本案例 Q 表形状为：

```text
[31 个肩关节档位, 31 个肘关节档位, 5 个动作]
= [31, 31, 5]
```

初始化为零：

```python
q_table = np.zeros((31, 31, 5), dtype=np.float32)  # shape=[q1档位,q2档位,动作]
```

Q-learning 更新公式：

$$
Q(s,a)\leftarrow Q(s,a)+\alpha
\left[r+\gamma\max_{a'}Q(s',a')-Q(s,a)\right]
$$

| 符号 | 含义 | 本案例初值 |
| --- | --- | ---: |
| $\alpha$ | 学习率，新经验改动旧值的幅度 | 0.2 |
| $\gamma$ | 折扣因子，对未来奖励的重视程度 | 0.97 |
| $r$ | 当前一步立即奖励 | 环境返回 |
| $\max Q(s',a')$ | 新状态可获得的最佳未来价值 | 查 Q 表 |

### 5.1 一次更新的具体数字

假设当前：

```text
state = (10, 10)
action = 1
reward = 0.12
Q(state, action) = 0.05
max Q(next_state, ·) = 0.20
alpha = 0.2
gamma = 0.97
```

目标值和 TD Error 为：

$$
y=0.12+0.97\times0.20=0.314
$$

$$
\delta=y-Q(s,a)=0.314-0.05=0.264
$$

更新后：

$$
Q_{new}=0.05+0.2\times0.264=0.1028
$$

代码只有一行：

```python
old_q = 0.05  # 更新前的 Q(s,a)
reward = 0.12  # 环境返回的即时奖励 r
best_next_q = 0.20  # 下一状态 5 个动作价值中的最大值
td_target = reward + 0.97 * best_next_q  # 监督目标 y=0.314
td_error = td_target - old_q  # 预测与目标的差值 δ=0.264
new_q = old_q + 0.2 * td_error  # 向目标移动 20%，避免一次经验覆盖旧知识
print(new_q)  # 0.1028
```

它没有神经网络和 `backward()`，参数就是 Q 表单元格，更新方向直接由 TD Error 决定。

## 6. 探索与利用：为什么不能永远选最大 Q

训练刚开始时 Q 表全为零，Agent 不知道哪个动作好。使用 $\epsilon$-greedy：

```text
概率 epsilon：随机动作，探索没试过的选择
概率 1-epsilon：选择 argmax Q(s, ·)，利用当前经验
```

初期 `epsilon=1.0` 代表几乎全部随机探索，之后逐渐降到 0.05。测试时通常设为 0，只使用学到的策略。

如果训练时一开始就 `argmax`，NumPy 会在并列时总选第一个动作，机器人可能长期只尝试同一方向。若永远保持很大 epsilon，策略即使学会也会频繁随机犯错。

## 7. 可直接运行的完整 Q-learning 案例

把下面代码接在第 3 节的 `TwoJointArmEnv` 后运行：

```python
import numpy as np  # 用于 Q 表、随机采样和训练统计

env = TwoJointArmEnv(n_bins=31, seed=7)  # 创建机械臂环境
rng = np.random.default_rng(7)  # 独立的动作探索随机数生成器
q_table = np.zeros(
    (env.n_bins, env.n_bins, env.action_size),
    dtype=np.float32,
)  # shape=[31,31,5]，共 4805 个可学习标量

learning_rate = 0.2  # 每次把旧 Q 值向 TD 目标移动 20%
gamma = 0.97  # 保留下一状态未来价值的 97%
epsilon = 1.0  # 初始完全探索，避免被全零 Q 表固定在动作 0
epsilon_min = 0.05  # 后期仍保留少量探索
epsilon_decay = 0.997  # 每个 Episode 后衰减一次
episode_count = 3000  # 完整尝试次数
max_steps = 80  # 单次尝试的最大控制步数
episode_returns = []  # 保存每回合累计奖励
episode_success = []  # 保存每回合是否到达目标

for episode in range(episode_count):  # 外层：不断从随机起点重新练习
    state = env.reset()  # 格式为 (q1_index,q2_index)
    total_reward = 0.0  # 清空本回合累计奖励
    success = False  # 默认本回合失败

    for step in range(max_steps):  # 内层：一次回合最多执行 80 个动作
        if rng.random() < epsilon:  # epsilon 概率探索未知动作
            action = int(rng.integers(env.action_size))  # 从 0～4 均匀随机
        else:
            action = int(np.argmax(q_table[state]))  # q_table[state] 的 shape=[5]

        next_state, reward, terminated, info = env.step(action)  # 与环境交互一步

        # state+(action,) 得到 (q1,q2,action)，只定位 Q 表中的一个标量。
        old_q = q_table[state + (action,)]
        if terminated:
            td_target = reward  # 终点后没有未来动作，不再 bootstrap
        else:
            best_next_q = np.max(q_table[next_state])  # next_state 对应长度 5 的 Q 向量
            td_target = reward + gamma * best_next_q  # 即时奖励 + 折扣未来价值
        td_error = td_target - old_q  # 正值增大当前 Q，负值减小当前 Q
        q_table[state + (action,)] = old_q + learning_rate * td_error  # 更新一个单元

        state = next_state  # 下一轮决策从新状态继续
        total_reward += reward  # 累计本回合奖励
        if terminated:  # 末端进入成功区域就结束本回合
            success = True
            break

    epsilon = max(epsilon_min, epsilon * epsilon_decay)  # 逐渐从探索转向利用
    episode_returns.append(total_reward)  # 用于绘制回报曲线
    episode_success.append(success)  # 用于计算滚动成功率

    if (episode + 1) % 500 == 0:
        mean_return = np.mean(episode_returns[-100:])
        success_rate = np.mean(episode_success[-100:])
        print(
            f"episode={episode + 1:04d}, "
            f"mean_return={mean_return:.3f}, "
            f"success_rate={success_rate:.2%}, "
            f"epsilon={epsilon:.3f}"
        )

np.save("two_joint_q_table.npy", q_table)  # 保存 shape=[31,31,5] 的训练结果
```

在本文固定随机种子下，后期 100 个 Episode 的成功率会逐渐接近 100%。具体数值可能因 NumPy 版本变化，但应看到平均回报、成功率整体上升。

### 7.1 训练循环逐段解读

```text
reset
  → 随机得到一次任务的初始关节角
epsilon-greedy
  → 决定随机探索还是查表利用
env.step
  → 机械臂执行动作，返回 s'、reward、terminated
TD target
  → 当前奖励 + 新状态的折扣未来价值
Q update
  → 只修改当前 state/action 对应的一个表格单元
```

到达目标时，`td_target=reward`，因为这个 Episode 已自然结束，不再加新状态的未来 Q 值。

## 8. 测试训练后的机械臂路径

评估时关闭随机探索，从固定初始状态开始：

```python
def run_greedy_episode(env, q_table, start_state=(10, 10), max_steps=80):
    state = env.reset(start_state=start_state)
    state_path = [state]

    for step in range(max_steps):
        action = int(np.argmax(q_table[state]))
        state, reward, terminated, info = env.step(action)
        state_path.append(state)
        if terminated:
            return True, state_path, info

    return False, state_path, info


success, state_path, final_info = run_greedy_episode(env, q_table)
print("是否到达:", success)
print("使用步数:", len(state_path) - 1)
print("最终距离:", final_info["distance"])
print("关节状态路径:", state_path)
```

在固定种子的一次运行中，从 `(10,10)` 通常约 11 步即可进入目标范围，最终距离约 0.02 m。测试不能只用训练时最常见的起点，应从工作空间不同区域采样并统计成功率、平均步数、最大距离和越界次数。

### 8.1 把运动轨迹画出来

```python
import matplotlib.pyplot as plt


def joint_points(env, state):
    q1, q2 = env.angles[list(state)]
    elbow = np.array([
        env.lengths[0] * np.cos(q1),
        env.lengths[0] * np.sin(q1),
    ])
    end = env.forward_kinematics(state)
    return np.vstack([np.zeros(2), elbow, end])


plt.figure(figsize=(6, 6))
sample_interval = max(1, len(state_path) // 8)
for index, state in enumerate(state_path[::sample_interval]):
    points = joint_points(env, state)
    plt.plot(points[:, 0], points[:, 1], "o-", alpha=0.25 + 0.7 * index / 8)

plt.scatter(*env.target, marker="*", s=220, c="red", label="target")
plt.gca().set_aspect("equal")
plt.xlim(-1.1, 1.1)
plt.ylim(-1.1, 1.1)
plt.grid(True)
plt.legend()
plt.title("Q-learning two-joint arm trajectory")
plt.show()
```

如果损失或回报看起来正常但轨迹抖动，可以直接观察动作序列是否在两个相反动作间切换。平均回报不能代替实际行为检查。

## 9. 为什么还需要 DQN

Q 表适合 961 个离散状态。但真实机器人状态可能包含 6 个关节角、速度、末端姿态、相机特征和障碍物位置，表格会指数爆炸。

DQN 用神经网络近似：

$$
Q(s,a;\theta)\approx Q^*(s,a)
$$

输入一个状态向量，网络一次输出 5 个动作的 Q 值：

```text
state vector [6]
  → Linear(6,64) + ReLU
  → Linear(64,64) + ReLU
  → Linear(64,5)
  → [Q(s,a0), ..., Q(s,a4)]
```

连续角度不应直接使用角度值，因为 $-\pi$ 和 $+\pi$ 数值相距很远，物理方向却相同。本案例输入：

$$
[\sin q_1,\cos q_1,\sin q_2,\cos q_2,\Delta x,\Delta y]
$$

对前面的 `(10,10)` 状态，实际输入网络的是：

```text
离散索引 (10,10)
  → 关节角 [-1.0472,-1.0472]
  → sin/cos 编码 [-0.8660,0.5000,-0.8660,0.5000]
  → 目标减末端 [0.4900,1.5060]
  → state_vector = [-0.8660,0.5000,-0.8660,0.5000,0.4900,1.5060]
```

单个状态的 shape 是 `[6]`，送入网络前增加 batch 维后是 `[1,6]`。训练时一次抽 64 条经验，状态矩阵就是 `[64,6]`。`sin/cos` 编码让 $-\pi$ 与 $+\pi$ 都接近 `[0,-1]`，避免同一物理方向在数值上被网络误认为相隔很远。

## 10. DQN 的损失怎样计算

对经验 $(s,a,r,s',done)$，目标网络计算：

$$
y=r+(1-done)\gamma\max_{a'}Q_{target}(s',a')
$$

在线网络只取实际执行动作的预测：

$$
q=Q_{online}(s,a)
$$

损失通常使用 Huber Loss：

$$
L=\operatorname{SmoothL1}(q,y)
$$

`loss.backward()` 将误差传回在线网络参数。目标 $y$ 放在 `torch.no_grad()` 中，不通过目标网络反向传播。

### 10.1 一个 Batch 中矩阵怎样变化

假设经验回放抽出 64 条数据，进入 `optimize_dqn()` 后的格式如下：

| 张量 | shape | dtype | 每一行表示什么 |
| --- | --- | --- | --- |
| `states` | `[64,6]` | `float32` | 动作前状态向量 |
| `actions` | `[64,1]` | `int64` | 实际执行的动作编号 |
| `rewards` | `[64]` | `float32` | 即时奖励 |
| `next_states` | `[64,6]` | `float32` | 动作后状态向量 |
| `dones` | `[64]` | `float32` | 成功终止为 1，否则为 0 |

在线网络的矩阵链路是：

```text
states X                         [64, 6]
X @ W1.T + b1，W1=[64,6]       → [64,64]
ReLU                            → [64,64]
H1 @ W2.T + b2，W2=[64,64]     → [64,64]
ReLU                            → [64,64]
H2 @ W3.T + b3，W3=[5,64]      → all_q_values [64,5]
gather(actions [64,1])          → predicted_q [64]
```

为什么网络输出 `[64,5]` 后还要 `gather`？因为一条经验只真正执行了一个动作。例如第一行输出：

```text
Q(s,·) = [-0.08, 0.11, 0.03, -0.02, 0.07]
action = 1
gather 后 predicted_q = 0.11
```

没有执行的另外四个动作在这条经验里没有直接监督信号，不能把同一个目标同时强加给它们。

目标网络处理 `next_states` 后也得到 `[64,5]`，但会沿动作维取最大值：

```text
target_net(next_states)         [64,5]
max(dim=1)                    → best_next_q [64]
rewards + γ(1-dones)×best     → target_q [64]
SmoothL1(predicted,target)     → loss []，一个标量
```

举一条未终止经验：`reward=0.1591`、`best_next_q=0.23`、`gamma=0.97`，则：

$$
y=0.1591+0.97\times0.23=0.3822
$$

若在线网络对已执行动作预测 `0.11`，误差为 `-0.2722`。因为绝对误差小于 1，Huber Loss 在这一项等价于 $0.5\times0.2722^2\approx0.0370$。反向传播会推动该动作的预测升高，但更新幅度还会与 Batch 中另外 63 条经验求平均。

### 10.2 为什么训练必须这样设计

- 随机抽 Batch：连续控制数据高度相似，按时间顺序训练会让梯度一直朝相近方向偏移；随机回放让样本更接近独立分布。
- 使用目标网络：如果同一个网络既产生预测又立即产生目标，相当于一边追目标一边移动目标，容易震荡甚至发散。
- 终止时乘 `(1-done)`：任务已经结束时不存在“下一状态的未来奖励”，继续加最大 Q 会凭空制造价值。
- 使用 Huber Loss：小误差时像均方误差一样平滑，大误差时近似绝对误差，异常 TD Error 不会产生过大的梯度。
- 梯度裁剪：机器人奖励偶尔突变，裁剪能限制一次更新对所有层的破坏，但它不能替代正确的奖励和数据归一化。

DQN 还需要两个稳定训练的关键设计：

- **Experience Replay**：把过去交互放进缓冲区，随机抽样，打破相邻时间步的强相关。
- **Target Network**：使用一份延迟更新的网络计算目标，避免预测值和目标值同时剧烈变化。

## 11. PyTorch DQN 完整源码

下面代码接在 `TwoJointArmEnv` 后运行。它先打印随机网络的 Q 值，然后训练并展示第一次反向传播造成的权重变化：

```python
import random  # Python 随机数用于 epsilon 探索和经验抽样
from collections import deque, namedtuple  # deque 实现定长经验回放

import numpy as np  # 环境状态仍使用 NumPy
import torch  # 张量、自动求导和模型保存
from torch import nn  # 神经网络层
import torch.nn.functional as F  # Huber Loss

random.seed(13)  # 固定 Python 随机序列
np.random.seed(13)  # 固定 NumPy 随机序列
torch.manual_seed(13)  # 固定网络初始化与 PyTorch 随机序列
torch.set_num_threads(1)  # 小模型限制线程数，减少调度开销


def state_to_vector(env, state):
    q1, q2 = env.angles[list(state)]  # 离散索引 → 两个弧度值
    delta = env.target - env.forward_kinematics(state)  # shape=[2] 的目标方向误差
    return np.array([
        np.sin(q1), np.cos(q1),
        np.sin(q2), np.cos(q2),
        delta[0], delta[1],
    ], dtype=np.float32)  # shape=[6]，神经网络统一使用 float32


class DQN(nn.Module):
    def __init__(self, state_size=6, action_size=5):
        super().__init__()  # 初始化 nn.Module 内部状态
        self.net = nn.Sequential(
            nn.Linear(state_size, 64),  # [B,6] → [B,64]，weight shape=[64,6]
            nn.ReLU(),  # 将负激活截为 0，引入非线性
            nn.Linear(64, 64),  # [B,64] → [B,64]
            nn.ReLU(),  # 第二次非线性变换
            nn.Linear(64, action_size),  # [B,64] → [B,5]，每列对应一个动作
        )

    def forward(self, state):
        return self.net(state)  # 输入必须是 float32，最后一维固定为 6


Transition = namedtuple(
    "Transition", ["state", "action", "reward", "next_state", "done"]
)  # 单条经验的数据契约
replay_buffer = deque(maxlen=10000)  # 超过 1 万条后自动丢弃最旧经验
env = TwoJointArmEnv(seed=13)  # 创建训练环境
online_net = DQN()  # 真正参与反向传播的在线网络
target_net = DQN()  # 只负责产生相对稳定的 TD 目标
target_net.load_state_dict(online_net.state_dict())  # 开始时两套参数完全一致
target_net.eval()  # 进入评估模式；本网络虽然没有 Dropout，也应明确职责
optimizer = torch.optim.Adam(online_net.parameters(), lr=1e-3)  # 只绑定在线网络参数


def optimize_dqn(trace_update=False):
    batch = random.sample(replay_buffer, 64)  # 无放回随机抽 64 条，打破时间相关性
    states = torch.tensor(
        np.array([item.state for item in batch]), dtype=torch.float32
    )  # 64 个 [6] 堆成 [64,6]
    actions = torch.tensor(
        [item.action for item in batch], dtype=torch.int64
    ).unsqueeze(1)  # [64] → [64,1]，gather 的索引必须是 int64
    rewards = torch.tensor(
        [item.reward for item in batch], dtype=torch.float32
    )  # shape=[64]
    next_states = torch.tensor(
        np.array([item.next_state for item in batch]), dtype=torch.float32
    )  # shape=[64,6]
    dones = torch.tensor(
        [item.done for item in batch], dtype=torch.float32
    )  # bool 转成 0.0/1.0，shape=[64]

    all_q_values = online_net(states)  # [64,6] → [64,5]
    predicted_q = all_q_values.gather(1, actions).squeeze(1)  # [64,1] → [64]

    with torch.no_grad():
        next_all_q = target_net(next_states)  # [64,6] → [64,5]
        best_next_q = next_all_q.max(dim=1).values  # 每行取最大动作价值，shape=[64]
        target_q = rewards + 0.97 * (1.0 - dones) * best_next_q  # shape=[64]

    loss = F.smooth_l1_loss(predicted_q, target_q)  # 对 64 项求平均，得到标量
    first_layer = online_net.net[0].weight  # shape=[64,6]
    weight_before = first_layer.detach().clone()  # 复制更新前权重用于教学对比

    optimizer.zero_grad()  # 清除上一 Batch 累积在 parameter.grad 中的梯度
    loss.backward()  # 只计算梯度，此时权重数值还没有变化
    nn.utils.clip_grad_norm_(online_net.parameters(), max_norm=5.0)  # 限制总梯度范数

    if trace_update:
        print("sample predicted Q:", predicted_q[:5].detach())
        print("sample target Q:", target_q[:5])
        print("Huber loss:", loss.item())
        print("第一层 gradient 左上角:\n", first_layer.grad[:3, :3])
        print("backward 后 weight 未变:",
              torch.equal(weight_before, first_layer.detach()))

    optimizer.step()  # Adam 读取各参数的 grad，并真正修改在线网络权重

    if trace_update:
        print("step 后 weight 变化左上角:\n",
              (first_layer.detach() - weight_before)[:3, :3])
    return loss.item()


# 训练前的网络是随机函数，同一状态的 5 个 Q 值没有任务含义。
initial_state = env.reset(start_state=(10, 10))  # 离散状态元组
initial_vector = state_to_vector(env, initial_state)  # ndarray shape=[6]
with torch.no_grad():
    initial_input = torch.tensor(initial_vector).unsqueeze(0)  # [6] → [1,6]
    initial_q = online_net(initial_input)  # [1,6] → [1,5]
print("状态向量:", initial_vector)
print("随机网络初始 Q:", initial_q[0])
print("随机第一层权重左上角:\n", online_net.net[0].weight[:3, :3])

epsilon = 1.0  # 初期以探索为主
epsilon_min = 0.05  # 后期保留 5% 随机动作
total_steps = 0  # 用环境步数控制目标网络同步频率
first_update = True  # 第一次优化时打印梯度与权重变化
recent_success = deque(maxlen=100)  # 滚动统计最近 100 回合成功率

for episode in range(800):  # 训练 800 个完整回合
    discrete_state = env.reset()  # 供环境 step 使用的离散索引
    state = state_to_vector(env, discrete_state)  # 供 DQN 使用的 float32[6]
    success = False  # 记录本回合是否到达
    last_loss = float("nan")  # 缓冲区不足时还没有 loss

    for step in range(80):  # 单回合最多交互 80 次
        if random.random() < epsilon:  # 探索分支
            action = random.randrange(env.action_size)  # 随机选择 0～4
        else:
            with torch.no_grad():
                state_tensor = torch.tensor(state).unsqueeze(0)  # [6] → [1,6]
                q_values = online_net(state_tensor)  # [1,5]
                action = int(q_values.argmax(dim=1).item())  # 取 Q 最大的动作编号

        next_discrete_state, reward, terminated, info = env.step(action)  # 执行动作
        next_state = state_to_vector(env, next_discrete_state)  # 下一状态转为 [6]
        replay_buffer.append(Transition(
            state, action, reward, next_state, terminated
        ))  # 保存时两个状态都是 ndarray[6]，动作/奖励/终止都是标量
        state = next_state  # 继续沿当前轨迹前进
        total_steps += 1  # 全局环境步数加一

        if len(replay_buffer) >= 256:  # 先积累经验，再开始随机 Batch 训练
            last_loss = optimize_dqn(trace_update=first_update)
            first_update = False  # 只有第一次更新打印详细矩阵

        # 目标网络周期性复制在线网络，而不是每一步一起更新。
        if total_steps % 200 == 0:
            target_net.load_state_dict(online_net.state_dict())  # 延迟同步全部参数

        if terminated:  # 到达后结束当前回合
            success = True
            break

    epsilon = max(epsilon_min, epsilon * 0.995)  # 每回合减少探索率
    recent_success.append(success)  # 更新滚动成功率

    if (episode + 1) % 100 == 0:
        print(
            f"episode={episode + 1:03d}, "
            f"success_rate={np.mean(recent_success):.2%}, "
            f"epsilon={epsilon:.3f}, loss={last_loss:.4f}"
        )

torch.save(online_net.state_dict(), "two_joint_dqn.pt")  # 只保存在线网络参数字典
```

### 11.1 源码中第一次更新发生了什么

```text
64 条 Transition
  → online_net(states) 得到 [64,5]
  → gather 只取每条经验真正执行动作的 Q
  → target_net(next_states) 取下一状态最大 Q
  → reward + gamma×next_Q 得到监督目标
  → SmoothL1 得到标量 loss
  → backward 写入在线网络 parameter.grad
  → gradient clipping 限制总梯度范数
  → Adam step 修改在线网络参数
  → 每 200 环境步复制给 target_net
```

和监督学习相似，DQN 最终也构造了“预测值和目标值”的损失。区别是目标值不是人工标签，而是奖励加上网络对未来价值的估计，所以目标会随训练变化。

### 11.2 为什么 Loss 下降不等于策略一定变好

DQN 的训练数据分布由当前策略产生，Target 也在变化。Loss 很小可能只是拟合了缓冲区里的狭窄经验，必须同时监控：

- 最近 100 个 Episode 成功率。
- 平均回报和到达目标的平均步数。
- 从固定测试起点出发的成功率。
- 关节限位、动作抖动和碰撞次数。
- 不带随机探索时的评估结果。

## 12. Q 表和 DQN 的参数变化有何不同

| 项目 | Q-learning 表格 | DQN |
| --- | --- | --- |
| 参数 | `q_table[s,a]` | 多层神经网络权重 |
| 一条经验影响范围 | 一个表格单元 | 通过共享权重影响多个相似状态 |
| 更新方式 | 显式 TD 公式 | Loss + backward + optimizer |
| 连续/高维状态 | 不适合 | 可以近似，但仍需合理特征 |
| 稳定技巧 | 学习率、探索 | Replay、Target Network、裁剪等 |

DQN 并没有摆脱 Q-learning，它只是用网络替换无法存下的大 Q 表。

## 13. 常见训练失败及排查顺序

### 13.1 成功率一直为零

1. 手动调用 `env.step()`，确认动作、坐标和距离正确。
2. 放大成功半径，例如先从 0.08 改为 0.15。
3. 打印随机策略能否偶尔到达，确认任务可探索。
4. 检查奖励是否真的在靠近时增大。
5. 先固定目标和较小初始范围，形成课程学习，再逐渐增加难度。

### 13.2 回报上涨但机械臂原地抖动

奖励可能允许在两个状态之间反复获取“靠近奖励”。本案例用距离差而不是 `-distance` 累加，并加入每步成本，可减少这种漏洞。真实控制还可惩罚：

$$
r_{smooth}=-\lambda\lVert a_t-a_{t-1}\rVert^2
$$

### 13.3 DQN Loss 爆炸或出现 NaN

- 降低学习率。
- 对状态和奖励缩放。
- 使用 Huber Loss 和梯度裁剪。
- 降低 Target Network 更新频率。
- 检查终止状态是否仍错误加入未来 Q。
- 打印观测中是否有 NaN/Inf。

### 13.4 训练很好，换起点就失败

这通常是初始状态覆盖不足或过拟合。将训练和测试初始状态集合分开，扩大 reset 分布，并报告工作空间网格上的成功率热力图。

## 14. 超参数先改哪些

| 参数 | 太小 | 太大 | 建议起点 |
| --- | --- | --- | ---: |
| Q-learning `alpha` | 学习慢 | Q 值震荡 | 0.1～0.2 |
| `gamma` | 只顾眼前 | 目标估计更不稳定 | 0.95～0.99 |
| DQN learning rate | 收敛慢 | Loss 爆炸 | `1e-3` 或 `3e-4` |
| batch size | 梯度噪声大 | 更新慢、占内存 | 64～256 |
| replay size | 经验单一 | 占内存、旧数据过多 | 1 万起步 |
| target interval | 追随太快 | 目标过旧 | 200～2000 steps |
| epsilon decay | 过早停止探索 | 长期随机 | 看成功率调整 |

一次只改一个主要因素，至少运行多个随机种子。强化学习方差大，单次最好结果不能代表算法稳定。

## 15. 为什么真实机器人常用 PPO、SAC 而不是 DQN

DQN 原生适合离散动作。本案例把每次关节变化离散为 5 个选项，便于教学。若希望直接输出连续关节速度：

```text
action = [shoulder_velocity, elbow_velocity]
```

更常见的选择是：

| 算法 | 动作 | 特点 | 机器人中的典型使用 |
| --- | --- | --- | --- |
| Q-learning | 小型离散 | 最容易理解 | 教学、网格世界 |
| DQN | 离散 | 用网络近似 Q | 少量离散控制动作 |
| PPO | 离散/连续 | 稳定、并行采样常见 | 仿真机器人、行走和操作 |
| SAC | 连续 | Off-policy、探索能力强 | 连续关节/末端控制 |
| TD3 | 连续 | 减少价值高估 | 连续控制基线 |

算法名称不是第一决策。应先确定状态能否观测、动作接口、奖励、控制频率和安全约束。

## 16. 如何接入上一篇 URDF/Gazebo 机械臂

上一篇文章已经提供 `shoulder_joint`、`elbow_joint`、`tool0` 和 `arm_controller`。把本地数学环境换成 Gazebo 时，映射关系如下：

| 教学环境 | ROS2/Gazebo |
| --- | --- |
| `state=(q1_index,q2_index)` | `/joint_states` 中的位置/速度 |
| `forward_kinematics` | TF：`world → tool0` |
| `step(action)` | 向轨迹控制器发送小角度/速度命令 |
| `target` | 世界坐标系下的目标 Pose |
| `distance` | `tool0` 与目标的 TF 距离 |
| `terminated` | 距离和姿态误差小于阈值 |

建议固定控制周期，例如每 100 ms：

```text
读取 JointState/TF
  → 组成 observation
  → policy 推理得到 action
  → 安全层裁剪动作和关节目标
  → 发送 controller command
  → Gazebo 运行固定时间
  → 读取新状态并计算 reward
```

### 16.1 不要让 RL 直接绕过安全控制器

策略输出先经过：

1. 动作范围裁剪。
2. 关节位置、速度和加速度限位。
3. 碰撞预测或安全区域检查。
4. 超时和通信丢失处理。
5. 底层 `ros2_control` 控制器。

RL 决定“想往哪里动”，确定性安全层决定“这个命令是否允许执行”。

::: danger 注意：软件限位不能替代硬件安全
神经网络、Python 节点和普通 ROS2 Topic 都不是安全认证回路。真机仍需硬限位、驱动器电流/力矩保护、独立急停、通信看门狗和可达的人工断电装置；安全检查失败时必须默认停止，而不是继续使用上一条命令。
:::

## 17. 从仿真到真实机器人的差距

仿真策略直接上真机常失败，原因包括质量、摩擦、间隙、传感器噪声、控制延迟和碰撞模型不一致，这叫 Sim-to-Real Gap。

常见缓解方法：

- **Domain Randomization**：训练时随机质量、摩擦、阻尼、目标、延迟和噪声。
- **System Identification**：用真实数据估计模型参数。
- **Observation Noise**：让策略习惯编码器和视觉噪声。
- **Action Delay**：仿真中加入通信和执行延迟。
- **Residual Learning**：传统控制器负责主行为，RL 只学习小修正。
- **Offline/Imitation Warm Start**：先用示教或安全控制数据初始化。

真机部署顺序应为：仿真大量评估 → 回放策略轨迹 → 断电/无负载检查 → 低速单步 → 小工作空间 → 安全员和急停就位 → 扩大范围。

::: danger 注意：仿真成功不能证明真机安全
质量、摩擦、减速器间隙、控制延迟、传感器噪声或碰撞几何中任意一项不一致，都可能使策略在真机上振荡或撞击。没有独立验证集、异常停止测试和安全评审时，不得因为“成功率 100%”就直接部署。
:::

## 18. 一个合格实验要记录什么

至少保存：

```text
环境版本、URDF/Xacro 和控制器配置
随机种子、算法和全部超参数
每个 Episode 的 return、长度、success、终止原因
碰撞、越界、NaN 和控制超时次数
训练、验证的初始状态和目标分布
模型 checkpoint 与归一化统计量
不探索策略的视频或轨迹
```

只保存最终模型而没有环境版本，之后几乎无法解释为何同一权重表现改变。

## 19. 初学者实践顺序

```text
1. 手算两关节正运动学
2. 随机动作验证环境
3. 打印距离和奖励
4. Q 表训练固定目标
5. 从多个固定起点做无探索评估
6. 画机械臂轨迹和成功率曲线
7. 换 DQN 并观察第一次 backward
8. 随机化目标和初始状态
9. 接 Gazebo，不接真机
10. 加碰撞、限位、延迟和噪声
11. 再学习 PPO/SAC 连续控制
12. 完成安全评审后考虑真机低速测试
```

## 20. 经典资料与论文脉络

- Sutton 与 Barto，《Reinforcement Learning: An Introduction》：强化学习基础教材。
- Watkins，1989，Q-learning：Off-policy 时序差分控制的经典来源。
- Mnih 等，2015，Human-level control through deep reinforcement learning：DQN、经验回放与目标网络的代表性工作。
- Schulman 等，2017，Proximal Policy Optimization Algorithms：PPO。
- Haarnoja 等，2018，Soft Actor-Critic：最大熵连续控制。

阅读论文时先把符号映射回本文案例：$s$ 是关节和目标，$a$ 是关节动作，$r$ 是距离改善，$Q$ 是动作的长期价值。能在一个小案例中看到每个变量的真实数值，再阅读复杂机器人论文会容易很多。

## 21. 最终自检

读完后应该能够回答：

- State、Action、Reward、Episode 在机械臂中分别是什么？
- 为什么到达终止状态后 TD Target 不再加下一状态 Q 值？
- `epsilon` 太快降为零会怎样？
- Replay Buffer 和 Target Network 分别解决什么问题？
- DQN 的 `backward()` 更新哪一个网络？
- 为什么训练 Loss 低不能证明机器人策略安全有效？
- 为什么连续关节速度通常更适合 PPO/SAC？
- 从 Gazebo 上真机前必须增加哪些安全层？

强化学习的第一步不是堆算法，而是建立一个因果正确、奖励可解释、行为可观察的环境。本案例足够小，所以每一次状态变化和 Q 值更新都能打印出来；这正是开始机器人强化学习最稳妥的方式。

[[toc]]

---
title: ROS2 具身智能机器人自学路线与代码
date: 2026-08-27
created: 2026-08-27
updated: 2026-09-01
---

# ROS2 具身智能机器人自学路线与代码

这篇文章把一套从 `00_ROS课程导学` 到 `68_ROS语音与AI_MCP实现驱动机械臂` 的课程目录，整理成一条可以自己动手的 ROS2 学习路线。目标不是背命令，而是逐步完成一条具身智能闭环：

```text
传感器采集 → ROS2 通讯 → 视觉/语音理解 → 坐标与运动学计算 → 控制执行 → 记录、评估和迭代
```

文中的代码以 Ubuntu 22.04 + ROS2 Humble + Python 3 为例。

::: danger 注意：示例默认不连接真机动力
示例应运行在仿真或断电测试台上。连接真实机械臂前，必须确认独立急停、软硬关节限位、速度/加速度/力矩限制、通信看门狗和机械隔离空间。普通 ROS2 节点退出不等于电机已安全断力。
:::

## 1. 课程目录怎样串起来

| 阶段 | 对应课程 | 学完后的能力 |
| --- | --- | --- |
| 认识 ROS | 00-01 | 知道 ROS 的历史、生态和节点化思想 |
| 环境搭建 | 02-08 | 能安装 Ubuntu、ROS2 和常用开发工具 |
| ROS2 入门 | 09-15 | 能创建工作空间、Package、节点并远程开发 |
| Topic 通讯 | 16-23 | 能让发布者和订阅者交换消息并调试 |
| 机械臂控制 | 24-36 | 能读取关节角、驱动电机、录制回放并用 launch 启动 |
| 视觉与坐标 | 37-50 | 能处理图像、识别物体并把坐标转换到机器人坐标系 |
| 正逆解与抓取 | 51-55 | 能由关节角求位姿、由目标位姿求关节角并完成抓取 |
| 语音、AI、MCP | 56-68 | 能把语音识别、LLM 和工具调用接入 ROS2 |

建议每完成一个阶段，就留下一个可运行的最小项目。这样遇到错误时，可以判断问题来自操作系统、ROS2 通讯、算法还是硬件，而不是所有东西同时排查。

## 2. 00-01：先理解 ROS2 在解决什么问题

ROS（Robot Operating System）不是传统意义上的操作系统，而是一组通信、工具和约定。机器人被拆成很多节点，每个节点只负责一件事，例如摄像头节点发布图像、识别节点发布目标框、控制节点订阅目标并发送关节命令。

ROS1 到 ROS2 的学习重点不是历史细节，而是三个变化：

- ROS2 使用 DDS，支持更好的实时性、发现机制和多机通信。
- ROS2 的节点、Topic、Service、Action、Parameter 都有明确的接口。
- ROS2 更重视质量服务（QoS）、生命周期和安全机制。

先记住一个最小闭环：**节点产生数据，Topic 传输连续数据，Service 处理一次请求，Action 处理可反馈的长任务**。

## 3. 02-08：搭建可复现的 ROS2 环境

### 3.1 虚拟机和 Ubuntu

课程 03-05 使用 VMware 安装 Ubuntu 并修改软件源。初学时建议使用快照：安装系统后建立“干净系统”快照，ROS2 安装完成后再建立“ROS2 基础”快照。虚拟机网络优先选择 NAT；需要多机通讯时再切换桥接，并确认防火墙允许 DDS 使用的网络。

下面是安装前的检查命令，每行都写出目的：

```bash
uname -a  # 查看 Linux 内核和系统架构
lsb_release -a  # 查看 Ubuntu 发行版版本
locale  # 检查终端是否使用 UTF-8 编码
python3 --version  # 检查 Python 3 版本
ip addr  # 查看网卡和局域网地址
```

### 3.2 安装 ROS2 和开发工具

课程 06-08 会安装 Git、编译工具、ROS2 软件源和核心包。下面给出命令骨架；不同 Ubuntu 版本的软件源地址可能变化，实际执行前应以 ROS2 官方文档为准。

```bash
sudo apt update  # 更新本地软件包索引
sudo apt install -y git curl build-essential python3-pip  # 安装版本管理、下载和编译工具
sudo apt install -y ros-humble-desktop  # 安装 ROS2 Humble 桌面版核心组件
sudo apt install -y python3-colcon-common-extensions  # 安装 colcon 常用构建扩展
sudo apt install -y python3-rosdep  # 安装 ROS 依赖解析工具
sudo rosdep init  # 初始化 rosdep 数据源，已经初始化过时可跳过
rosdep update  # 更新 ROS 依赖索引
echo 'source /opt/ros/humble/setup.bash' >> ~/.bashrc  # 让每个新终端自动加载 ROS2 环境
source ~/.bashrc  # 让当前终端立即加载 ROS2 环境
ros2 doctor --report  # 输出 ROS2 环境诊断报告
```

不要把 `source` 只写在某一个终端里就以为永久生效；新开终端后要用 `ros2 topic list` 验证环境是否仍然可用。

## 4. 09-15：创建工作空间、Package 和第一个节点

### 4.1 工作空间和 Package

工作空间是源码、构建产物、安装结果和日志的集合。课程 10-13 的基本流程如下：

```bash
mkdir -p ~/ros2_ws/src  # 创建 ROS2 工作空间和源码目录
cd ~/ros2_ws  # 进入工作空间根目录
ros2 pkg create --build-type ament_python robot_demo --dependencies rclpy std_msgs  # 创建 Python Package 并声明依赖
colcon build --symlink-install  # 编译工作空间并保留源码软链接
source install/setup.bash  # 加载当前工作空间的安装结果
ros2 pkg list | grep robot_demo  # 确认新 Package 已经被 ROS2 发现
```

### 4.2 一个逐行注释的发布者节点

把下面代码保存为 `~/ros2_ws/src/robot_demo/robot_demo/talker.py`，并给文件执行权限。它每秒向 `robot/chatter` 发布一条消息。

```python
import rclpy  # 导入 ROS2 Python 客户端库
from rclpy.node import Node  # 导入 ROS2 节点基类
from std_msgs.msg import String  # 导入字符串消息类型

class Talker(Node):  # 定义一个继承自 Node 的发布者节点
    def __init__(self):  # 定义节点初始化方法
        super().__init__('talker')  # 设置节点名称为 talker
        self.publisher = self.create_publisher(String, 'robot/chatter', 10)  # 创建字符串发布者并设置队列深度
        self.count = 0  # 初始化消息计数器
        self.timer = self.create_timer(1.0, self.publish_message)  # 创建每秒触发一次的定时器

    def publish_message(self):  # 定义定时器触发时要执行的函数
        message = String()  # 创建一条空的字符串消息
        message.data = f'hello robot {self.count}'  # 填充消息内容并带上计数值
        self.publisher.publish(message)  # 把消息发布到 Topic
        self.get_logger().info(message.data)  # 在终端打印已发布的内容
        self.count += 1  # 发布完成后将计数器加一

def main(args=None):  # 定义程序入口函数
    rclpy.init(args=args)  # 初始化 ROS2 Python 运行环境
    node = Talker()  # 创建 Talker 节点对象
    try:  # 开始保护节点运行过程
        rclpy.spin(node)  # 进入事件循环并持续处理回调
    except KeyboardInterrupt:  # 捕获 Ctrl+C 产生的退出信号
        pass  # 收到退出信号时不再执行额外操作
    finally:  # 无论如何都执行资源清理
        node.destroy_node()  # 销毁节点并释放 ROS2 资源
        rclpy.shutdown()  # 关闭 ROS2 Python 运行环境

if __name__ == '__main__':  # 判断当前文件是否作为主程序运行
    main()  # 调用程序入口函数
```

在 `setup.py` 的 `entry_points` 中添加一个入口后即可运行。下面的配置每一行也保留中文说明：

```python
'console_scripts': [  # 声明可以通过 ros2 run 调用的命令
    'talker = robot_demo.talker:main',  # 将 talker 命令映射到 talker.py 的 main 函数
],  # 结束控制台入口列表
```

编译和运行：

```bash
cd ~/ros2_ws  # 回到工作空间根目录
colcon build --symlink-install  # 重新编译 Python Package
source install/setup.bash  # 加载最新的可执行入口
ros2 run robot_demo talker  # 启动发布者节点
```

### 4.3 节点、参数和远程开发

课程 12-15 关注节点配置、编译运行、VS Code/SSH 远程开发和 AI 辅助编写节点。AI 可以帮助生成模板，但你必须自己检查 Topic 名称、消息类型、QoS 和异常处理。常用检查命令如下：

```bash
ros2 node list  # 列出当前运行中的节点
ros2 node info /talker  # 查看 talker 发布和订阅的接口
ros2 topic list -t  # 列出 Topic 以及消息类型
ros2 topic echo /robot/chatter  # 实时查看 Topic 中的数据
ros2 topic hz /robot/chatter  # 统计 Topic 的发布频率
ros2 param list /talker  # 查看节点参数列表
```

## 5. 16-23：Topic 通讯、rqt 和需求拆解

### 5.1 订阅者节点

课程 16-20 的小乌龟案例，本质是发布速度指令、订阅位姿反馈。下面是与上面发布者配套的订阅者：

```python
import rclpy  # 导入 ROS2 Python 客户端库
from rclpy.node import Node  # 导入 ROS2 节点基类
from std_msgs.msg import String  # 导入字符串消息类型

class Listener(Node):  # 定义一个继承自 Node 的订阅者节点
    def __init__(self):  # 定义节点初始化方法
        super().__init__('listener')  # 设置节点名称为 listener
        self.subscription = self.create_subscription(String, 'robot/chatter', self.on_message, 10)  # 创建 Topic 订阅者

    def on_message(self, message):  # 定义收到消息时的回调函数
        self.get_logger().info(f'收到消息：{message.data}')  # 输出收到的字符串内容

def main(args=None):  # 定义程序入口函数
    rclpy.init(args=args)  # 初始化 ROS2 运行环境
    node = Listener()  # 创建订阅者节点
    rclpy.spin(node)  # 持续等待和处理消息回调
    node.destroy_node()  # 退出事件循环后销毁节点
    rclpy.shutdown()  # 关闭 ROS2 运行环境

if __name__ == '__main__':  # 判断当前文件是否直接执行
    main()  # 启动订阅者程序
```

### 5.2 用命令行和 rqt 调试

课程 17-18 的工具练习很重要，因为它们能把“代码没反应”变成可观察的问题。小乌龟控制时，要先确认仿真节点和控制节点是否存在，再确认消息类型和频率。

```bash
ros2 run turtlesim turtlesim_node  # 启动 ROS2 小乌龟仿真窗口
ros2 run turtlesim turtle_teleop_key  # 启动键盘控制节点
ros2 topic info /turtle1/cmd_vel  # 查看速度 Topic 的发布者和订阅者
ros2 interface show geometry_msgs/msg/Twist  # 查看 Twist 消息字段定义
rqt_graph  # 打开节点和 Topic 的图形化关系图
rqt  # 打开 ROS2 图形化调试工具集合
```

课程 21-23 提醒我们：先写需求，再决定 Topic。一个“让机器人移动到目标点”的需求至少要拆成目标输入、当前状态、控制输出、完成条件和异常停止五部分，不能把所有逻辑堆进一个回调函数。

## 6. 24-36：机械臂关节、驱动、录制与回放

### 6.1 先读取关节角，再发送控制命令

课程 24-29 的顺序应该固定为“只读观察 → 仿真控制 → 低速真机”。关节状态通常使用 `sensor_msgs/msg/JointState`，控制接口可能是厂商 Topic、Service、Action 或 `ros2_control` 控制器，不能假设所有机械臂的接口名称相同。

一条 `JointState` 不是“一个矩阵”，而是数个按索引对齐的一维数组。以二关节机械臂为例：

```text
name     string[2]  = ["shoulder_joint", "elbow_joint"]
position float64[2] = [0.700, -0.500]  # rad
velocity float64[2] = [0.120, -0.080]  # rad/s；允许为空
effort   float64[2] = [1.800, 0.900]    # 常见为 N·m，但必须查驱动定义；允许为空
```

这里的第 `i` 个 `name`、`position`、`velocity` 和 `effort` 描述同一个关节。不能假设 `position[0]` 永远是肩关节；发布者重启、模型修改或驱动不同，都可能改变数组顺序。下面的只读节点先校验长度，再按名称重新排序：

::: danger 注意：JointState 名称错位会让错误电机执行命令
`zip` 会静默截断较长数组，而只按下标读取又会把关节顺序写死。控制前必须检查名称是否唯一、所需名称是否齐全、数组长度是否一致，并确认整个系统只有预期的 `/joint_states` 发布者。`effort` 的单位也不一定都是 N·m，未经厂商文档确认不得把它直接当作力矩闭环输入。
:::

```python
import rclpy  # 导入 ROS2 Python 客户端库
from rclpy.node import Node  # 导入 ROS2 节点基类
from sensor_msgs.msg import JointState  # 导入关节状态消息类型

class JointMonitor(Node):  # 定义关节状态监控节点
    def __init__(self):  # 定义初始化方法
        super().__init__('joint_monitor')  # 设置节点名称
        self.subscription = self.create_subscription(JointState, '/joint_states', self.on_state, 10)  # 订阅标准关节状态 Topic

    def on_state(self, message):  # 定义关节状态回调函数
        if len(message.name) != len(message.position):  # 检查名称和位置是否能逐项对应
            self.get_logger().error('JointState 的 name/position 长度不一致')  # 报告格式错误
            return  # 丢弃不完整消息，避免错位使用
        if len(set(message.name)) != len(message.name):  # 检查关节名称是否重复
            self.get_logger().error('JointState 中存在重复关节名')  # 重名时无法可靠建立映射
            return  # 拒绝歧义数据
        position_by_name = dict(zip(message.name, message.position))  # 建立“名称 -> 弧度”的显式映射
        required = ['shoulder_joint', 'elbow_joint']  # 声明本节点真正需要的关节顺序
        if any(name not in position_by_name for name in required):  # 检查两个目标关节是否齐全
            self.get_logger().warning('JointState 缺少 shoulder_joint 或 elbow_joint')  # 输出缺失原因
            return  # 等待下一条完整消息
        ordered = [position_by_name[name] for name in required]  # 按控制器约定重排为 shape=[2]
        values = ', '.join(f'{name}={position:.3f}rad' for name, position in zip(required, ordered))  # 格式化输出
        self.get_logger().info(values)  # 打印关节名称和位置

def main(args=None):  # 定义程序入口函数
    rclpy.init(args=args)  # 初始化 ROS2 运行环境
    node = JointMonitor()  # 创建关节监控节点
    rclpy.spin(node)  # 持续处理关节状态消息
    node.destroy_node()  # 退出时销毁节点
    rclpy.shutdown()  # 关闭 ROS2 运行环境

if __name__ == '__main__':  # 判断是否直接运行当前文件
    main()  # 启动关节监控程序
```

### 6.2 录制和回放 rosbag

课程 30-35 可以先使用 rosbag 记录关节状态，再做 GUI 的启停按钮。录制的文件是实验数据，不是控制程序；回放真机前应确认控制器没有把历史数据直接当成安全命令。

```bash
ros2 bag record /joint_states -o arm_joint_demo  # 录制关节状态并保存为 arm_joint_demo
ros2 bag info arm_joint_demo  # 查看录制包的时长、Topic 和消息数量
ros2 bag play arm_joint_demo --clock  # 按录制时间回放关节状态数据
ros2 topic echo /joint_states --once  # 只查看一条关节状态消息并确认字段
```

::: danger 注意：不要把 rosbag 控制 Topic 直接回放到真机
bag 会原样重放旧时间戳、旧坐标系和旧控制命令。若其中包含 `/cmd_vel`、轨迹 Action 或厂商电机 Topic，真机可能突然重复历史动作。应先用 `ros2 bag info` 审核 Topic 白名单，在隔离的 ROS Domain 或重映射后的仿真环境回放；生产数据还可能包含图像、语音和位置信息，上传前必须脱敏并限制访问权限。
:::

课程 35 的 GUI 可以先只实现“开始录制、停止录制、选择文件、开始回放、紧急停止”五个按钮。按钮回调通过 `subprocess` 启动 rosbag，并在窗口上显示进程状态；不要让 GUI 线程直接阻塞等待命令结束。

### 6.3 用 launch 一键启动

课程 36 使用 launch 把多个节点组合起来。Python launch 文件比 XML 更容易加入参数和条件：

```python
from launch import LaunchDescription  # 导入 ROS2 LaunchDescription 类型
from launch_ros.actions import Node  # 导入启动 ROS2 节点的动作

def generate_launch_description():  # 定义 launch 文件要求的入口函数
    monitor = Node(package='robot_demo', executable='joint_monitor', name='joint_monitor', output='screen')  # 声明关节监控节点
    talker = Node(package='robot_demo', executable='talker', name='talker', output='screen')  # 声明示例发布者节点
    return LaunchDescription([monitor, talker])  # 返回需要同时启动的节点列表
```

```bash
ros2 launch robot_demo arm_demo.launch.py  # 一次启动机械臂实验所需的节点
```

## 7. 37-48：从数字图像到 ROS2 视觉节点

### 7.1 图像的本质

数字图像是一个数组。灰度图的每个像素是一个亮度值，彩色图通常有三个通道。OpenCV 默认使用 BGR 顺序，而很多资料使用 RGB；颜色异常时先检查通道顺序，不要马上怀疑相机坏了。

例如一帧 `640 × 480` 的 `bgr8` 图像经 `cv_bridge` 转换后是 `uint8[480,640,3]`：第一维是行 `y`，第二维是列 `x`，第三维依次是 B、G、R。一个像素 `[20, 80, 200]` 表示蓝、绿、红三个 0～255 强度值。HSV 分割后得到 `uint8[480,640]`，每个位置通常只有 `0` 或 `255`；形态学操作改变这个掩膜的连通区域，不改变原图的真实深度。

课程 37-43 的 HSV 实验适合入门颜色分割：先把 BGR 转 HSV，再根据颜色阈值生成掩膜，最后用形态学操作去除噪声。

```python
import cv2  # 导入 OpenCV 图像处理库
import numpy as np  # 导入 NumPy 数组库

image = cv2.imread('object_a.jpg')  # 从磁盘读取一张物品 A 图片
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)  # 将 BGR 图像转换为 HSV 颜色空间
lower = np.array([35, 60, 60], dtype=np.uint8)  # 设置绿色物体的 HSV 下界示例
upper = np.array([85, 255, 255], dtype=np.uint8)  # 设置绿色物体的 HSV 上界示例
mask = cv2.inRange(hsv, lower, upper)  # 根据上下界生成二值掩膜
kernel = np.ones((5, 5), dtype=np.uint8)  # 创建用于形态学操作的五乘五内核
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)  # 使用开运算去除孤立噪声
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)  # 使用闭运算填补目标内部小孔
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)  # 查找外部轮廓
for contour in contours:  # 遍历所有候选轮廓
    area = cv2.contourArea(contour)  # 计算当前轮廓的面积
    if area < 500:  # 忽略面积过小的噪声轮廓
        continue  # 跳过当前候选轮廓
    x, y, width, height = cv2.boundingRect(contour)  # 计算轮廓的外接矩形
    cv2.rectangle(image, (x, y), (x + width, y + height), (0, 255, 0), 2)  # 在原图上绘制识别框
cv2.imwrite('object_a_result.jpg', image)  # 保存绘制结果供检查
```

阈值 `[35, 60, 60]` 和 `[85, 255, 255]` 只是示例，必须根据目标相机、光照和物品 A 的颜色重新测量。颜色分割对光照很敏感，复杂场景最终通常要升级到目标检测模型。

### 7.2 ROS2 摄像头节点和图像转换

课程 45-48 需要相机驱动、原生图像节点、HSV 节点和 box 识别节点。常见消息是 `sensor_msgs/msg/Image`，Python 中使用 `cv_bridge` 将 ROS 图像转成 OpenCV 数组：

```python
import rclpy  # 导入 ROS2 Python 客户端库
from rclpy.node import Node  # 导入 ROS2 节点基类
from sensor_msgs.msg import Image  # 导入图像消息类型
from cv_bridge import CvBridge  # 导入 ROS 图像与 OpenCV 转换工具
import cv2  # 导入 OpenCV 图像处理库

class HsvImageNode(Node):  # 定义 HSV 图像处理节点
    def __init__(self):  # 定义节点初始化方法
        super().__init__('hsv_image_node')  # 设置节点名称
        self.bridge = CvBridge()  # 创建图像转换对象
        self.subscription = self.create_subscription(Image, '/camera/image_raw', self.on_image, 10)  # 订阅相机原始图像
        self.publisher = self.create_publisher(Image, '/camera/object_mask', 10)  # 发布物品 A 掩膜图像

    def on_image(self, message):  # 定义图像回调函数
        frame = self.bridge.imgmsg_to_cv2(message, desired_encoding='bgr8')  # 将 ROS 图像转换为 BGR 数组
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)  # 将 BGR 图像转换为 HSV 图像
        lower = (35, 60, 60)  # 设置颜色阈值下界示例
        upper = (85, 255, 255)  # 设置颜色阈值上界示例
        mask = cv2.inRange(hsv, lower, upper)  # 生成颜色掩膜
        output = self.bridge.cv2_to_imgmsg(mask, encoding='mono8')  # 将掩膜数组转换回 ROS 图像消息
        output.header = message.header  # 复制原图时间戳和坐标系信息
        self.publisher.publish(output)  # 发布掩膜图像

def main(args=None):  # 定义程序入口函数
    rclpy.init(args=args)  # 初始化 ROS2 运行环境
    node = HsvImageNode()  # 创建 HSV 图像节点
    rclpy.spin(node)  # 持续等待相机图像消息
    node.destroy_node()  # 退出时销毁节点
    rclpy.shutdown()  # 关闭 ROS2 运行环境

if __name__ == '__main__':  # 判断是否直接运行当前文件
    main()  # 启动 HSV 图像节点
```

调试时同时查看原图、掩膜和识别框：

```bash
ros2 topic list -t  # 确认相机和识别 Topic 是否存在
ros2 topic hz /camera/image_raw  # 检查相机图像发布频率
rqt_image_view /camera/image_raw  # 查看原始图像
rqt_image_view /camera/object_mask  # 查看 HSV 掩膜结果
```

::: danger 注意：一帧识别结果不能直接触发抓取
检查 `message.encoding`、`height × step == len(data)` 是否成立，并保留原始 `header.stamp`。曝光突变、RGB/BGR 搞反、旧帧堆积或网络延迟都可能产生“置信度很高但位置已经过期”的目标。控制层应要求连续多帧稳定、时间戳未过期、深度有效且目标仍在安全工作区，否则进入停止状态。
:::

## 8. 49-50：坐标转换，视觉结果如何到达机器人

像素坐标 `(u, v)` 不能直接当成机械臂坐标。至少需要相机内参、深度或平面假设，以及相机到机器人基座的外参。ROS2 中推荐使用 `tf2` 管理坐标变换，所有消息的 `header.frame_id` 都要填写真实坐标系名称。

假设相机到基座的齐次变换和相机点分别为：

```text
T_base_camera [4,4] = [[ 0, -1, 0, 0.50],
                       [ 1,  0, 0, 0.10],
                       [ 0,  0, 1, 0.20],
                       [ 0,  0, 0, 1.00]]
p_camera      [4]   = [0.20, 0.10, 0.30, 1.00]
p_base = T_base_camera @ p_camera
       = [0.40, 0.30, 0.50, 1.00]
```

左上 `3 × 3` 把点的方向旋转 90°，最右列再增加相机原点相对基座的平移。结果仍是**位置**，没有产生速度、力或电机力矩；力与力矩的变换还要考虑作用点和伴随矩阵。

下面代码演示把相机坐标系中的点转换到 `base_link`：

```python
import rclpy  # 导入 ROS2 Python 客户端库
from rclpy.node import Node  # 导入 ROS2 节点基类
from geometry_msgs.msg import PointStamped  # 导入带坐标系的点消息
from tf2_ros import Buffer, TransformListener  # 导入 TF 缓存和监听器
from tf2_geometry_msgs import do_transform_point  # 导入点坐标变换函数

class PointTransformer(Node):  # 定义坐标转换节点
    def __init__(self):  # 定义初始化方法
        super().__init__('point_transformer')  # 设置节点名称
        self.buffer = Buffer()  # 创建 TF 缓存对象
        self.listener = TransformListener(self.buffer, self)  # 创建 TF 监听器并绑定当前节点
        self.subscription = self.create_subscription(PointStamped, '/object_point_camera', self.on_point, 10)  # 订阅相机坐标系中的物体点

    def on_point(self, point):  # 定义物体点回调函数
        try:  # 开始处理 TF 查询异常
            transform = self.buffer.lookup_transform('base_link', point.header.frame_id, point.header.stamp)  # 查询拍摄该点时刻对应的变换
            result = do_transform_point(point, transform)  # 将物体点变换到机器人基座坐标系
            self.get_logger().info(f'目标点：{result.point.x:.3f}, {result.point.y:.3f}, {result.point.z:.3f}')  # 输出基座坐标系中的目标点
        except Exception as error:  # 捕获 TF 尚未准备好等异常
            self.get_logger().warning(f'TF 暂不可用：{error}')  # 输出可读的错误信息

def main(args=None):  # 定义程序入口函数
    rclpy.init(args=args)  # 初始化 ROS2 运行环境
    node = PointTransformer()  # 创建坐标转换节点
    rclpy.spin(node)  # 持续处理目标点消息
    node.destroy_node()  # 退出时销毁节点
    rclpy.shutdown()  # 关闭 ROS2 运行环境

if __name__ == '__main__':  # 判断是否直接运行当前文件
    main()  # 启动坐标转换节点
```

如果没有深度相机，可以先假设目标位于工作台平面，再用相机标定得到的单应关系估计三维位置。真实抓取前还要做手眼标定，并用已知点验证转换误差。

::: danger 注意：不要用“最新 TF”变换历史图像
机器人运动时，最新位姿和图像曝光时刻的位姿并不相同；几十毫秒偏差就可能变成厘米级抓取误差。必须使用传感器时间戳查询同一时刻的 TF，设置可接受的最大延迟，并在 TF 外推失败时丢弃数据，不能捕获异常后继续沿用上一帧坐标。
:::

## 9. 51-55：正解、反解和视觉抓取

### 9.1 用 `ikpy` 验证运动学

课程 51-52 先讲正解反解概念，再用 URDF 集成。下面是 `ikpy` 的最小验证脚本；`arm.urdf` 和链名称必须换成你的机械臂文件：

```python
from ikpy.chain import Chain  # 导入 ikpy 的机械臂链模型
import numpy as np  # 导入 NumPy 数值计算库

chain = Chain.from_urdf_file('arm.urdf')  # 从 URDF 文件加载机械臂链
target = np.eye(4)  # 创建四乘四单位齐次变换矩阵
target[:3, 3] = [0.30, 0.10, 0.20]  # 设置目标位置，单位示例为米
guess = np.zeros(len(chain.links))  # 创建全零关节角作为逆解初始值
angles = chain.inverse_kinematics_frame(target, initial_position=guess)  # 根据目标位姿求解关节角
forward = chain.forward_kinematics(angles)  # 用求得的关节角重新计算正运动学
position_error = np.linalg.norm(forward[:3, 3] - target[:3, 3])  # 计算末端位置误差
print(f'位置误差：{position_error:.6f} m')  # 输出位置误差供判断
print('关节角：', angles)  # 输出逆解得到的全部关节角
```

数据在这段代码中依次变化为：`target [4,4]` 表示目标位姿，`guess [N]` 是整条 URDF 链的初始关节变量，求解器输出 `angles [N]`，正解又把它还原为 `forward [4,4]`。`forward[:3,3] - target[:3,3]` 得到位置残差 `[3]`，其二范数才是标量误差。训练神经网络时会通过损失和反向传播更新参数，而 IKPy 在这里做的是数值优化关节角，**没有训练模型，也没有自动计算安全轨迹或力矩**。

::: danger 注意：IK 有解也不能直接下发
逆解可能越过关节限位、落在奇异点、与环境碰撞，或从当前姿态跳到另一支解。至少要检查 FK 位置/姿态误差、关节软限位、与当前角度的差值、路径连续性和碰撞距离，再由带速度、加速度及力矩限制的轨迹控制器执行。
:::

### 9.2 视觉跟随和抓取的安全状态机

课程 53-55 把识别结果接到机械臂。不要在“收到一个框”后直接发送电机命令，至少要经过 `SEARCH`、`APPROACH`、`GRASP`、`VERIFY` 和 `STOP` 状态，并在目标丢失、距离异常、通信超时时进入停止状态。

```python
from enum import Enum  # 导入枚举类型以定义有限状态

class State(Enum):  # 定义机械臂任务状态枚举
    SEARCH = 'search'  # 定义搜索目标状态
    APPROACH = 'approach'  # 定义接近目标状态
    GRASP = 'grasp'  # 定义执行夹取状态
    VERIFY = 'verify'  # 定义验证夹取状态
    STOP = 'stop'  # 定义安全停止状态

state = State.SEARCH  # 将系统初始状态设置为搜索
if target_missing or target_confidence < 0.7:  # 判断目标是否丢失或置信度过低
    state = State.STOP  # 不满足感知条件时立即进入停止状态
elif distance_to_target > 0.02:  # 判断末端距离目标是否大于两厘米
    state = State.APPROACH  # 距离较远时进入接近状态
else:  # 处理已经到达目标附近的情况
    state = State.GRASP  # 目标可靠且距离足够近时才允许夹取
```

上面的状态判断需要放进 ROS2 节点，并结合关节限位、速度限制、急停输入和夹爪反馈。示例只说明结构，不能直接用于未知型号的机械臂。

## 10. 56-68：语音、LLM 和 MCP 如何接入 ROS2

### 10.1 语音链路

课程 56-60 的链路是“录音 → Whisper 识别 → 大模型理解 → 文本转语音”。先把每一步做成独立脚本，再通过 ROS2 Service 或 Action 串起来。录音要处理采样率、单声道、静音检测和隐私数据保存。

下面是一个最小的文本转语音接口示例，真实项目可替换为 `pyttsx3` 或 Edge TTS：

```python
import pyttsx3  # 导入本地文本转语音库

engine = pyttsx3.init()  # 初始化本地语音引擎
engine.setProperty('rate', 160)  # 设置语速，数值需要按听感调整
engine.say('机器人已准备好')  # 将中文文本放入语音队列
engine.runAndWait()  # 等待语音播放完成
```

### 10.2 调用大语言模型

课程 61-63 的重点是把自然语言转换为结构化意图，而不是让模型直接输出任意电机指令。模型输出应先经过 JSON Schema 校验和安全策略，再交给 ROS2 控制节点。

```python
import os  # 导入操作系统环境变量模块
from openai import OpenAI  # 导入兼容 OpenAI 接口的客户端

client = OpenAI(api_key=os.environ['LLM_API_KEY'])  # 从环境变量读取密钥并创建客户端
response = client.chat.completions.create(model='deepseek-chat', messages=[{'role': 'user', 'content': '把前方的红色方块放到左侧'}])  # 请求模型理解用户意图
intent_text = response.choices[0].message.content  # 读取模型返回的文本结果
print(intent_text)  # 打印结果，正式系统应改为结构化解析和校验
```

不要把 API 密钥写进代码或提交到 Git。模型只负责高层任务规划，低层节点负责限位、碰撞检查、速度约束和急停。

::: danger 注意：语音和提示词都属于不可信输入
误识别、环境中的恶意语句、网页检索内容或 MCP 返回文本都可能诱导模型调用高权限工具。生产系统要实行工具白名单、参数 Schema、权限分级、动作二次确认、幂等任务号和完整审计；“删除数据、解锁安全区、运动到未知坐标”等动作不能仅凭 LLM 文本获准。
:::

### 10.3 MCP Server、Client 和 ROS2 工具

课程 64-68 可以按三层理解：

1. MCP Server 暴露工具，例如 `get_joint_state`、`move_to_safe_pose`、`detect_object`。
2. MCP Client 把用户对话交给模型，并根据模型选择调用工具。
3. ROS2 Adapter 将工具调用转换为 Topic、Service 或 Action 请求。

工具函数必须返回可验证结果，例如“是否成功、错误原因、当前状态、任务编号”，而不是只返回一句模糊文本。下面是一个仅展示接口约定的安全工具骨架：

```python
def move_to_safe_pose(request):  # 定义移动到安全姿态的工具函数
    if request.get('pose') != 'home':  # 只允许白名单中的姿态名称
        return {'ok': False, 'error': '只允许 home 安全姿态'}  # 拒绝未知姿态并返回原因
    if emergency_stop_is_active():  # 检查急停是否处于激活状态
        return {'ok': False, 'error': '急停已激活'}  # 急停时拒绝任何运动请求
    publish_joint_trajectory('home')  # 将已经过验证的 home 轨迹交给控制器
    return {'ok': True, 'task_id': create_task_id()}  # 返回成功标记和可查询的任务编号
```

正式实现时，`publish_joint_trajectory` 应该调用具体的 ROS2 Action 客户端，并等待控制器反馈；`emergency_stop_is_active` 也必须连接真实安全回路，不能只用一个普通软件变量模拟。

::: danger 注意：软件“急停变量”不是安全急停
普通 ROS2 Topic、Service 和 Python 布尔值可能因节点卡死、网络分区或进程崩溃而失效。人员可进入的工作区必须使用符合设备要求的硬接线急停、安全继电器或安全 PLC；MCP 工具只能读取安全状态和请求受限动作，不能绕过硬件安全链。
:::

## 11. 数据、仿真和调试习惯

视觉和 AI 课程会产生图片、音频、rosbag、模型权重和日志。建议为每次实验保存以下信息：

```text
experiment/2026-08-27_object_a/
├── README.md  # 记录硬件、软件版本、参数和实验目的
├── images/  # 保存原始图像和识别结果
├── rosbag/  # 保存 ROS2 Topic 录制数据
├── config/  # 保存阈值、关节限位和模型配置
├── logs/  # 保存节点日志、错误和安全停止原因
└── metrics.json  # 保存识别率、位置误差和任务成功率
```

每次排障按同一顺序执行：

1. `ros2 node list`：节点是否启动。
2. `ros2 topic list -t`：接口名称和类型是否正确。
3. `ros2 topic echo`/`hz`：数据是否真的在流动。
4. `tf2_tools` 或 RViz：坐标系是否连接、方向是否正确。
5. 仿真低速验证：控制命令是否符合预期。
6. 真机小范围测试：限位、急停和通信超时是否有效。

## 12. 12 周自学安排

| 周次 | 实践目标 | 必须交付的结果 |
| --- | --- | --- |
| 第 1 周 | ROS 历史、Linux、终端和 Git | 能解释节点、Topic、Service、Action |
| 第 2 周 | Ubuntu/ROS2 安装 | `ros2 doctor` 无关键错误 |
| 第 3 周 | 工作空间和 Python Package | 跑通 talker/listener |
| 第 4 周 | Topic、rqt、小乌龟 | 能用命令行定位通讯问题 |
| 第 5 周 | 机械臂关节状态 | 记录一段安全的 `/joint_states` |
| 第 6 周 | rosbag、GUI、launch | 一键录制和回放仿真数据 |
| 第 7 周 | OpenCV 图像和 HSV | 输出原图、掩膜和 box |
| 第 8 周 | 相机、TF 和坐标转换 | 将相机点转换到 `base_link` |
| 第 9 周 | URDF、FK、IKPy | 位置误差和关节限位报告 |
| 第 10 周 | 视觉跟随和抓取状态机 | 目标丢失时自动停止 |
| 第 11 周 | Whisper、TTS、LLM | 语音得到结构化任务意图 |
| 第 12 周 | MCP + ROS2 | 工具白名单和任务反馈闭环 |

## 结语

这 69 节课可以归结为一句话：**先让系统能运行，再让节点能通讯；先让机器人知道自己在哪里，再让它理解目标；最后才让 AI 参与决策。** 对自学者来说，最重要的不是一次搭出“全自动智能机器人”，而是每周完成一个能运行、能观察、能记录、能复现的小闭环。

---
title: URDF 从零到两关节机械臂：建模、RViz、Gazebo 与 ros2_control
date: 2026-08-30
created: 2026-08-30
updated: 2026-08-30
---

# URDF 从零到两关节机械臂：建模、RViz、Gazebo 与 ros2_control

这篇文章从一个空 ROS2 Package 开始，完成一台两关节平面机械臂的 URDF/Xacro 建模、语法检查、RViz 可视化、Joint State 驱动、TF 验证、Gazebo 仿真和 `ros2_control` 轨迹控制。目标不只是“让模型显示出来”，而是理解每个坐标、质量、惯量和控制接口为什么这样写。

本文基线环境是 Ubuntu 22.04 + ROS2 Humble + Gazebo Classic 11。ROS2 Jazzy 等较新发行版通常使用现代 Gazebo 和 `gz_ros2_control`，URDF 主体仍适用，但仿真插件、安装包和启动文件需要按发行版替换。

连接真实机械臂前，必须重新核验关节方向、零位、限位、速度、力矩、急停和驱动接口。本文控制案例只面向仿真。

## 1. 最终会得到什么

完成后，工作空间中有一个 `urdf_arm_description` Package：

```text
ros2_ws/
└── src/
    └── urdf_arm_description/
        ├── CMakeLists.txt
        ├── package.xml
        ├── config/
        │   └── controllers.yaml
        ├── launch/
        │   ├── display.launch.py
        │   └── gazebo.launch.py
        ├── meshes/                     # 后续放 STL/DAE 网格
        └── urdf/
            └── urdf_arm.urdf.xacro
```

模型运动链为：

```mermaid
flowchart LR
    W[world] -->|fixed| B[base_link]
    B -->|shoulder_joint revolute| L1[shoulder_link]
    L1 -->|elbow_joint revolute| L2[forearm_link]
    L2 -->|tool_joint fixed| T[tool0]
```

两根臂都沿各自 Link 坐标系的 X 轴伸展，两个旋转关节都绕 Z 轴旋转，因此运动发生在 XY 平面。`tool0` 是末端工具参考坐标系。

## 2. 先理解 URDF 的四个核心对象

### 2.1 Link：刚体和坐标系

`link` 表示一个刚体，也定义了同名坐标系。一个 Link 常包含三套信息：

```xml
<link name="example_link">
  <visual>...</visual>     <!-- 人看到的外观 -->
  <collision>...</collision> <!-- 碰撞检测使用的几何体 -->
  <inertial>...</inertial> <!-- 仿真动力学使用的质量和惯量 -->
</link>
```

- `visual` 错了，RViz 外观不对，但未必影响碰撞。
- `collision` 错了，模型看着正常却可能隔空碰撞或互相穿透。
- `inertial` 错了，RViz 通常仍能显示，但 Gazebo 可能抖动、飞走或计算失败。

### 2.2 Joint：父子 Link 的约束

URDF 必须形成一棵树：每个非根 Link 只有一个父 Joint，不能直接构造闭环。Joint 指定父子 Link、关节原点、轴和限制：

```xml
<joint name="shoulder_joint" type="revolute">
  <parent link="base_link"/>
  <child link="shoulder_link"/>
  <origin xyz="0 0 0.1" rpy="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="-1.5708" upper="1.5708"
         effort="20" velocity="1.5"/>
</joint>
```

这里的 `origin` 表示：当关节值为零时，**child Link 坐标系相对 parent Link 坐标系**的位置和姿态。`axis` 写在 Joint/child 初始坐标系中，不是固定按世界坐标理解。

### 2.3 常见 Joint 类型

| 类型 | 自由度 | 是否需要 limit | 常见用途 |
| --- | ---: | --- | --- |
| `fixed` | 0 | 否 | 相机、夹爪、底座固定连接 |
| `revolute` | 1 个旋转 | 需要上下限 | 有限角度机械臂关节 |
| `continuous` | 1 个旋转 | 没有位置上下限 | 可连续旋转轮子 |
| `prismatic` | 1 个平移 | 需要上下限 | 直线导轨、升降轴 |
| `floating` | 6 | 通常不用普通控制器 | 自由刚体 |
| `planar` | 平面 3 自由度 | 较少直接使用 | 平面运动模型 |

### 2.4 一棵树为什么能生成 TF

`robot_state_publisher` 读取 URDF 的树结构：

- 固定 Joint 的变换发布到 `/tf_static`。
- 可动 Joint 的角度来自 `/joint_states`，计算后发布到 `/tf`。

因此 URDF 描述“连接关系和几何参数”，`JointState` 描述“当前关节状态”，二者结合才得到实时 TF。

## 3. 安装工具并创建 Package

安装建模、显示、校验和仿真依赖：

```bash
sudo apt update
sudo apt install -y \
  ros-humble-xacro \
  ros-humble-robot-state-publisher \
  ros-humble-joint-state-publisher-gui \
  ros-humble-rviz2 \
  ros-humble-ros2-control \
  ros-humble-ros2-controllers \
  ros-humble-gazebo-ros-pkgs \
  ros-humble-gazebo-ros2-control \
  liburdfdom-tools
```

创建工作空间和描述 Package：

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
ros2 pkg create urdf_arm_description --build-type ament_cmake
cd urdf_arm_description
mkdir -p urdf launch config meshes
```

描述包一般不编译 C++ 代码，但仍用 `ament_cmake` 安装模型、配置和启动文件，使其他 Package 能通过 ROS 包索引找到它们。

## 4. 编写 `package.xml`

将生成的 `package.xml` 改为：

```xml
<?xml version="1.0"?>
<package format="3">
  <name>urdf_arm_description</name>
  <version>0.0.1</version>
  <description>Two-joint arm URDF learning project</description>
  <maintainer email="you@example.com">your_name</maintainer>
  <license>Apache-2.0</license>

  <buildtool_depend>ament_cmake</buildtool_depend>

  <exec_depend>xacro</exec_depend>
  <exec_depend>robot_state_publisher</exec_depend>
  <exec_depend>joint_state_publisher_gui</exec_depend>
  <exec_depend>rviz2</exec_depend>
  <exec_depend>controller_manager</exec_depend>
  <exec_depend>joint_state_broadcaster</exec_depend>
  <exec_depend>joint_trajectory_controller</exec_depend>
  <exec_depend>gazebo_ros</exec_depend>
  <exec_depend>gazebo_ros2_control</exec_depend>

  <export>
    <build_type>ament_cmake</build_type>
  </export>
</package>
```

示例邮箱和维护者必须换成自己的信息。`exec_depend` 表示运行模型和 launch 所需的依赖。

## 5. 编写 `CMakeLists.txt`

描述包的重点是安装目录：

```cmake
cmake_minimum_required(VERSION 3.8)
project(urdf_arm_description)

find_package(ament_cmake REQUIRED)

install(
  DIRECTORY urdf launch config meshes
  DESTINATION share/${PROJECT_NAME}
)

ament_package()
```

如果忘记 `install(DIRECTORY ...)`，源码目录里文件存在，但 `ros2 launch` 从 `install/` 查找时会报“文件不存在”。

## 6. 从尺寸表开始，而不是边看边猜

先确定模型参数：

| 部件 | 尺寸 | 质量 | 坐标约定 |
| --- | --- | ---: | --- |
| 底座 | `0.20 × 0.20 × 0.10 m` | 3.0 kg | `base_link` 原点在底面中心 |
| 大臂 | `0.40 × 0.06 × 0.06 m` | 1.2 kg | 原点在肩关节，沿 +X 伸展 |
| 小臂 | `0.30 × 0.05 × 0.05 m` | 0.8 kg | 原点在肘关节，沿 +X 伸展 |
| 末端球 | 半径 `0.04 m` | 0.2 kg | 球心位于 `tool0` 原点 |

Link 原点放在关节处，几何体中心要平移半个臂长。例如大臂 Link 原点在肩部，长度为 0.4 m 的 Box 中心应写在 `x=0.2`，否则模型会有一半伸到关节后方。

## 7. 完整 Xacro 模型

将下面内容保存为 `urdf/urdf_arm.urdf.xacro`：

```xml
<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="urdf_arm">

  <!-- 可复用参数。prefix 接多机器人时使用，默认保持控制器关节名简单。 -->
  <xacro:arg name="prefix" default=""/>
  <xacro:arg name="use_gazebo" default="false"/>

  <xacro:property name="prefix" value="$(arg prefix)"/>
  <xacro:property name="link1_length" value="0.40"/>
  <xacro:property name="link2_length" value="0.30"/>
  <xacro:property name="link1_width" value="0.06"/>
  <xacro:property name="link2_width" value="0.05"/>

  <material name="blue">
    <color rgba="0.12 0.42 0.80 1.0"/>
  </material>
  <material name="orange">
    <color rgba="0.95 0.45 0.08 1.0"/>
  </material>
  <material name="dark">
    <color rgba="0.18 0.20 0.23 1.0"/>
  </material>

  <!-- 沿 Link +X 方向伸展的 Box Link。惯量使用长方体质心公式。 -->
  <xacro:macro name="arm_box" params="name length width height mass color">
    <link name="${prefix}${name}">
      <visual>
        <origin xyz="${length / 2.0} 0 0" rpy="0 0 0"/>
        <geometry>
          <box size="${length} ${width} ${height}"/>
        </geometry>
        <material name="${color}"/>
      </visual>
      <collision>
        <origin xyz="${length / 2.0} 0 0" rpy="0 0 0"/>
        <geometry>
          <box size="${length} ${width} ${height}"/>
        </geometry>
      </collision>
      <inertial>
        <origin xyz="${length / 2.0} 0 0" rpy="0 0 0"/>
        <mass value="${mass}"/>
        <inertia
          ixx="${mass * (width * width + height * height) / 12.0}"
          ixy="0" ixz="0"
          iyy="${mass * (length * length + height * height) / 12.0}"
          iyz="0"
          izz="${mass * (length * length + width * width) / 12.0}"/>
      </inertial>
    </link>
  </xacro:macro>

  <!-- world 作为整棵 TF 树的固定根。 -->
  <link name="${prefix}world"/>

  <link name="${prefix}base_link">
    <visual>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <geometry><box size="0.20 0.20 0.10"/></geometry>
      <material name="dark"/>
    </visual>
    <collision>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <geometry><box size="0.20 0.20 0.10"/></geometry>
    </collision>
    <inertial>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <mass value="3.0"/>
      <inertia ixx="0.0125" ixy="0" ixz="0"
               iyy="0.0125" iyz="0" izz="0.0200"/>
    </inertial>
  </link>

  <joint name="${prefix}world_to_base" type="fixed">
    <parent link="${prefix}world"/>
    <child link="${prefix}base_link"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </joint>

  <xacro:arm_box name="shoulder_link"
    length="${link1_length}" width="${link1_width}" height="0.06"
    mass="1.2" color="blue"/>

  <joint name="${prefix}shoulder_joint" type="revolute">
    <parent link="${prefix}base_link"/>
    <child link="${prefix}shoulder_link"/>
    <origin xyz="0 0 0.10" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.5708" upper="1.5708" effort="20" velocity="1.5"/>
    <dynamics damping="0.15" friction="0.05"/>
  </joint>

  <xacro:arm_box name="forearm_link"
    length="${link2_length}" width="${link2_width}" height="0.05"
    mass="0.8" color="orange"/>

  <joint name="${prefix}elbow_joint" type="revolute">
    <parent link="${prefix}shoulder_link"/>
    <child link="${prefix}forearm_link"/>
    <origin xyz="${link1_length} 0 0" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-2.0944" upper="2.0944" effort="12" velocity="1.8"/>
    <dynamics damping="0.10" friction="0.03"/>
  </joint>

  <link name="${prefix}tool0">
    <visual>
      <geometry><sphere radius="0.04"/></geometry>
      <material name="dark"/>
    </visual>
    <collision>
      <geometry><sphere radius="0.04"/></geometry>
    </collision>
    <inertial>
      <mass value="0.2"/>
      <inertia ixx="0.000128" ixy="0" ixz="0"
               iyy="0.000128" iyz="0" izz="0.000128"/>
    </inertial>
  </link>

  <joint name="${prefix}tool_joint" type="fixed">
    <parent link="${prefix}forearm_link"/>
    <child link="${prefix}tool0"/>
    <origin xyz="${link2_length} 0 0" rpy="0 0 0"/>
  </joint>

  <!-- 只有仿真 launch 传入 use_gazebo:=true 时，才加载控制硬件接口。 -->
  <xacro:if value="$(arg use_gazebo)">
    <ros2_control name="GazeboSystem" type="system">
      <hardware>
        <plugin>gazebo_ros2_control/GazeboSystem</plugin>
      </hardware>

      <joint name="${prefix}shoulder_joint">
        <command_interface name="position">
          <param name="min">-1.5708</param>
          <param name="max">1.5708</param>
        </command_interface>
        <state_interface name="position"/>
        <state_interface name="velocity"/>
      </joint>

      <joint name="${prefix}elbow_joint">
        <command_interface name="position">
          <param name="min">-2.0944</param>
          <param name="max">2.0944</param>
        </command_interface>
        <state_interface name="position"/>
        <state_interface name="velocity"/>
      </joint>
    </ros2_control>

    <gazebo>
      <plugin filename="libgazebo_ros2_control.so"
              name="gazebo_ros2_control">
        <parameters>$(find urdf_arm_description)/config/controllers.yaml</parameters>
      </plugin>
    </gazebo>
  </xacro:if>

  <!-- Gazebo 使用自己的材质脚本；这里只为外观补充映射。 -->
  <gazebo reference="${prefix}base_link">
    <material>Gazebo/Grey</material>
  </gazebo>
  <gazebo reference="${prefix}shoulder_link">
    <material>Gazebo/Blue</material>
  </gazebo>
  <gazebo reference="${prefix}forearm_link">
    <material>Gazebo/Orange</material>
  </gazebo>

</robot>
```

### 7.1 为什么视觉、碰撞和惯性 origin 相同

臂 Link 原点在旋转轴，Box 的质心在半臂长处，所以三者都使用 `xyz="length/2 0 0"`。如果视觉 origin 正确而惯性 origin 仍为零，画面看起来没有问题，动力学却认为全部质量集中在关节轴附近。

### 7.2 惯量矩阵为什么必须正定

长方体在质心、主轴坐标系下：

$$
I_{xx}=\frac{m}{12}(w^2+h^2),\quad
I_{yy}=\frac{m}{12}(l^2+h^2),\quad
I_{zz}=\frac{m}{12}(l^2+w^2)
$$

对称物体的交叉项可以为零。不要为了通过解析把惯量全部写成零；物理引擎需要合法的正质量、正惯量。

## 8. 展开并校验 Xacro

先把宏展开为纯 URDF：

```bash
cd ~/ros2_ws
xacro src/urdf_arm_description/urdf/urdf_arm.urdf.xacro \
  use_gazebo:=false > /tmp/urdf_arm.urdf
check_urdf /tmp/urdf_arm.urdf
```

期望看到类似树结构：

```text
robot name is: urdf_arm
---------- Successfully Parsed XML ---------------
root Link: world has 1 child(ren)
    child(1):  base_link
        child(1):  shoulder_link
            child(1):  forearm_link
                child(1):  tool0
```

进一步检查：

```bash
# 确认宏参数能够解析，且生成了两个 ros2_control joint
xacro src/urdf_arm_description/urdf/urdf_arm.urdf.xacro \
  use_gazebo:=true | grep -E 'ros2_control|shoulder_joint|elbow_joint'

# 生成 Link/Joint 关系图，需要 graphviz
sudo apt install -y graphviz
urdf_to_graphiz /tmp/urdf_arm.urdf
```

`check_urdf` 能发现 XML、树结构和部分 Joint 错误，但不能证明尺寸、轴方向、惯量和控制接口符合真实机器人，这些还要在 RViz/Gazebo 和参数表中逐项核对。

## 9. RViz 启动文件

创建 `launch/display.launch.py`：

```python
from launch import LaunchDescription
from launch.substitutions import Command
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    package_share = get_package_share_directory('urdf_arm_description')
    xacro_file = os.path.join(package_share, 'urdf', 'urdf_arm.urdf.xacro')

    robot_description = ParameterValue(
        Command(['xacro ', xacro_file, ' use_gazebo:=false']),
        value_type=str,
    )

    return LaunchDescription([
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            parameters=[{'robot_description': robot_description}],
            output='screen',
        ),
        Node(
            package='joint_state_publisher_gui',
            executable='joint_state_publisher_gui',
            output='screen',
        ),
        Node(
            package='rviz2',
            executable='rviz2',
            output='screen',
        ),
    ])
```

`ParameterValue(..., value_type=str)` 明确告诉 launch：`Command` 的输出是 XML 字符串，作为 `robot_description` 参数传递，不是文件路径。

## 10. 构建并在 RViz 检查

```bash
cd ~/ros2_ws
rosdep install --from-paths src --ignore-src -r -y
colcon build --symlink-install --packages-select urdf_arm_description
source install/setup.bash
ros2 launch urdf_arm_description display.launch.py
```

第一次打开 RViz：

1. 将 `Global Options → Fixed Frame` 设置为 `world`。
2. 点击 `Add → RobotModel`。
3. `Description Source` 选择 `Topic`，Topic 使用 `/robot_description`。
4. 再添加 `TF`，展开坐标轴观察方向。
5. 拖动 Joint State Publisher GUI 的 `shoulder_joint` 和 `elbow_joint`。

应该看到大臂绕肩部转动，小臂绕大臂末端转动，末端球始终位于小臂末端。如果小臂绕世界原点转，通常是 `elbow_joint/origin` 写错；如果围绕错误轴翻转，检查 `axis` 与 Joint 坐标系。

## 11. 用 Topic 和 TF 验证，不只凭肉眼

新终端必须重新加载工作空间：

```bash
source ~/ros2_ws/install/setup.bash
ros2 topic echo /joint_states
ros2 topic echo /tf
ros2 topic echo /tf_static --qos-durability transient_local
ros2 run tf2_ros tf2_echo world tool0
ros2 run tf2_tools view_frames
```

`JointState` 中至少应有：

```text
name: [shoulder_joint, elbow_joint]
position: [q1, q2]
```

本模型的末端平面位置可以手算：

$$
x=0.4\cos q_1+0.3\cos(q_1+q_2)
$$

$$
y=0.4\sin q_1+0.3\sin(q_1+q_2),\qquad z=0.1
$$

例如 $q_1=0,q_2=0$ 时，`tool0` 应在 `(0.7, 0, 0.1)`；$q_1=\pi/2,q_2=0$ 时应接近 `(0, 0.7, 0.1)`。用 `tf2_echo` 与公式比较，是检查坐标和关节轴最直接的方法。

## 12. `robot_state_publisher` 的源码工作链

```text
robot_description XML
  → URDF parser 生成 Link/Joint 模型
  → KDL/内部树结构划分 fixed 与 movable segment
  → fixed joint 变换发布到 /tf_static

/joint_states
  → 按 joint name 查找当前 position
  → 计算 revolute/prismatic joint transform
  → 与 joint origin、父级 transform 组合
  → 发布动态 /tf
```

`robot_state_publisher` 不会控制关节，也不会凭空生成真实角度。RViz 阶段是 `joint_state_publisher_gui` 发布测试角度；Gazebo 阶段则由 `joint_state_broadcaster` 发布仿真状态。真实机器人应由驱动读取编码器后发布。

## 13. 添加 `ros2_control` 控制器配置

创建 `config/controllers.yaml`：

```yaml
controller_manager:
  ros__parameters:
    update_rate: 100
    use_sim_time: true

    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster

    arm_controller:
      type: joint_trajectory_controller/JointTrajectoryController

arm_controller:
  ros__parameters:
    joints:
      - shoulder_joint
      - elbow_joint
    command_interfaces:
      - position
    state_interfaces:
      - position
      - velocity
    allow_partial_joints_goal: false
    open_loop_control: false
```

三层职责不要混淆：

- URDF `<ros2_control>` 声明硬件系统、Joint 和 command/state interface。
- `controllers.yaml` 声明加载哪些控制器及其关节列表。
- Gazebo 插件把 `ros2_control` 读写映射到仿真 Joint。

任何一层关节名不一致，控制器都无法激活。

## 14. Gazebo 启动文件

创建 `launch/gazebo.launch.py`：

```python
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, RegisterEventHandler
from launch.event_handlers import OnProcessExit
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    description_share = get_package_share_directory('urdf_arm_description')
    gazebo_share = get_package_share_directory('gazebo_ros')
    xacro_file = os.path.join(
        description_share, 'urdf', 'urdf_arm.urdf.xacro'
    )

    robot_description = ParameterValue(
        Command(['xacro ', xacro_file, ' use_gazebo:=true']),
        value_type=str,
    )

    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(gazebo_share, 'launch', 'gazebo.launch.py')
        )
    )

    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        parameters=[{
            'robot_description': robot_description,
            'use_sim_time': True,
        }],
        output='screen',
    )

    spawn_robot = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        arguments=[
            '-entity', 'urdf_arm',
            '-topic', 'robot_description',
        ],
        output='screen',
    )

    joint_state_broadcaster = Node(
        package='controller_manager',
        executable='spawner',
        arguments=['joint_state_broadcaster',
                   '--controller-manager', '/controller_manager'],
        output='screen',
    )

    arm_controller = Node(
        package='controller_manager',
        executable='spawner',
        arguments=['arm_controller',
                   '--controller-manager', '/controller_manager'],
        output='screen',
    )

    # 机器人成功插入 Gazebo 后再请求加载控制器。
    start_controllers = RegisterEventHandler(
        OnProcessExit(
            target_action=spawn_robot,
            on_exit=[joint_state_broadcaster, arm_controller],
        )
    )

    return LaunchDescription([
        gazebo,
        robot_state_publisher,
        spawn_robot,
        start_controllers,
    ])
```

重新构建并启动：

```bash
cd ~/ros2_ws
colcon build --symlink-install --packages-select urdf_arm_description
source install/setup.bash
ros2 launch urdf_arm_description gazebo.launch.py
```

若 Gazebo 已有残留进程或同名实体，先正常关闭旧进程再重新启动，不要同时运行 RViz 的 `joint_state_publisher_gui`，否则两个节点会争相发布同名 Joint 状态。

## 15. 检查控制器和硬件接口

```bash
ros2 control list_controllers
ros2 control list_hardware_components
ros2 control list_hardware_interfaces
ros2 topic echo /joint_states
ros2 action list | grep arm_controller
```

正常状态应包含：

```text
joint_state_broadcaster  active
arm_controller           active
```

如果控制器是 `unconfigured` 或 `inactive`，重点检查终端日志中的关节名、接口名和 YAML 路径，而不是反复重启。

## 16. 发送一条轨迹并观察完整链路

发送 3 秒内到达 `shoulder=0.7 rad, elbow=-0.5 rad` 的轨迹：

```bash
ros2 action send_goal \
  /arm_controller/follow_joint_trajectory \
  control_msgs/action/FollowJointTrajectory \
  "{trajectory: {
    joint_names: [shoulder_joint, elbow_joint],
    points: [
      {positions: [0.7, -0.5], time_from_start: {sec: 3, nanosec: 0}}
    ]
  }}"
```

数据路径为：

```mermaid
flowchart LR
    A[FollowJointTrajectory Goal] --> B[joint_trajectory_controller]
    B --> C[position command interface]
    C --> D[gazebo_ros2_control]
    D --> E[Gazebo Joint]
    E --> F[state interface]
    F --> G[joint_state_broadcaster]
    G --> H[/joint_states]
    H --> I[robot_state_publisher]
    I --> J[/tf 与 RViz]
```

可以同时打开 RViz，只保留 `robot_state_publisher` 的一个实例，并设置 `use_sim_time=true`。最简单的方式是以后在 Gazebo launch 中再加入 RViz Node，而不是另开 `display.launch.py`。

## 17. 换成 STL/DAE 网格

几何模型验证通过后，再把 `visual` 换成网格：

```xml
<visual>
  <origin xyz="0 0 0" rpy="0 0 0"/>
  <geometry>
    <mesh filename="package://urdf_arm_description/meshes/shoulder.dae"
          scale="1 1 1"/>
  </geometry>
</visual>
```

注意：

- ROS 长度单位是米，角度单位是弧度；很多 CAD/STL 使用毫米，可能要 `scale="0.001 0.001 0.001"`。
- DAE 可带材质，STL 通常只带几何。
- 复杂视觉网格可以保留，但 collision 应使用简化 Box/Cylinder/凸包，避免仿真过慢。
- CAD 导出原点不一定在关节轴，必须用 `origin` 校正，最好从 CAD 装配阶段就统一坐标系。
- Linux 文件名区分大小写，`Shoulder.STL` 与 `shoulder.stl` 不同。

## 18. 从 URDF 到真实机器人还缺什么

URDF 不是驱动程序。换成真机至少还需要：

1. 实现或接入 `ros2_control` Hardware Interface。
2. 在 `read()` 中读取编码器位置/速度/力矩。
3. 在 `write()` 中向总线或厂商 SDK 发送安全命令。
4. 将 URDF 零位、关节方向和传动比与真实编码器严格对齐。
5. 配置软限位、硬限位、速度/加速度限制和急停。
6. 低速、无负载、单关节逐一验证，再做多关节轨迹。

真机插件不能继续写 `gazebo_ros2_control/GazeboSystem`，而应改为真实硬件插件类名及其串口、CAN、EtherCAT 或网络配置。

## 19. 高频错误定位表

| 现象 | 常见原因 | 检查方式 |
| --- | --- | --- |
| RViz 显示 `No transform` | Fixed Frame 错、没有 JointState | 检查 `world`、`/joint_states`、`/tf` |
| 模型全部堆在原点 | Joint origin 缺失或为零 | 检查父子 Link 距离 |
| 臂杆一半伸向反方向 | Link 原点在关节，visual 未平移半臂长 | 修改 visual/collision/inertial origin |
| 转动方向错误 | axis 符号或坐标系理解错误 | RViz 显示 TF 轴并按右手定则检查 |
| RViz 有模型，Gazebo 飞走 | 质量/惯量非法、collision 重叠 | 检查 inertial、初始碰撞与日志 |
| Gazebo 模型不动 | 控制器未 active、接口不匹配 | `ros2 control list_*` |
| Controller 找不到 Joint | YAML、URDF、prefix 名称不一致 | 逐字符比较 Joint 名称 |
| Xacro 找不到文件 | Package 未安装资源或未 source | 检查 CMake install 并重新构建 |
| 网格巨大/极小 | 毫米与米混用 | 调整 mesh scale |
| 拖 GUI 时角度跳动 | 同时存在多个 `/joint_states` 发布者 | `ros2 topic info /joint_states -v` |

## 20. 每次修改后的验证顺序

```text
1. xacro 展开无错误
2. check_urdf 解析成功且树正确
3. RViz 静态外观与坐标系正确
4. GUI 逐关节验证方向、零位和限位
5. tf2_echo 与手算正运动学一致
6. collision/inertia 检查完成后再进 Gazebo
7. hardware interfaces 存在
8. controllers 为 active
9. 小角度、低速发送仿真轨迹
10. 最后才考虑 MoveIt 规划或真机驱动
```

不要一开始同时引入网格、Gazebo、MoveIt 和真机通信。先用 Box 构成的最小模型打通 TF，再逐层替换，错误才能定位到具体层。

## 21. 后续学习路线

- 为 `tool0` 增加相机、夹爪和各自光学坐标系。
- 用 `joint_state_publisher` 文件或 Python 节点发布测试姿态。
- 创建 SRDF、MoveIt Config Package，加入碰撞矩阵和规划组。
- 为轨迹增加速度、加速度和多点插值。
- 将两关节平面正运动学与 `/tf` 做自动化单元测试。
- 用真实 CAD 尺寸和质量替换教学参数，并用网格简化工具优化 collision。

只要能明确回答“每个 Link 原点在哪里、每个 Joint 轴朝哪里、质心和惯量相对哪个坐标系、当前 JointState 从谁发布”，URDF 就不再是一段靠试错拼出来的 XML，而是一份可以验证的机器人结构模型。

[[toc]]

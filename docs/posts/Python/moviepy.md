---
title: moviepy
date: 2025-06-17
created: 2025-06-17
updated: 2025-06-17
---

# 1. v2

- https://zulko.github.io/moviepy/

## 1.1. 安装

- pip install moviepy

> You do need to worry about ffplay if you plan on using video/audio previewing. For these cases, make sure to have
> ffplay installed (it can usually be found alongside ffmpeg) and make sure it is accessible to Python, or define a
> custom
> path (see below).

还需要安装ffmpeg，ffplay，用来进行视频预览。

> FFmpeg
> 全称：Fast Forward MPEG Audio/Video Encoder
> 简介：
> FFmpeg 是一个开源的跨平台多媒体处理工具，用于视频和音频的录制、转换、流处理等。它支持几乎所有主流的多媒体格式（包括编解码器），并提供丰富的滤镜、转码参数和协议适配功能。



> FFplay
> 全称：Fast Forward Player
> 简介：
> FFplay 是 FFmpeg 项目的一部分，是一个基于命令行的多媒体播放器。它基于 FFmpeg 的解码库构建，主要用于测试音视频流、查看媒体元数据或调试播放问题。



将所有视频、图片、文字抽象为一个**clip**，然后进行**操作**，最后**合成**。

```python
from moviepy import (
    VideoClip,
    VideoFileClip,
    ImageSequenceClip,
    ImageClip,
    TextClip,
    ColorClip,
    AudioFileClip,
    AudioClip,
)
```

> 可以用clip = ColorClip(size=(460, 380), color=black) ，ColorClip生成背景颜色

## 1.2. 变更

目前很多的LLM是基于v1版本训练的，不是v2版本的，所以生成的代码在很多时候不使用。目前的改变好下：

- 不再支持python2.0, 支持python3.7以上版本。
- .set_ 方法改为 .with_
- Clip.fx 方法改为 with_effects()
- clip.resize is now clip.resized
- clip.crop is now clip.cropped
- clip.rotate is now clip.rotated

关闭一个clip时需要注意：

- 当所有使用该clip的对象都关闭时，该clip才会被关闭。
- 即使是一个CompositeVideoClip，仍然需要手工的关闭这个CompositeVideoClip关联的所有clip。
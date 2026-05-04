---
title: comfyUI
date: 2025-06-17
---



- https://www.comfy.org/
- https://github.com/comfyanonymous/ComfyUI

## 1.3. comfyUI 安装

### 1.3.1. 后台安装一些pip的包

- nohup sh -c 'pip install -r /home/deipss/jupyter_files/ComfyUI/requirements.txt' > nohup.log 2>&1 &

### jupter py 安装
- https://github.com/comfyanonymous/ComfyUI/blob/master/notebooks/comfyui_colab.ipynb
因为当时在安装时，是使用的jupter方式来安装的，所以在启动comfy UI时，要从jupter启动

通过GitHub中的文件的安装脚本来看，是依赖pytorch的具体版本的
- pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu128


# ==============================================================================
# Scholarly AI 底层代码沙盒 - E2B 微虚拟机自定义模板
# 基础镜像: E2B 官方 Jupyter Code Interpreter
# ==============================================================================

FROM e2bdev/code-interpreter:latest

# 安装 PyTorch CPU 稳定版及核心科学计算库
# 预先打包后，用户在论坛执行代码可享受 200ms 内极速冷启动
RUN pip install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir matplotlib numpy pandas

# 验证安装
RUN python -c "import torch, matplotlib; print(f'PyTorch {torch.__version__} Ready in E2B!')"

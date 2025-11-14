# 使用官方的 Bun 镜像作为基础镜像
FROM oven/bun:1-alpine

# 安装 FFmpeg 和 FFprobe
RUN apk update && apk add --no-cache ffmpeg

# 创建工作目录
WORKDIR /app

# 复制整个项目（包括工作空间配置）
COPY . .

# 安装所有依赖（包括工作空间依赖）
RUN bun install

# 确保输出目录存在
RUN mkdir -p /app/apps/api/output /app/apps/api/temp

# 设置工作目录为 API 应用
WORKDIR /app/apps/api

# 暴露端口
EXPOSE 4000

# 启动应用
CMD ["bun", "run", "src/index.ts"]
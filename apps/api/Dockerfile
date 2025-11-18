# ========== 阶段 1: 准备依赖 ==========
FROM node:22-alpine AS deps

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

WORKDIR /workspace

# 复制所有 package.json（包括 apps 和 packages）
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/


# 复制 workspace 配置文件（利用缓存层）
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# 复制源代码（包括共享包）
COPY apps/api ./apps/api
COPY packages ./packages

# 使用 pnpm deploy 将 api 及其 workspace 依赖复制到独立目录
# 这会自动处理符号链接和依赖解析
RUN pnpm --filter=api deploy --prod /app


# ========== 阶段 2: 最终运行时镜像 ==========
FROM oven/bun:1-alpine
# 安装 FFmpeg（在 Alpine 上支持 arm64 和 amd64）
RUN apk add --no-cache ffmpeg

WORKDIR /app

# 从 deps 阶段复制已准备好的应用（包含 workspace 依赖）
COPY --from=deps /app ./

# 创建输出和临时目录
RUN mkdir -p /app/output /app/temp

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 4000

# 健康检查（可选）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# 启动应用
CMD ["bun", "run", "src/index.ts"]

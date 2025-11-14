# 第一阶段：构建 React 应用
FROM node:22-alpine  AS base
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
# 安装所有依赖
RUN pnpm install 
# 构建所有必需的包（包括 shared-configs 和 shared-utils）
RUN pnpm run -r build
# 使用 deploy 提取 web 项目及其依赖
RUN pnpm deploy --filter=web --prod /prod/web

# 第二阶段：使用 Nginx 部署静态文件
FROM nginx:1.29-alpine AS production
COPY --from=build /prod/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
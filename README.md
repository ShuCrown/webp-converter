# 动机

搭建 web 项目 需要很多图片资源，每次都要线上压缩，且只找到同格式压缩工具，没有转成体积更小的 webp 格式的
调研时发现 ffmpeg 可以处理图片，且体积更小，但不想命令行一个个一个处理，所以想写一个 webp 转换工具，可以批量处理图片，且批量打包所有本次处理的图片

# 环境
node v22
预先安装ffmpeg

# 本地安装方式

```bash
pnpm install
```

```bash
pnpm dev
```

# 部署

```bash
docker compose build
```

```bash
docker compose up -d
```

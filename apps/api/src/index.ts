import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { config, certificates } from "shared-configs";
import { uploadRoutes } from "./routes/upload";
import { ensureDir } from "./utils";

// 确保目录存在
await ensureDir("./temp");
await ensureDir("./output");
await ensureDir("./public");

const app = new Elysia({
  // 在 Docker 环境中不使用 TLS，直接通过 HTTP 通信
  ...(process.env.NODE_ENV !== "production" && {
    serve: {
      tls: {
        cert: Bun.file(certificates.cert),
        key: Bun.file(certificates.key),
      },
    },
  }),
})
  // 启用 CORS
  .use(cors())

  // 输出目录静态访问
  .use(
    staticPlugin({
      assets: "output",
      prefix: "/",
      noCache: true,
    })
  )

  // API 路由
  .use(uploadRoutes)

  // 健康检查
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // 错误处理
  .onError(({ code, error, set, path }) => {
    console.error("Error:", error);

    if (code === "VALIDATION") {
      set.status = 422;
      return {
        success: false,
        error: "Validation failed",
        details: error.message,
      };
    }

    if (code === "NOT_FOUND") {
      if (path.startsWith("/output/")) {
        // 让静态插件处理，不返回自定义错误
        return;
      }
      set.status = 404;
      return {
        success: false,
        error: "Route not found",
      };
    }

    set.status = 500;
    return {
      success: false,
      error: "Internal server error",
    };
  })
  .listen({
    hostname: "0.0.0.0",
    port: config.https.port,
  });

console.log(
  `🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
);

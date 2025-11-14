import { Elysia, sse, t } from "elysia";
import {  formatFileSize, isImageFile } from "shared-utils";
import { randomUUID } from "crypto";
import path, { join } from "path";
import { unlink, stat } from "fs/promises";
import { spawn } from "child_process";
import { readdirSync, statSync, readFileSync } from "fs";
import JSZip from "jszip";
import { ensureDir } from "../utils";
export interface ConversionResult {
  status: string;
  originalSize: number;
  convertedSize?: string;
  downloadUrl?: string;
  compressionRatio?: number;
}
//  存储任务进度
const taskProgress = new Map<string, ConversionResult>();

export const uploadRoutes = new Elysia({ prefix: "/api" })
  .post(
    "/compress",
    async ({ body, set }) => {
      const { file, key } = body;
      const taskId = randomUUID();

      // 验证文件
      if (!isImageFile(file)) {
        set.status = 422;
        return {
          success: false,
          error: `上传文件 ${file.name} 非图片文件`,
        };
      }

      if (file.size > 10 * 1024 * 1024) {
        set.status = 422;
        return {
          success: false,
          error: `上传文件 ${file.name} 超过 10MB上限`,
        };
      }
      // 异步处理图片转换
      processImage(taskId, file, key);
      taskProgress.set(taskId, {
        originalSize: file.size,
        status: "processing",
      });

      return { taskId };
    },
    {
      body: t.Object({
        file: t.File({
          format: "image/*",
        }),
        key: t.String(),
      }),
    }
  )
  // SSE 进度推送接口
  .get("/progress/:taskId", async function* ({ params }) {
    const { taskId } = params;

    while (true) {
      const progress = taskProgress.get(taskId);

      if (!progress) {
        yield sse({ event: "error", data: { message: "任务不存在" } });
        break;
      }

      yield sse({
        event: "progress",
        data: progress,
      });

      // 任务完成或失败时结束 SSE 流
      if (progress.status === "completed" || progress.status === "failed") {
        taskProgress.delete(taskId);
        break;
      }

      await Bun.sleep(100); // 每 100ms 推送一次进度
    }
  })
  // 下载单个文件
  .get("/download/:key/:fileName", async ({ params, set }) => {
    const { key, fileName } = params;
    const filePath = `./output/${key}/${fileName}`;
    try {
      // 使用 Bun.file() 而不是 readFile
      const file = Bun.file(filePath);

      // 检查文件是否存在
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "file not found" };
      }

      // Bun.file 可以直接传入 Response，会自动流式传输
      return new Response(file, {
        headers: {
          "Content-Type": fileName.endsWith(".zip")
            ? "application/zip"
            : file.type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": file.size.toString(), // 添加文件大小
        },
      });
    } catch (error) {
      set.status = 404;
      return { error: "file not found" };
    }
  })
  // 下载这个目录文件
  .get("/download/zip/:taskId", async ({ params, set }) => {
    const { taskId } = params;
    const directoryToZip = path.join("./output", taskId);
    try {
      const zip = new JSZip();

      // 递归添加目录中的所有文件
      const addFilesToZip = (currentPath: string, zipFolder: JSZip) => {
        const files = readdirSync(currentPath);

        files.forEach((file) => {
          const filePath = join(currentPath, file);
          const stats = statSync(filePath);

          if (stats.isDirectory()) {
            // 递归处理子目录
            const subFolder = zipFolder.folder(file);
            if (subFolder) {
              addFilesToZip(filePath, subFolder);
            }
          } else {
            // 添加文件到 zip
            const fileContent = readFileSync(filePath);
            zipFolder.file(file, fileContent);
          }
        });
      };

      // 开始添加文件
      addFilesToZip(directoryToZip, zip);

      // 生成 zip 文件的 buffer
      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      // 返回 zip 文件
      return new Response(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="download.zip"',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "文件打包失败" }), {
        status: 500,
      });
    }
  });

// 处理图片转换
const processImage = async (taskId: string, file: File, key: string) => {
  const outputDir = `./output/${key}/`;

  const inputPath = `./temp/${randomUUID()}_${file.name}`;
  const outputPath = path.join(outputDir, `${path.parse(file.name).name}.webp`);
  await ensureDir(outputDir);
  try {
    // 保存上传的文件
    await Bun.write(inputPath, file);
    // 检测是否为动图
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-count_frames",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=nb_read_frames",
      "-of",
      "default=noprint_wrappers=1",
      inputPath,
    ]);

    let frameCount = 1;
    ffprobe.stdout.on("data", (data) => {
      frameCount = +data.toString().trim().replace("nb_read_frames=", "");
    });

    // 使用 FFmpeg 转换
    await new Promise<void>((resolve, reject) => {
      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe 检测失败: ${code}`));
          return;
        }

        // Step 2: 判断是否为动图（帧数 > 1 或 codec_name=apng/gif）
        const isAnimated = frameCount > 1;

        // Step 3: 构建 ffmpeg 参数
        const ffmpegArgs = ["-i", inputPath];

        // 如果是动图，添加循环参数（0=无限循环）
        if (isAnimated) {
          ffmpegArgs.push("-loop", "0");
        }

        ffmpegArgs.push(outputPath);

        // Step 4: 执行转换
        const ffmpeg = spawn("ffmpeg", ffmpegArgs);

        ffmpeg.on("close", async (code) => {
          const progressData = taskProgress.get(taskId);
          if (code === 0 && progressData) {
            // 获取转换后文件大小
            const convertedStats = await stat(outputPath);
            const convertedSize = convertedStats.size;
            // 计算压缩比例
            const ratio = +(
              (convertedSize / progressData.originalSize - 1) *
              100
            )
              .toFixed(2)
              .replace(/\.?0+$/, "");

            taskProgress.set(taskId, {
              status: "completed",
              originalSize: progressData.originalSize,
              convertedSize: formatFileSize(convertedSize),
              downloadUrl: `/api/download/${key}/${path.basename(outputPath)}`,
              compressionRatio: ratio,
            });

            resolve(void 0);
          } else {
            reject(new Error(`退出码: ${code}`));
          }
        });
      });
    });
  } catch (error) {
    console.error(`转换失败: ${file.name}`, error);
    const progress = taskProgress.get(taskId);
    if (progress) {
      progress.status = "failed";
    }
  } finally {
    // 删除临时文件
    await unlink(inputPath);
  }
};

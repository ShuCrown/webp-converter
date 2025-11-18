import React, { useState, type DragEvent } from "react";
import {
  Card,
  Flex,
  Avatar,
  Progress,
  Callout,
  Separator,
  Inset,
  Button,
  ScrollArea,
} from "@radix-ui/themes";
import {
  Bug,
  FileDown,
  FileUp,
  FolderDown,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { formatFileSize } from "shared-utils";

//生成随机数
const key = Math.random().toString(36).substring(4);
type TaskStatus = "compressing" | "completed" | "failed";

type CompressionTask = {
  taskId: string; // 由服务端返回的 id
  fileName: string;
  originalSize: number; // bytes
  previewUrl?: string; // URL.createObjectURL(file)
  status: TaskStatus;
  progress: number; // 0 - 100
  convertedSize?: number; // bytes
  compressionRatio: number; // 如 "45"
  downloadUrl: string;
  error?: string | null;
};

const handleDownload = async (url: string, fileName: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
const handlePreDownload = async (downloadUrl: string) => {
  let fileName = downloadUrl.split("/").pop() || "";
  let response;
  const outputUrl = downloadUrl.replace("/api/download", "/output");
  try {
    response = await fetch(downloadUrl);
    if (!response.ok) {
      console.log("outputUrl", outputUrl);

      response = await fetch(outputUrl);
      if (!response.ok) {
        toast.error("转换失败，请重试");
        return;
      }
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    handleDownload(url, fileName);
  } catch (error) {
    const response = await fetch(outputUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    handleDownload(url, fileName);
  }
};
export default function ImageConverter() {
  const [tasks, setTasks] = useState<Record<string, CompressionTask>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    validateAndSetFiles(selectedFiles);
  };

  // 处理拖拽上传
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };

  // 验证文件
  const validateAndSetFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length !== newFiles.length) {
      toast("已过滤非图片文件");
    }
    convertImages(validFiles);
  };
  // create 或 更新任务的辅助函数
  const upsertTask = (taskId: string, partial: Partial<CompressionTask>) => {
    setTasks((prev) => {
      const existing = prev[taskId] ?? {
        taskId,
        fileName: partial.fileName ?? "",
        originalSize: partial.originalSize ?? 0,
        status: "compressing",
        progress: 0,
      };

      return {
        ...prev,
        [taskId]: { ...existing, ...partial },
      };
    });
  };
  const handleDownloadZip = async () => {
    setLoading(true);
    const toastId = toast.loading("压缩包下载中...", { duration: 0 });
    try {
      const response = await fetch(`/api/download/zip/${key}`);

      if (!response.ok) throw new Error("下载失败");

      // 获取文件名
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "archive.zip";

      // 读取流
      const blob = await response.blob();

      // 创建下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      // 释放资源
      URL.revokeObjectURL(url);
      toast.success("下载成功");
    } catch (error) {
      console.error("下载失败:", error);
    } finally {
      setLoading(false);
      toast.remove(toastId);
    }
  };

  // 批量转换
  const convertImages = async (files: File[]) => {
    if (files.length === 0) {
      toast.error("请选择至少一个图片文件");
      return;
    }
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);

      try {
        const response = await fetch("/api/compress", {
          method: "POST",
          body: formData,
        });
        const res = await response.json();
        const { taskId, error } = res;

        if (error) {
          throw new Error(error);
        }

        // 创建任务占位（包含预览）
        upsertTask(taskId, {
          fileName: file.name,
          originalSize: file.size,
          previewUrl: URL.createObjectURL(file),
          status: "compressing",
          progress: 0,
          error: null,
        });
        // 监听进度更新
        const eventSource = new EventSource(`/api/progress/${taskId}`);
        let percent = 0;
        eventSource.addEventListener("progress", (event) => {
          const data = event.data ? JSON.parse(event.data) : {};
          console.log("progress", percent);
          if (percent < 90) {
            percent = percent + 10;
          }
          // 更新进度与可能的中间 convertedSize
          upsertTask(taskId, {
            ...data,
            downloadUrl: data?.downloadUrl || "",
            progress: data?.downloadUrl ? 100 : percent,
          });
        });

        eventSource.addEventListener("error", () => {
          upsertTask(taskId, {
            error: "转换失败，请重试",
            progress: 0,
          });
          eventSource.close();
        });
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "转换失败，请重试";
        setErrors((prev) => [...prev, errMsg]);
      }
    }
  };

  return (
    <div className="max-w-[700px] mx-auto p-8">
      <div className="text-2xl font-bold text-center">图片批量转 WebP 工具</div>

      <div
        className={`border border-dashed border-gray-400 rounded-sm my-2 p-4 h-40 `}
        style={
          isDragging
            ? {
                borderColor: "#007bff",
                backgroundColor: "#f0f8ff",
              }
            : {}
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor="file-input"
          className="h-full flex items-center justify-center flex-col gap-2 cursor-pointer"
        >
          <p className="text-xl font-semibold">点击选择图片或拖拽到此处</p>
          <p className="text-sm">支持 JPG, PNG, GIF 等格式</p>
        </label>
      </div>
      {errors.length > 0 &&
        errors.map((error) => (
          <Callout.Root
            color="red"
            role="alert"
            className="my-1 w-full flex!"
            key={error}
            size="1"
          >
            <Callout.Icon>
              <TriangleAlert />
            </Callout.Icon>
            <div className="flex-1 flex justify-between">
              <Callout.Text>{error}</Callout.Text>
              <Trash2
                className="size-4 cursor-pointer"
                onClick={() => {
                  setErrors((prev) => prev.filter((item) => item !== error));
                }}
              />
            </div>
          </Callout.Root>
        ))}
      {Object.keys(tasks).length > 0 && (
        <Card className="w-full mt-2 pr-0!">
          <ScrollArea
            scrollbars="vertical"
            style={{ maxHeight: 500, paddingRight: 12 }}
          >
            {Object.values(tasks).map((task) => {
              return (
                <Flex className="w-full" key={task.taskId} gap="2">
                  <Avatar src={task.previewUrl} fallback={""} />
                  <Flex className="flex-1" direction="column">
                    <Flex justify={"between"} gap="2">
                      <div>
                        <div className="font-black text-sm">
                          {task.fileName}
                        </div>
                        <div className="text-xs">
                          {formatFileSize(task.originalSize)}
                        </div>
                      </div>
                      <div>
                        {task.downloadUrl ? (
                          <Flex gap="2" align={"center"}>
                            <div>
                              <div className="font-bold text-sm">
                                {task.compressionRatio}%
                              </div>
                              <div className="text-xs">
                                {task.convertedSize}
                              </div>
                            </div>

                            <Button
                              color={
                                task.compressionRatio > 0 ? "red" : "indigo"
                              }
                              variant="soft"
                              onClick={() => {
                                handlePreDownload(task.downloadUrl);
                              }}
                              className="cursor-pointer"
                            >
                              {task.compressionRatio > 0 ? (
                                <FileUp className="size-4" />
                              ) : (
                                <FileDown className="size-4" />
                              )}
                              <span className="text-xs">webp</span>
                            </Button>
                          </Flex>
                        ) : task.status !== "failed" ? (
                          "compressing"
                        ) : (
                          <Button color="red" variant="soft">
                            <Bug className="size-4" />
                            <span className="text-xs"> 转换失败</span>
                          </Button>
                        )}
                      </div>
                    </Flex>
                    {!task.downloadUrl && task.status !== "failed" && (
                      <Progress
                        duration="10s"
                        size="1"
                        value={task.progress}
                        className="mt-1"
                      />
                    )}
                    <Separator my="2" size="4" />
                  </Flex>
                </Flex>
              );
            })}
          </ScrollArea>
          {Object.keys(tasks).length > 1 && (
            <Inset clip="padding-box" side="bottom">
              <Flex
                gap="2"
                justify="center"
                align="center"
                py="2"
                className="bg-gray-200"
              >
                <Button onClick={handleDownloadZip} loading={loading}>
                  <FolderDown />
                  下载全部
                </Button>
              </Flex>
            </Inset>
          )}
        </Card>
      )}
      <Toaster />
    </div>
  );
}

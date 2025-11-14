import { mkdir } from "fs/promises";
/**
 * 确保目录存在
 */
export async function ensureDir(dir:string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }
}
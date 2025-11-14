/**
 * 验证文件是否为图片
 */
export function isImageFile(file) {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
  ];

  return allowedTypes.includes(file.type);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * 验证文件类型是否在允许列表中
 */
export function isValidFileType(filename, allowedExtensions) {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  return `${timestamp}-${random}.${extension}`;
}
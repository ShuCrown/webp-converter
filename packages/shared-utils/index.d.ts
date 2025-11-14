/**
 * 验证文件是否为图片
 */
export declare function isImageFile(file: File): boolean;

/**
 * 格式化文件大小
 */
export declare function formatFileSize(bytes: number): string;

/**
 * 获取文件扩展名
 */
export declare function getFileExtension(filename: string): string;

/**
 * 验证文件类型是否在允许列表中
 */
export declare function isValidFileType(filename: string, allowedExtensions: string[]): boolean;

/**
 * 生成唯一文件名
 */
export declare function generateUniqueFilename(originalName: string): string;
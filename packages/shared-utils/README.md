# Shared Utils Package

这个包包含了项目共享的工具函数，可以在 API 和 Web 项目中共同使用。

## 安装依赖

在需要使用共享工具函数的项目中，package.json 中添加：
```json
{
  "dependencies": {
    "shared-utils": "workspace:*"
  }
}
```

## 可用函数

### `ensureDir(dir: string): Promise<void>`
确保目录存在，如果不存在则创建。

```javascript
import { ensureDir } from 'shared-utils';

await ensureDir("./uploads");
await ensureDir("./output");
```

### `isImageFile(file: File): boolean`
验证文件是否为图片类型。

```javascript
import { isImageFile } from 'shared-utils';

const file = new File([blob], "image.jpg", { type: "image/jpeg" });
if (isImageFile(file)) {
  console.log("这是图片文件");
}
```

### `formatFileSize(bytes: number): string`
格式化文件大小为易读的字符串。

```javascript
import { formatFileSize } from 'shared-utils';

console.log(formatFileSize(1024));        // "1.00 KB"
console.log(formatFileSize(1048576));     // "1.00 MB"
console.log(formatFileSize(512));         // "512 B"
```

### `getFileExtension(filename: string): string`
获取文件扩展名。

```javascript
import { getFileExtension } from 'shared-utils';

console.log(getFileExtension("image.jpg"));    // "jpg"
console.log(getFileExtension("document.pdf"));  // "pdf"
```

### `isValidFileType(filename: string, allowedExtensions: string[]): boolean`
验证文件类型是否在允许列表中。

```javascript
import { isValidFileType } from 'shared-utils';

const allowedTypes = ["jpg", "png", "webp"];
console.log(isValidFileType("image.jpg", allowedTypes));  // true
console.log(isValidFileType("file.pdf", allowedTypes));   // false
```

### `generateUniqueFilename(originalName: string): string`
生成基于时间戳和随机数的唯一文件名。

```javascript
import { generateUniqueFilename } from 'shared-utils';

const uniqueName = generateUniqueFilename("image.jpg");
console.log(uniqueName); // "1634567890-abc123.jpg"
```

## TypeScript 支持

所有函数都包含完整的 TypeScript 类型定义，可以直接在 TypeScript 项目中使用。
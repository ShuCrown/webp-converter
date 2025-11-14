# Shared Configs Package

这个包包含了项目的共享配置文件，包括 SSL 证书和其他通用配置。

## 使用方法

### 安装依赖
在需要使用共享配置的项目中，package.json 中添加：
```json
{
  "dependencies": {
    "shared-configs": "workspace:*"
  }
}
```

### 使用证书
```javascript
import { certificates } from 'shared-configs';

// 获取证书路径
const certPath = certificates.cert;  // cert.pem 路径
const keyPath = certificates.key;    // key.pem 路径
```

### 使用完整配置
```javascript
import { config } from 'shared-configs';

// 获取 HTTPS 配置
const httpsConfig = config.https;
// {
//   port: 443,
//   host: '192.168.110.37'
// }

// 获取证书配置
const certConfig = config.certificates;
// {
//   cert: '/path/to/cert.pem',
//   key: '/path/to/key.pem'
// }
```

## 文件结构

```
shared-configs/
├── package.json          # 包配置
├── index.js             # 主入口文件
├── index.d.ts           # TypeScript 类型定义
└── certificates/        # 证书目录
    ├── cert.pem         # SSL 证书
    └── key.pem          # SSL 私钥
```

## 更新证书

如果需要更新证书文件，只需替换 `certificates/` 目录下的文件即可，所有引用该包的项目都会自动使用新的证书。
const os = require("os");
const path = require("path");

// 证书配置
const certificates = {
  cert: path.join(__dirname, "certificates", "cert.pem"),
  key: path.join(__dirname, "certificates", "key.pem"),
};
// 获取本地局域网 IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部和 IPv6 地址
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; // 备用地址
}

// 其他共享配置
const config = {
  https: {
    port: 4100,
    host: getLocalIP(),
  },
};

module.exports = {
  config,
  certificates,
};

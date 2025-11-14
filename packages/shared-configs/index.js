const path = require('path');

// 证书配置
const certificates = {
  cert: path.join(__dirname, 'certificates', 'cert.pem'),
  key: path.join(__dirname, 'certificates', 'key.pem')
};

// 其他共享配置
const config = {
  https: {
    port: 4000,
    host: '192.168.110.37'
  },
  certificates
};

module.exports = {
  config,
  certificates
};
/**
 * 配置文件
 */
const path = require('path');

module.exports = {
  // 服務器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // Line Bot配置
  lineBot: {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
    staffIds: (process.env.STAFF_IDS || '').split(',').filter(id => id.trim() !== '')
  },

  googleCloudStorage: {
    enabled: true,
    bucketName: 'kgerickg-wedding-bot', // 替換成你的 GCS 儲存空間名稱
    // GCP 環境中會自動使用預設認證
    projectId: 'neon-metric-459818-v5' 
  },
  imgur: {
    enabled: false, // 如果只想用 GCS，可以關閉 Imgur
    // ... imgur 其他設定
  },
}; 
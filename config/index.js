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
  
  // 資源配置
  resources: {
    // 數據文件路徑
    guestsCsvPath: path.join(__dirname, '../data/guests.csv'),
    
    // 圖片目錄
    tablesDir: path.join(__dirname, '../public/tables'),
    imagesDir: path.join(__dirname, '../public/images'),
    
    // 圖片URL基礎路徑 (取決於部署環境)
    baseUrl: process.env.HOST_URL || 'http://localhost:3000'
  },
  
  // 查詢限制配置
  queryLimit: {
    // 每個用戶每日最大查詢次數
    maxDailyQueries: parseInt(process.env.MAX_DAILY_QUERIES || '5', 10)
  }
}; 
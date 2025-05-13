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
  
  // Google Sheets 配置
  googleSheets: {
    // Google API 服務帳號金鑰文件路徑
    keyFilePath: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../config/service-account-key.json'),
    // Google Sheets文件ID（從URL獲取）
    spreadsheetId: process.env.SHEETS_ID || '',
    // 數據範圍（工作表名稱和範圍）
    range: process.env.SHEETS_RANGE || 'guests!A:B',
    // 是否啟用Google Sheets（如果為false，則使用本地CSV）
    enabled: process.env.USE_GOOGLE_SHEETS === 'true'
  },
  
  // Imgur API 配置
  imgur: {
    // 是否啟用 Imgur 照片功能
    enabled: process.env.USE_IMGUR === 'true',
    // Imgur API Client ID
    clientId: process.env.IMGUR_CLIENT_ID || '',
    // Imgur 相簿哈希值
    albumHash: process.env.IMGUR_ALBUM_HASH || ''
  },
  
  // 查詢限制配置
  queryLimit: {
    // 每個用戶每日最大查詢次數
    maxDailyQueries: parseInt(process.env.MAX_DAILY_QUERIES || '5', 10)
  }
}; 
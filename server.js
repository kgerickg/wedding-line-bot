// server.js
// 婚禮Line Bot 啟動腳本
const appModule = require('./index'); // 從 index.js 載入
const expressApp = appModule.weddingLineBot; // 從模組中取得實際的 Express app
const PORT = process.env.PORT || 3000;

// 只有當 server.js 是主模組 (即直接用 node server.js 執行) 時才啟動伺服器
if (require.main === module) {
  if (!expressApp || typeof expressApp.listen !== 'function') {
    console.error('錯誤：未能正確獲取 Express app 實例，無法啟動伺服器。');
    process.exit(1);
  }
  expressApp.listen(PORT, async () => {
    console.log(`婚禮 Line Bot 服務已啟動，監聽端口: ${PORT}`);
    console.log(`如果要通過 ngrok 進行測試，請執行: ngrok http ${PORT}`);
    console.log('請確保在 LINE Developers Console 中設定 Webhook URL: https://您的ngrok網址/callback');
    
    // 檢查 NGROK_URL 是否設定
    if (!process.env.NGROK_URL) {
      console.log('\n⚠️ 警告: 未設定 NGROK_URL 環境變數');
      console.log('請設定 NGROK_URL 環境變數為您的 ngrok 網址，例如：');
      console.log('在 .env 檔案中加入：NGROK_URL=https://your-ngrok-url.ngrok-free.app\n');
    } else {
      console.log(`使用 NGROK_URL: ${process.env.NGROK_URL}`);
    }
  });
} 
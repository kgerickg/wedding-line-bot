// server.js
// 婚禮Line Bot 啟動腳本
const app = require('./src/app');
const richMenuService = require('./src/services/richMenuService');

// 定義埠號
const PORT = process.env.PORT || 3000;

// 啟動服務
app.listen(PORT, async () => {
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
  
  // 取得LINE客戶端實例
  const client = app.get('lineClient');
  
  // 檢查是否已設置Rich Menu
  try {
    await richMenuService.setupRichMenu(client);
    console.log('Rich Menu 設置成功或已存在');
  } catch (error) {
    console.error('設置 Rich Menu 失敗:', error);
  }
}); 
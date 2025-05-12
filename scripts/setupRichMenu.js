// setupRichMenu.js
// 單獨執行設定Rich Menu的腳本
require('dotenv').config({ path: './env/.env' });
const line = require('@line/bot-sdk');
const { setupRichMenu } = require('./src/richMenuService');

// 配置
const config = {
  channelAccessToken: process.env.channelAccessToken,
  channelSecret: process.env.channelSecret
};

// 創建LINE客戶端
const client = new line.Client(config);

// 執行設定
(async () => {
  try {
    console.log('開始設定Rich Menu...');
    const richMenuId = await setupRichMenu(client);
    console.log(`Rich Menu設定成功！ID: ${richMenuId}`);
    process.exit(0);
  } catch (error) {
    console.error('設定Rich Menu失敗:', error);
    process.exit(1);
  }
})(); 
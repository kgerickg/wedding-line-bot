// cli.js
// CLI 互動測試查詢座位和婚紗照片
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 初始化環境變數，以確保配置正確載入
require('dotenv').config({ path: path.join(__dirname, '../config/env/.env') });

// 動態導入模組，確保導入時環境變數已設置
const config = require('../config');
const guestService = require('../src/services/guestService');
const photoService = require('../src/services/photoService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.log('\n=== 婚禮服務選單 Wedding Service Menu ===');
  console.log('1. 座位查詢 (Seat Lookup)');
  console.log('2. 婚紗照片 (Wedding Photo)');
  console.log('3. 清理緩存 (Clear Cache)');
  console.log('4. 離開 (Exit)');
  rl.question('請選擇 (Please select): ', (choice) => {
    switch(choice) {
      case '1': 
        askForName();
        break;
      case '2':
        showPhoto();
        break;
      case '3':
        clearCache();
        break;
      case '4':
        rl.close();
        break;
      default:
        console.log('無效選擇，請重試。\nInvalid choice, please try again.');
        showMenu();
    }
  });
}

function askForName() {
  rl.question('請輸入姓名 (Enter name): ', async (name) => {
    try {
      console.log('正在查詢...');
      // 第二個參數為false表示不強制刷新緩存
      const result = await guestService.querySeat(name);
      console.log(result);
      
      // 測試緩存狀態的第二次查詢
      console.log('\n[測試緩存] 再次查詢相同姓名:');
      const cachedResult = await guestService.querySeat(name);
      console.log(`查詢結果: ${cachedResult.success ? '找到了！' : '未找到'}`);
    } catch (error) {
      console.error('查詢失敗:', error);
    }
    showMenu();
  });
}

function showPhoto() {
  const photoResult = photoService.getRandomPhoto();
  
  if (!photoResult.success) {
    console.log(photoResult.message);
    showMenu();
    return;
  }
  
  console.log(photoResult.message);
  console.log(`照片路徑 (Photo path): ${photoResult.path}`);
  
  try {
    // 在實際的 Line Bot 中，這裡會傳送圖片給使用者
    // 在 CLI 模式下，只顯示照片已準備好的訊息
    const fileStats = fs.statSync(photoResult.path);
    console.log(`照片大小 (Photo size): ${Math.round(fileStats.size / 1024)} KB`);
    console.log('照片已準備好。在 Line Bot 中會直接顯示此圖片。');
    console.log('Photo is ready. It would be displayed directly in Line Bot.');
  } catch (error) {
    console.error('無法讀取照片:', error);
  }
  
  showMenu();
}

/**
 * 清理緩存功能
 */
function clearCache() {
  console.log('正在清理緩存...');
  
  if (config.googleSheets.enabled) {
    try {
      const result = guestService.clearCache();
      if (result) {
        console.log('✅ 緩存已成功清理！下次查詢將重新從 Google Sheets 獲取資料。');
      } else {
        console.log('⚠️ 未啟用 Google Sheets 或清理操作未成功。');
      }
    } catch (error) {
      console.error('❌ 清理緩存時發生錯誤:', error);
    }
  } else {
    console.log('⚠️ 當前未啟用 Google Sheets，無需清理緩存。');
  }
  
  showMenu();
}

// 啟動應用程式
console.log('歡迎使用婚禮服務 CLI 測試工具');
console.log('Welcome to Wedding Service CLI Test Tool');

// 顯示數據源信息
if (config.googleSheets.enabled) {
  console.log('使用 Google Sheets 作為數據源');
  console.log(`Spreadsheet ID: ${config.googleSheets.spreadsheetId}`);
} else {
  console.log('使用本地 CSV 作為數據源');
  console.log(`CSV 路徑: ${config.resources.guestsCsvPath}`);
}

showMenu(); 
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
  console.log('4. 刷新照片快取 (Refresh Photo Cache)');
  console.log('5. 離開 (Exit)');
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
        refreshPhotoCache();
        break;
      case '5':
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

async function showPhoto() {
  console.log('正在獲取婚紗照片...');
  try {
    // 由於 photoService.getRandomPhoto 現在是非同步函數，需要使用 await
    const photoResult = await photoService.getRandomPhoto();
    
    if (!photoResult.success) {
      console.log(photoResult.message);
      showMenu();
      return;
    }
    
    console.log(photoResult.message);
    
    // 檢查照片來源是 Imgur 還是本地
    if (photoResult.url) {
      // Imgur 照片
      console.log('照片來源: Imgur API');
      console.log(`照片 URL: ${photoResult.url}`);
      console.log(`照片標題: ${photoResult.title}`);
      console.log('在 LINE Bot 中會直接顯示此 Imgur 照片。');
    } else {
      // 本地照片
      console.log('照片來源: 本地檔案');
      console.log(`照片路徑: ${photoResult.path}`);
      
      try {
        const fileStats = fs.statSync(photoResult.path);
        console.log(`照片大小: ${Math.round(fileStats.size / 1024)} KB`);
        console.log('照片已準備好。在 Line Bot 中會直接顯示此圖片。');
      } catch (error) {
        console.error('無法讀取本地照片:', error);
      }
    }
  } catch (error) {
    console.error('獲取照片時發生錯誤:', error);
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

/**
 * 刷新照片快取功能
 */
async function refreshPhotoCache() {
  console.log('正在刷新 Imgur 照片快取...');
  
  if (config.imgur.enabled) {
    try {
      const result = await photoService.refreshImgurCache();
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 刷新照片快取時發生錯誤:', error);
    }
  } else {
    console.log('⚠️ 當前未啟用 Imgur API，無需刷新照片快取。');
  }
  
  showMenu();
}

// 啟動應用程式
console.log('歡迎使用婚禮服務 CLI 測試工具');
console.log('Welcome to Wedding Service CLI Test Tool');

// 顯示數據源信息
if (config.googleSheets.enabled) {
  console.log('使用 Google Sheets 作為賓客數據源');
  console.log(`Spreadsheet ID: ${config.googleSheets.spreadsheetId}`);
} else {
  console.log('使用本地 CSV 作為賓客數據源');
  console.log(`CSV 路徑: ${config.resources.guestsCsvPath}`);
}

// 顯示照片源信息
if (config.imgur.enabled) {
  console.log('使用 Imgur 作為照片來源');
  console.log(`Imgur 相簿: ${config.imgur.albumHash ? '已設定' : '未設定'}`);
} else {
  console.log('使用本地目錄作為照片來源');
  console.log(`照片目錄: ${path.join(__dirname, '../data/pictures')}`);
}

showMenu(); 
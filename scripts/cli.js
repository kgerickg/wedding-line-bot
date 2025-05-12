// cli.js
// CLI 互動測試查詢座位和婚紗照片
const readline = require('readline');
const fs = require('fs');
const { querySeat } = require('./src/guestService');
const { getRandomPhoto } = require('./src/photoService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.log('\n=== 婚禮服務選單 Wedding Service Menu ===');
  console.log('1. 座位查詢 (Seat Lookup)');
  console.log('2. 婚紗照片 (Wedding Photo)');
  console.log('3. 離開 (Exit)');
  rl.question('請選擇 (Please select): ', (choice) => {
    switch(choice) {
      case '1': 
        askForName();
        break;
      case '2':
        showPhoto();
        break;
      case '3':
        rl.close();
        break;
      default:
        console.log('無效選擇，請重試。\nInvalid choice, please try again.');
        showMenu();
    }
  });
}

function askForName() {
  rl.question('請輸入姓名 (Enter name): ', (name) => {
    console.log(querySeat(name));
    showMenu();
  });
}

function showPhoto() {
  const photoResult = getRandomPhoto();
  
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

// 啟動應用程式
console.log('歡迎使用婚禮服務 CLI 測試工具');
console.log('Welcome to Wedding Service CLI Test Tool');
showMenu(); 
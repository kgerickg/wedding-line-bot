// src/services/googleSheetsService.js
// 從Google Sheets API讀取賓客資料
const { google } = require('googleapis');
const config = require('../../config');
const fs = require('fs');
const path = require('path');

/**
 * 創建Google Sheets API客戶端
 * @returns {Object} Google Sheets客戶端
 */
async function getSheetClient() {
  // 使用服務帳號認證
  const authOptions = {
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  };

  // 在 GCF/Cloud Run 環境中，如果服務帳號已正確設定給該服務，通常不需要 keyFile
  // GOOGLE_APPLICATION_CREDENTIALS 環境變數會被自動偵測 (如果你設定了它指向一個有效的金鑰檔並部署了該檔案)
  // 或者，函式本身運行的服務帳號若有權限，則無需任何額外 keyFile 設定。
  // 此處保留 keyFile 的邏輯，主要用於本地開發或當 GOOGLE_APPLICATION_CREDENTIALS 未自動生效時的備用。
  if (config.googleSheets.keyFilePath && fs.existsSync(config.googleSheets.keyFilePath)) {
    // 確保 keyFilePath 是一個相對於專案根目錄的有效路徑，或者是一個絕對路徑
    // 例如，如果 keyFile 在 config/service-account-key.json
    // 且 googleSheetsService.js 在 src/services/，那麼 keyFilePath 應該是 '../../config/service-account-key.json' 或類似
    // 最好在 config.js 中就設定好正確的相對路徑或絕對路徑
    authOptions.keyFile = path.resolve(__dirname, '../../', config.googleSheets.keyFilePath); // 假設 keyFilePath 是相對於專案根目錄的路徑
    console.log(`Using keyFile for Google Sheets: ${authOptions.keyFile}`);
  } else {
    console.log('Attempting to use default credentials for Google Sheets (e.g., from GCF service account or GOOGLE_APPLICATION_CREDENTIALS env var).');
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

/**
 * 從Google Sheets載入賓客資料
 * @returns {Promise<Map>} 賓客姓名與桌號的映射
 */
async function loadGuestsFromSheet() {
  try {
    const sheets = await getSheetClient();   
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: config.googleSheets.range,
    });
    
    const rows = response.data.values;
    const guests = new Map();
    
    // 跳過標題行
    for (let i = 1; i < rows.length; i++) {
      const [name, table] = rows[i];
      if (name && table) {
        guests.set(name, table.trim());
      }
    }
    
    // cache結果到記憶體中以提高效能
    guestsCache = {
      data: guests,
      timestamp: Date.now(),
    };
    
    return guests;
  } catch (error) {
    console.error('從Google Sheets載入賓客資料失敗:', error);
    return new Map();
  }
}

// 記憶體cache，避免頻繁API調用
let guestsCache = null;
const CACHE_TTL = 30 * 60 * 1000; // cache有效期30分鐘

/**
 * 獲取賓客資料，優先從cache獲取
 * @param {boolean} forceRefresh - 是否強制刷新，忽略cache
 * @returns {Promise<Map>} 賓客姓名與桌號的映射
 */
async function getGuests(forceRefresh = false) {
  // 如果強制刷新或cache不存在或已過期，則重新獲取
  if (forceRefresh || !guestsCache || (Date.now() - guestsCache.timestamp > CACHE_TTL)) {
    console.log(forceRefresh ? '強制刷新cache' : 'cache過期，重新獲取數據');
    return loadGuestsFromSheet();
  }
  
  // 否則使用cache
  const remainingSeconds = Math.round((CACHE_TTL - (Date.now() - guestsCache.timestamp))/1000);
  console.log(`使用cache數據，有效期剩餘 ${remainingSeconds} 秒（${Math.floor(remainingSeconds/60)}分${remainingSeconds%60}秒）`);
  return guestsCache.data;
}

/**
 * 清除cache，強制下次獲取數據時從Google Sheets獲取
 */
function clearCache() {
  guestsCache = null;
  console.log('賓客數據cache已清除');
  return true;
}

module.exports = { getGuests, clearCache }; 
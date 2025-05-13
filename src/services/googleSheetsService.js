// src/services/googleSheetsService.js
// 從Google Sheets API讀取賓客資料
const { google } = require('googleapis');
const config = require('../../config');

/**
 * 創建Google Sheets API客戶端
 * @returns {Object} Google Sheets客戶端
 */
async function getSheetClient() {
  // 使用服務帳號認證
  const auth = new google.auth.GoogleAuth({
    keyFile: config.googleSheets.keyFilePath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
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
const CACHE_TTL = 5 * 60 * 1000; // cache有效期5分鐘

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
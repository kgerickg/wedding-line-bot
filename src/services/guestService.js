// src/services/guestService.js
// 讀取本地 guests.csv 並查詢座位
const fs = require('fs');
const path = require('path');
const config = require('../../config');

// 修正路徑
const csvPath = path.join(__dirname, '../../data/guests.csv');
// 桌次圖位於 public/tables/ 目錄下，命名格式為 table_1.png, table_2.png...
const tableImagesDir = path.join(__dirname, '../../public/tables');

// 桌號對應的名稱
const tableNames = {
  '1': '主桌',
  '2': '爸爸同學',
  '3': '泡茶好朋友',
  '4': '後備軍人',
  '5': '建功親友',
  '6': '女方親友',
  '7': '男方親友',
  '8': '黃氏家族',
  '9': '爸爸朋友',
  '10': '女方親戚',
  '11': '咚咚大姿\n心動系!',
  '12': '陽光兒女\n永遠18歲!',
  '13': '永峻麻吉&\n魚親愛的家人',
  '14': '沐Gym微晨\n榮譽校友桌',
  '15': '誠樸勇仁!\n94姿優班',
  '16': 'Volando',
  '17': '小腳丫親子\n俱樂部',
  '18': '黃氏家族',
  '19': '黃氏家族',
  '20': '媽媽親友',
  '21': '打鐵夥伴',
  '22': '打鐵夥伴',
  '23': '打鐵親戚'
};

/**
 * 載入賓客資料
 * @returns {Map} 賓客姓名與桌號的映射
 */
function loadGuests() {
  try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.trim().split('\n');
    const guests = new Map();
    for (let i = 1; i < lines.length; i++) { // 跳過標題
      const [name, table] = lines[i].split(',');
      if (name && table) {
        guests.set(name, table.trim());
      }
    }
    return guests;
  } catch (error) {
    console.error('載入賓客資料失敗:', error);
    return new Map();
  }
}

/**
 * 獲取桌次圖URL
 * @param {string} tableNumber - 桌號
 * @returns {string} 桌次圖URL
 */
function getTableImageUrl(tableNumber) {
  // 從環境變數中獲取主機URL，或使用本地開發URL
  const baseUrl = process.env.HOST_URL || 'http://localhost:3000';
  return `${baseUrl}/api/tables/${tableNumber}`;
}

/**
 * 根據姓名查詢座位
 * @param {string} name - 賓客姓名
 * @returns {Object} 查詢結果，包含成功狀態、訊息和桌次圖片URL
 */
function querySeat(name) {
  const guests = loadGuests();
  if (guests.has(name)) {
    const table = guests.get(name);
    const tableImagePath = path.join(tableImagesDir, `table_${table}.png`);
    const imageExists = fs.existsSync(tableImagePath);
    const tableName = tableNames[table] || ''; // 獲取桌號對應的名稱，若無則為空字串
    
    return {
      success: true,
      message: `您的桌號是:第${table}桌(${tableName})`,
      tableNumber: table,
      tableName: tableName,
      imageExists: imageExists,
      imageUrl: getTableImageUrl(table),
      imageFileName: `table_${table}.png`
    };
  } else {
    return {
      success: false,
      message: '哎呀是不是打錯名字了呢，請重新輸入。\nNot found, please try again.'
    };
  }
}

module.exports = { loadGuests, querySeat }; 
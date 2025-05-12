// src/photoService.js
// 提供婚紗照片功能

const fs = require('fs');
const path = require('path');

// 照片目錄路徑
const photosDir = path.join(__dirname, '../../data/pictures');

/**
 * 獲取所有照片文件名稱
 * @returns {Array<string>} 照片文件名陣列
 */
function getAllPhotos() {
  try {
    // 只選取支援的圖片格式
    return fs.readdirSync(photosDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    });
  } catch (error) {
    console.error('讀取照片目錄失敗:', error);
    return [];
  }
}

/**
 * 獲取隨機照片的完整路徑
 * @returns {string|null} 隨機照片的路徑，失敗則返回null
 */
function getRandomPhotoPath() {
  const photos = getAllPhotos();
  if (photos.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * photos.length);
  const randomPhoto = photos[randomIndex];
  return path.join(photosDir, randomPhoto);
}

/**
 * 隨機取得一張照片並返回照片資訊
 * @returns {Object} 照片資訊物件，包含路徑和檔名
 */
function getRandomPhoto() {
  const photoPath = getRandomPhotoPath();
  
  if (!photoPath) {
    return { 
      success: false, 
      message: '無法獲取照片。\nUnable to get wedding photo.' 
    };
  }
  
  const fileName = path.basename(photoPath);
  // 去除副檔名以取得照片名稱（作為標題使用）
  const title = path.parse(fileName).name;
  
  return {
    success: true,
    path: photoPath,
    fileName: fileName,
    title: title,
    message: `婚紗照片: ${title}\nWedding Photo: ${title}`
  };
}

module.exports = { getAllPhotos, getRandomPhoto }; 
// src/photoService.js
// 提供婚紗照片功能，包含 Imgur API 和本地照片兩種模式，帶有快取機制

const fs = require('fs');
const path = require('path');
const { ImgurClient } = require('imgur');
const config = require('../../config');

// 配置參數
const photosDir = path.join(__dirname, '../../data/pictures');
const useImgur = config.imgur.enabled; // 是否使用 Imgur API
const imgurClientId = config.imgur.clientId; // Imgur API Client ID
const imgurAlbumHash = config.imgur.albumHash; // Imgur 相簿雜湊值
const CACHE_REFRESH_INTERVAL = 3600000; // 快取更新間隔，預設 1 小時 (3600000 毫秒)

// Imgur 照片快取
let imgurPhotosCache = [];
let lastCacheUpdate = 0;
let cacheUpdateInProgress = false;

// 初始化 Imgur client
let imgurClient = null;
if (useImgur && imgurClientId) {
  imgurClient = new ImgurClient({ clientId: imgurClientId });
  
  // 應用啟動時立即更新快取
  updateImgurCache();
}

/**
 * 更新 Imgur 照片快取
 * @returns {Promise<boolean>} 更新成功返回 true，失敗返回 false
 */
async function updateImgurCache() {
  // 避免同時有多個更新請求
  if (cacheUpdateInProgress) {
    return false;
  }
  
  cacheUpdateInProgress = true;
  
  try {
    if (!imgurClient || !imgurAlbumHash) {
      throw new Error('Imgur 客戶端未配置或相簿 Hash 未提供');
    }
    
    console.log('正在更新 Imgur 照片快取...');
    
    // 獲取相簿中的所有照片
    const albumResponse = await imgurClient.getAlbum(imgurAlbumHash);
    
    if (!albumResponse.success || !albumResponse.data || !albumResponse.data.images || albumResponse.data.images.length === 0) {
      throw new Error('無法獲取 Imgur 相簿照片');
    }
    
    // 更新快取
    imgurPhotosCache = albumResponse.data.images.map(image => ({
      url: image.link,
      title: image.description || '婚紗照',
      width: image.width,
      height: image.height
    }));
    
    lastCacheUpdate = Date.now();
    console.log(`Imgur 照片快取更新成功，共 ${imgurPhotosCache.length} 張照片`);
    return true;
  } catch (error) {
    console.error('更新 Imgur 照片快取失敗:', error);
    return false;
  } finally {
    cacheUpdateInProgress = false;
  }
}

/**
 * 檢查快取是否需要更新
 * @returns {boolean} 需要更新返回 true
 */
function shouldUpdateCache() {
  // 如果快取為空或已過期則更新
  return imgurPhotosCache.length === 0 || (Date.now() - lastCacheUpdate > CACHE_REFRESH_INTERVAL);
}

/**
 * 從 Imgur 相簿快取獲取隨機照片
 * @returns {Promise<Object>} 照片資訊
 */
async function getRandomPhotoFromImgurCache() {
  try {
    // 檢查是否需要更新快取
    if (shouldUpdateCache()) {
      // 在背景更新快取，不等待結果
      updateImgurCache().catch(err => console.error('背景更新 Imgur 快取失敗:', err));
    }
    
    // 如果快取為空，進行一次同步更新
    if (imgurPhotosCache.length === 0) {
      const updated = await updateImgurCache();
      if (!updated || imgurPhotosCache.length === 0) {
        throw new Error('Imgur 照片快取為空且無法更新');
      }
    }
    
    // 從快取中隨機選擇一張照片
    const randomIndex = Math.floor(Math.random() * imgurPhotosCache.length);
    const randomPhoto = imgurPhotosCache[randomIndex];
    
    return {
      success: true,
      url: randomPhoto.url,
      title: randomPhoto.title,
      message: `婚紗照片: ${randomPhoto.title}\nWedding Photo: ${randomPhoto.title}`
    };
  } catch (error) {
    console.error('從 Imgur 快取獲取照片失敗:', error);
    // 如果快取方式失敗，嘗試直接從 API 獲取
    return getRandomPhotoFromImgurDirect();
  }
}

/**
 * 直接從 Imgur API 獲取隨機照片（不使用快取）
 * @returns {Promise<Object>} 照片資訊
 */
async function getRandomPhotoFromImgurDirect() {
  try {
    if (!imgurClient || !imgurAlbumHash) {
      throw new Error('Imgur 客戶端未配置或相簿hash未提供');
    }
    
    // 獲取相簿中的所有照片
    const albumResponse = await imgurClient.getAlbum(imgurAlbumHash);
    
    if (!albumResponse.success || !albumResponse.data || !albumResponse.data.images || albumResponse.data.images.length === 0) {
      throw new Error('無法獲取 Imgur 相簿照片');
    }
    
    const images = albumResponse.data.images;
    const randomIndex = Math.floor(Math.random() * images.length);
    const randomImage = images[randomIndex];
    
    // 從描述中提取標題，若無描述則使用預設標題
    const title = randomImage.description || '婚紗照';
    
    return {
      success: true,
      url: randomImage.link, // Imgur 提供的圖片 URL
      title: title,
      message: `婚紗照片: ${title}\nWedding Photo: ${title}`
    };
  } catch (error) {
    console.error('直接從 Imgur 獲取照片失敗:', error);
    return { success: false, error };
  }
}

/**
 * 獲取所有本地照片文件名稱
 * @returns {Array<string>} 照片文件名陣列
 */
function getAllLocalPhotos() {
  try {
    // 只選取支援的圖片格式
    return fs.readdirSync(photosDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    });
  } catch (error) {
    console.error('讀取本地照片目錄失敗:', error);
    return [];
  }
}

/**
 * 獲取隨機本地照片的完整路徑
 * @returns {string|null} 隨機照片的路徑，失敗則返回null
 */
function getRandomLocalPhotoPath() {
  const photos = getAllLocalPhotos();
  if (photos.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * photos.length);
  const randomPhoto = photos[randomIndex];
  return path.join(photosDir, randomPhoto);
}

/**
 * 從本地獲取隨機照片
 * @returns {Object} 照片資訊物件
 */
function getRandomLocalPhoto() {
  const photoPath = getRandomLocalPhotoPath();
  
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

/**
 * 隨機取得一張照片並返回照片資訊（優先從 Imgur 獲取，失敗時使用本地照片）
 * @returns {Promise<Object>} 照片資訊物件
 */
async function getRandomPhoto() {
  if (useImgur && imgurClient) {
    try {
      // 使用快取方式獲取照片（優先）
      const imgurPhoto = await getRandomPhotoFromImgurCache();
      if (imgurPhoto.success) {
        return imgurPhoto;
      }
      console.log('從 Imgur 快取獲取照片失敗，改用本地照片');
    } catch (error) {
      console.error('Imgur 照片處理錯誤:', error);
    }
  }
  
  // 使用本地照片（作為備選或主要方式）
  return getRandomLocalPhoto();
}

// 手動刷新快取的函數，可在需要時調用
async function refreshImgurCache() {
  const result = await updateImgurCache();
  return {
    success: result,
    message: result 
      ? `快取更新成功，共 ${imgurPhotosCache.length} 張照片` 
      : '快取更新失敗，請檢查 Imgur 配置和網絡連接'
  };
}

module.exports = { 
  getRandomPhoto,
  refreshImgurCache  // 導出刷新快取功能，可供外部調用
}; 
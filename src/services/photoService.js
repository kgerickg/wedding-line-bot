// 引入 @google-cloud/storage
const { Storage } = require('@google-cloud/storage');
const config = require('../../config');

// --- 加入偵錯日誌 ---
console.log('[photoService] 正在讀取設定...');
console.log('[photoService] config object:', JSON.stringify(config, null, 2));
if (config && config.googleCloudStorage) {
  console.log('[photoService] config.googleCloudStorage.enabled:', config.googleCloudStorage.enabled);
  console.log('[photoService] config.googleCloudStorage.bucketName:', config.googleCloudStorage.bucketName);
} else {
  console.log('[photoService] config.googleCloudStorage 物件不存在。');
}
// --- 偵錯日誌結束 ---

// 從設定檔讀取 GCS 設定
const gcsBucketName = config.googleCloudStorage?.bucketName;
const gcsKeyFile = config.googleCloudStorage?.keyFilename;
const gcsProjectId = config.googleCloudStorage?.projectId;

// GCS 照片快取
let gcsPhotosCache = [];
// 用戶已顯示照片記錄 - 以用戶ID為鍵
const userDisplayedPhotos = new Map();

// 初始化 GCS Client
const storageClient = new Storage({
  projectId: gcsProjectId,
  keyFilename: gcsKeyFile,
});

/**
 * 啟動時同步載入所有照片清單
 * @returns {Promise<number>} 載入的照片數量
 */
async function preloadPhotosSync() {
  try {
    console.log(`[photoService] 正在從 GCS 預載入照片 (Bucket: ${gcsBucketName})...`);
    const [files] = await storageClient.bucket(gcsBucketName).getFiles();
    
    if (!files || files.length === 0) {
      console.warn(`[photoService] GCS 儲存桶 ${gcsBucketName} 中沒有找到任何檔案。`);
      gcsPhotosCache = [];
      return 0;
    }

    gcsPhotosCache = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
      .map(file => ({
        url: `https://storage.googleapis.com/${gcsBucketName}/${file.name}`,
        title: file.name,
        updated: file.metadata.updated,
        contentType: file.metadata.contentType,
        size: Number(file.metadata.size),
      }));

    console.log(`[photoService] 預載入 GCS 完成，共 ${gcsPhotosCache.length} 張照片`);
    return gcsPhotosCache.length;
  } catch (error) {
    console.error(`[photoService] 從 GCS 預載入照片失敗:`, error);
    return 0;
  }
}

/**
 * 獲取特定用戶的已顯示照片集合
 * @param {string} userId 用戶ID
 * @returns {Set<string>} 用戶的已顯示照片集合
 */
function getUserDisplayedPhotos(userId) {
  // 如果這個用戶還沒有記錄，則創建一個空集合
  if (!userDisplayedPhotos.has(userId)) {
    userDisplayedPhotos.set(userId, new Set());
  }
  return userDisplayedPhotos.get(userId);
}

/**
 * 從快取中獲取未顯示過的照片，針對特定用戶
 * @param {number} count 需要的照片數量
 * @param {string} userId 用戶ID，默認為 'default'
 * @returns {Array<Object>} 照片物件陣列
 */
function getPhotos(count = 10, userId = 'default') {
  if (gcsPhotosCache.length === 0) {
    console.warn('[photoService] 照片快取為空，無法提供照片');
    return [];
  }
  
  // 獲取該用戶的已顯示照片記錄
  const userPhotosSet = getUserDisplayedPhotos(userId);
  
  // 找出該用戶未顯示過的照片
  const unseenPhotos = gcsPhotosCache.filter(photo => !userPhotosSet.has(photo.url));
  
  // 如果未顯示照片不足，或者已經顯示完所有照片，重置該用戶的記錄
  if (unseenPhotos.length < count || unseenPhotos.length === 0) {
    console.log(`[photoService] 用戶 ${userId} 已看過所有照片，重置記錄`);
    userPhotosSet.clear(); // 只清除該用戶的記錄
    
    // 重置後，所有照片對該用戶都可用
    const shuffled = [...gcsPhotosCache].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    // 更新該用戶的已顯示照片集合
    selected.forEach(photo => userPhotosSet.add(photo.url));
    return selected;
  }
  
  // 從未顯示過的照片中隨機選擇
  const shuffledUnseen = [...unseenPhotos].sort(() => 0.5 - Math.random());
  const selected = shuffledUnseen.slice(0, count);
  
  // 更新該用戶的已顯示照片集合
  selected.forEach(photo => userPhotosSet.add(photo.url));
  console.log(`[photoService] 為用戶 ${userId} 提供 ${selected.length} 張未重複照片，已顯示過 ${userPhotosSet.size}/${gcsPhotosCache.length} 張`);
  
  return selected;
}

/**
 * 手動重新載入照片
 * @returns {Promise<Object>} 包含成功狀態和載入的照片數量
 */
async function reloadPhotos() {
  try {
    const count = await preloadPhotosSync();
    // 重載照片時清空所有用戶的顯示記錄
    userDisplayedPhotos.clear();
    return {
      success: true,
      count: count,
      message: `成功重新載入 ${count} 張照片，已重置所有用戶的顯示記錄`
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      message: `重新載入照片失敗: ${error.message}`
    };
  }
}

/**
 * 獲取多張照片資訊，用於輪播 (Carousel)
 * @param {number} [count=10] 需要的照片數量 (上限為 10，Line Carousel 官方限制)
 * @param {string} [userId='default'] 用戶ID 
 * @returns {Object} 包含照片陣列 { success: boolean, photos: Array }
 */
function getPhotosForCarousel(count = 10, userId = 'default') {
  const desiredCount = Math.min(Math.max(1, count), 10);
  const photos = getPhotos(desiredCount, userId);
  
  if (photos.length === 0) {
    return {
      success: false,
      photos: [],
      message: '無法獲取任何照片用於輪播。'
    };
  }
  
  // 格式化照片資訊以符合 Line Carousel Template 需求
  const carouselPhotos = photos.map(p => ({
    title: (p.title || '照片').substring(0, 40),
    text: (p.title || '照片').substring(0, 60),
    thumbnailImageUrl: p.url,
    originalUrl: p.url
  }));
  
  return {
    success: true,
    photos: carouselPhotos
  };
}

/**
 * 重置特定用戶的照片顯示記錄
 * @param {string} userId 用戶ID
 * @returns {boolean} 是否成功重置
 */
function resetUserPhotoHistory(userId) {
  if (userDisplayedPhotos.has(userId)) {
    userDisplayedPhotos.get(userId).clear();
    return true;
  }
  return false;
}

/**
 * 取得特定用戶的已顯示照片統計資訊
 * @param {string} userId 用戶ID
 * @returns {Object} 統計資訊
 */
function getUserDisplayedStats(userId = 'default') {
  const userPhotosSet = getUserDisplayedPhotos(userId);
  return {
    userId: userId,
    total: gcsPhotosCache.length,
    displayed: userPhotosSet.size,
    remaining: gcsPhotosCache.length - userPhotosSet.size,
    completedCycles: Math.floor(userPhotosSet.size / gcsPhotosCache.length)
  };
}

// 啟動時預載入照片
(async () => {
  console.log('[photoService] 準備預載入照片...');
  await preloadPhotosSync();
  // 這裡可以加入應用程式啟動邏輯
  // require('./start-app.js')
})();

module.exports = { 
  getPhotos,
  reloadPhotos,
  getPhotosForCarousel,
  resetUserPhotoHistory,
  getUserDisplayedStats
}; 
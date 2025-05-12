const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

/**
 * 獲取桌次圖片
 * @param {object} req - 請求對象
 * @param {object} res - 響應對象
 */
const getTableImage = async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber);
    
    // 驗證桌次號碼
    if (isNaN(tableNumber) || tableNumber < 1 || tableNumber > 23) {
      return res.status(400).json({ 
        success: false, 
        message: '無效的桌次號碼，必須是1-23之間的數字' 
      });
    }

    // 檢查圖片是否存在
    const imagePath = path.join(__dirname, '../../public/tables', `table_${tableNumber}.png`);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ 
        success: false, 
        message: `桌次 ${tableNumber} 的圖片不存在` 
      });
    }

    // 檢查圖片大小
    const stats = fs.statSync(imagePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    
    // LINE 圖片大小限制為 1MB
    if (fileSizeInMegabytes > 1) {
      try {
        // 優化圖片大小
        const optimizedImageBuffer = await sharp(imagePath)
          .resize({ width: 1024, withoutEnlargement: true }) // 最大寬度 1024px
          .png({ quality: 90 }) // 保持較好的品質
          .toBuffer();
          
        // 直接傳送優化後的圖片
        res.set('Content-Type', 'image/png');
        return res.send(optimizedImageBuffer);
      } catch (optimizeError) {
        console.error('優化圖片失敗:', optimizeError);
        // 優化失敗時提供原始圖片
        return res.sendFile(imagePath);
      }
    }

    // 提供原始圖片
    return res.sendFile(imagePath);
  } catch (error) {
    console.error('獲取桌次圖片時出錯:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服務器錯誤' 
    });
  }
};

/**
 * 獲取所有可用的桌次號碼
 * @param {object} req - 請求對象
 * @param {object} res - 響應對象
 */
const getAvailableTables = (req, res) => {
  try {
    const tablesDir = path.join(__dirname, '../../public/tables');
    
    // 讀取目錄內容
    const files = fs.readdirSync(tablesDir);
    
    // 過濾並提取桌次號碼
    const tableNumbers = files
      .filter(file => file.startsWith('table_') && file.endsWith('.png'))
      .map(file => {
        const match = file.match(/table_(\d+)\.png/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => a - b);

    return res.json({
      success: true,
      data: {
        tables: tableNumbers,
        count: tableNumbers.length
      }
    });
  } catch (error) {
    console.error('獲取可用桌次時出錯:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服務器錯誤' 
    });
  }
};

module.exports = {
  getTableImage,
  getAvailableTables
}; 
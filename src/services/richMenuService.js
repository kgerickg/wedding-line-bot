// src/richMenuService.js
// 配置LINE豐富菜單(Rich Menu)服務

/**
 * 創建婚禮服務豐富菜單配置
 * @returns {Object} Rich Menu配置對象
 */
function createWeddingRichMenu() {
  return {
    size: {
      width: 2500,
      height: 843
    },
    selected: true,
    name: "Wedding Service Menu",
    chatBarText: "選單 Menu",
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "postback",
          data: "seat_lookup",
          displayText: "座位查詢 Seat Lookup"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "postback",
          data: "wedding_photo",
          displayText: "婚紗照 Wedding Photo"
        }
      }
    ]
  };
}

/**
 * 設置Rich Menu
 * @param {Object} client - LINE SDK客戶端
 * @returns {Promise} 設置結果Promise
 */
async function setupRichMenu(client) {
  try {
    // 檢查圖片是否存在
    const fs = require('fs');
    const imagePath = './public/images/rich_menu_image.jpg'; // 背景圖路徑
    
    if (!fs.existsSync(imagePath)) {
      console.log('Rich Menu 圖片不存在，請使用 create_rich_menu_image.html 生成圖片');
      console.log('將圖片保存至 ' + require('path').resolve(imagePath));
      console.log('暫時跳過 Rich Menu 設定');
      return null; // 直接返回，不設定 Rich Menu
    }
    
    // 創建Rich Menu
    const richMenu = createWeddingRichMenu();
    const richMenuId = await client.createRichMenu(richMenu);
    console.log(`Created rich menu with ID: ${richMenuId}`);
    
    // 讀取Rich Menu背景圖
    const bufferImage = fs.readFileSync(imagePath);
    
    // 上傳Rich Menu背景圖
    await client.setRichMenuImage(richMenuId, bufferImage);
    
    // 將Rich Menu設為默認菜單
    await client.setDefaultRichMenu(richMenuId);
    
    console.log('Rich menu setup completed successfully');
    return richMenuId;
  } catch (error) {
    console.error('Error setting up rich menu:', error);
    throw error;
  }
}

module.exports = { createWeddingRichMenu, setupRichMenu }; 
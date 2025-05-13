// src/app.js
// Line Bot 主應用程式
require('dotenv').config({ path: './config/env/.env' });
const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const guestService = require('./services/guestService');
const photoService = require('./services/photoService');
const richMenuService = require('./services/richMenuService');
const tableRoutes = require('./routes/tableRoutes');
const config = require('../config');

// LINE 配置
const configLine = {
  channelAccessToken: config.lineBot.channelAccessToken,
  channelSecret: config.lineBot.channelSecret
};

// 創建LINE客戶端
const client = new line.Client(configLine);

// 創建Express應用
const app = express();

// 將LINE客戶端設為應用程式的屬性，以便在server.js中使用
app.set('lineClient', client);

// 加入根路徑處理
app.get('/', (req, res) => {
  res.send(`
    <h1>婚禮 Line Bot 服務</h1>
    <p>這是一個LINE Bot的後端服務，請不要直接在瀏覽器中訪問。</p>
    <p>狀態：伺服器正在運行</p>
    <p>請使用LINE加入好友來互動。</p>
    <hr>
    <p><small>服務時間: ${new Date().toLocaleString()}</small></p>
  `);
});

// 靜態檔案服務（提供圖片訪問）
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/tables', express.static(path.join(__dirname, '../public/tables')));
app.use('/pictures', express.static(path.join(__dirname, '../data/pictures')));

// 接收LINE Webhook
app.post('/callback', line.middleware(configLine), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 處理LINE事件
async function handleEvent(event) {
  if (event.type !== 'message' && event.type !== 'postback') {
    return Promise.resolve(null);
  }
  
  // 歡迎訊息（當用戶加入時）
  if (event.type === 'follow') {
    return client.replyMessage(event.replyToken, getWelcomeMessage());
  }

  // 處理選單事件
  if (event.type === 'postback') {
    const data = event.postback.data;
    if (data === 'seat_lookup') {
      return client.replyMessage(event.replyToken, getSeatLookupInstructions());
    } else if (data === 'wedding_photo') {
      return handlePhotoRequest(event.replyToken);
    }
    return Promise.resolve(null);
  }

  // 處理文字訊息
  if (event.message.type === 'text') {
    const text = event.message.text.trim();
    
    // 關鍵字 - 清除緩存
    if (text === 'cleancache') {
      try {
        const result = guestService.clearCache();
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `Successfully cleared cache. Next query will fetch data from Google Sheets.`
        });
      } catch (error) {
        console.error('清除緩存指令執行失敗:', error);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `Failed to clear cache: ${error.message}`
        });
      }
    }
    
    // 關鍵字處理
    if (text === '座位查詢' || text === 'Seat Lookup') {
      return client.replyMessage(event.replyToken, getSeatLookupInstructions());
    } else if (text === '婚紗照' || text === 'Wedding Photo') {
      return handlePhotoRequest(event.replyToken);
    } else if (text === 'menu' || text === '選單') {
      return client.replyMessage(event.replyToken, getMenuMessage());
    } else {
      // 假設這是姓名查詢請求
      return handleSeatQuery(event.source.userId, text, event.replyToken);
    }
  }

  // 其他類型的訊息，回覆選單
  return client.replyMessage(event.replyToken, getMenuMessage());
}

// 取得歡迎訊息
function getWelcomeMessage() {
  return {
    type: 'text',
    text: '歡迎使用婚禮服務！請點選下方選單選擇功能。\nWelcome to the Wedding Service! Please use the menu below to select a function.'
  };
}

// 取得選單訊息
function getMenuMessage() {
  return {
    type: 'template',
    altText: '婚禮服務選單 Wedding Service Menu',
    template: {
      type: 'buttons',
      title: '婚禮服務選單',
      text: '請選擇服務 Please select a service',
      actions: [
        {
          type: 'postback',
          label: '座位查詢 Seat Lookup',
          data: 'seat_lookup'
        },
        {
          type: 'postback',
          label: '婚紗照 Wedding Photo',
          data: 'wedding_photo'
        }
      ]
    }
  };
}

// 取得座位查詢說明
function getSeatLookupInstructions() {
  return {
    type: 'text',
    text: '請輸入您的姓名查詢座位。\nPlease enter your name to look up your seat.'
  };
}

// 處理婚紗照請求
async function handlePhotoRequest(replyToken) {
  const photoResult = photoService.getRandomPhoto();
  
  if (!photoResult.success) {
    return client.replyMessage(replyToken, {
      type: 'text',
      text: photoResult.message
    });
  }
  
  // 使用 ngrok 的公開網址提供圖片
  // 獲取 ngrok 的公開網址（這裡需要手動填寫當前 ngrok 的網址）
  const ngrokUrl = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok-free.app';
  
  try {
    // 修正：移除URL末尾的斜線以避免重複
    const baseUrl = ngrokUrl.endsWith('/') ? ngrokUrl.slice(0, -1) : ngrokUrl;
    
    // 建立圖片的公開網址
    const imageUrl = `${baseUrl}/pictures/${encodeURIComponent(photoResult.fileName)}`;
    
    // 只發送圖片，不發送文字
    return client.replyMessage(replyToken, {
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    });
  } catch (error) {
    console.error('照片處理失敗:', error);
    return client.replyMessage(replyToken, {
      type: 'text',
      text: '無法獲取照片，請稍後再試。\nUnable to get photo, please try again later.'
    });
  }
}

// 處理座位查詢
async function handleSeatQuery(userId, name, replyToken) {
  try {
    // 執行查詢 (現在是異步函數)
    const result = await guestService.querySeat(name);
    
    if (!result.success) {
      // 查詢失敗，返回錯誤訊息
      return client.replyMessage(replyToken, {
        type: 'text',
        text: result.message
      });
    }
    
    // 查詢成功，準備回覆
    const messages = [
      {
        type: 'text',
        text: result.message
      }
    ];
    
    // 如果有桌次圖片，添加圖片訊息
    if (result.imageExists) {
      try {
        // 獲取 ngrok 的公開網址
        const ngrokUrl = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok-free.app';
        
        // 修正：移除URL末尾的斜線以避免重複
        const baseUrl = ngrokUrl.endsWith('/') ? ngrokUrl.slice(0, -1) : ngrokUrl;
        
        // 直接使用靜態檔案路徑而非API路徑
        const tableImageUrl = `${baseUrl}/tables/${encodeURIComponent(result.imageFileName)}`;
        
        // 檢查圖片URL長度（LINE限制為1000個字符）
        if (tableImageUrl.length > 1000) {
          console.error(`圖片URL過長: ${tableImageUrl.length} 字符`);
          // 只傳送文字資訊
        } else {
          // 輸出圖片URL以便除錯
          console.log(`使用的圖片URL: ${tableImageUrl}`);
          
          messages.push({
            type: 'image',
            originalContentUrl: tableImageUrl,
            previewImageUrl: tableImageUrl
          });
        }
      } catch (error) {
        console.error('處理桌次圖片出錯:', error);
        // 處理桌次圖片出錯時只傳送文字訊息，並繼續程序
      }
    }
    
    // 回覆查詢結果
    return client.replyMessage(replyToken, messages);
  } catch (error) {
    console.error('座位查詢處理出錯:', error);
    return client.replyMessage(replyToken, {
      type: 'text',
      text: '系統處理錯誤，請稍後再試。\nSystem error, please try again later.'
    });
  }
}

// 注冊路由
app.use('/api/tables', tableRoutes);

// 匯出應用
module.exports = app; 
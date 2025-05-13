console.log('INDEX_JS: Top of the module, EXTREMELY MINIMAL TEST.');

const express = require('express');
const line = require('@line/bot-sdk');
const fs =require('fs');
const path = require('path');
const guestService = require('./src/services/guestService');
const photoService = require('./src/services/photoService');
const config = require('./config');

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || config.lineBot.channelAccessToken,
  channelSecret: process.env.LINE_CHANNEL_SECRET || config.lineBot.channelSecret
};
const client = new line.Client(lineConfig);

const app = express();

// --- 新增靜態資源服務 (路徑需要你確認) ---
// 假設 index.js 在專案根目錄
const picturesStaticPath = path.join(__dirname, './data/pictures');
const tablesStaticPath = path.join(__dirname, './public/tables');

console.log(`Setting up static path for pictures: ${picturesStaticPath}`);
app.use('/pictures', express.static(picturesStaticPath));
console.log(`Setting up static path for tables (for /tables and /api/tables): ${tablesStaticPath}`);
app.use('/tables', express.static(tablesStaticPath));
app.use('/api/tables', express.static(tablesStaticPath)); // 支援 guestService 中的 /api/tables
// --- 結束新增靜態資源服務 ---

// 健康檢查端點 (從原始碼還原)
app.get('/', (req, res) => {
  console.log('收到健康檢查請求');
  res.status(200).send(`婚禮Line Bot運行中! Wedding Line Bot is running! (${new Date().toISOString()})`);
});

// 調試用端點 (從原始碼還原)
app.get('/debug', (req, res) => {
  console.log('收到調試請求');
  try {
    const debugInfo = {
      nodeVersion: process.version,
      env: {
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? '已設定' : '未設定',
        LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已設定' : '未設定',
        USE_GOOGLE_SHEETS: process.env.USE_GOOGLE_SHEETS,
        USE_IMGUR: process.env.USE_IMGUR,
        APP_BASE_URL: process.env.APP_BASE_URL // 確保這個環變有設定
      },
      config: {
        lineBot: {
          channelSecret: config.lineBot.channelSecret ? '已設定' : '未設定',
          channelAccessToken: config.lineBot.channelAccessToken ? '已設定' : '未設定'
        },
        googleSheets: {
          enabled: config.googleSheets.enabled
        },
        imgur: {
          enabled: config.imgur.enabled
        }
      }
    };
    res.json(debugInfo);
  } catch (error) {
    console.error('調試端點錯誤:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// LINE Webhook處理 - 支援兩種路徑
const handleWebhook = (req, res) => {
  console.log('LINE Webhook: Received request at handleWebhook (full event processing).');
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => {
      console.log('LINE Webhook: Successfully processed events, sending result.');
      res.json(result);
    })
    .catch((err) => {
      console.error('LINE Webhook: Error processing events:', err);
      res.status(500).end();
    });
};

// 處理LINE事件 (移植自 src/app.js)
async function handleEvent(event) {
  console.log(`EVENT_HANDLER (from src/app.js logic): Received event type: ${event.type}`);
  if (event.type !== 'message' && event.type !== 'postback') {
    if (event.type === 'follow') { 
      console.log('EVENT_HANDLER: Follow event detected.');
      return client.replyMessage(event.replyToken, getWelcomeMessage());
    }
    console.log('EVENT_HANDLER: Event type is not message or postback, and not follow. Resolving null.');
    return Promise.resolve(null);
  }
  if (event.type === 'postback') {
    const data = event.postback.data;
    console.log(`EVENT_HANDLER: Postback event detected with data: ${data}`);
    if (data === 'seat_lookup') {
      return client.replyMessage(event.replyToken, getSeatLookupInstructions());
    } else if (data === 'wedding_photo') {
      return handlePhotoRequest(event.replyToken);
    }
    console.log('EVENT_HANDLER: Postback data not recognized. Resolving null.');
    return Promise.resolve(null);
  }
  if (event.message.type === 'text') {
    const text = event.message.text.trim();
    console.log(`EVENT_HANDLER: Text message received: "${text}"`);
    if (text === 'cleancache') {
      try {
        guestService.clearCache(); 
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
    if (text === 'clearPhotoCache') {
      try {
        const result = await photoService.refreshImgurCache(); 
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `照片快取已更新: ${result.message}\nPhoto cache refreshed: ${result.message}`
        });
      } catch (error) {
        console.error('清除照片快取指令執行失敗:', error);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `無法更新照片快取: ${error.message}\nFailed to refresh photo cache: ${error.message}`
        });
      }
    }
    if (text === '座位查詢' || text === 'Seat Lookup') {
      return client.replyMessage(event.replyToken, getSeatLookupInstructions());
    } else if (text === '婚紗照' || text === 'Wedding Photo') {
      return handlePhotoRequest(event.replyToken);
    } else if (text === 'menu' || text === '選單') {
      return client.replyMessage(event.replyToken, getMenuMessage());
    } else {
      return handleSeatQuery(event.source.userId, text, event.replyToken);
    }
  }
  console.log('EVENT_HANDLER: Message type not text, or unhandled case. Replying with menu.');
  return client.replyMessage(event.replyToken, getMenuMessage());
}

function getWelcomeMessage() {
  return {
    type: 'text',
    text: '歡迎使用婚禮服務！請點選下方選單選擇功能。\nWelcome to the Wedding Service! Please use the menu below to select a function.'
  };
}

function getMenuMessage() {
  return {
    type: 'template',
    altText: '婚禮服務選單 Wedding Service Menu',
    template: {
      type: 'buttons',
      title: '婚禮服務選單',
      text: '請選擇服務 Please select a service',
      actions: [
        { type: 'postback', label: '座位查詢 Seat Lookup', data: 'seat_lookup' },
        { type: 'postback', label: '婚紗照 Wedding Photo', data: 'wedding_photo' }
      ]
    }
  };
}

function getSeatLookupInstructions() {
  return {
    type: 'text',
    text: '請輸入您的姓名查詢座位。\nPlease enter your name to look up your seat.'
  };
}

async function handlePhotoRequest(replyToken) {
  console.log('PHOTO_REQUEST (from src/app.js logic): Received photo request.');
  try {
    const photoResult = await photoService.getRandomPhoto();
    console.log('PHOTO_REQUEST: Photo service result:', photoResult);
    if (!photoResult.success) {
      return client.replyMessage(replyToken, {
        type: 'text',
        text: photoResult.message || '無法獲取照片，請稍後再試。\nUnable to get photo, please try again later.'
      });
    }
    if (photoResult.url) { 
      return client.replyMessage(replyToken, {
        type: 'image',
        originalContentUrl: photoResult.url,
        previewImageUrl: photoResult.url
      });
    } else { 
      const appBaseUrl = process.env.APP_BASE_URL || ''; 
      const imageUrl = `${appBaseUrl}/pictures/${encodeURIComponent(photoResult.fileName)}`; 
      console.log(`PHOTO_REQUEST: Attempting to serve local-style photo from: ${imageUrl}`);
      if (imageUrl.length > 1000) {
          console.error(`圖片URL過長: ${imageUrl.length} 字符`);
          return client.replyMessage(replyToken, {
            type: 'text',
            text: '照片連結過長，無法顯示。Photo link is too long.'
          });
      }
      return client.replyMessage(replyToken, {
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      });
    }
  } catch (error) {
    console.error('PHOTO_REQUEST: Error processing photo request:', error);
    return client.replyMessage(replyToken, {
      type: 'text',
      text: '無法獲取照片，請稍後再試。\nUnable to get photo, please try again later.'
    });
  }
}

async function handleSeatQuery(userId, name, replyToken) {
  console.log(`SEAT_QUERY (from src/app.js logic): UserID: ${userId}, Name: "${name}"`);
  try {
    const result = await guestService.querySeat(name); 
    console.log(`SEAT_QUERY: Guest service result:`, result);
    if (!result.success) {
      return client.replyMessage(replyToken, {
        type: 'text',
        text: result.message
      });
    }
    const messages = [{ type: 'text', text: result.message }];
    if (result.imageExists && result.imageFileName) { 
      const appBaseUrl = process.env.APP_BASE_URL || ''; 
      // guestService.js uses /api/tables, so we use that path here for consistency with its internal URL construction if it were used directly.
      // However, our static path setup above uses appBaseUrl + /api/tables, so this should align.
      const tableImageUrl = `${appBaseUrl}/api/tables/${encodeURIComponent(result.imageFileName)}`;
      console.log(`SEAT_QUERY: Attempting to serve table image from: ${tableImageUrl}`);
      if (tableImageUrl.length > 1000) {
        console.error(`桌次圖片URL過長: ${tableImageUrl.length} 字符`);
      } else {
        messages.push({
          type: 'image',
          originalContentUrl: tableImageUrl,
          previewImageUrl: tableImageUrl
        });
      }
    }
    return client.replyMessage(replyToken, messages);
  } catch (error) {
    console.error('SEAT_QUERY: Error processing seat query:', error);
    return client.replyMessage(replyToken, {
      type: 'text',
      text: '系統處理錯誤，請稍後再試。\nSystem error, please try again later.'
    });
  }
}

// 設置兩個Webhook路徑
app.post('/callback', line.middleware(lineConfig), handleWebhook);
app.post('/', line.middleware(lineConfig), handleWebhook); // Cloud Functions默認路徑

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('App-level error middleware caught:', err);
  res.status(500).send('內部伺服器錯誤');
});

// app.listen(...) 應該保持註解狀態
/*
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`婚禮Line Bot服務已啟動，監聽端口: ${PORT}. (This log is mainly for local, GCF handles listening)`);
});
*/

console.log('INDEX_JS: Exporting weddingLineBot (with FULL src/app.js logic, static paths, and URL adjustments).');
exports.weddingLineBot = app;
console.log('INDEX_JS: weddingLineBot export attempt finished.');

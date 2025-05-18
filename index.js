require('dotenv').config({ path: './config/env/.env' }); // 載入環境變數

const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
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
    console.log('EVENT_HANDLER: Event type is not message or postback, and not follow. Resolving null.');
    return Promise.resolve(null);
  }
  if (event.type === 'postback') {
    const data = event.postback.data;
    console.log(`EVENT_HANDLER: Postback event detected with data: ${data}`);
    if (data === '婚紗照') {
      return handlePhotoRequest(event.replyToken, event);
    }
    console.log('EVENT_HANDLER: Postback data not recognized. Resolving null.');
    return Promise.resolve(null);
  }
  if (event.message.type === 'text') {
    const text = event.message.text.trim();
    console.log(`EVENT_HANDLER: Text message received: "${text}"`);
    if (text === 'reload') {
      try {
        const result = await photoService.reloadPhotos();
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
    if (text === '婚紗照' || text === 'Wedding Photo') {
      return handlePhotoRequest(event.replyToken, event);
    }
  }
}

async function handlePhotoRequest(replyToken, event) {
  try {
    // 從事件中獲取用戶ID，如果沒有則使用'default'
    const userId = event?.source?.userId || 'default';
    console.log(`處理用戶 ${userId} 的婚紗照請求`);
    
    const carouselData = await photoService.getPhotosForCarousel(10, userId);

    if (!carouselData.success || carouselData.photos.length === 0) {
      const errorMessage = carouselData.message || '目前沒有照片。\nNo photos available to display.';
      return client.replyMessage(replyToken, {
        type: 'text',
        text: errorMessage
      });
    }

    // 每張圖一個 bubble，只留圖片
    const bubbles = carouselData.photos.map(photo => {
      let imageUrl = photo.thumbnailImageUrl;
      // 只允許 https
      if (!imageUrl || !imageUrl.startsWith('https://')) return null;
      return {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "image",
              url: imageUrl,
              size: "full",
              aspectMode: "cover",
              aspectRatio: "1:1",
              action: {
                type: "uri",
                uri: imageUrl
              }
            }
          ],
          paddingAll: "0px"
        }
      };
    }).filter(Boolean);

    if (!bubbles.length) {
      return client.replyMessage(replyToken, {
        type: 'text',
        text: 'Failed to process photos for carousel.'
      });
    }

    // Flex message carousel
    const flexMessage = {
      type: "flex",
      altText: "婚紗照",
      contents: {
        type: "carousel",
        contents: bubbles
      }
    };

    return client.replyMessage(replyToken, flexMessage);

  } catch (error) {
    console.error('failed to get photo carousel', error);
    return client.replyMessage(replyToken, {
      type: 'text',
      text: 'Unable to get photo carousel, please try again later.'
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

exports.weddingLineBot = app;

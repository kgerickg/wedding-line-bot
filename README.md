# 婚禮 Line Bot

這是一個為婚禮活動設計的 LINE Bot 專案，提供賓客座位查詢和婚紗照片瀏覽等功能。

## 功能特色

- **婚紗照片瀏覽**：通過 Google Cloud Storage 顯示婚紗照片，支持輪播展示
- **座位查詢**：賓客可以查詢自己的座位位置
- **自動記憶用戶**：系統會記住每個用戶已經看過的照片，避免重複
- **快速部署**：支援 Google Cloud Platform (App Engine 或 Cloud Run) 快速部署

## 技術架構

- **後端**：Node.js + Express
- **LINE SDK**：@line/bot-sdk
- **雲端儲存**：Google Cloud Storage
- **部署環境**：GCP App Engine / Cloud Run

## 目錄結構

```
婚禮 Line Bot/
├── config/                   # 設定檔
│   └── index.js              # 主要設定檔
├── data/                     # 資料目錄
│   ├── pictures/             # 本地照片
│   └── tables/               # 座位表資料
├── deployment/               # 部署相關文件
│   └── gcp-deployment.md     # GCP 部署說明
├── docs/                     # 文件資料夾
├── scripts/                  # 腳本
│   └── setupRichMenu.js      # 設定 LINE 選單
├── src/                      # 程式碼
│   ├── controllers/          # 控制器
│   ├── middlewares/          # 中間件
│   ├── models/               # 資料模型
│   ├── routes/               # 路由
│   ├── services/             # 服務
│   │   └── photoService.js   # 照片服務
│   └── utils/                # 工具函式
├── app.yaml                  # GCP App Engine 設定檔
├── Dockerfile                # Docker 設定檔
├── deploy-gcp.sh             # GCP 部署腳本
├── index.js                  # 主要應用程式邏輯
├── package.json              # NPM 依賴管理
├── server.js                 # 伺服器啟動入口
└── README.md                 # 本文件
```

## 安裝與設置

### 前置需求

- Node.js 14+
- GCP 帳號 (用於 App Engine / Cloud Run 部署)
- LINE Developers 帳號

### 本地開發

1. clone專案
   ```bash
   git clone [repository-url]
   cd wedding-line-bot
   ```

2. 安裝依賴
   ```bash
   npm install
   ```

3. 配置環境變數
   建立 config/env/.env 檔案，包含以下內容：
   ```
   LINE_CHANNEL_SECRET=你的LINE_Channel_Secret
   LINE_CHANNEL_ACCESS_TOKEN=你的LINE_Channel_Access_Token
   ```

4. 啟動開發伺服器
   ```bash
   npm run dev
   ```

5. 使用 ngrok 等工具進行本地測試
   ```bash
   ngrok http 5000
   ```

## LINE Bot 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 在您的頻道設定中，啟用 Webhook
3. 將 Webhook URL 設定為 `https://您的網域/callback`


## 部署

詳細部署指南請參考 [GCP 部署說明](deployment/gcp-deployment.md)

### 快速部署

使用專案中的部署腳本:
```bash
./deploy-gcp.sh
```

## 照片管理

1. 將婚紗照片上傳至 Google Cloud Storage
2. 在 config/index.js 中設定正確的 GCS bucket 名稱
3. 部署後，系統會自動讀取 GCS 中的照片

## 開發者

- 維護者：kgerickg
- 項目源於：婚禮賓客服務需求

## 使用授權

本專案程式碼遵循 MIT 授權。 
# 婚禮Line Bot雲端部署指南

本文檔提供將婚禮Line Bot部署到Google Cloud Functions的詳細步驟。

## 前置需求

1. 擁有Google Cloud Platform帳號
2. 安裝Google Cloud CLI
3. Line Developers帳號和頻道

## 部署步驟

### 1. 安裝Google Cloud CLI

Windows系統請從[官方網站](https://cloud.google.com/sdk/docs/install)下載安裝。

Linux/Mac系統可以使用以下命令:

```bash
# Linux/Mac
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-latest.tar.gz
tar -xf google-cloud-cli-latest.tar.gz
./google-cloud-sdk/install.sh
```

### 2. 登入Google Cloud

```bash
gcloud auth login
```

### 3. 建立和選擇專案

```bash
# 建立新專案（只需一次）
gcloud projects create wedding-line-bot-project

# 選擇專案
gcloud config set project wedding-line-bot-project
```

### 4. 啟用必要API

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### 5. 建立服務帳號（如需使用Google Sheets）

```bash
# 建立服務帳號
gcloud iam service-accounts create wedding-bot-service

# 下載金鑰（務必保管好）
gcloud iam service-accounts keys create config/service-account-key.json \
  --iam-account wedding-bot-service@wedding-line-bot-project.iam.gserviceaccount.com

# 授予權限（如需讀取Google Sheets）
gcloud projects add-iam-policy-binding wedding-line-bot-project \
  --member=serviceAccount:wedding-bot-service@wedding-line-bot-project.iam.gserviceaccount.com \
  --role=roles/sheets.reader
```

### 6. 設定環境變數

建立 `.env.yaml` 檔案:

```yaml
LINE_CHANNEL_ACCESS_TOKEN: "你的Line頻道存取權杖"
LINE_CHANNEL_SECRET: "你的Line頻道密鑰"
USE_GOOGLE_SHEETS: "true"
GOOGLE_APPLICATION_CREDENTIALS: "config/service-account-key.json"
SHEETS_ID: "你的Google試算表ID"
SHEETS_RANGE: "賓客名單!A:B"
USE_IMGUR: "true"
IMGUR_CLIENT_ID: "你的Imgur客戶端ID"
IMGUR_ALBUM_HASH: "你的相簿哈希值"
```

### 7. 部署到Cloud Functions

#### 使用部署腳本（推薦）

Windows系統:
```powershell
# 執行部署腳本
.\cloud-deploy.sh
```

Linux/Mac系統:
```bash
# 設置執行權限
chmod +x cloud-deploy.sh

# 執行部署腳本
./cloud-deploy.sh
```

#### 手動部署

```bash
gcloud functions deploy weddingLineBot \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file .env.yaml \
  --memory 256MB \
  --timeout 60s \
  --entry-point weddingLineBot
```

### 8. 設定Line Webhook URL

部署完成後，獲取函數URL:

```bash
gcloud functions describe weddingLineBot --format='value(httpsTrigger.url)'
```

然後登入[Line Developers Console](https://developers.line.biz/)，前往您的頻道設定→Webhook URL，輸入:

```
https://您的函數URL/callback
```

點擊「驗證」按鈕測試連接。

### 9. 設定Rich Menu

```bash
# 設定環境變數
export FUNCTION_URL=您的函數URL

# 執行設定腳本
node scripts/setupRichMenu.js
```

## 快取設定

本專案已調整快取時間以優化API呼叫頻率和成本:

- Imgur照片快取: 12小時（原為1小時）
- Google Sheets資料快取: 30分鐘（原為5分鐘）

## 故障排除

### 部署問題

如果部署失敗，請查看錯誤訊息:

```bash
gcloud functions logs read weddingLineBot
```

### Line Webhook問題

確認:
1. Webhook URL正確無誤
2. 包含了 `/callback` 路徑
3. Cloud Function允許未認證的訪問

### 函數調用問題

查看函數執行日誌:

```bash
gcloud functions logs read weddingLineBot --limit=50
``` 
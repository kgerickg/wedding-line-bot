# Google Cloud Platform 部署指南

本文檔提供將婚禮 Line Bot 部署到 GCP 的詳細步驟，包含 App Engine、Cloud Run 和 Google Cloud Storage 的設定。

## 前置需求

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) 已安裝
- 已經建立 GCP 專案並啟用帳單
- 具有適當權限的 GCP 用戶 (專案管理員或部署管理員)

## 登入 Google Cloud

```bash
# 登入 Google Cloud
gcloud auth login

# 設定專案 ID
gcloud config set project YOUR_PROJECT_ID
```

## Google Cloud Storage 設定

### 1. 建立 Cloud Storage Bucket

```bash
# 建立 Cloud Storage Bucket
gcloud storage buckets create gs://YOUR_BUCKET_NAME --default-storage-class=STANDARD --location=asia-east1
```

### 2. 上傳婚紗照片

```bash
# 上傳單一檔案
gcloud storage cp 本地檔案路徑.jpg gs://YOUR_BUCKET_NAME/

# 上傳資料夾中所有照片
gcloud storage cp 照片資料夾路徑/* gs://YOUR_BUCKET_NAME/
```

### 3. 設定公開存取權限

```bash
# 設定 Bucket 公開讀取權限
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME --member=allUsers --role=roles/storage.objectViewer
```

### 4. 更新專案設定

修改 `config/index.js` 檔案中的 GCS 設定：

```javascript
googleCloudStorage: {
  enabled: true,
  bucketName: 'YOUR_BUCKET_NAME', // 更新為您的 bucket 名稱
  projectId: 'YOUR_PROJECT_ID'    // 更新為您的專案 ID
},
```

## 部署選項 1: App Engine 部署

### 1. 啟用 App Engine API

```bash
gcloud services enable appengine.googleapis.com
```

### 2. 更新 app.yaml

確保 `app.yaml` 檔案包含正確的環境變數：

```yaml
runtime: nodejs18
service: wedding-line-bot

env_variables:
  LINE_CHANNEL_ACCESS_TOKEN: "您的LINE存取權杖"
  LINE_CHANNEL_SECRET: "您的LINE頻道密鑰"
  PORT: 8080
  NODE_ENV: production
  
handlers:
  - url: /.*
    script: auto

instance_class: F2
```

### 3. 部署到 App Engine

```bash
gcloud app deploy app.yaml
```

### 4. 設定 LINE Webhook URL

將 LINE Webhook URL 設定為:
`https://YOUR_PROJECT_ID.appspot.com/callback`

## 部署選項 2: Cloud Run 部署

### 1. 啟用必要的 API

```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com
```

### 2. 建立並推送 Docker 映像

```bash
# 建立 Docker 映像並推送到 Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/wedding-line-bot
```

### 3. 部署到 Cloud Run

```bash
gcloud run deploy wedding-line-bot \
    --image gcr.io/YOUR_PROJECT_ID/wedding-line-bot \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars="LINE_CHANNEL_SECRET=您的密鑰,LINE_CHANNEL_ACCESS_TOKEN=您的令牌"
```

### 4. 設定 LINE Webhook URL

```bash
# 取得 Cloud Run 服務 URL
SERVICE_URL=$(gcloud run services describe wedding-line-bot --platform managed --format='value(status.url)')

# 顯示 Webhook URL
echo "請設定 LINE Webhook URL 為: ${SERVICE_URL}/callback"
```

## 設定 Cloud Run 服務使用 GCS 的權限

### 1. 獲取 Cloud Run 服務帳號

```bash
SERVICE_ACCOUNT=$(gcloud run services describe wedding-line-bot --platform managed --format='value(spec.template.spec.serviceAccountName)')
```

### 2. 授予存取 GCS 的權限

```bash
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME --member="serviceAccount:${SERVICE_ACCOUNT}" --role=roles/storage.objectViewer
```

## 故障排除

### 無法存取 GCS 照片

1. 確認 GCS Bucket 權限設定
2. 檢查 Cloud Run 服務帳號是否有適當權限
3. 查看 Cloud Run 日誌以檢查錯誤

```bash
# 查看 Cloud Run 日誌
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wedding-line-bot" --limit=50
```

### 部署失敗

1. 確認 gcloud CLI 已登入且設定正確專案
2. 檢查 Cloud Build 日誌

```bash
# 查看 Cloud Build 日誌
gcloud builds list --limit=5
gcloud builds log YOUR_BUILD_ID
```

## 更新已部署的服務

### 更新 App Engine 服務

修改程式碼後，重新部署:

```bash
gcloud app deploy app.yaml
```

### 更新 Cloud Run 服務

修改程式碼後，重新建立映像並部署:

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/wedding-line-bot
gcloud run deploy wedding-line-bot --image gcr.io/YOUR_PROJECT_ID/wedding-line-bot
```

## 成本優化提示

- App Engine 即使無流量也會有最低執行實例
- Cloud Run 可設定為無流量時縮減至零，節省成本
- 限制 GCS 存取權限，設定適當的存取控制

## 監控與維護

### 設定 Cloud Monitoring

```bash
# 啟用 Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# 創建警報政策 (如服務不可用時)
gcloud alpha monitoring policies create --policy-from-file=alert-policy.json
```

### 查看日誌和效能

```bash
# 查看應用程式日誌
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wedding-line-bot" --limit=50
``` 
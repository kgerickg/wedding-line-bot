#!/bin/bash
# 部署到Google Cloud Functions的腳本

# 顯示使用說明
echo "=== 婚禮Line Bot雲端部署腳本 ==="
echo "此腳本將幫助您將Line Bot部署到Google Cloud Functions"

# 確認已安裝gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "錯誤：未安裝Google Cloud CLI，請先安裝"
    echo "安裝指南：https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 登入Google Cloud（如果需要）
echo "正在確認是否已登入Google Cloud..."
gcloud auth list &> /dev/null || gcloud auth login

# 設定項目ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "請輸入您的Google Cloud Project ID："
    read PROJECT_ID
    gcloud config set project $PROJECT_ID
else
    echo "使用現有專案：$PROJECT_ID"
    echo "如需變更專案，請按Ctrl+C中止，並執行 'gcloud config set project 您的專案ID'"
    sleep 3
fi

# 啟用必要API
echo "正在啟用必要的API服務..."
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable sheets.googleapis.com

# 創建.env.yaml檔案（如果不存在）
if [ ! -f .env.yaml ]; then
    echo "未找到.env.yaml檔案，正在創建..."
    cat > .env.yaml << EOF
LINE_CHANNEL_ACCESS_TOKEN: "你的Line頻道存取權杖"
LINE_CHANNEL_SECRET: "你的Line頻道密鑰"
USE_GOOGLE_SHEETS: "true"
GOOGLE_APPLICATION_CREDENTIALS: "config/service-account-key.json"
SHEETS_ID: "你的Google試算表ID"
SHEETS_RANGE: "賓客名單!A:B"
USE_IMGUR: "true"
IMGUR_CLIENT_ID: "你的Imgur客戶端ID"
IMGUR_ALBUM_HASH: "你的相簿哈希值"
EOF
    echo "已創建.env.yaml範本檔案，請編輯此檔案填入正確的設定值後再執行部署"
    exit 0
fi

# 部署到Cloud Functions
echo "正在部署到Google Cloud Functions..."
gcloud functions deploy weddingLineBot \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file .env.yaml \
  --memory 256MB \
  --timeout 60s \
  --source . \
  --region asia-east1 \
  --min-instances 0 \
  --max-instances 1

# 獲取部署後的函數URL
FUNCTION_URL=$(gcloud functions describe weddingLineBot --region asia-east1 --format='value(serviceConfig.uri)')

echo "部署完成！"
echo "函數URL: $FUNCTION_URL"
echo ""
echo "請在LINE Developers Console設定Webhook URL:"
echo "$FUNCTION_URL/callback"
echo ""
echo "部署後設定Rich Menu的命令:"
echo "FUNCTION_URL=$FUNCTION_URL node scripts/setupRichMenu.js" 
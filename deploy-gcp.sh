#!/bin/bash

# 婚禮 Line Bot GCP 部署腳本
echo "===== 婚禮 Line Bot GCP 部署腳本 ====="

# 確認已登入 gcloud
echo "確認 Google Cloud 登入狀態..."
gcloud auth list

# 設定專案
read -p "請輸入您的 Google Cloud 專案 ID (預設: neon-metric-459818-v5): " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-neon-metric-459818-v5}
echo "設定 Google Cloud 專案為: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 選擇部署方式
echo ""
echo "請選擇部署方式："
echo "1) Google App Engine (無狀態，適合簡單服務)"
echo "2) Google Cloud Run (容器化，更彈性)"
read -p "請選擇 (1/2): " DEPLOY_OPTION

if [ "$DEPLOY_OPTION" = "1" ]; then
    # App Engine 部署
    echo ""
    echo "===== 準備 App Engine 部署 ====="
    
    # 輸入 Line Bot 憑證
    read -p "請輸入 LINE_CHANNEL_SECRET: " LINE_CHANNEL_SECRET
    read -p "請輸入 LINE_CHANNEL_ACCESS_TOKEN: " LINE_CHANNEL_ACCESS_TOKEN
    
    # 修改 app.yaml 環境變數
    echo "更新 app.yaml 環境變數..."
    sed -i "s|\${LINE_CHANNEL_SECRET}|$LINE_CHANNEL_SECRET|g" app.yaml
    sed -i "s|\${LINE_CHANNEL_ACCESS_TOKEN}|$LINE_CHANNEL_ACCESS_TOKEN|g" app.yaml
    
    # 部署到 App Engine
    echo "開始部署到 App Engine..."
    gcloud app deploy app.yaml --quiet
    
    # 顯示部署資訊
    echo ""
    echo "===== 部署完成 ====="
    echo "您的 Line Bot 已部署到 App Engine"
    echo "服務 URL: https://${PROJECT_ID}.appspot.com"
    echo ""
    echo "請在 LINE Developers Console 將 Webhook URL 設定為:"
    echo "https://${PROJECT_ID}.appspot.com/callback"
    
elif [ "$DEPLOY_OPTION" = "2" ]; then
    # Cloud Run 部署
    echo ""
    echo "===== 準備 Cloud Run 部署 ====="
    
    # 輸入 Line Bot 憑證
    read -p "請輸入 LINE_CHANNEL_SECRET: " LINE_CHANNEL_SECRET
    read -p "請輸入 LINE_CHANNEL_ACCESS_TOKEN: " LINE_CHANNEL_ACCESS_TOKEN
    
    # 設定 Cloud Run 服務名稱
    read -p "請輸入 Cloud Run 服務名稱 (預設: wedding-line-bot): " SERVICE_NAME
    SERVICE_NAME=${SERVICE_NAME:-wedding-line-bot}
    
    # 建立 Docker 映像並推送到 Google Container Registry
    echo "建立 Docker 映像..."
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
    gcloud builds submit --tag $IMAGE_NAME
    
    # 部署到 Cloud Run
    echo "部署到 Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --allow-unauthenticated \
        --set-env-vars="LINE_CHANNEL_SECRET=$LINE_CHANNEL_SECRET,LINE_CHANNEL_ACCESS_TOKEN=$LINE_CHANNEL_ACCESS_TOKEN"
    
    # 取得服務 URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --format='value(status.url)')
    
    # 顯示部署資訊
    echo ""
    echo "===== 部署完成 ====="
    echo "您的 Line Bot 已部署到 Cloud Run"
    echo "服務 URL: $SERVICE_URL"
    echo ""
    echo "請在 LINE Developers Console 將 Webhook URL 設定為:"
    echo "${SERVICE_URL}/callback"
else
    echo "無效選擇，部署取消。"
    exit 1
fi 
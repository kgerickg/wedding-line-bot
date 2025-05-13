#!/bin/bash
# 重新部署到Google Cloud Functions的腳本

# 顯示使用說明
echo "=== 婚禮Line Bot雲端重新部署腳本 ==="
echo "此腳本將幫助您快速重新部署Line Bot到Google Cloud Functions"

# 確認.env.yaml檔案存在
if [ ! -f .env.yaml ]; then
    echo "錯誤：未找到.env.yaml檔案。"
    echo "請先執行 cloud-deploy.sh 完成初始設定與部署，或手動創建 .env.yaml。"
    exit 1
fi

# 重新部署到Cloud Functions
echo "正在重新部署到Google Cloud Functions..."
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

echo "重新部署完成！"
echo "函數URL: $FUNCTION_URL"
echo ""
echo "請在LINE Developers Console設定Webhook URL (如果尚未設定或有變更):"
echo "$FUNCTION_URL/callback"
echo ""
echo "部署後設定Rich Menu的命令 (如果尚未設定或有變更):"
echo "FUNCTION_URL=$FUNCTION_URL node scripts/setupRichMenu.js" 
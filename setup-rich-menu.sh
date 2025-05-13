#!/bin/bash
# 設置Rich Menu腳本

# 獲取函數URL
FUNCTION_URL=$(gcloud functions describe weddingLineBot --region=asia-east1 --format="value(url)")

echo "使用函數URL: $FUNCTION_URL"
echo "正在設置Rich Menu..."

# 設置環境變數
export FUNCTION_URL

# 執行設置腳本
node scripts/setupRichMenu.js

echo "Rich Menu設置完成！" 
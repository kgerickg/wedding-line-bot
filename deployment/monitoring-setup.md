# Cloud Monitoring 設定指南

本文檔說明如何為婚禮 Line Bot 設定 Google Cloud Monitoring，建立監控和警報系統。

## 啟用 Cloud Monitoring

首先，需要啟用 Google Cloud Monitoring API：

```bash
gcloud services enable monitoring.googleapis.com
```

## 設定 Uptime Check（可用性檢查）

Uptime Check 可以定期檢查您的服務是否正常運行：

1. 登入 Google Cloud Console
2. 前往 Cloud Monitoring > Uptime Checks
3. 點擊「CREATE UPTIME CHECK」
4. 設定檢查：
   - 目標類型：選擇 URL
   - 目標 URL：輸入您的服務 URL (例如 `https://YOUR_SERVICE_URL/`)
   - 檢查頻率：建議 5 分鐘
   - 回應檢查：選擇 「Status code matches」，設定為「200-299」

## 創建通知管道

您需要設定通知管道以接收警報：

1. 前往 Cloud Monitoring > Alerting > Notification channels
2. 點擊「ADD NEW」
3. 選擇通知類型（Email、SMS、Slack 等）
4. 完成設定後，複製通知通道 ID（後面需要用到）

## 創建警報政策

### 方法一：透過 Google Cloud Console 設置（簡單）

1. 前往 Cloud Monitoring > Alerting > Policies
2. 點擊「CREATE POLICY」
3. 選擇條件（例如 Uptime Check 失敗）
4. 設定閾值和持續時間
5. 選擇通知通道
6. 設定警報名稱和文件

### 方法二：使用 JSON 檔案設置（進階）

1. 修改 alert-policy.json 檔案中的以下部分：
   - `YOUR_PROJECT_ID`：替換為您的 GCP 專案 ID
   - `YOUR_NOTIFICATION_CHANNEL_ID`：替換為您建立的通知通道 ID
   
2. 建立警報政策：
   ```bash
   gcloud alpha monitoring policies create --policy-from-file=deployment/alert-policy.json
   ```

## 設定自定義指標（選用）

如果您需要監控特定應用程式指標（如照片請求次數或特定事件），可以設定自定義指標：

```javascript
// 在應用程式中添加以下程式碼
const {Monitoring} = require('@google-cloud/monitoring');
const client = new Monitoring.MetricServiceClient();

async function recordMetric(metricName, value) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const dataPoint = {
    interval: {
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
    value: {
      doubleValue: value,
    },
  };
  
  const timeSeriesData = {
    metric: {
      type: `custom.googleapis.com/${metricName}`,
    },
    resource: {
      type: 'global',
      labels: {
        project_id: projectId,
      },
    },
    points: [dataPoint],
  };
  
  const request = {
    name: client.projectPath(projectId),
    timeSeries: [timeSeriesData],
  };
  
  await client.createTimeSeries(request);
}

// 使用範例
recordMetric('wedding-bot/photo-requests', 1);
```

## 檢視監控儀表板

1. 前往 Cloud Monitoring > Dashboards
2. 點擊「CREATE DASHBOARD」創建自訂儀表板
3. 添加圖表以顯示關鍵指標（例如請求量、錯誤率、響應時間等）

## 常見指標

適合監控 Wedding Line Bot 的指標：

- HTTP 請求量及延遲
- LINE Webhook 成功/失敗率
- GCS 訪問頻率及延遲
- 照片顯示請求次數
- 記憶體使用量和 CPU 使用率

## 查看警報歷史

您可以在 Cloud Monitoring > Alerting > Incidents & Events 中查看觸發的警報歷史。 
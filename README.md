# 婚禮Line Bot

為賓客提供婚禮相關資訊的Line聊天機器人，支援座位查詢和婚紗照展示。

## 功能概覽

- ✅ **婚紗照隨機展示**：隨機顯示一張精美婚紗照
- ✅ **命令列介面**：方便本地測試的CLI工具
- ✅ **Rich Menu圖片生成**：建立Line Bot選單圖片的工具
- ✅ **Google Sheets整合**：從Google Sheets讀取賓客資料，無需重新部署即可線上更新
- ✅ **Imgur API整合**：使用Imgur託管婚紗照片，方便管理和高速載入
- ✅ **照片快取機制**：Cache Imgur 照片，顯著提升載入速度
- 🔄 **座位查詢**：輸入姓名查詢桌號及顯示桌次圖
- 🔄 **雙語支援**：所有功能支援中英文雙語
- 🔄 **桌次圖系統**：自動生成的精美桌次圖，支援特定桌次高亮顯示

## 專案結構

```
marraige/
├── config/                 # 配置目錄
│   └── service-account-key.json # Google服務帳號密鑰（.gitignore中）
├── data/                   # 資料目錄
│   ├── guests.csv          # 賓客名單和座位資料
│   ├── pictures/           # 婚紗照片目錄
│   └── tables/             # 桌次圖目錄
├── docs/                   # 文件目錄
│   ├── 需求說明.md          # 專案需求文件
│   ├── google_sheets_setup.md # Google Sheets整合指南
│   └── imgur_setup.md      # Imgur API整合指南
├── node_modules/           # NPM依賴套件目錄
├── public/                 # 公開資源目錄
│   ├── images/             # 圖片資源目錄
│   └── tables/             # 桌次圖目錄
├── scripts/                # 腳本目錄
│   ├── cli.js              # 命令列介面工具
│   ├── create_rich_menu_image.html  # 建立Rich Menu圖片工具
│   ├── elegant_wedding_map.html     # 桌次圖網頁生成工具
│   ├── generate_table_images.js     # 批量生成桌次圖腳本
│   ├── setupRichMenu.js             # 設置LINE Rich Menu的腳本
│   └── wedding_pic.png              # 婚紗照示例
├── src/                    # 源碼目錄
│   ├── app.js              # 應用程式主體
│   ├── controllers/        # 控制器目錄
│   ├── middlewares/        # 中間件目錄
│   ├── models/             # 資料模型目錄
│   ├── routes/             # 路由目錄
│   ├── services/           # 服務目錄
│   │   ├── guestService.js  # 座位查詢服務
│   │   ├── googleSheetsService.js # Google Sheets整合服務
│   │   ├── photoService.js  # 照片服務
│   │   └── richMenuService.js # Rich Menu服務
│   └── utils/              # 工具函數目錄
├── package-lock.json       # NPM套件版本鎖定檔
├── package.json            # 專案設定和依賴套件
└── server.js               # 伺服器啟動檔
```

## 開發進度

- ✅ 婚紗照隨機顯示功能已完成本地實現
- ✅ CLI功能選單已實現
- ✅ Rich Menu圖片生成工具已完成
- ✅ Google Sheets整合已完成實現
- ✅ Imgur API照片整合與快取系統已完成
- ✅ 座位查詢功能開發中
- ✅ 桌次圖生成功能開發中
- ✅ 雙語支援系統開發中

## 環境設定

### 安裝相依套件

```bash
# 安裝所有依賴
npm install
```

### 環境變數配置

複製 `.env.example` 為 `.env` 並填入適當的值：

```bash
# 複製環境變數範例檔
cp .env.example .env

# 編輯環境變數
nano .env
```

必要的環境變數包括：
- `LINE_CHANNEL_ACCESS_TOKEN` - Line機器人的頻道存取權杖
- `LINE_CHANNEL_SECRET` - Line機器人的頻道密鑰
- `USE_GOOGLE_SHEETS` - 設為'true'使用Google Sheets，否則使用本地CSV
- `GOOGLE_APPLICATION_CREDENTIALS` - Google服務帳號金鑰文件路徑
- `SHEETS_ID` - Google試算表ID
- `SHEETS_RANGE` - 數據範圍（如：'賓客名單!A:B'）
- `USE_IMGUR` - 設為'true'使用Imgur API，否則使用本地照片
- `IMGUR_CLIENT_ID` - Imgur API的客戶端ID
- `IMGUR_ALBUM_HASH` - Imgur相簿的哈希值

## 本地開發

### 啟動開發模式

```bash
# 啟動本地開發伺服器
npm run dev
```

### 使用CLI測試模式

```bash
# 啟動命令列介面測試工具
node scripts/cli.js
```

### 建立Rich Menu圖片

1. 開啟 `scripts/create_rich_menu_image.html`
2. 使用瀏覽器介面設計選單
3. 下載生成的圖片

### 生成桌次圖

1. 開啟 `scripts/elegant_wedding_map.html`
2. 設定所需的桌數和配置
3. 下載生成的桌次圖

## 部署說明

### 部署至Google Cloud Functions

```bash
# 確保已安裝 Google Cloud CLI 並登入

# 部署函數
gcloud functions deploy weddingLineBot \
  --runtime nodejs16 \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file .env.yaml
```

### 設定Line Webhook URL

將部署完成後獲得的函數URL設定到Line開發者控制台的Webhook URL中。

### 設定Rich Menu

```bash
# 設定Line機器人的Rich Menu
node scripts/setupRichMenu.js
```

## 資料管理

系統支援兩種方式管理賓客資料：

### 1. 本地CSV文件（default）

編輯 `data/guests.csv` 檔案，格式為：

```
姓名,桌號
黃姿瑜,1
黃維瑞,1
```

### 2. Google Sheets（推薦，更靈活）

你可以使用Google Sheets管理賓客名單，這樣可以更方便地在網上編輯而無需重新部署應用。

#### 主要優點

- **實時更新**：無需重啟服務即可更新賓客資料
- **多人協作**：多人可同時安全編輯
- **資料驗證**：利用Google Sheets自帶的資料驗證功能
- **備份機制**：如果Google Sheets讀取失敗，自動切換到本地CSV文件

#### 設定方法

設置步驟請參考 [Google Sheets整合指南](docs/google_sheets_setup.md)。

啟用後，你可以在任何時候編輯Google Sheets中的賓客資料，系統會每5分鐘自動拉取最新數據。

### 婚紗照管理

系統支援兩種方式管理婚紗照：

#### 1. 本地照片（default）

將要展示的婚紗照放到 `data/pictures/` 目錄中，系統會自動隨機選擇。

#### 2. Imgur相簿（推薦，更靈活）

你可以使用Imgur API管理婚紗照片，提供更好的效能和管理體驗：

- **高可用性**：利用Imgur的CDN，照片載入更快速
- **簡易管理**：輕鬆在網頁上管理照片，添加新照片無需重新部署
- **儲存空間節約**：避免在應用伺服器中儲存大量圖片
- **智能快取機制**：系統會智能快取照片資訊，顯著提升回應速度
- **備份機制**：如果Imgur讀取失敗，自動切換到本地照片

#### 照片快取系統

為了提升效能，系統實作了完整的照片快取機制：

- **自動快取**：啟動時自動載入相簿照片到記憶體
- **定時更新**：每小時自動更新快取，確保能獲取新增照片
- **快速回應**：從快取中隨機選擇照片，無需每次呼叫API
- **錯誤處理**：多層級錯誤處理和降級機制
- **管理工具**：透過CLI或指令即可手動刷新快取

管理照片快取的方法：
- CLI工具：選擇「刷新照片快取」選項
- Line Bot指令：發送 `clearPhotoCache` 更新照片快取

#### 設定方法

設置步驟請參考 [Imgur API整合指南](docs/imgur_setup.md)。

啟用後，你可以在Imgur網站上管理相簿，添加或移除照片，Line Bot會自動獲取最新照片。 
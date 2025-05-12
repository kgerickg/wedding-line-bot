# 婚禮Line Bot

為賓客提供婚禮相關資訊的Line聊天機器人，支援座位查詢和婚紗照展示。

## 功能概覽

- ✅ **婚紗照隨機展示**：隨機顯示一張精美婚紗照
- ✅ **命令列介面**：方便本地測試的CLI工具
- ✅ **Rich Menu圖片生成**：建立Line Bot選單圖片的工具
- 🔄 **座位查詢**：輸入姓名查詢桌號及顯示桌次圖
- 🔄 **雙語支援**：所有功能支援中英文雙語
- 🔄 **桌次圖系統**：自動生成的精美桌次圖，支援特定桌次高亮顯示

## 專案結構

```
marraige/
├── config/                 # 配置目錄
├── data/                   # 資料目錄
│   ├── guests.csv          # 賓客名單和座位資料
│   ├── pictures/           # 婚紗照片目錄
│   └── tables/             # 桌次圖目錄
├── docs/                   # 文件目錄
│   └── 需求說明.md          # 專案需求文件
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
- 🔄 座位查詢功能開發中
- 🔄 桌次圖生成功能開發中
- 🔄 雙語支援系統開發中

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

### 賓客座位資料

編輯 `data/guests.csv` 檔案，格式為：

```
姓名,桌號,別名
王小明,1,小明
李小華,2,華華
...
```

### 婚紗照管理

將要展示的婚紗照放到 `data/pictures/` 目錄中，系統會自動隨機選擇。 
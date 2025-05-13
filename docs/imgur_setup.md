# Imgur API 整合指南

本文檔說明如何設置 Imgur API 以用於婚禮 Line Bot 的婚紗照展示功能。

## 1. 為什麼使用 Imgur？

Imgur 提供免費的圖片托管服務，具有以下優勢：

- **高可用性**：Imgur 擁有高可靠性的 CDN，圖片加載速度快
- **免費使用**：基礎功能完全免費
- **隱私控制**：可以建立私人相簿，只允許有連結的人訪問
- **API 支援**：提供完整的 API，方便程式化管理

## 2. 設置步驟

### 2.1 註冊 Imgur 帳號

1. 前往 [Imgur](https://imgur.com/) 網站
2. 點擊 "Sign Up" 註冊新帳號（或登入現有帳號）

### 2.2 建立 Imgur 應用程式

1. 登入後，前往 [Imgur 應用程式頁面](https://api.imgur.com/oauth2/addclient)
2. 填寫以下資訊：
   - Application name: Wedding Line Bot
   - Authorization type: 選擇 "OAuth 2 authorization without a callback URL"
   - Email: 輸入您的電子郵件
   - Description: 婚禮 Line Bot 的婚紗照展示應用
3. 點擊 "Submit" 提交
4. Imgur 將提供 **Client ID** 和 **Client Secret**，請保存 Client ID

### 2.3 創建相簿並上傳照片

1. 登入 Imgur
2. 點擊右上角的 "New Post"
3. 選擇 "New album"
4. 上傳您的婚紗照並為每張照片添加描述（可選，但建議添加以便在 Line Bot 中顯示）
5. 設置相簿隱私選項為 "Hidden"（隱藏，只有擁有連結的人可以查看）
6. 保存相簿
7. 從相簿 URL 獲取 **Album Hash**：`https://imgur.com/a/ALBUM_HASH`
   
   其中 `ALBUM_HASH` 部分就是您需要的相簿哈希值

### 2.4 設定 Line Bot 環境變數

1. 編輯 `.env` 文件（如果不存在，請複製 `.env.example` 並重命名為 `.env`）
2. 添加或更新以下設定：

```bash
# Imgur API設定
USE_IMGUR=true
IMGUR_CLIENT_ID=your_client_id_here
IMGUR_ALBUM_HASH=your_album_hash_here
```

## 3. 使用注意事項

### 3.1 API 使用限制

Imgur API 有以下限制：

- 每小時請求限制：12,500 次
- 每日上傳限制：無名用戶 50 張照片，註冊用戶無限制
- 相簿上限：每個帳號可創建無限數量的相簿

### 3.2 最佳實踐

- **照片大小**：建議上傳合理大小的照片（1MB-2MB），避免過大影響加載速度
- **照片描述**：添加有意義的描述，這些將作為照片標題顯示給用戶
- **備份機制**：即使使用 Imgur，依然建議保留本地照片作為備份
- **隱私選項**：使用 "Hidden" 選項保護照片隱私

### 3.3 故障排除

如果照片無法顯示：

1. 確認 Client ID 和 Album Hash 正確無誤
2. 檢查相簿的隱私設置是否為 "Hidden"（而非 "Private"）
3. 確認相簿中確實有照片
4. 檢查您的 Imgur 帳號是否處於正常狀態

## 4. 其他資源

- [Imgur API 文檔](https://apidocs.imgur.com/)
- [imgur npm 套件](https://www.npmjs.com/package/imgur)
- [Imgur 使用條款](https://imgur.com/tos) 
# Google Sheets 整合設置

本文件說明如何將婚禮Line Bot連接到Google Sheets以獲取賓客資料。

## 步驟 1: 創建Google試算表

1. 登入Google帳戶，前往 [Google Sheets](https://sheets.google.com/)
2. 建立新的試算表
3. 將第一個工作表命名為「guests」（使用英文名稱避免編碼問題）
4. 在A1儲存格輸入「姓名」，在B1儲存格輸入「桌號」
5. 從A2開始填入賓客資料，格式如下：
   ```
   姓名,桌號
   黃姿瑜,1
   黃維瑞,1
   ...
   ```
6. 記下試算表的網址，從中獲取試算表ID
   - 例如：https://docs.google.com/spreadsheets/d/`1AbCdEfGhIjKlMnOpQrStUvWxYz012345`/edit
   - 其中 `1AbCdEfGhIjKlMnOpQrStUvWxYz012345` 即為試算表ID

## 步驟 2: 創建Google Cloud項目

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案
3. 在「API和服務」中啟用 Google Sheets API

## 步驟 3: 創建服務帳號

1. 在Google Cloud Console中，進入「IAM和管理 > 服務帳號」
2. 點擊「創建服務帳號」
3. 輸入服務帳號名稱和說明，點擊「創建」
4. 無需為此服務帳號授予專案訪問權
5. 點擊「完成」創建服務帳號
6. 在服務帳號列表中，找到您剛才創建的服務帳號
7. 點擊該服務帳號，選擇「密鑰」選項卡
8. 點擊「添加密鑰 > 創建新密鑰」
9. 選擇JSON格式，點擊「創建」
10. 瀏覽器會自動下載JSON密鑰文件
11. 將此文件重命名為 `service-account-key.json` 並保存到項目的 `config` 目錄中

## 步驟 4: 共享Google試算表

1. 返回包含賓客名單的Google試算表
2. 點擊右上角的「共享」按鈕
3. 在「添加用戶」框中，輸入服務帳號的電子郵件地址
   - 格式通常為 `something@project-id.iam.gserviceaccount.com`
   - 可在您的服務帳號JSON文件中找到此電子郵件地址
4. 將權限設為「檢視者」
5. 取消勾選「通知用戶」選項
6. 點擊「共享」

## 步驟 5: 配置環境變數

編輯專案根目錄下的 `.env` 文件（或創建一個），添加以下設置：

```
# Google Sheets設定
USE_GOOGLE_SHEETS=true
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account-key.json
SHEETS_ID=您的試算表ID
SHEETS_RANGE=guests!A:B
```

> **重要提示**：如果工作表名稱包含中文或特殊字符，必須用單引號將工作表名稱括起來，如：`'賓客名單'!A:B`

## 步驟 6: 測試整合

1. 運行 CLI 測試工具確認整合正常工作：
   ```
   node scripts/cli.js
   ```
2. 選擇「座位查詢」並輸入賓客姓名
3. 系統應能成功查詢到座位信息

## 故障排除

如果遇到問題：

1. 確認服務帳號密鑰文件位置正確
2. 確認已正確共享試算表給服務帳號
3. 確認試算表ID正確
4. 檢查控制台日誌中的錯誤信息
5. 確認試算表的格式正確（標題行在第一行，數據從第二行開始） 
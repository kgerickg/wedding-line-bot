FROM node:18-slim

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝相依套件
RUN npm ci --only=production

# 複製專案檔案
COPY . .

# 暴露應用程式端口
EXPOSE 8080

# 設定環境變數
ENV PORT=8080
ENV NODE_ENV=production

# 啟動應用程式
CMD [ "npm", "start" ] 
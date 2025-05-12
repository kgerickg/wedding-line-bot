const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 確保output目錄存在
const outputDir = path.join(__dirname, '../public/tables');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 等待函數
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateTableImages() {
  console.log('啟動瀏覽器...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 讀取HTML檔案
    const htmlPath = path.join(__dirname, 'elegant_wedding_map.html');
    console.log(`加載HTML文件: ${htmlPath}`);
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML文件不存在: ${htmlPath}`);
    }
    
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    // 設定視窗大小
    await page.setViewport({ width: 500, height: 800 });
    
    console.log('開始生成桌次圖片...');
    
    // 生成23張圖片，每張圖片highlight不同的桌次
    for (let i = 1; i <= 23; i++) {
      console.log(`處理桌次 ${i}...`);
      
      // 選擇要highlight的桌次
      await page.evaluate((tableNum) => {
        const selectElement = document.getElementById('highlight-table');
        if (!selectElement) {
          throw new Error('無法找到highlight-table元素');
        }
        
        selectElement.value = tableNum;
        
        // 觸發change事件
        const event = new Event('change');
        selectElement.dispatchEvent(event);
      }, i);
      
      // 等待UI更新
      await sleep(500);
      
      // 截圖
      const element = await page.$('#map-container');
      if (!element) {
        throw new Error('無法找到map-container元素');
      }
      
      const outputPath = path.join(outputDir, `table_${i}.png`);
      
      await element.screenshot({
        path: outputPath,
        omitBackground: true
      });
      
      console.log(`已生成桌次 ${i} 圖片: ${outputPath}`);
    }
    
    console.log('所有桌次圖片已生成完成！');
    console.log(`圖片存儲位置: ${outputDir}`);
  } catch (error) {
    console.error('生成圖片時發生錯誤:');
    console.error(error);
  } finally {
    await browser.close();
    console.log('瀏覽器已關閉');
  }
}

generateTableImages().catch(err => {
  console.error('腳本執行失敗:');
  console.error(err);
}); 
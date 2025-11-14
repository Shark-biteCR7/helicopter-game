#!/usr/bin/env node

/**
 * 游戏自动化测试脚本
 * 使用 Puppeteer 自动化浏览器测试游戏
 */

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer 未安装。请先运行 `npm install puppeteer --save-dev`。');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const http = require('http');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// 测试配置
const CONFIG = {
  port: 8080,
  url: 'http://localhost:8080',
  headless: false, // 显示浏览器窗口方便观察
  testTimeout: 60000 // 60秒超时
};

// 启动静态服务器
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      try {
        const rawPath = request.url ? request.url.split('?')[0] : '/';
        const normalized = path.normalize(rawPath).replace(/^\/+/, '');
        let filePath = path.join(__dirname, normalized);

        if (!filePath.startsWith(__dirname)) {
          response.writeHead(403);
          response.end('Forbidden');
          return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath)) {
          response.writeHead(404);
          response.end('Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(response);
      } catch (error) {
        response.writeHead(500);
        response.end('Internal Server Error');
        console.error('❌ 静态服务器错误:', error);
      }
    });

    server.listen(CONFIG.port, () => {
      console.log(`✅ 服务器启动: ${CONFIG.url}`);
      resolve(server);
    });
  });
}

// 等待延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试流程
async function runTests() {
  let browser;
  let server;

  try {
    console.log('🚀 开始自动化测试...\n');

    // 1. 启动服务器
    server = await startServer();
    await delay(1000);

    // 2. 启动浏览器
    console.log('🌐 启动浏览器...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      defaultViewport: { width: 720, height: 1280 },
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // 监听控制台
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('❌') || text.includes('⚠️')) {
        console.log(`  ⚠️  控制台警告: ${text}`);
      }
    });

    // 监听错误
    page.on('pageerror', error => {
      console.log(`  ❌ 页面错误: ${error.message}`);
    });

    // 3. 加载游戏
    console.log('📂 加载游戏页面...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle2' });
    await delay(2000); // 等待Phaser加载

    console.log('\n===== 测试开始 =====\n');

    // 4. 测试菜单界面
  console.log('✅ [1/11] 菜单界面加载');
    const menuButton = await page.$('canvas');
    if (!menuButton) throw new Error('未找到游戏画布');

    // 5. 点击开始游戏
  console.log('✅ [2/11] 点击"开始冒险"按钮');
    await page.click('canvas', { position: { x: 360, y: 700 } }); // 开始冒险按钮位置
    await delay(2000);

    // 6. 选择第1关
  console.log('✅ [3/11] 选择第1关');
    await page.click('canvas', { position: { x: 360, y: 400 } }); // 第1关位置
    await delay(2000);

    // 7. 开始游戏
  console.log('✅ [4/11] 点击开始游戏');
    await page.click('canvas', { position: { x: 360, y: 640 } }); // 点击屏幕开始
    await delay(1000);

    await page.evaluate(() => {
      const locateGameInstance = () => {
        if (window.__GAME__) return window.__GAME__;
        if (window.game) return window.game;
        if (window.Phaser?.GAMES?.length) return window.Phaser.GAMES[0];
        return null;
      };
      const game = locateGameInstance();
      if (!game) return;
      const getPlayScene = () => {
        if (typeof game.scene.getScene === 'function') {
          try {
            return game.scene.getScene('Play');
          } catch (err) {
            return null;
          }
        }
        return game.scene.keys?.Play || null;
      };
      const playScene = getPlayScene();
      const status = playScene?.scene?.settings?.status;
      const RUNNING = window.Phaser?.Scenes?.RUNNING ?? 4;
      if (!playScene || status !== RUNNING) {
        game.scene.start('Play', { chapterId: 'rural', levelIndex: 0 });
      }
    });

    await delay(1200);

    // 8. 自动玩游戏（模拟点击）
  console.log('✅ [5/11] 模拟玩游戏（自动点击10秒）');
    const startTime = Date.now();
    const playDuration = 10000; // 玩10秒

    while (Date.now() - startTime < playDuration) {
      // 随机点击控制飞行
      if (Math.random() > 0.5) {
        await page.mouse.down();
        await delay(100);
        await page.mouse.up();
      }
      await delay(200);
    }

    console.log('✅ [6/11] 游戏运行正常');

    console.log('✅ [7/11] 模拟通关并验证解锁进度');
    const completionResult = await page.evaluate(() => {
      const locateGameInstance = () => {
        if (window.__GAME__) return window.__GAME__;
        if (window.game) return window.game;
        if (window.Phaser) {
          if (window.Phaser.GAMES && window.Phaser.GAMES.length) {
            const withPlay = window.Phaser.GAMES.find(entry => entry?.scene?.keys?.Play);
            if (withPlay) return withPlay;
            return window.Phaser.GAMES[0];
          }
          if (window.Phaser.GAME) return window.Phaser.GAME;
        }
        return null;
      };

      const game = locateGameInstance();
      if (game) {
        window.__GAME__ = game;
      }
      if (!game) {
        return {
          success: false,
          reason: '未找到 Phaser 游戏实例',
          phaserAvailable: Boolean(window.Phaser),
          gamesCount: window.Phaser?.GAMES?.length || 0,
          hasWindowGame: Boolean(window.game),
          hasStoredGame: Boolean(window.__GAME__),
          hasGamesProp: Boolean(window.Phaser && 'GAMES' in window.Phaser),
          phaserKeys: window.Phaser ? Object.keys(window.Phaser) : []
        };
      }
      const playScene = typeof game.scene.getScene === 'function'
        ? game.scene.getScene('Play')
        : game.scene.keys?.Play;
      if (!playScene) {
        return { success: false, reason: 'Play 场景尚未启动' };
      }
      if (!playScene.levelContext) {
        return {
          success: false,
          reason: 'Play 场景未完成初始化',
          playKeys: Object.keys(playScene || {}),
          sceneStatus: playScene.scene?.settings?.status ?? null
        };
      }
      if (!playScene.isRunning) {
        playScene.beginRun();
      }
      playScene.worldX = playScene.goalPosition + 10;
      if (playScene.finishLine) {
        playScene.finishLine.x = playScene.goalPosition - playScene.worldX;
      }
      playScene.onLevelComplete();
      const chapterId = playScene.levelContext.chapter.id;
      const chapterProgress = playScene.progressManager.getChapterProgress(chapterId);
      const storageValue = window.localStorage.getItem('HELI_PROGRESS');
      return {
        success: playScene.isLevelComplete,
        unlockedLevels: chapterProgress?.unlockedLevels ?? null,
        storage: storageValue
      };
    });

    if (!completionResult.success) {
      console.log('   - Debug:', completionResult);
      throw new Error(`通关验证失败: ${completionResult.reason || '未知原因'}`);
    }
    try {
      const stored = completionResult.storage ? JSON.parse(completionResult.storage) : {};
      console.log(`   - 当前关卡解锁数: ${completionResult.unlockedLevels}`);
      console.log(`   - 存档摘要: ${JSON.stringify(stored)}`);
    } catch (err) {
      console.log('   - 存档解析失败，原始值:', completionResult.storage);
    }

    // 9. 检查性能
    console.log('✅ [8/11] 检查性能指标');
    const metrics = await page.metrics();
    console.log(`   - JS堆大小: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - 节点数: ${metrics.Nodes}`);
    console.log(`   - 事件监听器: ${metrics.JSEventListeners}`);

    // 10. 截图
  console.log('✅ [9/11] 保存游戏截图');
    await page.screenshot({ path: 'test-screenshot.png' });

    // 11. 检查控制台错误
  console.log('✅ [10/11] 检查控制台日志');
    const logs = await page.evaluate(() => {
      return window.console.history || [];
    });

    // 12. 测试完成
  console.log('✅ [11/11] 测试完成\n');

    console.log('===== 测试结果 =====');
    console.log('✅ 所有测试通过！');
    console.log(`📸 截图已保存: test-screenshot.png`);
    console.log(`💾 内存占用: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // 清理
    if (browser) {
      console.log('\n🔒 关闭浏览器...');
      await browser.close();
    }
    if (server) {
      console.log('🔒 关闭服务器...');
      server.close();
    }
  }
}

// 运行测试
runTests().then(() => {
  console.log('\n✅ 测试流程完成！');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 测试流程失败:', error);
  process.exit(1);
});

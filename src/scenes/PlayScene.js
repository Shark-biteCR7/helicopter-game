import { DESIGN, PHYS, SCORE, CHAPTERS, COURSE, WEATHER, ASSETS } from '../constants.js';
import AudioSystem from '../systems/AudioSystem.js';

const resolveLevel = (request = {}) => {
  const playableChapters = CHAPTERS.filter(ch => Array.isArray(ch.levels) && ch.levels.length > 0);
  if (!playableChapters.length) {
    throw new Error('No playable chapters configured.');
  }
  const fallbackChapter = playableChapters[0];
  const requestedChapter = playableChapters.find(ch => ch.id === request.chapterId) || fallbackChapter;
  const safeIndex = Phaser.Math.Clamp(request.levelIndex ?? 0, 0, requestedChapter.levels.length - 1);
  const level = requestedChapter.levels[safeIndex];
  return { chapter: requestedChapter, level, levelIndex: safeIndex };
};

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('Play');
    this.levelRequest = { chapterId: 'rural', levelIndex: 0 };
  }

  init(data) {
    if (data) this.levelRequest = data;
  }

  create(data) {
    this.levelContext = resolveLevel(data || this.levelRequest);
    this.registry.set('currentLevel', {
      chapterId: this.levelContext.chapter.id,
      levelIndex: this.levelContext.levelIndex
    });
    this.audio = new AudioSystem(this);

    const cam = this.cameras.main;
    this.centerX = cam.centerX;
    this.centerY = cam.centerY;

    const level = this.levelContext.level;
    this.levelLength = level.length; // 关卡总长度
    this.goalPosition = level.goalPosition; // 终点位置
    this.starThresholds = level.starThresholds; // 星级阈值
    this.weatherType = level.weather;
    this.scrollSpeed = 200; // 固定滚动速度

    this.elapsed = 0;
    this.worldX = 0; // 当前世界坐标（关卡进度）
    this.hold = false;
    this.isRunning = false;
    this.isDead = false;
    this.isLevelComplete = false;
    this.idleTime = 0;
    this.vy = 0;

    // 终点线
    this.finishLine = null;
    // 移除 activeSensors，不再使用传感器

    this.best = parseInt(localStorage.getItem(SCORE.lsKey) || '0', 10);
    this.score = 0;
    
    // 生命系统
    this.lives = 5;
    this.maxLives = 5;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.livesLostCount = 0; // 记录失去的生命数（用于计算星级）

    this.createBackground();
    this.createHelicopter();
    this.createObstaclePool();
    this.spawnLevelObstacles(); // 生成关卡固定障碍
    this.createUI();
    this.setupInput();
    this.setupWeatherEffect();

    this.events.once('shutdown', this.cleanup, this);
  }

  createBackground() {
    this.sky = this.add.image(this.centerX, this.centerY, 'rural-sky').setDepth(-4);

    this.clouds = this.add.group();
    for (let i = 0; i < 4; i += 1) {
      this.spawnCloud(Phaser.Math.Between(80, DESIGN.width - 80));
    }
    this.time.addEvent({ delay: 4200, loop: true, callback: () => this.spawnCloud(DESIGN.width + 120) });

    this.field = this.add.tileSprite(this.centerX, DESIGN.height - 120, DESIGN.width, 240, 'field-ground')
      .setDepth(-2)
      .setOrigin(0.5, 0.5);

  this.ground = this.physics.add.staticImage(this.centerX, DESIGN.height - 15, 'ground');
  this.ground.refreshBody();
    this.ground.setData('type', 'ground');

    // 创建终点线
    this.createFinishLine();
  }

  createFinishLine() {
    // 终点线容器（初始在屏幕右侧外很远）
    this.finishLine = this.add.container(DESIGN.width + 5000, 0);
    // 竖条纹
    const lineGraphics = this.add.graphics();
    const stripeWidth = 30;
    const stripeCount = Math.ceil(DESIGN.height / stripeWidth);
    for (let i = 0; i < stripeCount; i++) {
      const color = i % 2 === 0 ? 0xffff00 : 0x000000; // 黄黑相间
      lineGraphics.fillStyle(color, 1);
      lineGraphics.fillRect(0, i * stripeWidth, 40, stripeWidth);
    }
    this.finishLine.add(lineGraphics);
    // 文本
    const finishText = this.add.text(20, DESIGN.height / 2 - 100, '🏁', { fontSize: 80 }).setOrigin(0.5);
    this.finishLine.add(finishText);
    const finishTextZh = this.add.text(20, DESIGN.height / 2, '终点', {
      fontFamily: 'Inter, Arial', fontSize: 48, fontStyle: '700', color: '#ff0000', stroke: '#ffffff', strokeThickness: 4
    }).setOrigin(0.5);
    this.finishLine.add(finishTextZh);
    const finishTextEn = this.add.text(20, DESIGN.height / 2 + 60, 'FINISH', {
      fontFamily: 'Inter, Arial', fontSize: 32, fontStyle: '700', color: '#ff0000', stroke: '#ffffff', strokeThickness: 3
    }).setOrigin(0.5);
    this.finishLine.add(finishTextEn);
    // 初始距离
    this.finishLineDistance = 0;
  }

  spawnCloud(x, y = Phaser.Math.Between(140, 540)) {
    const scale = Phaser.Math.FloatBetween(0.6, 1.1);
    const cloud = this.add.image(x, y, 'cloud')
      .setAlpha(0.85)
      .setScale(scale)
      .setDepth(-3);
    cloud.speed = Phaser.Math.FloatBetween(18, 32);
    this.clouds.add(cloud);
    return cloud;
  }

  createHelicopter() {
    this.heli = this.physics.add.image(180, this.centerY, 'heli');
    this.heli.setFlipX(true); // 水平翻转直升机，使其朝向正确
    this.heli.setCircle(26, 24, 14);
    // 改为手动边界控制，避免 Arcade 世界边界内部强制归零造成卡底
    this.heli.setCollideWorldBounds(false);
    this.heli.body.setAllowGravity(false);
    // 移除地面碰撞检测，让触底和触顶一样（只物理阻挡，不扣血）
    // this.groundCollider = this.physics.add.overlap(this.heli, this.ground, this.onHit, null, this);
  }

  createObstaclePool() {
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.heli, this.obstacles, this.onHit, null, this);
    // 动态生成相关变量（重新启用）
    this.nextObstacleX = 1000;
    this.lastObstacleX = 0;
    this.activeObstacles = [];
  }

  spawnLevelObstacles() {
    this.createFinishLineAtGoal();
  }

  /**
   * 根据关卡获取障碍物贴图 key（预留扩展点）
   * 当前使用 tree-top / tree-bottom，未来可替换为钟乳石专用素材
   */
  getObstacleSpriteKeysForLevel(level) {
    // 未来扩展：根据关卡 levelId 返回不同的钟乳石贴图数组
    // 例如：levelId 1-2 用浅色钟乳石，3-4 用深色，5 用特殊形状
    const topSpriteKeys = ['tree-top'];    // 将来可扩展为 ['stalactite_top_1', 'stalactite_top_2', ...]
    const bottomSpriteKeys = ['tree-bottom']; // 将来可扩展为 ['stalagmite_bottom_1', 'stalagmite_bottom_2', ...]
    
    return {
      top: Phaser.Utils.Array.GetRandom(topSpriteKeys),
      bottom: Phaser.Utils.Array.GetRandom(bottomSpriteKeys)
    };
  }

  /**
   * 根据关卡和当前进度动态计算缝隙参数（基于连续轨迹）
   * @param {Object} level - 当前关卡配置
   * @param {number} progress - 当前进度比例 (0~1)，0 表示起点，1 表示终点
   * @returns {{ gapHeight: number, gapCenterY: number, densityMultiplier: number }}
   */
  getGapConfigForCurrentLevel(level, progress) {
    const levelId = level.levelId || 1;
    const gapHeightMin = level.gapHeight?.min || 200;
    const gapHeightMax = level.gapHeight?.max || 280;
    
    // 使用 COURSE 定义的可飞行区域
    const usableMin = COURSE.centerYMin || 300;
    const usableMax = COURSE.centerYMax || 960;
    
    // === 1. 计算 gapHeight（越到后期越窄） ===
    let gapHeightBias;
    if (progress < 0.2) {
      // 前 20%：简单，偏向大缝隙
      gapHeightBias = 0.7 + Math.random() * 0.3;
    } else if (progress > 0.8) {
      // 后 20%：困难，偏向小缝隙
      gapHeightBias = 0.0 + Math.random() * 0.3;
    } else {
      // 中间 60%：正常
      gapHeightBias = 0.3 + Math.random() * 0.5;
    }
    const gapHeight = Math.floor(gapHeightMin + (gapHeightMax - gapHeightMin) * gapHeightBias);
    
    // === 2. 生成连续轨迹的 normalizedY ∈ [0, 1] ===
    let normalizedY = 0.5; // 默认中间
    
    // 根据关卡选择不同的轨迹模式
    switch (levelId) {
      case 1: {
        // 关卡1：温和正弦波，频率低，振幅小
        const frequency = 1.5; // 低频率
        const amplitude = 0.15; // 小振幅（0.35~0.65）
        normalizedY = 0.5 + amplitude * Math.sin(2 * Math.PI * frequency * progress);
        break;
      }
      
      case 2: {
        // 关卡2：正弦波 + 小随机，频率略高
        const frequency = 2.0;
        const amplitude = 0.2; // 0.3~0.7
        const randomOffset = (Math.random() - 0.5) * 0.1; // 添加小随机
        normalizedY = 0.5 + amplitude * Math.sin(2 * Math.PI * frequency * progress) + randomOffset;
        break;
      }
      
      case 3: {
        // 关卡3：正弦 + 锯齿混合，高低交替
        const sineFreq = 2.5;
        const sineAmp = 0.25;
        const sawtoothFreq = 1.0;
        const sawtoothAmp = 0.15;
        // 锯齿波：上升-下降循环
        const sawtoothPhase = (progress * sawtoothFreq) % 1;
        const sawtoothValue = sawtoothPhase < 0.5 ? sawtoothPhase * 2 : 2 - sawtoothPhase * 2;
        normalizedY = 0.5 
          + sineAmp * Math.sin(2 * Math.PI * sineFreq * progress)
          + sawtoothAmp * (sawtoothValue - 0.5);
        break;
      }
      
      case 4: {
        // 关卡4：随机阶梯 + 正弦，突然跳跃
        const stepCount = 8; // 分成8段
        const stepIndex = Math.floor(progress * stepCount);
        // 用步骤索引作为随机种子（保持同一段内一致）
        const stepSeed = (stepIndex * 137) % 100; // 伪随机
        const stepValue = (stepSeed / 100) * 0.6 + 0.2; // 0.2~0.8
        const sineFreq = 3.0;
        const sineAmp = 0.15;
        normalizedY = stepValue + sineAmp * Math.sin(2 * Math.PI * sineFreq * progress);
        break;
      }
      
      case 5: {
        // 关卡5：高频正弦 + 大振幅 + 随机跳跃，地狱难度
        const freq1 = 3.5;
        const freq2 = 1.2; // 双频叠加
        const amp1 = 0.25;
        const amp2 = 0.15;
        const randomJump = (Math.random() - 0.5) * 0.2; // 大随机跳跃
        normalizedY = 0.5 
          + amp1 * Math.sin(2 * Math.PI * freq1 * progress)
          + amp2 * Math.sin(2 * Math.PI * freq2 * progress)
          + randomJump;
        break;
      }
      
      default:
        normalizedY = 0.5;
    }
    
    // === 3. 将 normalizedY 映射到实际高度，并 Clamp 到安全范围 ===
    normalizedY = Phaser.Math.Clamp(normalizedY, 0.0, 1.0);
    const gapCenterY = Math.floor(Phaser.Math.Linear(usableMin, usableMax, normalizedY));
    
    // 添加小随机偏移（不超过 gapHeight 的 10%），保持轨迹连续但不僵硬
    const microOffset = (Math.random() - 0.5) * gapHeight * 0.1;
    const finalGapCenterY = Phaser.Math.Clamp(
      gapCenterY + microOffset,
      usableMin + gapHeight / 2,
      usableMax - gapHeight / 2
    );
    
    // === 4. 密度系数（关卡越高越密集） ===
    const densityMultiplier = 1.0 - (levelId - 1) * 0.05; // 1.0 → 0.8
    
    return {
      gapHeight: Math.max(150, gapHeight),
      gapCenterY: Math.floor(finalGapCenterY),
      densityMultiplier
    };
  }

  // 动态生成单个障碍物（基于连续轨迹的钟乳石风格）
  spawnNextObstacle() {
    if (!this.levelContext || !this.levelContext.level) {
      console.error('❌ spawnNextObstacle: levelContext 未初始化！');
      return;
    }
    
    const level = this.levelContext.level;
    const baseDensity = level.obstacleDensity || 800;
    
    // 如果超过终点位置，不再生成
    if (this.nextObstacleX >= this.goalPosition) {
      return;
    }
    
    // 计算当前进度比例 (0~1)
    const progress = this.nextObstacleX / this.goalPosition;
    
    // 使用连续轨迹生成缝隙配置
    const gapConfig = this.getGapConfigForCurrentLevel(level, progress);
    const gapHeight = gapConfig.gapHeight;
    const gapCenterY = gapConfig.gapCenterY;
    const densityMultiplier = gapConfig.densityMultiplier;
    
    // 计算上下障碍物位置
    const topY = gapCenterY - gapHeight / 2;
    const bottomY = gapCenterY + gapHeight / 2;
    
    // 计算屏幕位置（世界坐标 - worldX）
    const screenX = this.nextObstacleX - this.worldX;
    
    // 获取本关的钟乳石贴图 key（预留扩展点）
    const spriteKeys = this.getObstacleSpriteKeysForLevel(level);
    
    // ✅ 使用已调好的 acquireObstacle() 来生成障碍和碰撞盒
    const top = this.acquireObstacle(spriteKeys.top, screenX, topY, true);
    const bottom = this.acquireObstacle(spriteKeys.bottom, screenX, bottomY, false);
    
    // 标记数据，供 onHit / 更新位置使用
    top.setData('type', 'obstacle');
    bottom.setData('type', 'obstacle');
    top.setData('worldX', this.nextObstacleX);
    bottom.setData('worldX', this.nextObstacleX);
    
    // 随机钟乳石形态变化（宽度、旋转角度）- 仅影响视觉，不影响碰撞盒
    const scaleX = Phaser.Math.FloatBetween(0.9, 1.3);
    const rotation = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-4, 4));
    top.setScale(scaleX, 1.0);
    top.setRotation(rotation);
    
    const bottomScaleX = Phaser.Math.FloatBetween(0.9, 1.3);
    const bottomRotation = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-4, 4));
    bottom.setScale(bottomScaleX, 1.0);
    bottom.setRotation(bottomRotation);
    
    // === 移除传感器得分逻辑，改为基于飞行距离得分 ===
    // 原有的 sensor 已删除，不再通过穿过缝隙加分
    
    // 记录障碍物组（便于后续清理）
    this.activeObstacles.push({ top, bottom, x: this.nextObstacleX });
    
    // 更新下一个障碍物位置（应用难度密度系数）
    this.lastObstacleX = this.nextObstacleX;
    this.nextObstacleX += Math.floor(baseDensity * densityMultiplier);
  }

  spawnObstacleAt(obstacleData) {
    // 保留此方法以防其他地方调用，但不再使用
  }

  createFinishLineAtGoal() {
    const goalX = this.goalPosition;
    
    // 终点线容器
    this.finishLine = this.add.container(goalX, 0);
    
    // 绘制竖条纹
    const lineGraphics = this.add.graphics();
    const stripeWidth = 30;
    const stripeCount = Math.ceil(DESIGN.height / stripeWidth);
    
    for (let i = 0; i < stripeCount; i++) {
      const color = i % 2 === 0 ? 0xffff00 : 0x000000;
      lineGraphics.fillStyle(color, 1);
      lineGraphics.fillRect(0, i * stripeWidth, 40, stripeWidth);
    }
    
    this.finishLine.add(lineGraphics);
    
    // 终点文字
    const finishText = this.add.text(20, DESIGN.height / 2 - 100, '🏁', {
      fontSize: 80
    }).setOrigin(0.5);
    this.finishLine.add(finishText);
    
    const finishTextZh = this.add.text(20, DESIGN.height / 2, '终点', {
      fontFamily: 'Inter, Arial',
      fontSize: 48,
      fontStyle: '700',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.finishLine.add(finishTextZh);
    
    const finishTextEn = this.add.text(20, DESIGN.height / 2 + 60, 'FINISH', {
      fontFamily: 'Inter, Arial',
      fontSize: 32,
      fontStyle: '700',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.finishLine.add(finishTextEn);
  }

  createUI() {
    const { chapter, level } = this.levelContext;
    const weather = WEATHER[this.weatherType] || { zh: '待定', en: 'TBD' };

    // 顶部中央：关卡标题
    this.levelTitleZh = this.add.text(this.centerX, 40, `${chapter.title.zh} · ${level.name.zh}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 28,
      fontStyle: '600',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 左上角：最高分
    this.bestZh = this.add.text(40, 100, `最高 ${this.best}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // 右上角：天气
    this.weatherZh = this.add.text(DESIGN.width - 40, 100, weather.zh, {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    // 中上：得分
    this.add.text(this.centerX, 150, '得分', {
      fontFamily: 'Inter, Arial',
      fontSize: 24,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    this.scoreText = this.add.text(this.centerX, 190, '0', {
      fontFamily: 'Inter, Arial',
      fontSize: 56,
      fontStyle: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 生命值显示
    this.livesContainer = this.add.container(this.centerX, 280);
    this.livesText = this.add.text(0, 0, '❤️', {
      fontFamily: 'Inter, Arial',
      fontSize: 28
    }).setOrigin(0.5);
    this.livesValue = this.add.text(50, 0, '× 5', {
      fontFamily: 'Inter, Arial',
      fontSize: 28,
      fontStyle: '700',
      color: '#ff5370'
    }).setOrigin(0, 0.5);
    this.livesContainer.add([this.livesText, this.livesValue]);

    // 关卡进度显示
    this.progressContainer = this.add.container(this.centerX, 350);
    this.progressLabel = this.add.text(0, 0, '进度', {
      fontFamily: 'Inter, Arial',
      fontSize: 20,
      color: '#bcd7ff'
    }).setOrigin(0.5);
    this.progressValue = this.add.text(0, 28, `0 / ${this.levelLength}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      fontStyle: '600',
      color: '#9ee4ff'
    }).setOrigin(0.5);
    this.progressContainer.add([this.progressLabel, this.progressValue]);

    this.tipContainer = this.add.container(this.centerX, DESIGN.height - 300);
    const tipZh = this.add.text(0, 0, '轻触屏幕或按空格开始', {
      fontFamily: 'Inter, Arial',
      fontSize: 32,
      color: '#9ee4ff'
    }).setOrigin(0.5);
    const tipEn = this.add.text(0, 38, 'Tap or press Space to start', {
      fontFamily: 'Inter, Arial',
      fontSize: 18,
      color: '#bcd7ff'
    }).setOrigin(0.5);
    this.tipContainer.add([tipZh, tipEn]);
    this.tipTween = this.tweens.add({
      targets: this.tipContainer,
      alpha: 0.25,
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  setupInput() {
    this.handlePointerDown = () => {
      if (!this.isRunning && !this.isDead) this.beginRun();
      this.hold = true;
      this.audio.playJump();
    };
    this.handlePointerUp = () => { this.hold = false; };
    this.input.on('pointerdown', this.handlePointerDown);
    this.input.on('pointerup', this.handlePointerUp);

    this.keyDownHandler = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        if (!this.isRunning && !this.isDead) this.beginRun();
        this.hold = true;
        this.audio.playJump();
      }
    };
    this.keyUpHandler = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') this.hold = false;
    };
    this.input.keyboard.on('keydown', this.keyDownHandler, this);
    this.input.keyboard.on('keyup', this.keyUpHandler, this);
  }

  setupWeatherEffect() {
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
      this.weatherParticles = null;
      this.weatherEmitter = null;
    }

    switch (this.weatherType) {
      case 'windy': {
        const manager = this.add.particles(0, 0, 'leaf').setDepth(-1);
        manager.setScrollFactor(0);
        const emitter = manager.createEmitter({
          x: { min: DESIGN.width + 40, max: DESIGN.width + 140 },
          y: { min: 220, max: DESIGN.height - 360 },
          lifespan: 5200,
          speedX: { min: -180, max: -120 },
          speedY: { min: -40, max: 40 },
          scale: { start: 0.9, end: 0.4 },
          rotate: { min: -140, max: 140 },
          alpha: { start: 0.9, end: 0 },
          quantity: 1,
          frequency: 190
        });
        this.weatherParticles = manager;
        this.weatherEmitter = emitter;
        break;
      }
      case 'rain': {
        const manager = this.add.particles(0, 0, 'rain-drop').setDepth(-1);
        manager.setScrollFactor(0);
        const emitter = manager.createEmitter({
          x: { min: -60, max: DESIGN.width + 60 },
          y: 0,
          lifespan: 1000,
          speedX: { min: -60, max: -20 },
          speedY: { min: 520, max: 640 },
          quantity: 2, // 减少粒子数量从4到2
          frequency: 120, // 降低频率从90到120
          alpha: { start: 0.8, end: 0 }
        });
        this.weatherParticles = manager;
        this.weatherEmitter = emitter;
        break;
      }
      case 'snow': {
        const manager = this.add.particles(0, 0, 'snow-flake').setDepth(-1);
        manager.setScrollFactor(0);
        const emitter = manager.createEmitter({
          x: { min: -60, max: DESIGN.width + 60 },
          y: -20,
          lifespan: 2400,
          speedX: { min: -40, max: -5 },
          speedY: { min: 80, max: 120 },
          scale: { start: 1.0, end: 0.4 },
          rotate: { min: -45, max: 45 },
          quantity: 2, // 减少粒子数量从3到2
          frequency: 180, // 降低频率从140到180
          alpha: { start: 0.9, end: 0.2 }
        });
        this.weatherParticles = manager;
        this.weatherEmitter = emitter;
        break;
      }
      default:
        break;
    }
  }

  beginRun() {
    this.isRunning = true;
    this.spawnTimer = 0;
    this.elapsed = 0;
    this.distanceAccumulator = 0;
    // distanceContainer已被移除，改为progressContainer
    if (this.progressContainer) {
      this.progressContainer.setVisible(true);
    }
    if (this.tipContainer) {
      this.tweens.killTweensOf(this.tipContainer);
      this.tipContainer.destroy();
      this.tipContainer = null;
    }
  }

  spawnPair() {
    const baseX = DESIGN.width + 160;
    const centerY = Phaser.Math.Clamp(
      Phaser.Math.Between(COURSE.centerYMin, COURSE.centerYMax),
      COURSE.centerYMin,
      COURSE.centerYMax
    );
    const gapHalf = this.gap / 2;

    const topY = centerY - gapHalf;
    const bottomY = centerY + gapHalf;

    const top = this.acquireObstacle('tree-top', baseX, topY, true);
    const bottom = this.acquireObstacle('tree-bottom', baseX, bottomY, false);

    // 移除传感器创建逻辑（不再使用穿过缝隙得分）

    return { top, bottom };
  }

  acquireObstacle(key, x, y, isTop) {
    let ob = this.obstacles.get(x, y, key);
    if (!ob) {
      ob = this.obstacles.create(x, y, key);
    } else {
      ob.setTexture(key);
    }
    ob.setActive(true);
    ob.setVisible(true);
    ob.body.enable = true;
    ob.body.allowGravity = false;
    ob.setOrigin(0.5, isTop ? 1 : 0);
    ob.x = x;
    ob.y = y;
  ob.body.reset(x, y);
    const width = ob.width * 0.45;  // 进一步缩小宽度
    const height = ob.height * 0.75; // 进一步缩小高度
    ob.body.setSize(width, height);
    const offsetX = (ob.width - width) / 2;
    const offsetY = isTop ? ob.height - height - (ob.height * 0.1) : ob.height * 0.15;
    ob.body.setOffset(offsetX, offsetY);
    ob.body.updateFromGameObject();
    return ob;
  }

  // 移除 handleSensorOverlap 方法，不再使用传感器得分

  addScore(value, source = 'distance') {
    if (value <= 0) return;
    this.score += value;
    this.scoreText.setText(String(this.score));
    // 移除 sensor 相关的音效逻辑
  }

  onHit = (heli, collider) => {
    if (this.isDead || this.isInvincible) return;
    
    // 只处理障碍物碰撞，地面和顶部通过worldBounds物理阻挡
    const colliderType = collider.getData('type');
    if (colliderType !== 'obstacle') {
      return;
    }
    
    // 减少一条命
    this.lives -= 1;
    this.livesLostCount += 1;
    this.updateLivesDisplay();
    this.audio.playHit();
    
    // 触发无敌时间（闪烁）
    this.triggerInvincible();
    
    if (this.lives <= 0) {
      // 生命值归零，游戏结束
      this.isDead = true;
      this.hold = false;
      heli.setVelocity(0, 0);
      this.time.delayedCall(600, () => {
        this.scene.launch('UI', {
          mode: 'result',
          score: this.score,
          best: this.best,
          chapter: this.levelContext.chapter,
          level: this.levelContext.level,
          onRestart: () => this.restartCurrentLevel(),
          onRevive: () => this.revivePlayer()
        });
        this.scene.pause();
      });
    }
  };

  updateLivesDisplay() {
    this.livesValue.setText(`× ${this.lives}`);
    if (this.lives <= 2) {
      this.livesValue.setColor('#ff1744'); // 红色警告
    } else {
      this.livesValue.setColor('#ff5370'); // 正常红色
    }
  }

  triggerInvincible() {
    if (this.isInvincible) return; // 已经在无敌时间内，不重复触发
    
    this.isInvincible = true;
    this.invincibleTimer = 2.0; // 2秒无敌时间
    
    // 闪烁效果（2秒）
    this.tweens.add({
      targets: this.heli,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 13, // 13次重复 = 约2秒
      onComplete: () => {
        this.heli.alpha = 1;
        // 闪烁结束时确保无敌时间也结束
        this.isInvincible = false;
        this.invincibleTimer = 0;
      }
    });
  }

  revivePlayer() {
    // 看广告复活（占位，以后接入抖音/微信API）
    console.log('播放广告中...');
    
    this.scene.stop('UI');
    this.scene.resume();
    
    // 复活后恢复1条命
    this.lives = 1;
    this.isDead = false;
    this.updateLivesDisplay();
    
    // 触发无敌时间
    this.triggerInvincible();
    
    // 让直升机回到安全位置
    this.heli.y = this.centerY;
    this.vy = 0;
  }

  onLevelComplete() {
    if (this.isLevelComplete) return; // 防止重复触发
    this.isLevelComplete = true;
    this.isRunning = false;
    
    console.log('🎉 关卡完成！', {
      chapterId: this.levelContext.chapter.id,
      levelIndex: this.levelContext.levelIndex,
      score: this.score,
      distance: Math.floor(this.traveledDistance),
      targetDistance: this.targetDistance
    });
    
    this.audio.playScore(); // 播放胜利音效
    
    // 计算星级
    const remainingLives = this.lives;
    const thresholds = this.starThresholds;
    let stars = 1;
    if (remainingLives >= thresholds.star3) {
      stars = 3; // 满血通关
    } else if (remainingLives >= thresholds.star2) {
      stars = 2; // 3条命以上
    }
    
    // 保存关卡进度
    this.saveLevelProgress(stars);
    
    // 延迟一下再显示完成界面
    this.time.delayedCall(500, () => {
      console.log('🚀 启动 LevelComplete 场景');
      // 显示关卡完成界面
      this.scene.launch('LevelComplete', {
        chapterId: this.levelContext.chapter.id,
        levelIndex: this.levelContext.levelIndex,
        score: this.score,
        stars: stars,
        remainingLives: remainingLives,
        maxLives: this.maxLives
      });
      this.scene.pause();
    });
  }

  saveLevelProgress(stars) {
    const progressKey = 'HELI_PROGRESS';
    let progress = {};
    
    try {
      const saved = localStorage.getItem(progressKey);
      if (saved) progress = JSON.parse(saved);
    } catch (e) {
      console.error('读取进度失败', e);
    }
    
    const chapterId = this.levelContext.chapter.id;
    if (!progress[chapterId]) {
      progress[chapterId] = { unlockedLevels: 0 };
    }
    
    // 解锁下一关
    const nextLevel = this.levelContext.levelIndex + 1;
    progress[chapterId].unlockedLevels = Math.max(
      progress[chapterId].unlockedLevels,
      nextLevel
    );
    
    try {
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (e) {
      console.error('保存进度失败', e);
    }
  }

  restartCurrentLevel() {
    this.scene.stop('UI');
    this.scene.restart({
      chapterId: this.levelContext.chapter.id,
      levelIndex: this.levelContext.levelIndex
    });
  }

  update(_, dtMs) {
    if (this.isDead) {
      this.updateClouds(dtMs / 1000);
      return;
    }

    const dt = dtMs / 1000;

    if (!this.isRunning) {
      this.idleTime += dt;
      this.heli.y = this.centerY + Math.sin(this.idleTime * 2) * 18;
      this.heli.rotation = Phaser.Math.Angle.RotateTo(this.heli.rotation, 0, dt * 3.5);
      this.updateClouds(dt);
      this.field.tilePositionX += this.scrollSpeed * dt * 0.25;
      return;
    }

    this.elapsed += dt;

    // 更新无敌时间
    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.invincibleTimer = 0;
      }
    }

    const acceleration = this.hold ? -PHYS.thrust : PHYS.gravity;
    this.vy = Phaser.Math.Clamp(this.vy + acceleration * dt, -PHYS.vyMaxUp, PHYS.vyMaxDown);

    const topLimit = 60;
    const bottomLimit = DESIGN.height - 80;
    const proposedY = this.heli.y + this.vy * dt;
    let clampedY = proposedY;
    let hitTopBound = false;
    let hitBottomBound = false;

    if (proposedY < topLimit) {
      clampedY = topLimit;
      hitTopBound = true;
    } else if (proposedY > bottomLimit) {
      clampedY = bottomLimit;
      hitBottomBound = true;
    }

    this.heli.y = clampedY;

    if (hitTopBound && this.vy < 0) {
      // 顶部轻微弹回
      this.vy = Math.min(200, Math.abs(this.vy) * 0.25);
    } else if (hitBottomBound && this.vy > 0) {
      // 底部弹回并稍微抬起避免再次被Clamp
      this.heli.y = bottomLimit - 2; // 往上抬 2px
      this.vy = -Math.min(500, Math.abs(this.vy) * 0.45) || -220;
    }

    // 调试日志（可按需删除）
    if (hitBottomBound) {
      if (!this._lastBottomLog || this.time.now - this._lastBottomLog > 300) {
        console.log('[底部碰撞] y=', this.heli.y, 'vy=', this.vy, 'hold=', this.hold);
        this._lastBottomLog = this.time.now;
      }
    }

    const normalized = Phaser.Math.Clamp((this.vy + PHYS.vyMaxUp) / (PHYS.vyMaxUp + PHYS.vyMaxDown), 0, 1);
    const tilt = Phaser.Math.Linear(-22, 16, normalized);
    this.heli.rotation = Phaser.Math.Angle.RotateTo(this.heli.rotation, Phaser.Math.DegToRad(tilt), dt * 6);

    // 世界滚动（关卡制）
    const speed = this.scrollSpeed;
    this.worldX += speed * dt;
    
    // 动态生成障碍物：当屏幕右侧距离下一个障碍物位置足够近时生成
    // 动态生成障碍物：当屏幕右侧距离下一个障碍物位置足够近时生成
    const spawnThreshold = this.worldX + DESIGN.width + 500;
    let spawnCount = 0;
    const maxSpawnPerFrame = 5;
    
    while (this.nextObstacleX < spawnThreshold && this.nextObstacleX < this.goalPosition && spawnCount < maxSpawnPerFrame) {
      const beforeX = this.nextObstacleX;
      this.spawnNextObstacle();
      spawnCount++;
      
      if (this.nextObstacleX <= beforeX) {
        console.error(`⚠️ nextObstacleX 未更新！beforeX=${beforeX}, afterX=${this.nextObstacleX}`);
        break;
      }
    }
    
    // 清理离开屏幕的障碍物组
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const group = this.activeObstacles[i];
      const screenX = group.x - this.worldX;
      
      if (screenX < -500) {
        group.top.destroy();
        group.bottom.destroy();
        // 移除 sensor.destroy()（已不再使用传感器）
        this.activeObstacles.splice(i, 1);
      }
  }
    
    // 更新所有障碍物位置（基于worldX计算屏幕位置）
    this.obstacles.children.iterate(obstacle => {
      if (!obstacle || !obstacle.active) return;
      
      // 根据worldX计算屏幕位置（障碍物的世界X是固定的，随着worldX增加，屏幕X减少）
      const obstacleWorldX = obstacle.getData('worldX') || obstacle.x;
      if (!obstacle.getData('worldX')) {
        obstacle.setData('worldX', obstacle.x);
      }
      obstacle.x = obstacleWorldX - this.worldX;
      
      // 视锥剔除
      const inView = obstacle.x > -300 && obstacle.x < DESIGN.width + 300;
      obstacle.setVisible(inView);
      if (obstacle.body) obstacle.body.enable = inView;
      
      // 完全离开屏幕后不再处理
      if (obstacle.x < -500) {
        obstacle.setActive(false);
      }
    });

    // 移除传感器更新逻辑（已不再使用传感器）

    // 更新终点线位置（基于worldX）
    this.finishLine.x = this.goalPosition - this.worldX;
    
    // 更新进度显示（降低更新频率）
    if (Math.floor(this.elapsed * 10) % 2 === 0) { // 每0.2秒更新一次
      const progress = Math.floor(this.worldX);
      const percentage = Math.min(100, Math.floor((progress / this.levelLength) * 100));
      this.progressValue.setText(`${progress} / ${this.levelLength} (${percentage}%)`);
    }
    
    // 检查是否到达终点线
    if (!this.isLevelComplete && this.heli.x >= this.finishLine.x - 50) {
      console.log('🏁 穿过终点线！');
      this.onLevelComplete();
      return;
    }

    this.best = Math.max(this.best, this.score);
    
    // 降低UI更新频率（每0.1秒更新一次）
    if (Math.floor(this.elapsed * 10) % 1 === 0) {
      this.bestZh.setText(`最高 ${this.best}`);
    }

    this.updateClouds(dt);
    this.field.tilePositionX += speed * dt * 0.4;
  }

  updateClouds(dt) {
    // 只更新活跃的云朵，跳过已销毁的
    const clouds = this.clouds.getChildren();
    for (let i = 0; i < clouds.length; i++) {
      const cloud = clouds[i];
      if (!cloud || !cloud.active) continue;
      
      cloud.x -= cloud.speed * dt;
      if (cloud.x < -120) {
        cloud.destroy();
      }
    }
  }

  shutdownToMenu() {
    this.scene.stop('UI');
    this.scene.start('LevelScene', { chapterId: this.levelContext.chapter.id });
  }

  cleanup() {
    this.input.off('pointerdown', this.handlePointerDown);
    this.input.off('pointerup', this.handlePointerUp);
    this.input.keyboard.off('keydown', this.keyDownHandler, this);
    this.input.keyboard.off('keyup', this.keyUpHandler, this);
    // 移除 activeSensors 清理逻辑（已不再使用传感器）
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
      this.weatherParticles = null;
      this.weatherEmitter = null;
    }
  }
}

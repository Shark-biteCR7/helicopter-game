import { DESIGN, PHYS, SCORE, CHAPTERS, COURSE, WEATHER } from '../constants.js';
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
    this.activeSensors = [];

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
    
    // 绘制竖条纹终点线
    const lineGraphics = this.add.graphics();
    const stripeWidth = 30;
    const stripeCount = Math.ceil(DESIGN.height / stripeWidth);
    
    for (let i = 0; i < stripeCount; i++) {
      const color = i % 2 === 0 ? 0xffff00 : 0x000000; // 黄黑相间
      lineGraphics.fillStyle(color, 1);
      lineGraphics.fillRect(0, i * stripeWidth, 40, stripeWidth);
    }
    
    this.finishLine.add(lineGraphics);
    
    // 添加"终点"文字
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
    
    // 设置终点线的初始位置（基于目标距离）
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
    this.heli.setCircle(26, 24, 14);
    this.heli.setCollideWorldBounds(true);
    this.heli.body.setAllowGravity(false);
    this.physics.add.overlap(this.heli, this.ground, this.onHit, null, this);
  }

  createObstaclePool() {
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.heli, this.obstacles, this.onHit, null, this);
    
    // 动态生成相关变量
    this.nextObstacleX = 1000; // 下一个障碍物的X位置
    this.lastObstacleX = 0; // 上一个障碍物的X位置
    this.activeObstacles = []; // 当前活跃的障碍物组
  }

  spawnLevelObstacles() {
    // 不再预生成所有障碍物，改为在update中动态生成
    // 初始生成屏幕内的前几个障碍物
    if (!this.levelContext || !this.levelContext.level) {
      console.error('❌ levelContext 未初始化！');
      return;
    }
    
    const density = this.levelContext.level.obstacleDensity || 800;
    // 只生成屏幕内+右侧一点点的障碍物（约3个）
    const spawnCount = Math.min(3, Math.ceil((DESIGN.width + 800) / density));
    
    for (let i = 0; i < spawnCount; i++) {
      this.spawnNextObstacle();
    }
    
    // 生成终点线
    this.createFinishLineAtGoal();
  }

  // 动态生成单个障碍物
  spawnNextObstacle() {
    if (!this.levelContext || !this.levelContext.level) {
      console.error('❌ spawnNextObstacle: levelContext 未初始化！');
      return;
    }
    
    const level = this.levelContext.level;
    const density = level.obstacleDensity || 800;
    
    // 如果超过终点位置，不再生成
    if (this.nextObstacleX >= this.goalPosition) {
      return;
    }
    
    // 随机生成缝隙参数
    const gapHeightMin = level.gapHeight?.min || 200;
    const gapHeightMax = level.gapHeight?.max || 280;
    const gapCenterYMin = level.gapCenterY?.min || 400;
    const gapCenterYMax = level.gapCenterY?.max || 880;
    
    const gapHeight = Phaser.Math.Between(gapHeightMin, gapHeightMax);
    const gapCenterY = Phaser.Math.Between(gapCenterYMin, gapCenterYMax);
    
    // 计算上下障碍物位置
    const topHeight = gapCenterY - gapHeight / 2;
    const bottomY = gapCenterY + gapHeight / 2;
    
    // 计算屏幕位置（世界坐标 - worldX）
    const screenX = this.nextObstacleX - this.worldX;
    
    // 创建上方障碍
    const top = this.obstacles.create(screenX, topHeight / 2, 'tree-top');
    top.setOrigin(0.5, 1);
    top.setData('type', 'obstacle');
    top.setData('worldX', this.nextObstacleX); // 保存世界坐标
    top.body.setSize(top.width * 0.5, topHeight * 0.85); // 缩小碰撞体积
    top.body.setOffset(top.width * 0.25, topHeight * 0.15); // 向中心偏移
    
    // 创建下方障碍
    const bottom = this.obstacles.create(screenX, bottomY + (DESIGN.height - bottomY) / 2, 'tree-bottom');
    bottom.setOrigin(0.5, 0);
    bottom.setData('type', 'obstacle');
    bottom.setData('worldX', this.nextObstacleX); // 保存世界坐标
    const bottomHeight = DESIGN.height - bottomY;
    bottom.body.setSize(bottom.width * 0.5, bottomHeight * 0.85); // 缩小碰撞体积
    bottom.body.setOffset(bottom.width * 0.25, bottomHeight * 0.15); // 向中心偏移
    
    // 创建得分传感器
    const sensor = this.physics.add.sprite(screenX + 50, gapCenterY, null);
    sensor.setSize(20, gapHeight);
    sensor.setAlpha(0);
    sensor.body.setAllowGravity(false);
    sensor.setData('scored', false);
    sensor.setData('worldX', this.nextObstacleX + 50); // 保存世界坐标
    this.activeSensors.push(sensor);
    
    this.physics.add.overlap(this.heli, sensor, () => {
      if (!sensor.getData('scored')) {
        sensor.setData('scored', true);
        this.addScore(10, 'pass');
        this.audio.playScore();
      }
    });
    
    // 记录障碍物组
    this.activeObstacles.push({ top, bottom, sensor, x: this.nextObstacleX });
    
    // 更新下一个障碍物位置
    this.lastObstacleX = this.nextObstacleX;
    this.nextObstacleX += density;
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

    const sensorHeight = Math.max(60, this.gap - 20);
    const sensor = this.add.zone(baseX, centerY, 28, sensorHeight);
    this.physics.world.enable(sensor);
    sensor.body.setAllowGravity(false);
    sensor.body.moves = true;
    sensor.setData('sensor', true);
    this.activeSensors.push(sensor);
    this.physics.add.overlap(this.heli, sensor, this.handleSensorOverlap, null, this);

    return { top, bottom, sensor };
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

  handleSensorOverlap = (heli, sensor) => {
    if (!sensor.getData('counted')) {
      sensor.setData('counted', true);
      this.addScore(1, 'sensor');
    }
  };

  addScore(value, source = 'distance') {
    if (value <= 0) return;
    this.score += value;
    this.scoreText.setText(String(this.score));
    if (source === 'sensor') {
      this.audio.playScore();
    }
  }

  onHit = (heli, collider) => {
    if (this.isDead || this.isInvincible) return;
    
    // 检查碰撞对象类型，只有障碍物和地面才扣血
    const colliderType = collider.getData('type');
    if (colliderType !== 'obstacle' && colliderType !== 'ground') {
      return; // 不是障碍物，忽略
    }
    
    // 如果是地面碰撞，重置直升机位置避免卡住
    if (colliderType === 'ground') {
      heli.setVelocityY(-200); // 给一个向上的速度
      heli.y = DESIGN.height - 180; // 重置到安全位置
    }
    
    // 减少一条命
    this.lives -= 1;
    this.livesLostCount += 1; // 记录失去的生命数（用于计算星级）
    this.updateLivesDisplay();
    this.audio.playHit();
    
    if (this.lives <= 0) {
      // 生命值归零，游戏结束
      this.isDead = true;
      this.hold = false;
      this.time.delayedCall(600, () => {
        this.scene.launch('UI', {
          mode: 'result',
          score: this.score,
          best: this.best,
          chapter: this.levelContext.chapter,
          level: this.levelContext.level,
          onRestart: () => this.restartCurrentLevel(),
          onRevive: () => this.revivePlayer()  // 复活回调
        });
        this.scene.pause();
      });
    } else {
      // 还有生命值，触发无敌时间
      this.triggerInvincible();
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
    this.isInvincible = true;
    this.invincibleTimer = 2.0; // 2秒无敌时间
    
    // 闪烁效果
    this.tweens.add({
      targets: this.heli,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 13,
      onComplete: () => {
        this.heli.alpha = 1;
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
    this.heli.y = Phaser.Math.Clamp(this.heli.y + this.vy * dt, 60, DESIGN.height - 80);

    const normalized = Phaser.Math.Clamp((this.vy + PHYS.vyMaxUp) / (PHYS.vyMaxUp + PHYS.vyMaxDown), 0, 1);
    const tilt = Phaser.Math.Linear(-22, 16, normalized);
    this.heli.rotation = Phaser.Math.Angle.RotateTo(this.heli.rotation, Phaser.Math.DegToRad(tilt), dt * 6);

    // 世界滚动（关卡制）
    const speed = this.scrollSpeed;
    this.worldX += speed * dt;
    
    // 动态生成障碍物：当屏幕右侧距离下一个障碍物位置足够近时生成
    const spawnThreshold = this.worldX + DESIGN.width + 500; // 在屏幕右侧500px处生成
    let spawnCount = 0;
    const maxSpawnPerFrame = 5; // 每帧最多生成5个，防止卡死
    
    while (this.nextObstacleX < spawnThreshold && this.nextObstacleX < this.goalPosition && spawnCount < maxSpawnPerFrame) {
      const beforeX = this.nextObstacleX;
      this.spawnNextObstacle();
      spawnCount++;
      
      // 防御：如果nextObstacleX没有增加，强制跳出
      if (this.nextObstacleX <= beforeX) {
        console.error(`⚠️ nextObstacleX 未更新！beforeX=${beforeX}, afterX=${this.nextObstacleX}`);
        break;
      }
    }
    
    // 清理离开屏幕的障碍物组
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const group = this.activeObstacles[i];
      const screenX = group.x - this.worldX;
      
      // 障碍物离开屏幕左侧很远，销毁
      if (screenX < -500) {
        group.top.destroy();
        group.bottom.destroy();
        group.sensor.destroy();
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

    // 更新传感器位置
    for (let i = this.activeSensors.length - 1; i >= 0; i -= 1) {
      const sensor = this.activeSensors[i];
      
      // 根据worldX计算屏幕位置
      const sensorWorldX = sensor.getData('worldX');
      if (sensorWorldX !== undefined) {
        sensor.x = sensorWorldX - this.worldX;
      }
      
      // 只更新屏幕内的传感器
      if (sensor.x > -200 && sensor.x < DESIGN.width + 200) {
        if (sensor.body) sensor.body.updateFromGameObject();
      }
      
      // 离开屏幕很远后销毁
      if (sensor.x < -500) {
        sensor.destroy();
        this.activeSensors.splice(i, 1);
      }
    }

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

    if (this.heli.y >= DESIGN.height - 80) {
      this.onHit();
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
    this.activeSensors.forEach(sensor => sensor.destroy());
    this.activeSensors.length = 0;
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
      this.weatherParticles = null;
      this.weatherEmitter = null;
    }
  }
}

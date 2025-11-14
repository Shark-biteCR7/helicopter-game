import { DESIGN, PHYS, SCORE, CHAPTERS, WEATHER } from '../constants.js';
import AudioSystem from '../systems/AudioSystem.js';
import ProgressManager from '../systems/ProgressManager.js';
import WeatherSystem from '../systems/WeatherSystem.js';
import ObstacleSystem from '../systems/ObstacleSystem.js';
import HUD from '../ui/HUD.js';

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
    this.progressManager = new ProgressManager(this);
    this.weatherSystem = new WeatherSystem(this);

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
    this.createFinishLine();

    this.obstacleSystem = new ObstacleSystem(this);
    this.obstacleSystem.init(level, this.goalPosition);
    this.physics.add.overlap(this.heli, this.obstacleSystem.group, this.onHit, null, this);

    const weatherInfo = WEATHER[this.weatherType] || { zh: '待定', en: 'TBD' };
    this.hud = new HUD(this, {
      chapter: this.levelContext.chapter,
      level,
      weather: weatherInfo,
      bestScore: this.best,
      levelLength: this.levelLength
    });
    this.hud.updateLives(this.lives);
    this.hud.updateProgress(0);

    this.setupInput();
    this.weatherSystem.apply(this.weatherType);

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
  }

  createFinishLine() {
    if (this.finishLine) {
      this.finishLine.destroy(true);
    }
    const goalX = this.goalPosition;
    this.finishLine = this.add.container(goalX, 0);
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

  beginRun() {
    this.isRunning = true;
    this.elapsed = 0;
    if (this.hud) {
      this.hud.onRunStart();
    }
  }

  // 移除 handleSensorOverlap 方法，不再使用传感器得分

  addScore(value, source = 'distance') {
    if (value <= 0) return;
    this.score += value;
    if (this.hud) {
      this.hud.updateScore(this.score);
    }
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
    if (this.hud) {
      this.hud.updateLives(this.lives);
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
    
    const traveledDistance = Math.floor(Math.min(this.worldX, this.goalPosition));
    console.log('🎉 关卡完成！', {
      chapterId: this.levelContext.chapter.id,
      levelIndex: this.levelContext.levelIndex,
      score: this.score,
      distance: traveledDistance,
      goal: this.goalPosition
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
    
    if (this.hud) {
      this.hud.updateProgress(this.goalPosition);
    }

    // 保存关卡进度
    this.saveLevelProgress();
    
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

  saveLevelProgress() {
    const chapterId = this.levelContext.chapter.id;
    const nextLevel = this.levelContext.levelIndex + 1;
    if (this.progressManager) {
      this.progressManager.unlockLevel(chapterId, nextLevel);
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

    if (this.obstacleSystem) {
      this.obstacleSystem.update(this.worldX);
    }

    if (this.finishLine) {
      this.finishLine.x = this.goalPosition - this.worldX;
    }

    if (Math.floor(this.elapsed * 10) % 2 === 0 && this.hud) {
      this.hud.updateProgress(Math.min(this.worldX, this.goalPosition));
    }
    
    // 检查是否到达终点线
    if (!this.isLevelComplete && this.finishLine && this.heli.x >= this.finishLine.x - 50) {
      console.log('🏁 穿过终点线！');
      this.onLevelComplete();
      return;
    }

    const distanceScore = Math.floor(this.worldX * SCORE.distFactor);
    if (distanceScore > this.score) {
      this.addScore(distanceScore - this.score);
    }

    const newBest = Math.max(this.best, this.score);
    if (newBest !== this.best) {
      this.best = newBest;
      localStorage.setItem(SCORE.lsKey, String(this.best));
      if (this.hud) {
        this.hud.updateBest(this.best);
      }
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
    if (this.obstacleSystem) {
      this.obstacleSystem.destroy();
      this.obstacleSystem = null;
    }
    if (this.weatherSystem) {
      this.weatherSystem.destroy();
      this.weatherSystem = null;
    }
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
    }
  }
}

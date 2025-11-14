import { DESIGN, COURSE } from '../constants.js';

const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 50;
const MAX_SPAWN_PER_FRAME = 5;
const SPAWN_PADDING = 500;

export default class ObstacleSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.activeGroups = [];
    this.level = null;
    this.goalPosition = 0;
    this.nextObstacleX = 0;
    this.lastObstacleX = 0;
  }

  init(level, goalPosition) {
    this.level = level;
    this.goalPosition = goalPosition;
    this.nextObstacleX = 1000;
    this.lastObstacleX = 0;
    this.clear();
  }

  clear() {
    this.group.clear(true, true);
    this.activeGroups.length = 0;
  }

  update(worldX) {
    if (!this.level) return;
    this._spawnIfNeeded(worldX);
    this._reposition(worldX);
  }

  destroy() {
    this.clear();
    this.group.destroy(true);
  }

  _spawnIfNeeded(worldX) {
    const spawnThreshold = worldX + DESIGN.width + SPAWN_PADDING;
    let spawnCount = 0;
    while (this.nextObstacleX < spawnThreshold && this.nextObstacleX < this.goalPosition && spawnCount < MAX_SPAWN_PER_FRAME) {
      const before = this.nextObstacleX;
      this._spawnNextObstacle();
      spawnCount += 1;
      if (this.nextObstacleX <= before) {
        console.error(`⚠️ nextObstacleX 未更新！before=${before}, after=${this.nextObstacleX}`);
        break;
      }
    }
  }

  _spawnNextObstacle() {
    if (!this.level) return;
    const baseDensity = this.level.obstacleDensity || 800;
    if (this.nextObstacleX >= this.goalPosition) {
      return;
    }

    const progress = this.nextObstacleX / this.goalPosition;
    const gapConfig = this._getGapConfig(progress);
    const gapHeight = gapConfig.gapHeight;
    const gapCenterY = gapConfig.gapCenterY;

    const gapTopY = gapCenterY - gapHeight / 2;

    const randomOffsetX = Phaser.Math.Between(-100, 100);
    const obstacleX = this.nextObstacleX + randomOffsetX;

    const bottomColliders = this._createLegoMountainBottom(obstacleX, DESIGN.height, BRICK_WIDTH, BRICK_HEIGHT);
    const topColliders = this._createLegoMountainTop(obstacleX, gapTopY, BRICK_WIDTH, BRICK_HEIGHT);

    this.activeGroups.push({ obstacleX, topColliders, bottomColliders });

    this.lastObstacleX = this.nextObstacleX;
    this.nextObstacleX += Math.floor(baseDensity * gapConfig.densityMultiplier);
  }

  _reposition(worldX) {
    for (let i = this.activeGroups.length - 1; i >= 0; i--) {
      const group = this.activeGroups[i];
      const screenX = group.obstacleX - worldX;
      if (screenX < -500) {
        this._destroyGroup(group);
        this.activeGroups.splice(i, 1);
      }
    }

    this.group.children.iterate(obstacle => {
      if (!obstacle || !obstacle.active) return;
      const worldPos = obstacle.getData('worldX');
      if (typeof worldPos !== 'number') return;
      obstacle.x = worldPos - worldX;
      const inView = obstacle.x > -300 && obstacle.x < DESIGN.width + 300;
      obstacle.setVisible(inView);
      if (obstacle.body) obstacle.body.enable = inView;
      if (obstacle.x < -500) {
        obstacle.setActive(false);
      }
    });
  }

  _destroyGroup(group) {
    if (group.topColliders) {
      group.topColliders.forEach(sprite => sprite.destroy());
    }
    if (group.bottomColliders) {
      group.bottomColliders.forEach(sprite => sprite.destroy());
    }
  }

  _createBrick(textureKey, x, y, width, height, isTop) {
    const sprite = this.scene.physics.add.sprite(x, y, textureKey);
    sprite.setOrigin(0.5, 0.5);
    sprite.displayWidth = width;
    sprite.displayHeight = height;
    sprite.body.setSize(width, height);
    sprite.body.setOffset(0, 0);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    sprite.setData('type', 'obstacle');
    sprite.setData('worldX', x);
    sprite.setData('isTopObstacle', Boolean(isTop));
    this.group.add(sprite);
    return sprite;
  }

  _createLegoMountainBottom(xCenter, groundY, brickWidth, brickHeight) {
    const columns = [1, 4, 2];
    const colliders = [];
    for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
      const brickCount = columns[colIndex];
      const x = xCenter + (colIndex - 1) * brickWidth;
      for (let j = 0; j < brickCount; j += 1) {
        const y = groundY - brickHeight / 2 - j * brickHeight;
        const brick = this._createBrick('tree-bottom', x, y, brickWidth, brickHeight, false);
        brick.setData('colIndex', colIndex);
        brick.setData('brickIndex', j);
        colliders.push(brick);
      }
    }
    return colliders;
  }

  _createLegoMountainTop(xCenter, topY, brickWidth, brickHeight) {
    const columns = [1, 4, 2];
    const colliders = [];
    for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
      const brickCount = columns[colIndex];
      const x = xCenter + (colIndex - 1) * brickWidth;
      for (let j = 0; j < brickCount; j += 1) {
        const y = topY + brickHeight / 2 + j * brickHeight;
        const brick = this._createBrick('tree-top', x, y, brickWidth, brickHeight, true);
        brick.setData('colIndex', colIndex);
        brick.setData('brickIndex', j);
        colliders.push(brick);
      }
    }
    return colliders;
  }

  _getGapConfig(progress) {
    const level = this.level;
    const gapHeightMin = level.gapHeight?.min || 200;
    const gapHeightMax = level.gapHeight?.max || 280;

    const usableMin = COURSE.centerYMin || 300;
    const usableMax = COURSE.centerYMax || 960;

    let gapHeightBias;
    if (progress < 0.2) {
      gapHeightBias = 0.7 + Math.random() * 0.3;
    } else if (progress > 0.8) {
      gapHeightBias = Math.random() * 0.3;
    } else {
      gapHeightBias = 0.3 + Math.random() * 0.5;
    }
    const gapHeight = Math.floor(gapHeightMin + (gapHeightMax - gapHeightMin) * gapHeightBias);

    const levelId = level.levelId || 1;
    let normalizedY = 0.5;
    switch (levelId) {
      case 1: {
        const frequency = 1.5;
        const amplitude = 0.15;
        normalizedY = 0.5 + amplitude * Math.sin(2 * Math.PI * frequency * progress);
        break;
      }
      case 2: {
        const frequency = 2.0;
        const amplitude = 0.2;
        const randomOffset = (Math.random() - 0.5) * 0.1;
        normalizedY = 0.5 + amplitude * Math.sin(2 * Math.PI * frequency * progress) + randomOffset;
        break;
      }
      case 3: {
        const sineFreq = 2.5;
        const sineAmp = 0.25;
        const sawtoothFreq = 1.0;
        const sawtoothAmp = 0.15;
        const sawtoothPhase = (progress * sawtoothFreq) % 1;
        const sawtoothValue = sawtoothPhase < 0.5 ? sawtoothPhase * 2 : 2 - sawtoothPhase * 2;
        normalizedY = 0.5 + sineAmp * Math.sin(2 * Math.PI * sineFreq * progress) + sawtoothAmp * (sawtoothValue - 0.5);
        break;
      }
      case 4: {
        const stepCount = 8;
        const stepIndex = Math.floor(progress * stepCount);
        const stepSeed = (stepIndex * 137) % 100;
        const stepValue = (stepSeed / 100) * 0.6 + 0.2;
        const sineFreq = 3.0;
        const sineAmp = 0.15;
        normalizedY = stepValue + sineAmp * Math.sin(2 * Math.PI * sineFreq * progress);
        break;
      }
      case 5: {
        const freq1 = 3.5;
        const freq2 = 1.2;
        const amp1 = 0.25;
        const amp2 = 0.15;
        const randomJump = (Math.random() - 0.5) * 0.2;
        normalizedY = 0.5 + amp1 * Math.sin(2 * Math.PI * freq1 * progress)
          + amp2 * Math.sin(2 * Math.PI * freq2 * progress) + randomJump;
        break;
      }
      default:
        normalizedY = 0.5;
    }

    normalizedY = Phaser.Math.Clamp(normalizedY, 0.0, 1.0);
    const gapCenterY = Math.floor(Phaser.Math.Linear(usableMin, usableMax, normalizedY));

    const microOffset = (Math.random() - 0.5) * gapHeight * 0.1;
    const finalGapCenterY = Phaser.Math.Clamp(
      gapCenterY + microOffset,
      usableMin + gapHeight / 2,
      usableMax - gapHeight / 2
    );

    const densityMultiplier = 1.0 - (level.levelId - 1) * 0.05;

    return {
      gapHeight: Math.max(150, gapHeight),
      gapCenterY: Math.floor(finalGapCenterY),
      densityMultiplier
    };
  }
}

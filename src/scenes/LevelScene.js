import { CHAPTERS, WEATHER } from '../constants.js';
import AudioSystem from '../systems/AudioSystem.js';
import ProgressManager from '../systems/ProgressManager.js';

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
    this.activeChapterId = 'rural';
    this.audio = null;
    this.levelCards = [];
    this.chapterTabs = [];
    this.progressManager = null;
  }

  init(data) {
    if (data && data.chapterId) this.activeChapterId = data.chapterId;
  }

  create() {
    const c = this.cameras.main;
    const cx = c.centerX;
    const cy = c.centerY;

    this.audio = new AudioSystem(this);
    this.progressManager = new ProgressManager(this);

    this.add.rectangle(cx, cy, this.scale.width * 0.82, this.scale.height * 0.82, 0x101731, 0.6)
      .setStrokeStyle(2, 0x1f2d4c, 0.5);

    this.add.text(cx, cy - 300, '章节与关卡', {
      fontFamily: 'Inter, Arial',
      fontSize: 48,
      fontStyle: '700',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 260, 'Chapter & Stages', {
      fontFamily: 'Inter, Arial',
      fontSize: 24,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    this.createChapterTabs(cx, cy - 190);
    this.updateChapterTabsHighlight();
    this.levelGroup = this.add.container(0, 0);
    this.renderLevels();

    const back = this.add.container(cx, cy + 360);
    const hit = this.add.rectangle(0, 0, 220, 66, 0x1b2a49, 0.6)
      .setInteractive({ useHandCursor: true });
    hit.setStrokeStyle(3, 0x2f8cc9, 0.45);
    const labelZh = this.add.text(0, -10, '← 返回主菜单', {
      fontFamily: 'Inter, Arial',
      fontSize: 30,
      color: '#9ee4ff'
    }).setOrigin(0.5);
    const labelEn = this.add.text(0, 18, 'Back to Menu', {
      fontFamily: 'Inter, Arial',
      fontSize: 18,
      color: '#bcd7ff'
    }).setOrigin(0.5);
    back.add([hit, labelZh, labelEn]);

    hit.on('pointerdown', () => {
      back.setScale(0.96);
      this.audio.playButton();
      this.time.delayedCall(120, () => this.scene.start('Menu'));
    });
    const resetBack = () => back.setScale(1);
    hit.on('pointerup', resetBack);
    hit.on('pointerout', resetBack);
  }

  createChapterTabs(cx, tabY) {
    const spacing = 260;
    CHAPTERS.forEach((chapter, index) => {
      const x = cx + (index - (CHAPTERS.length - 1) / 2) * spacing;
      const isActive = chapter.id === this.activeChapterId;
      const container = this.add.container(x, tabY);
      const bg = this.add.rectangle(0, 0, 240, 96, isActive ? 0x2f8cc9 : 0x1b2a49, 0.85)
        .setInteractive({ useHandCursor: chapter.levels.length > 0 })
        .setStrokeStyle(4, 0x2f8cc9, isActive ? 0.9 : 0.45);
      const titleZh = this.add.text(0, -16, chapter.title.zh, {
        fontFamily: 'Inter, Arial',
        fontSize: 28,
        fontStyle: '600',
        color: '#ffffff'
      }).setOrigin(0.5);
      const titleEn = this.add.text(0, 18, chapter.title.en, {
        fontFamily: 'Inter, Arial',
        fontSize: 16,
        color: '#bcd7ff'
      }).setOrigin(0.5);
      container.add([bg, titleZh, titleEn]);

      this.chapterTabs.push({ chapterId: chapter.id, bg, titleZh, titleEn });

      if (!isActive && chapter.levels.length > 0) {
        bg.on('pointerdown', () => {
          container.setScale(0.96);
          this.audio.playButton();
          this.activeChapterId = chapter.id;
          this.updateChapterTabsHighlight();
          this.renderLevels();
        });
        const reset = () => container.setScale(1);
        bg.on('pointerup', reset);
        bg.on('pointerout', reset);
      } else if (chapter.levels.length === 0) {
        this.add.text(x, tabY + 70, chapter.description.zh, {
          fontFamily: 'Inter, Arial',
          fontSize: 18,
          color: '#9ee4ff'
        }).setOrigin(0.5);
        this.add.text(x, tabY + 98, chapter.description.en, {
          fontFamily: 'Inter, Arial',
          fontSize: 14,
          color: '#bcd7ff'
        }).setOrigin(0.5);
      }
    });
  }

  updateChapterTabsHighlight() {
    this.chapterTabs.forEach(tab => {
      const isActive = tab.chapterId === this.activeChapterId;
      tab.bg.setFillStyle(isActive ? 0x2f8cc9 : 0x1b2a49, 0.85);
      tab.bg.setStrokeStyle(4, 0x2f8cc9, isActive ? 0.9 : 0.45);
      tab.titleZh.setColor(isActive ? '#ffffff' : '#9ee4ff');
      tab.titleEn.setColor(isActive ? '#bcd7ff' : '#6baedc');
    });
  }

  clearLevelGroup() {
    if (!this.levelGroup) return;
    this.levelGroup.removeAll(true);
    this.levelCards = [];
  }

  renderLevels() {
    this.clearLevelGroup();
    const chapter = CHAPTERS.find(ch => ch.id === this.activeChapterId) || CHAPTERS[0];

    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    const baseY = cy - 60;

    if (!chapter.levels.length) {
      const zh = this.add.text(cx, baseY, chapter.description.zh, {
        fontFamily: 'Inter, Arial',
        fontSize: 30,
        color: '#ffffff'
      }).setOrigin(0.5);
      const en = this.add.text(cx, baseY + 40, chapter.description.en, {
        fontFamily: 'Inter, Arial',
        fontSize: 18,
        color: '#bcd7ff'
      }).setOrigin(0.5);
      this.levelGroup.add([zh, en]);
      return;
    }

    // 获取关卡进度
    const progress = this.getLevelProgress(chapter.id);

    chapter.levels.forEach((level, idx) => {
      const column = idx % 3;
      const row = Math.floor(idx / 3);
      const x = cx - 220 + column * 220;
      const y = baseY + row * 200;

      // 判断关卡是否解锁（第一关总是解锁的）
      const isUnlocked = idx === 0 || idx <= progress.unlockedLevels;

      const card = this.add.rectangle(x, y, 200, 150, isUnlocked ? 0x1b2a49 : 0x0d1420, isUnlocked ? 0.9 : 0.6)
        .setStrokeStyle(4, isUnlocked ? 0x2f8cc9 : 0x4a5568, isUnlocked ? 0.55 : 0.3)
        .setInteractive({ useHandCursor: isUnlocked });

      const labelZh = this.add.text(x, y - 26, level.name.zh, {
        fontFamily: 'Inter, Arial',
        fontSize: 26,
        fontStyle: '600',
        color: isUnlocked ? '#ffffff' : '#666666',
        align: 'center',
        wordWrap: { width: 160 }
      }).setOrigin(0.5);

      const labelEn = this.add.text(x, y + 6, level.name.en, {
        fontFamily: 'Inter, Arial',
        fontSize: 16,
        color: isUnlocked ? '#bcd7ff' : '#555555',
        align: 'center',
        wordWrap: { width: 160 }
      }).setOrigin(0.5);

      if (!isUnlocked) {
        // 显示锁图标
        const lock = this.add.text(x, y + 48, '🔒', {
          fontSize: 40
        }).setOrigin(0.5);
        const lockText = this.add.text(x, y + 72, 'Locked', {
          fontFamily: 'Inter, Arial',
          fontSize: 16,
          color: '#666666'
        }).setOrigin(0.5);
        this.levelGroup.add([card, labelZh, labelEn, lock, lockText]);
      } else {
        const weather = WEATHER[level.weather] || { zh: '-', en: '-' };
        const weatherZh = this.add.text(x, y + 48, `天气：${weather.zh}`, {
          fontFamily: 'Inter, Arial',
          fontSize: 18,
          color: '#9ee4ff'
        }).setOrigin(0.5);
        const weatherEn = this.add.text(x, y + 72, `Weather: ${weather.en}`, {
          fontFamily: 'Inter, Arial',
          fontSize: 14,
          color: '#bcd7ff'
        }).setOrigin(0.5);

        card.on('pointerdown', () => {
          card.setScale(0.96);
          this.audio.playButton();
          this.time.delayedCall(140, () => {
            this.scene.start('Play', {
              chapterId: chapter.id,
              levelIndex: idx
            });
          });
        });
        const reset = () => card.setScale(1);
        card.on('pointerup', reset);
        card.on('pointerout', reset);

        this.levelGroup.add([card, labelZh, labelEn, weatherZh, weatherEn]);
      }

      this.levelCards.push(card);
    });
  }

  getLevelProgress(chapterId) {
    if (!this.progressManager) {
      this.progressManager = new ProgressManager(this);
    }
    return this.progressManager.getChapterProgress(chapterId);
  }
}

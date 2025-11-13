import { DESIGN } from '../constants.js';
import { UI_THEME } from '../ui/theme.js';
import { createUIButton } from '../ui/components.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelComplete');
  }

  init(data) {
    console.log('📋 LevelComplete init:', data);
    this.chapterId = data.chapterId;
    this.levelIndex = data.levelIndex;
    this.score = data.score;
    this.stars = data.stars;
    this.remainingLives = data.remainingLives;
    this.maxLives = data.maxLives;
  }

  create() {
    console.log('🎨 LevelComplete create');
    const cam = this.cameras.main;
    const cx = cam.centerX;
    const cy = cam.centerY;

    // 半透明背景遮罩
    this.add.rectangle(
      cx,
      cy,
      DESIGN.width,
      DESIGN.height,
      UI_THEME.colors.overlay.color,
      UI_THEME.colors.overlay.alpha
    );

    // 面板容器
    const panel = this.add.container(cx, cy);

    // 面板背景
    const bg = this.add.graphics();
    bg.fillStyle(UI_THEME.colors.panelBg, 1);
    bg.fillRoundedRect(-280, -300, 560, 600, 18);
    bg.lineStyle(3, UI_THEME.colors.panelStroke, 1);
    bg.strokeRoundedRect(-280, -300, 560, 600, 18);
    panel.add(bg);

    // 标题 - 关卡完成
    const titleZh = this.add.text(0, -240, '✨ 关卡完成 ✨', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 46,
      fontStyle: UI_THEME.fontWeight.bold,
      color: UI_THEME.colors.textAccent
    }).setOrigin(0.5);
    panel.add(titleZh);

    const titleEn = this.add.text(0, -190, 'Level Complete!', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 24,
      color: UI_THEME.colors.textSubtle
    }).setOrigin(0.5);
    panel.add(titleEn);

    // 星星显示
    const starY = -110;
    const starSpacing = 80;
    const starsText = [];
    for (let i = 0; i < 3; i++) {
      const starX = -starSpacing + i * starSpacing;
      const star = this.add.text(starX, starY, i < this.stars ? '⭐' : '☆', {
        fontSize: 56
      }).setOrigin(0.5);
      starsText.push(star);
      panel.add(star);
    }

    // 评价文字
    const ratingText = this.stars === 3 ? '完美通关！' : this.stars === 2 ? '顺利过关！' : '勉强通过';
    const ratingColor = this.stars === 3 ? UI_THEME.colors.success : UI_THEME.colors.textAccent;
    const rating = this.add.text(0, -30, ratingText, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 28,
      fontStyle: UI_THEME.fontWeight.bold,
      color: ratingColor
    }).setOrigin(0.5);
    panel.add(rating);

    // 统计信息
    const statsY = 40;
    const statsSpacing = 60;

    const livesLabel = this.add.text(0, statsY, `剩余生命: ${this.remainingLives} / ${this.maxLives}`, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 22,
      color: UI_THEME.colors.textPrimary
    }).setOrigin(0.5);
    panel.add(livesLabel);

    const scoreLabel = this.add.text(0, statsY + statsSpacing, `得分: ${this.score}`, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 22,
      color: UI_THEME.colors.textPrimary
    }).setOrigin(0.5);
    panel.add(scoreLabel);

    // 按钮
    const buttonY = 200;
    const buttonSpacing = 90;

    // 缩放动画
    panel.setScale(0.3);
    this.tweens.add({
      targets: panel,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // 按钮独立创建，不加入panel（避免被缩放动画影响交互）
    const nextBtn = createUIButton(this, {
      x: cx,
      y: cy + buttonY,
      label: '下一关',
      variant: 'success',
      onClick: () => this.goToNextLevel()
    });
    nextBtn.setDepth(10);

    const retryBtn = createUIButton(this, {
      x: cx,
      y: cy + buttonY + buttonSpacing,
      label: '重玩本关',
      variant: 'primary',
      onClick: () => this.retryLevel()
    });
    retryBtn.setDepth(10);

    const homeBtn = createUIButton(this, {
      x: cx,
      y: cy + buttonY + buttonSpacing * 2,
      label: '返回菜单',
      variant: 'neutral',
      onClick: () => this.goToMenu()
    });
    homeBtn.setDepth(10);

    // 按钮从小放大动画
    [nextBtn, retryBtn, homeBtn].forEach((btn, i) => {
      btn.setScale(0);
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 300,
        delay: 400 + i * 100,
        ease: 'Back.easeOut'
      });
    });

    // 星星逐个出现动画
    starsText.forEach((star, index) => {
      star.setAlpha(0);
      star.setScale(0);
      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: 1.2,
        duration: 300,
        delay: 500 + index * 150,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: star,
            scale: 1,
            duration: 200
          });
        }
      });
    });
  }

  goToNextLevel() {
    this.scene.stop('Play');
    this.scene.stop('LevelComplete');
    this.scene.start('Play', {
      chapterId: this.chapterId,
      levelIndex: this.levelIndex + 1
    });
  }

  retryLevel() {
    this.scene.stop('Play');
    this.scene.stop('LevelComplete');
    this.scene.start('Play', {
      chapterId: this.chapterId,
      levelIndex: this.levelIndex
    });
  }

  goToMenu() {
    this.scene.stop('Play');
    this.scene.stop('LevelComplete');
    this.scene.start('LevelScene', { chapterId: this.chapterId });
  }
}

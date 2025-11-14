import { DESIGN } from '../constants.js';

const DANGER_COLOR = '#ff1744';
const NORMAL_COLOR = '#ff5370';

export default class HUD {
  constructor(scene, { chapter, level, weather, bestScore, levelLength }) {
    this.scene = scene;
    this.levelLength = levelLength;
    this.centerX = scene.cameras.main.centerX;

    const titleZh = `${chapter.title.zh} · ${level.name.zh}`;
    this.title = scene.add.text(this.centerX, 40, titleZh, {
      fontFamily: 'Inter, Arial',
      fontSize: 28,
      fontStyle: '600',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.bestText = scene.add.text(40, 100, `最高 ${bestScore}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.weatherText = scene.add.text(DESIGN.width - 40, 100, weather.zh, {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    scene.add.text(this.centerX, 150, '得分', {
      fontFamily: 'Inter, Arial',
      fontSize: 24,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    this.scoreText = scene.add.text(this.centerX, 190, '0', {
      fontFamily: 'Inter, Arial',
      fontSize: 56,
      fontStyle: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.livesContainer = scene.add.container(this.centerX, 280);
    this.livesIcon = scene.add.text(0, 0, '❤️', {
      fontFamily: 'Inter, Arial',
      fontSize: 28
    }).setOrigin(0.5);
    this.livesValue = scene.add.text(50, 0, '× 5', {
      fontFamily: 'Inter, Arial',
      fontSize: 28,
      fontStyle: '700',
      color: NORMAL_COLOR
    }).setOrigin(0, 0.5);
    this.livesContainer.add([this.livesIcon, this.livesValue]);

    this.progressContainer = scene.add.container(this.centerX, 350);
    this.progressLabel = scene.add.text(0, 0, '进度', {
      fontFamily: 'Inter, Arial',
      fontSize: 20,
      color: '#bcd7ff'
    }).setOrigin(0.5);
    this.progressValue = scene.add.text(0, 28, `0 / ${levelLength}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      fontStyle: '600',
      color: '#9ee4ff'
    }).setOrigin(0.5);
    this.progressContainer.add([this.progressLabel, this.progressValue]);
    this.setProgressVisible(false);

    this.tipContainer = null;
    this.tipTween = null;
    this.showStartTip();
  }

  updateScore(score) {
    this.scoreText.setText(String(score));
  }

  updateBest(best) {
    this.bestText.setText(`最高 ${best}`);
  }

  updateLives(lives) {
    this.livesValue.setText(`× ${lives}`);
    this.livesValue.setColor(lives <= 2 ? DANGER_COLOR : NORMAL_COLOR);
  }

  updateProgress(progress) {
    const clamped = Math.max(0, Math.floor(progress));
    const distance = Math.min(clamped, this.levelLength);
    const percentage = this.levelLength > 0 ? Math.min(100, Math.floor((distance / this.levelLength) * 100)) : 0;
    this.progressValue.setText(`${distance} / ${this.levelLength} (${percentage}%)`);
  }

  setProgressVisible(visible) {
    this.progressContainer.setVisible(visible);
  }

  showStartTip() {
    if (this.tipContainer) return;
    this.tipContainer = this.scene.add.container(this.centerX, DESIGN.height - 300);
    const tipZh = this.scene.add.text(0, 0, '轻触屏幕或按空格开始', {
      fontFamily: 'Inter, Arial',
      fontSize: 32,
      color: '#9ee4ff'
    }).setOrigin(0.5);
    const tipEn = this.scene.add.text(0, 38, 'Tap or press Space to start', {
      fontFamily: 'Inter, Arial',
      fontSize: 18,
      color: '#bcd7ff'
    }).setOrigin(0.5);
    this.tipContainer.add([tipZh, tipEn]);
    this.tipTween = this.scene.tweens.add({
      targets: this.tipContainer,
      alpha: 0.25,
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  hideStartTip() {
    if (!this.tipContainer) return;
    if (this.tipTween) {
      this.tipTween.stop();
      this.tipTween.remove();
      this.tipTween = null;
    }
    this.tipContainer.destroy();
    this.tipContainer = null;
  }

  onRunStart() {
    this.hideStartTip();
    this.setProgressVisible(true);
  }

  destroy() {
    this.hideStartTip();
    [
      this.title,
      this.bestText,
      this.weatherText,
      this.scoreText,
      this.livesContainer,
      this.progressContainer
    ].forEach(obj => {
      if (obj && obj.destroy) obj.destroy();
    });
  }
}

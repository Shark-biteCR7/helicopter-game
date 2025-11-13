import { SCORE, WEATHER } from '../constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  init(data) { this.dataBag = data || {}; }

  create() {
    const { mode, score, best, onRestart, onRevive, chapter, level } = this.dataBag;
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    if (mode === 'result') {
      // 半透明背景
      this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.5);

      // 结果面板（如果有复活选项，面板高度增加）
      const panelHeight = onRevive ? 620 : 520;
      const box = this.add.rectangle(cx, cy, 520, panelHeight, 0x1e294e, 0.95).setStrokeStyle(6, 0x2f8cc9);

      this.add.text(cx, cy - 180, '结算', {
        fontFamily: 'Inter, Arial',
        fontSize: 48,
        fontStyle: '700',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.add.text(cx, cy - 140, 'Result', {
        fontFamily: 'Inter, Arial',
        fontSize: 22,
        color: '#bcd7ff'
      }).setOrigin(0.5);

      const weatherLabel = level ? WEATHER[level.weather] : null;
      const stageZh = level ? level.name.zh : '';
      const stageEn = level ? level.name.en : '';
      const chapterZh = chapter ? chapter.title.zh : '';
      const chapterEn = chapter ? chapter.title.en : '';

      if (chapter && level) {
        this.add.text(cx, cy - 92, `${chapterZh}｜${stageZh}`, {
          fontFamily: 'Inter, Arial',
          fontSize: 26,
          color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(cx, cy - 62, `${chapterEn} · ${stageEn}`, {
          fontFamily: 'Inter, Arial',
          fontSize: 18,
          color: '#bcd7ff'
        }).setOrigin(0.5);
      }

      if (weatherLabel) {
        this.add.text(cx, cy - 20, `天气：${weatherLabel.zh}`, {
          fontFamily: 'Inter, Arial',
          fontSize: 20,
          color: '#9ee4ff'
        }).setOrigin(0.5);
        this.add.text(cx, cy + 2, `Weather: ${weatherLabel.en}`, {
          fontFamily: 'Inter, Arial',
          fontSize: 16,
          color: '#bcd7ff'
        }).setOrigin(0.5);
      }

      this.add.text(cx, cy + 48, `${score}`, {
        fontFamily: 'Inter, Arial',
        fontSize: 72,
        fontStyle: '700',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(cx, cy + 8, '得分 / Score', {
        fontFamily: 'Inter, Arial',
        fontSize: 22,
        color: '#bcd7ff',
        align: 'center'
      }).setOrigin(0.5);

      const prevBest = parseInt(localStorage.getItem(SCORE.lsKey) || '0', 10);
      const newBest = Math.max(prevBest, score);
      localStorage.setItem(SCORE.lsKey, String(newBest));
      const bestTextZh = newBest > prevBest ? `最高分 ${newBest}  (新纪录!)` : `最高分 ${newBest}`;
      const bestTextEn = newBest > prevBest ? `Best ${newBest}  (New!)` : `Best ${newBest}`;
      this.add.text(cx, cy + 108, bestTextZh, {
        fontFamily: 'Inter, Arial',
        fontSize: 26,
        fontStyle: '600',
        color: '#9ee4ff'
      }).setOrigin(0.5);
      this.add.text(cx, cy + 140, bestTextEn, {
        fontFamily: 'Inter, Arial',
        fontSize: 18,
        color: '#bcd7ff'
      }).setOrigin(0.5);

      // 按钮构造函数
      const mkBtn = (y, label, color, callback) => {
        const btn = this.add.rectangle(cx, y, 220, 84, color).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(4, 0x2f8cc9, 0.6);
        this.add.text(cx, y - 14, label.zh, {
          fontFamily: 'Inter, Arial',
          fontSize: 32,
          fontStyle: '600',
          color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(cx, y + 18, label.en, {
          fontFamily: 'Inter, Arial',
          fontSize: 18,
          color: '#bcd7ff'
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
          btn.setScale(0.96);
          const playScene = this.scene.get('Play');
          if (playScene && playScene.audio) playScene.audio.playButton();
          this.time.delayedCall(150, () => {
            if (callback) callback();
          });
        });
        btn.on('pointerup', () => btn.setScale(1));
        btn.on('pointerout', () => btn.setScale(1));
      };

      // 如果有复活功能，显示复活按钮
      if (onRevive) {
        // 复活按钮（最显眼的位置）
        mkBtn(cy + 180, { zh: '看广告复活', en: 'Revive (Watch Ad)' }, 0x2ecc71, () => {
          if (onRevive) onRevive();
        });
        
        // Restart按钮
        mkBtn(cy + 280, { zh: '重新开始', en: 'Restart' }, 0x2f8cc9, () => {
          if (onRestart) onRestart();
        });

        // Home按钮
        mkBtn(cy + 380, { zh: '回到主页', en: 'Home' }, 0x1b2a49, () => {
          this.scene.get('Play').shutdownToMenu();
        });
      } else {
        // 没有复活功能时的按钮布局
        // Restart按钮
        mkBtn(cy + 200, { zh: '重新开始', en: 'Restart' }, 0x2f8cc9, () => {
          if (onRestart) onRestart();
        });

        // Home按钮
        mkBtn(cy + 300, { zh: '回到主页', en: 'Home' }, 0x1b2a49, () => {
          this.scene.get('Play').shutdownToMenu();
        });
      }
    }
  }
}

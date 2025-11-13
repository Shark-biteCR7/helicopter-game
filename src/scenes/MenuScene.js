import { DESIGN, SCORE } from '../constants.js';
import AudioSystem from '../systems/AudioSystem.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
    this.audio = null;
  }

  create() {
    const cam = this.cameras.main;
    const cx = cam.centerX;
    const cy = cam.centerY;

    this.audio = new AudioSystem(this);

    this.add.rectangle(cx, cy, this.scale.width * 0.7, this.scale.height * 0.75, 0x101731, 0.52)
      .setStrokeStyle(2, 0x1f2d4c, 0.6);

    const titleZh = this.add.text(cx, cy - 260, '直升机逃脱', {
      fontFamily: 'Inter, Arial',
      fontSize: 64,
      fontStyle: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(cx, titleZh.y + 58, 'Helicopter Escape', {
      fontFamily: 'Inter, Arial',
      fontSize: 28,
      fontStyle: '600',
      color: '#9ee4ff'
    }).setOrigin(0.5);

    const best = parseInt(localStorage.getItem(SCORE.lsKey) || '0', 10);
    this.add.text(cx, cy - 110, `最高分 ${best}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 30,
      color: '#9ee4ff'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 72, `Best ${best}`, {
      fontFamily: 'Inter, Arial',
      fontSize: 18,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    const mkBtn = (y, label, color, onTap) => {
      const w = 380, h = 104;
      const btn = this.add.rectangle(cx, y, w, h, color, 1).setInteractive({ useHandCursor: true });
      btn.setStrokeStyle(4, 0x2f8cc9, 0.55);
      const txt = this.add.text(cx, y - 18, label.zh, {
        fontFamily: 'Inter, Arial',
        fontSize: 40,
        fontStyle: '600',
        color: '#ffffff'
      }).setOrigin(0.5);
      const txtEn = this.add.text(cx, y + 24, label.en, {
        fontFamily: 'Inter, Arial',
        fontSize: 20,
        color: '#ffffff'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        btn.setScale(0.96);
        this.audio.playButton();
        this.time.delayedCall(120, () => onTap && onTap());
      });
      const resetScale = () => btn.setScale(1);
      btn.on('pointerup', resetScale);
      btn.on('pointerout', resetScale);
      return { btn, txt, txtEn };
    };

    mkBtn(cy + 10, { zh: '开始冒险', en: 'Start Journey' }, 0x2f8cc9, () => {
      this.scene.start('LevelScene', { chapterId: 'rural' });
    });

    this.add.text(cx, cy + 130, '轻触屏幕或按空格操控直升机', {
      fontFamily: 'Inter, Arial',
      fontSize: 24,
      color: '#9ee4ff'
    }).setOrigin(0.5);
    this.add.text(cx, cy + 166, 'Tap screen or press Space to pilot the heli', {
      fontFamily: 'Inter, Arial',
      fontSize: 16,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    // 右上角汉堡菜单
    const more = this.add.container(DESIGN.width - 50, 50);
    const moreHit = this.add.circle(0, 0, 28, 0x1b2a49, 0.7)
      .setInteractive({ useHandCursor: true });
    moreHit.setStrokeStyle(2, 0x2f8cc9, 0.5);
    const moreIcon = this.add.text(0, 0, '≡', {
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: '700',
      color: '#9ee4ff'
    }).setOrigin(0.5);
    more.add([moreHit, moreIcon]);

    moreHit.on('pointerdown', () => {
      more.setScale(0.96);
      this.audio.playButton();
      this.time.delayedCall(120, () => this.scene.start('MinimalMenu'));
    });
    const resetMore = () => more.setScale(1);
    moreHit.on('pointerup', resetMore);
    moreHit.on('pointerout', resetMore);
  }
}

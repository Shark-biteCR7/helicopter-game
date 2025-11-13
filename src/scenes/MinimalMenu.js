import AudioSystem from '../systems/AudioSystem.js';

export default class MinimalMenu extends Phaser.Scene {
  constructor() {
    super('MinimalMenu');
    this.audio = null;
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.audio = new AudioSystem(this);

    this.add.rectangle(cx, cy, this.scale.width * 0.75, this.scale.height * 0.78, 0x101731, 0.62)
      .setStrokeStyle(2, 0x1f2d4c, 0.5);

    this.add.text(cx, cy - 260, '更多选项', {
      fontFamily: 'Inter, Arial',
      fontSize: 48,
      fontStyle: '700',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 220, 'More Options', {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    const mkBtn = (y, label, on) => {
      const r = this.add.rectangle(cx, y, 400, 96, 0x1b2a49).setInteractive({ useHandCursor: true });
      r.setStrokeStyle(4, 0x2f8cc9, 0.5);
      const txtZh = this.add.text(cx, y - 16, label.zh, {
        fontFamily: 'Inter, Arial',
        fontSize: 34,
        fontStyle: '600',
        color: '#ffffff'
      }).setOrigin(0.5);
      const txtEn = this.add.text(cx, y + 20, label.en, {
        fontFamily: 'Inter, Arial',
        fontSize: 18,
        color: '#bcd7ff'
      }).setOrigin(0.5);

      r.on('pointerdown', () => {
        r.setScale(0.96);
        this.audio.playButton();
        this.time.delayedCall(140, () => on && on());
      });
      const reset = () => r.setScale(1);
      r.on('pointerup', reset);
      r.on('pointerout', reset);
      return { r, txtZh, txtEn };
    };

    const spacing = 130;
    mkBtn(cy - spacing, { zh: '关卡选择', en: 'Stage Select' }, () => this.scene.start('LevelScene'));
    mkBtn(cy, { zh: '设置', en: 'Settings' }, () => this.scene.start('SettingsScene'));
    mkBtn(cy + spacing, { zh: '排行榜', en: 'Leaderboard' }, () => this.scene.start('LeaderboardScene'));

    const back = this.add.container(cx, cy + spacing * 1.8);
    const hit = this.add.rectangle(0, 0, 160, 60, 0x1b2a49, 0.6).setInteractive({ useHandCursor: true });
    hit.setStrokeStyle(3, 0x2f8cc9, 0.45);
    const labelZh = this.add.text(0, -10, '← 返回', {
      fontFamily: 'Inter, Arial',
      fontSize: 28,
      color: '#9ee4ff'
    }).setOrigin(0.5);
    const labelEn = this.add.text(0, 16, 'Back', {
      fontFamily: 'Inter, Arial',
      fontSize: 16,
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
}

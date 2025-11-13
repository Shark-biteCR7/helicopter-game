import AudioSystem from '../systems/AudioSystem.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
    this.audio = null;
  }

  create() {
    const cx = this.cameras.main.centerX, cy = this.cameras.main.centerY;

    this.audio = new AudioSystem(this);

    this.add.rectangle(cx, cy, this.scale.width * 0.75, this.scale.height * 0.8, 0x101731, 0.6)
      .setStrokeStyle(2, 0x1f2d4c, 0.5);

    this.add.text(cx, cy - 240, '设置', {
      fontFamily: 'Inter, Arial',
      fontSize: 48,
      fontStyle: '700',
      color: '#fff'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 200, 'Settings', {
      fontFamily: 'Inter, Arial',
      fontSize: 22,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    // 切换按钮函数
    const mkToggle = (y, label) => {
      const r = this.add.rectangle(cx, y, 440, 94, 0x1b2a49).setInteractive({ useHandCursor: true });
      r.setStrokeStyle(4, 0x2f8cc9, 0.45);

      const tZh = this.add.text(cx - 140, y - 16, label.zh, {
        fontFamily: 'Inter, Arial',
        fontSize: 30,
        fontStyle: '600',
        color: '#9ee4ff'
      }).setOrigin(0, 0.5);

      const tEn = this.add.text(cx - 140, y + 20, label.en, {
        fontFamily: 'Inter, Arial',
        fontSize: 18,
        color: '#bcd7ff'
      }).setOrigin(0, 0.5);

      const stateTextZh = this.add.text(cx + 140, y - 14, '开', {
        fontFamily: 'Inter, Arial',
        fontSize: 30,
        fontStyle: '600',
        color: '#ffffff'
      }).setOrigin(0.5);
      const stateTextEn = this.add.text(cx + 140, y + 16, 'On', {
        fontFamily: 'Inter, Arial',
        fontSize: 18,
        color: '#bcd7ff'
      }).setOrigin(0.5);

      let on = true;
      r.on('pointerdown', () => {
        on = !on;
        stateTextZh.setText(on ? '开' : '关');
        stateTextEn.setText(on ? 'On' : 'Off');
        this.audio.playButton();
      });
      return { r, tZh, tEn, stateTextZh, stateTextEn };
    };

    mkToggle(cy - 60, { zh: '音效', en: 'Sound Effects' });
    mkToggle(cy + 60, { zh: '背景音乐', en: 'Background Music' });

    const back = this.add.container(cx, cy + 260);
    const hit = this.add.rectangle(0, 0, 170, 60, 0x1b2a49, 0.6)
      .setInteractive({ useHandCursor: true });
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
      this.time.delayedCall(120, () => this.scene.start('MinimalMenu'));
    });
    const resetBack = () => back.setScale(1);
    hit.on('pointerup', resetBack);
    hit.on('pointerout', resetBack);
  }
}

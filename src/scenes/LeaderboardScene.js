import AudioSystem from '../systems/AudioSystem.js';

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
    this.audio = null;
  }

  create() {
    const cx = this.cameras.main.centerX, cy = this.cameras.main.centerY;

    this.audio = new AudioSystem(this);

    this.add.rectangle(cx, cy, this.scale.width * 0.78, this.scale.height * 0.82, 0x101731, 0.6)
      .setStrokeStyle(2, 0x1f2d4c, 0.5);

    this.add.text(cx, cy - 250, '排行榜', {
      fontFamily: 'Inter, Arial',
      fontSize: 50,
      fontStyle: '700',
      color: '#fff'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 210, 'Leaderboard', {
      fontFamily: 'Inter, Arial',
      fontSize: 24,
      color: '#bcd7ff'
    }).setOrigin(0.5);

    for (let i = 0; i < 10; i++) {
      const score = 1000 - i * 37;
      this.add.text(cx, cy - 150 + i * 48, `${i + 1}. 玩家${i + 1}  ——  ${score}`, {
        fontFamily: 'Inter, Arial',
        fontSize: 24,
        color: '#9ee4ff'
      }).setOrigin(0.5, 0);
      this.add.text(cx, cy - 126 + i * 48, `${i + 1}. Player ${i + 1}  ——  ${score}`, {
        fontFamily: 'Inter, Arial',
        fontSize: 16,
        color: '#bcd7ff'
      }).setOrigin(0.5, 0);
    }

    const back = this.add.container(cx, cy + 360);
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

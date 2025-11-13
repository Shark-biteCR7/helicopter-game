import { DESIGN } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {}

  create() {
    // 生成像素风纹理：直升机
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2f7aa5, 1);
    g.fillRect(6, 16, 84, 40);
    g.fillStyle(0x46a7d0, 1);
    g.fillRect(12, 22, 72, 28);
    g.fillStyle(0xffffff, 1);
    g.fillRect(70, 28, 10, 10); // 舷窗
    g.fillStyle(0x1b1b1b, 1);
    g.fillRect(42, 6, 12, 10); // 旋翼轴
    g.fillRect(18, -4, 60, 8); // 主旋翼
    g.fillRect(-8, 30, 32, 8); // 尾翼
    g.generateTexture('heli', 96, 64);

    // 农村天空背景
    g.clear();
    g.fillStyle(0x6fb5ff, 1);
    g.fillRect(0, 0, DESIGN.width, DESIGN.height);
    g.fillStyle(0x4a8cd8, 1);
    g.fillRect(0, DESIGN.height - 420, DESIGN.width, 420);
    g.generateTexture('rural-sky', DESIGN.width, DESIGN.height);

    // 麦田地面
    g.clear();
    g.fillStyle(0xf6c15b, 1);
    g.fillRect(0, 0, DESIGN.width, 240);
    g.fillStyle(0xdeaa3f, 1);
    for (let i = 0; i < DESIGN.width; i += 32) {
      g.fillRect(i, 80, 16, 8);
      g.fillRect(i + 16, 140, 12, 8);
      g.fillRect(i, 200, 20, 8);
    }
    g.generateTexture('field-ground', DESIGN.width, 240);

  // 彩色几何障碍（底部）- 圆形+矩形组合
  g.clear();
  g.fillStyle(0xff6b6b, 1); // 红色
  g.fillCircle(60, 60, 48);
  g.fillStyle(0xffd93d, 1); // 黄色
  g.fillRect(20, 80, 80, 176);
  g.generateTexture('tree-bottom', 120, 256);

  // 彩色几何障碍（顶部）- 三角形+菱形
  g.clear();
  g.fillStyle(0x6bcf7f, 1); // 绿色
  g.fillTriangle(60, 20, 20, 100, 100, 100);
  g.fillStyle(0xa29bfe, 1); // 紫色
  g.fillRect(40, 100, 40, 40);
  g.fillStyle(0x74b9ff, 1); // 蓝色
  g.fillRect(30, 110, 60, 90);
  g.generateTexture('tree-top', 120, 200);

    // 云朵
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 24, 40, 24);
    g.fillRect(32, 12, 40, 36);
    g.fillRect(68, 18, 44, 28);
    g.fillRect(32, 32, 56, 20);
    g.generateTexture('cloud', 112, 64);

    // 雨滴、雪花与叶片粒子
    g.clear();
    g.fillStyle(0x3c9be8, 1);
    g.fillRect(0, 0, 4, 16);
    g.generateTexture('rain-drop', 4, 16);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 10, 10);
    g.fillStyle(0xdde9ff, 1);
    g.fillRect(2, 2, 6, 6);
    g.generateTexture('snow-flake', 10, 10);

    g.clear();
    g.fillStyle(0x76b840, 1);
    g.fillRect(0, 6, 28, 10);
    g.fillRect(6, 0, 16, 6);
    g.fillStyle(0x4f7d28, 1);
    g.fillRect(6, 10, 16, 4);
    g.generateTexture('leaf', 28, 16);

    // 地面碰撞体
    g.clear();
    g.fillStyle(0x1a1f33, 1);
    g.fillRect(0, 0, DESIGN.width, 30);
    g.generateTexture('ground', DESIGN.width, 30);

    const nextScene = this.registry.has('boot:next') ? this.registry.get('boot:next') : 'Menu';
    this.scene.start(nextScene);
  }
}

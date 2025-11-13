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

  // 山洞岩石障碍（底部）- 不规则凸起的钟乳石感觉
  g.clear();
  g.fillStyle(0x8b7355, 1); // 深褐色基底
  g.fillRect(0, 200, 120, 56);
  g.fillStyle(0xa0826d, 1); // 浅褐色
  // 不规则锯齿状钟乳石
  g.fillTriangle(15, 200, 5, 140, 25, 200);
  g.fillTriangle(40, 200, 30, 120, 50, 200);
  g.fillTriangle(65, 200, 55, 160, 75, 200);
  g.fillTriangle(90, 200, 80, 100, 100, 200);
  g.fillStyle(0x6b5344, 1); // 阴影
  g.fillRect(5, 220, 15, 36);
  g.fillRect(30, 220, 20, 36);
  g.fillRect(55, 220, 15, 36);
  g.fillRect(80, 220, 20, 36);
  g.generateTexture('tree-bottom', 120, 256);

  // 山洞岩石障碍（顶部）- 向下生长的石笋
  g.clear();
  g.fillStyle(0x8b7355, 1); // 深褐色
  g.fillRect(0, 0, 120, 50);
  g.fillStyle(0xa0826d, 1); // 浅褐色
  // 倒三角石笋形状
  g.fillTriangle(20, 50, 10, 120, 30, 50);
  g.fillTriangle(45, 50, 35, 100, 55, 50);
  g.fillTriangle(70, 50, 60, 140, 80, 50);
  g.fillTriangle(95, 50, 85, 110, 105, 50);
  g.fillStyle(0x6b5344, 1); // 暗部纹理
  g.fillRect(10, 10, 12, 30);
  g.fillRect(35, 10, 15, 30);
  g.fillRect(60, 10, 12, 30);
  g.fillRect(85, 10, 15, 30);
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

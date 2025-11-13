import { DESIGN, ASSETS } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  
  preload() {
    // 加载自定义直升机图片
    if (ASSETS.helicopter) {
      this.load.image('heli', ASSETS.helicopter);
    }
  }


  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    
    // 创建天蓝色渐变背景 (从上到下：浅蓝 -> 深蓝)
    const canvas = document.createElement('canvas');
    canvas.width = DESIGN.width;
    canvas.height = DESIGN.height;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN.height);
    gradient.addColorStop(0, '#87CEEB');    // 天蓝色 (顶部)
    gradient.addColorStop(0.7, '#4A9FD8'); // 中蓝色
    gradient.addColorStop(1, '#2E86C1');    // 深蓝色 (底部)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, DESIGN.width, DESIGN.height);
    this.textures.addCanvas('rural-sky', canvas);

    // 创建简单的方块障碍物 (上下两部分)
    g.clear();
    g.fillStyle(0x7f8c8d, 1);
    g.fillRect(0, 0, 120, 256);
    g.generateTexture('tree-top', 120, 256);
    
    g.clear();
    g.fillStyle(0x95a5a6, 1);
    g.fillRect(0, 0, 120, 256);
    g.generateTexture('tree-bottom', 120, 256);

    // 创建地面
    g.clear();
    g.fillStyle(0x34495e, 1);
    g.fillRect(0, 0, DESIGN.width, 30);
    g.generateTexture('ground', DESIGN.width, 30);

    // 创建云朵（保留天气效果）
    g.clear();
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(0, 24, 40, 24);
    g.fillRect(32, 12, 40, 36);
    g.fillRect(68, 18, 44, 28);
    g.fillRect(32, 32, 56, 20);
    g.generateTexture('cloud', 112, 64);

    // 创建天气粒子
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

    const nextScene = this.registry.has('boot:next') ? this.registry.get('boot:next') : 'Menu';
    this.scene.start(nextScene);
  }
}

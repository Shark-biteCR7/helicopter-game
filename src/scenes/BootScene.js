import { DESIGN, ASSETS } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    if (ASSETS.useKenney) {
      // 加载背景图（用户需放置于 assets/kenney_pixel/backgrounds/ 下）
      ASSETS.backgrounds.forEach((fname, idx) => {
        const key = `kenney-bg-${idx}`;
        this.load.image(key, `assets/kenney_pixel/backgrounds/${fname}`);
      });
      // 若启用由 tile 碎图拼背景，则加载这些碎图
      if (ASSETS.backgroundFromTiles && ASSETS.backgroundTileFiles) {
        ASSETS.backgroundTileFiles.forEach((fname, idx) => {
          const key = `kenney-bgtile-${idx}`;
          this.load.image(key, `${ASSETS.backgroundTileDir}/${fname}`);
        });
      }
      // 加载 tile 障碍物素材（用户需放置于 assets/kenney_pixel/tiles/ 下）
      if (ASSETS.tiles) {
        ASSETS.tiles.forEach((fname, idx) => {
          const key = `kenney-tile-${idx}`;
          this.load.image(key, `assets/kenney_pixel/tiles/${fname}`);
        });
      }
    }
  }

  create() {
    if (!ASSETS.useKenney) {
      // === 保留旧的程序化生成路径 ===
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // 直升机
      g.fillStyle(0x2f7aa5, 1); g.fillRect(6, 16, 84, 40);
      g.fillStyle(0x46a7d0, 1); g.fillRect(12, 22, 72, 28);
      g.fillStyle(0xffffff, 1); g.fillRect(70, 28, 10, 10);
      g.fillStyle(0x1b1b1b, 1); g.fillRect(42, 6, 12, 10); g.fillRect(18, -4, 60, 8); g.fillRect(-8, 30, 32, 8);
      g.generateTexture('heli', 96, 64);

      // 背景
      g.clear(); g.fillStyle(0x6fb5ff, 1); g.fillRect(0, 0, DESIGN.width, DESIGN.height);
      g.fillStyle(0x4a8cd8, 1); g.fillRect(0, DESIGN.height - 420, DESIGN.width, 420);
      g.generateTexture('rural-sky', DESIGN.width, DESIGN.height);

      // 地面
      g.clear(); g.fillStyle(0xf6c15b, 1); g.fillRect(0, 0, DESIGN.width, 240);
      g.fillStyle(0xdeaa3f, 1);
      for (let i = 0; i < DESIGN.width; i += 32) {
        g.fillRect(i, 80, 16, 8); g.fillRect(i + 16, 140, 12, 8); g.fillRect(i, 200, 20, 8);
      }
      g.generateTexture('field-ground', DESIGN.width, 240);

      // 岩石障碍（简化保留）
      g.clear(); g.fillStyle(0x8b7355, 1); g.fillRect(0, 200, 120, 56);
      g.fillStyle(0xa0826d, 1);
      g.fillTriangle(15, 200, 5, 140, 25, 200);
      g.fillTriangle(40, 200, 30, 120, 50, 200);
      g.fillTriangle(65, 200, 55, 160, 75, 200);
      g.fillTriangle(90, 200, 80, 100, 100, 200);
      g.generateTexture('tree-bottom', 120, 256);
      g.clear(); g.fillStyle(0x8b7355, 1); g.fillRect(0, 0, 120, 50);
      g.fillStyle(0xa0826d, 1);
      g.fillTriangle(20, 50, 10, 120, 30, 50);
      g.fillTriangle(45, 50, 35, 100, 55, 50);
      g.fillTriangle(70, 50, 60, 140, 80, 50);
      g.fillTriangle(95, 50, 85, 110, 105, 50);
      g.generateTexture('tree-top', 120, 200);

      // 云 / 粒子 / 地面碰撞体
      g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 24, 40, 24); g.fillRect(32, 12, 40, 36); g.fillRect(68, 18, 44, 28); g.fillRect(32, 32, 56, 20); g.generateTexture('cloud', 112, 64);
      g.clear(); g.fillStyle(0x3c9be8, 1); g.fillRect(0, 0, 4, 16); g.generateTexture('rain-drop', 4, 16);
      g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 10, 10); g.fillStyle(0xdde9ff, 1); g.fillRect(2, 2, 6, 6); g.generateTexture('snow-flake', 10, 10);
      g.clear(); g.fillStyle(0x76b840, 1); g.fillRect(0, 6, 28, 10); g.fillRect(6, 0, 16, 6); g.fillStyle(0x4f7d28, 1); g.fillRect(6, 10, 16, 4); g.generateTexture('leaf', 28, 16);
      g.clear(); g.fillStyle(0x1a1f33, 1); g.fillRect(0, 0, DESIGN.width, 30); g.generateTexture('ground', DESIGN.width, 30);
    } else {
      // 生成背景纹理 rural-sky
      if (ASSETS.backgroundFromTiles && ASSETS.backgroundTileFiles && ASSETS.backgroundTileFiles.length) {
        // 用多个 tile 横向或平铺拼成完整背景
        const rt = this.make.renderTexture({ width: DESIGN.width, height: DESIGN.height, add: false });
        // 先填充底色
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x6fb5ff, 1); g.fillRect(0, 0, DESIGN.width, DESIGN.height);
        rt.draw(g, 0, 0);
        g.destroy();
        // 平铺放置（简单重复每个 tile，按行扫描）
        const tileKeys = ASSETS.backgroundTileFiles.map((_, i) => `kenney-bgtile-${i}`).filter(k => this.textures.exists(k));
        let y = DESIGN.height - 256; // 假设 tile 是地面/山的下半部分，放底部
        if (tileKeys.length) {
          tileKeys.forEach((key, idx) => {
            const img = this.textures.get(key).getSourceImage();
            const tileW = img.width;
            // 横向重复
            for (let x = 0; x < DESIGN.width; x += tileW) {
              rt.draw(key, x, y);
            }
            // 若有多层，往上叠一层（简单偏移）
            y -= img.height * 0.6;
            if (y < 0) y = 0;
          });
        }
        rt.saveTexture('rural-sky');
      } else {
        const firstBgKey = 'kenney-bg-0';
        if (this.textures.exists(firstBgKey)) {
          this.textures.renameTexture(firstBgKey, 'rural-sky');
        } else {
          console.warn('Kenney 背景纹理未找到，回退到程序化生成');
          const g = this.make.graphics({ x: 0, y: 0, add: false });
          g.fillStyle(0x5dade2, 1); g.fillRect(0, 0, DESIGN.width, DESIGN.height); g.generateTexture('rural-sky', DESIGN.width, DESIGN.height);
        }
      }
      // 地面：暂时继续使用程序化生成（保持字段兼容）
      if (!this.textures.exists('field-ground')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xf6c15b, 1); g.fillRect(0, 0, DESIGN.width, 240); g.generateTexture('field-ground', DESIGN.width, 240);
      }
      if (!this.textures.exists('heli')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x2f7aa5, 1); g.fillRect(6, 16, 84, 40); g.generateTexture('heli', 96, 64);
      }
      // 云若缺失则补全
      if (!this.textures.exists('cloud')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1); g.fillRect(0, 24, 40, 24); g.fillRect(32, 12, 40, 36); g.fillRect(68, 18, 44, 28); g.fillRect(32, 32, 56, 20); g.generateTexture('cloud', 112, 64);
      }
      // 占位障碍纹理（仍使用旧 key 以免报错）
      if (!this.textures.exists('tree-top')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x7f8c8d, 1); g.fillRect(0, 0, 120, 60); g.generateTexture('tree-top', 120, 60);
      }
      if (!this.textures.exists('tree-bottom')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x95a5a6, 1); g.fillRect(0, 0, 120, 60); g.generateTexture('tree-bottom', 120, 60);
      }
      if (!this.textures.exists('ground')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x1a1f33, 1); g.fillRect(0, 0, DESIGN.width, 30); g.generateTexture('ground', DESIGN.width, 30);
      }

      // 将前两个 tile 复用为 tree-top / tree-bottom（保持 PlayScene 兼容）
      const tileTopKey = 'kenney-tile-0';
      const tileBottomKey = 'kenney-tile-1';
      if (this.textures.exists(tileTopKey) && !this.textures.exists('tree-top')) {
        // 复制而非重命名：用一个临时绘制
        const src = this.textures.get(tileTopKey).getSourceImage();
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.drawTexture(tileTopKey, 0, 0);
        g.generateTexture('tree-top', src.width, src.height);
      }
      if (this.textures.exists(tileBottomKey) && !this.textures.exists('tree-bottom')) {
        const src = this.textures.get(tileBottomKey).getSourceImage();
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.drawTexture(tileBottomKey, 0, 0);
        g.generateTexture('tree-bottom', src.width, src.height);
      }
    }

    const nextScene = this.registry.has('boot:next') ? this.registry.get('boot:next') : 'Menu';
    this.scene.start(nextScene);
  }
}

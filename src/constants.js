export const DESIGN = {
  width: 720,
  height: 1280,
  bgColor: 0x0b1020
};

export const PHYS = {
  gravity: 1400,
  thrust: 1800,
  vyMaxUp: 600,
  vyMaxDown: 900
};

export const COURSE = {
  gapMin: 150,
  centerYMin: 300,
  centerYMax: 960
};

export const SCORE = {
  distFactor: 0.03,  // 距离分权重
  lsKey: 'HELI_BEST'
};

export const WEATHER = {
  sunny: { zh: '晴', en: 'Sunny' },
  windy: { zh: '风', en: 'Windy' },
  rain: { zh: '雨', en: 'Rainy' },
  snow: { zh: '雪', en: 'Snowy' }
};

export const CHAPTERS = [
  {
    id: 'rural',
    title: { zh: '第一章 洞穴探险', en: 'Chapter 1 Cave Adventure' },
    description: { zh: '穿越钟乳石洞穴', en: 'Navigate through stalactite caves' },
    levels: [
      {
        levelId: 1,
        id: 'rural-1',
        name: { zh: '第1关', en: 'Stage 1' },
        weather: 'sunny',
        length: 6000,
        goalPosition: 5800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        // 动态生成配置 - 关卡1：入门难度，障碍稀疏，缝隙宽
        obstacleDensity: 900,  // 障碍间距较大
        gapHeight: { min: 260, max: 320 },  // 缝隙较宽
        gapCenterY: { min: 400, max: 880 }  // 缝隙中心垂直范围
      },
      {
        levelId: 2,
        id: 'rural-2',
        name: { zh: '第2关', en: 'Stage 2' },
        weather: 'sunny',
        length: 7000,
        goalPosition: 6800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        // 关卡2：初级难度，障碍略密，缝隙略窄
        obstacleDensity: 800,
        gapHeight: { min: 240, max: 300 },
        gapCenterY: { min: 380, max: 900 }  // 垂直变化略大
      },
      {
        levelId: 3,
        id: 'rural-3',
        name: { zh: '第3关', en: 'Stage 3' },
        weather: 'windy',
        length: 8000,
        goalPosition: 7800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        // 关卡3：中级难度，障碍更密，缝隙更窄
        obstacleDensity: 700,
        gapHeight: { min: 220, max: 280 },
        gapCenterY: { min: 360, max: 920 }  // 垂直变化加大
      },
      {
        levelId: 4,
        id: 'rural-4',
        name: { zh: '第4关', en: 'Stage 4' },
        weather: 'rain',
        length: 9000,
        goalPosition: 8800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        // 关卡4：高级难度，障碍密集，缝隙狭窄
        obstacleDensity: 650,
        gapHeight: { min: 200, max: 260 },
        gapCenterY: { min: 340, max: 940 }  // 垂直变化剧烈
      },
      {
        levelId: 5,
        id: 'rural-5',
        name: { zh: '第5关', en: 'Stage 5' },
        weather: 'snow',
        length: 10000,
        goalPosition: 9800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        // 关卡5：地狱难度，障碍极密，缝隙极窄
        obstacleDensity: 600,
        gapHeight: { min: 180, max: 240 },
        gapCenterY: { min: 320, max: 960 }  // 垂直变化最大
      }
    ]
  },
  {
    id: 'city',
    title: { zh: '第二章 城市', en: 'Chapter 2 City' },
    description: { zh: '敬请期待', en: 'Coming soon' },
    levels: []
  }
];

// 素材配置：使用程序化生成 + 自定义直升机图片
export const ASSETS = {
  useExternalAssets: false, // 禁用外部素材，使用程序化生成
  helicopter: 'helicol.png',  // 自定义直升机图片
  
  // 钟乳石障碍物贴图配置（预留扩展点）
  // 当前使用 tree-top/tree-bottom 占位，未来可替换为真实钟乳石素材
  obstacles: {
    // 顶部钟乳石（从上垂下）
    topKeys: ['tree-top'],  // 将来可扩展: ['stalactite_top_1', 'stalactite_top_2', 'stalactite_top_3']
    // 底部钟乳石（从下长出）
    bottomKeys: ['tree-bottom'],  // 将来可扩展: ['stalagmite_bottom_1', 'stalagmite_bottom_2', 'stalagmite_bottom_3']
    
    // 按关卡自定义障碍物贴图组（可选，未来扩展）
    levelSets: {
      // 1: { topKeys: ['stalactite_light_1', 'stalactite_light_2'], bottomKeys: ['stalagmite_light_1', 'stalagmite_light_2'] },
      // 2: { topKeys: ['stalactite_normal_1', 'stalactite_normal_2'], bottomKeys: ['stalagmite_normal_1', 'stalagmite_normal_2'] },
      // 3: { topKeys: ['stalactite_dark_1', 'stalactite_dark_2'], bottomKeys: ['stalagmite_dark_1', 'stalagmite_dark_2'] },
      // 4: { topKeys: ['stalactite_crystal_1', 'stalactite_crystal_2'], bottomKeys: ['stalagmite_crystal_1', 'stalagmite_crystal_2'] },
      // 5: { topKeys: ['stalactite_hell_1', 'stalactite_hell_2'], bottomKeys: ['stalagmite_hell_1', 'stalagmite_hell_2'] }
    }
  }
};

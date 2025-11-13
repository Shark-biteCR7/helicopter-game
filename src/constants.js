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
    title: { zh: '第一章 农村', en: 'Chapter 1 Countryside' },
    description: { zh: '蓝天白云与麦田', en: 'Blue sky above endless fields' },
    levels: [
      {
        levelId: 1,
        id: 'rural-1',
        name: { zh: '第1关', en: 'Stage 1' },
        weather: 'sunny',
        length: 5000,
        goalPosition: 4800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        // 动态生成配置
        obstacleDensity: 800,  // 每800px生成一个障碍
        gapHeight: { min: 260, max: 300 },  // 缝隙高度范围
        gapCenterY: { min: 400, max: 880 }  // 缝隙中心Y范围
      },
      {
        levelId: 2,
        id: 'rural-2',
        name: { zh: '第2关', en: 'Stage 2' },
        weather: 'sunny',
        length: 6000,
        goalPosition: 5800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        obstacleDensity: 750,
        gapHeight: { min: 240, max: 280 },
        gapCenterY: { min: 400, max: 880 }
      },
      {
        levelId: 3,
        id: 'rural-3',
        name: { zh: '第3关', en: 'Stage 3' },
        weather: 'windy',
        length: 7000,
        goalPosition: 6800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        obstacleDensity: 700,
        gapHeight: { min: 220, max: 260 },
        gapCenterY: { min: 400, max: 880 }
      },
      {
        levelId: 4,
        id: 'rural-4',
        name: { zh: '第4关', en: 'Stage 4' },
        weather: 'rain',
        length: 8000,
        goalPosition: 7800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        obstacleDensity: 650,
        gapHeight: { min: 200, max: 240 },
        gapCenterY: { min: 400, max: 880 }
      },
      {
        levelId: 5,
        id: 'rural-5',
        name: { zh: '第5关', en: 'Stage 5' },
        weather: 'snow',
        length: 10000,
        goalPosition: 9800,
        starThresholds: { star3: 5, star2: 3, star1: 1 },
        obstacleDensity: 600,
        gapHeight: { min: 180, max: 220 },
        gapCenterY: { min: 400, max: 880 }
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

// 外部素材加载开关与配置（Kenney等）
export const ASSETS = {
  useKenney: true, // 设置为 true 启用外部素材；false 则使用程序化生成
  backgrounds: [
    // 仅使用一张整幅背景贴图（用户提供）
    'tilemap-backgrounds.png'
  ],
  tiles: [
    'tile_0000.png',
    'tile_0001.png',
    'tile_0002.png',
    'tile_0003.png'
  ],
  // 如果想用 Tiles/Backgrounds 目录里多个碎图拼成背景，开启下面两个开关并列出文件
  backgroundFromTiles: true,
  backgroundTileDir: 'assets/kenney_pixel/tiles/Backgrounds', // 目标拷贝目录（需你把对应图片复制进去）
  backgroundTileFiles: [
    // 自动平铺使用的全部碎图（当前目录已存在 0~23 共24张）
    'tile_0000.png','tile_0001.png','tile_0002.png','tile_0003.png',
    'tile_0004.png','tile_0005.png','tile_0006.png','tile_0007.png',
    'tile_0008.png','tile_0009.png','tile_0010.png','tile_0011.png',
    'tile_0012.png','tile_0013.png','tile_0014.png','tile_0015.png',
    'tile_0016.png','tile_0017.png','tile_0018.png','tile_0019.png',
    'tile_0020.png','tile_0021.png','tile_0022.png','tile_0023.png'
  ]
  // 预留：后续可加入 topTiles / bottomTiles 指定障碍物贴图
};

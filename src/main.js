import { DESIGN } from './constants.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import MinimalMenu from './scenes/MinimalMenu.js';
import LevelScene from './scenes/LevelScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import PlayScene from './scenes/PlayScene.js';
import UIScene from './scenes/UIScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';

const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const isDevHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: DESIGN.width,
  height: DESIGN.height,
  backgroundColor: DESIGN.bgColor,
  physics: {
    default: 'arcade',
    arcade: {
      debug: isDevHost
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [BootScene, MenuScene, MinimalMenu, LevelScene, SettingsScene, LeaderboardScene, PlayScene, UIScene, LevelCompleteScene]
};

const game = new Phaser.Game(config);
if (isBrowser && isDevHost) {
  window.__GAME__ = game;
}

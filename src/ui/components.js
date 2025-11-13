import { UI_THEME } from './theme.js';

export const BUTTON_VARIANTS = Object.keys(UI_THEME.buttons.variants);

export function createUIButton(scene, {
  x = 0,
  y = 0,
  label,
  subLabel,
  width = UI_THEME.buttons.width,
  height = UI_THEME.buttons.height,
  variant = 'primary',
  onClick,
  iconText
} = {}) {
  if (!BUTTON_VARIANTS.includes(variant)) {
    variant = 'primary';
  }

  const { fill, text } = UI_THEME.buttons.variants[variant];

  const container = scene.add.container(x, y);

  // 背景
  const bg = scene.add.graphics();
  bg.fillStyle(fill, 1);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, UI_THEME.buttons.radius);
  container.add(bg);

  // 主标签
  const labelText = scene.add.text(0, 0, label ?? '', {
    fontFamily: UI_THEME.fontFamily,
    fontSize: subLabel ? 28 : 30,
    fontStyle: UI_THEME.fontWeight.bold,
    color: text,
    align: 'center'
  }).setOrigin(0.5);
  container.add(labelText);

  // 次标签
  if (subLabel) {
    labelText.setY(-10);
    const sub = scene.add.text(0, 16, subLabel, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 18,
      color: text,
      align: 'center'
    }).setOrigin(0.5);
    container.add(sub);
  }

  // 图标（可选）
  if (iconText) {
    const icon = scene.add.text(-width / 2 + 32, 0, iconText, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: 28,
      color: text
    }).setOrigin(0.5);
    container.add(icon);
  }

  // 交互区域
  container.setSize(width, height);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );
  container.on('pointerover', () => {
    container.setScale(UI_THEME.buttons.hoverScale);
  });
  container.on('pointerout', () => {
    container.setScale(1);
  });
  container.on('pointerdown', () => {
    container.setScale(UI_THEME.buttons.pressScale);
    if (onClick) scene.time.delayedCall(110, onClick);
  });
  container.on('pointerup', () => {
    container.setScale(UI_THEME.buttons.hoverScale);
  });

  return container;
}

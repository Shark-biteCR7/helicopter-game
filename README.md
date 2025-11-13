# 🚁 飞行器逃生

一个基于 Phaser 3 的网页小游戏，支持手机和电脑。

## 🎮 快速开始

### 本地运行

```bash
# 使用 Python 启动（推荐）
python3 -m http.server 8080

# 或使用 Node.js
npx serve

# 浏览器访问 http://localhost:8080
```

## � 操作说明

- **键盘**: `空格` 或 `↑` 跳跃，`P`/`ESC` 暂停
- **触摸**: 点击屏幕跳跃

## 📁 项目结构

```
飞行器App/
├── src/           # 源代码（Phaser 3）
│   ├── scenes/   # 游戏场景
│   ├── systems/  # 系统模块
│   └── constants.js  # 游戏配置
├── index.html    # 入口文件
├── manifest.json # PWA 配置
└── README.md
```

## 🎨 功能特性

- ✅ 5 个关卡（晴天、大风、雨天、雪天）
- ✅ 多种天气效果
- ✅ 音效系统
- ✅ 双语界面（中/英）
- ✅ 本地存档
- ✅ 响应式布局

## 🛠️ 技术栈

- **Phaser 3** - HTML5 游戏引擎
- **Arcade Physics** - 物理引擎
- **LocalStorage** - 本地存储

## � 自定义配置

修改 `src/constants.js` 可以调整：
- 关卡配置（速度、间隙、天气）
- 物理参数（重力、跳跃力）
- 游戏规则

## 🚀 部署

支持任何静态文件托管服务：
- GitHub Pages
- Netlify / Vercel
- 自定义服务器

---

**游戏愉快！** 🎮

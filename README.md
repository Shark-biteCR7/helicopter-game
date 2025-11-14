# 🚁 飞行器逃生

一个基于 **Phaser 3 + Arcade Physics** 的横版飞行闯关游戏，包含 5 个难度渐进的洞穴关卡、天气系统、粒子特效与自动化回归测试。本文档汇总本地开发、构建、测试以及“家人朋友试玩”专用的稳定部署流程。

## ⚡ 快速上手

```bash
# 安装依赖（构建脚本 + Puppeteer 测试）
npm install

# 本地调试（源码模式，含调试网格与 window.__GAME__ 钩子）
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080

# 产出压缩后的生产包（dist/）
npm run build

# 预览 dist/（静态服务器 + History Fallback，便于最终验收）
npm run preview

# 端到端自动化测试（包含完整通关、存档验证、性能指标）
npm test
```

> **提示**：源码模式会启用调试可视化并暴露 `window.__GAME__`，方便手动排查或 Puppeteer 测试；构建后的产物在非 `localhost` 环境会自动关闭这些能力，确保线上体验稳定一致。

## ✅ 稳定性检验

- `npm test` 使用 Puppeteer 自动打开浏览器、模拟点击、强制通关并校验存档，输出截图 `test-screenshot.png`、性能指标（堆大小/节点/监听器）。
- 测试脚本会自行启动内置服务器并在结束时清理，因此只需保证 8080 端口可用。
- 若要在 CI 中运行，可在无头环境设置 `PUPPETEER_PRODUCT=chrome` 以获得一致的 Chromium 版本。

## 🌐 家人朋友试玩：一键部署到 GitHub Pages

仓库新增 `.github/workflows/deploy.yml`，在每次推送到 `main` 时自动：

1. `npm ci` 安装依赖并运行 `npm run build` 生成 `dist/`。
2. 将构建产物上传为 Pages 工件。
3. 通过 `actions/deploy-pages@v4` 发布到 GitHub Pages，生成稳定 Demo 链接。

启用步骤：

1. 在 GitHub 仓库页面打开 **Settings → Pages**，将 **Source** 设为 `GitHub Actions`。
2. 第一次推送（或手动运行 **Actions → Deploy Demo → Run workflow**）。
3. 等待流程完成后，Pages 卡片会给出可分享的 HTTPS 地址，将该链接发送给家人和朋友即可。

> 如果你偏好手动部署，也可以执行 `npm run build` 并将 `dist/` 内容上传到任意静态托管（Netlify、Vercel、Cloudflare Pages 等）。

## 📁 项目结构

```
飞行器App/
├── index.html              # 入口页面（Phaser CDN + 模块化脚本）
├── src/
│   ├── main.js             # Phaser 游戏配置，按环境切换调试/窗口钩子
│   ├── constants.js        # 关卡、天气、物理、UI 配置
│   ├── scenes/             # Boot/Menu/Play/Settings/Leaderboard/UIs 等场景
│   ├── systems/            # 障碍、天气、进度、音频等模块化系统
│   └── ui/                 # DOM HUD 样式
├── scripts/
│   ├── build.mjs           # esbuild 打包 + 资源压缩 + 体积报告
│   └── preview.mjs         # dist/ 预览服务器（含 History 回退）
├── test-game.js            # Puppeteer 自动化测试脚本
├── manifest.json / sw.js   # PWA 相关（可选）
└── README.md
```

## 🎯 特性速览

- 渐进式关卡与天气（晴天 / 大风 / 雨雪）组合，难度随距离动态调整。
- "乐高山" 型障碍生成算法，保证稳定可玩又不失挑战。
- DOM HUD 展示分数、生命、进度与提示，移动端触摸与桌面键鼠兼容。
- ProgressManager 本地存档，自动解锁下一关；Obstacles/Weather/Audio 等系统解耦便于扩展。
- 构建脚本默认 Tree Shaking、压缩与静态资源复制，生成 <50 KB 的发布包。

## 🛠️ 自定义入口

- `src/constants.js`：调整每章长度、障碍密度、风力、粒子数量、物理参数等。
- `src/systems/`：可添加成就、道具、皮肤等全局系统。
- `src/ui/dom.css`：定制 HUD 样式、字体或移动端布局。
- `scripts/build.mjs`：可扩展图片压缩、版本戳、Sourcemap 等高级构建逻辑。

## 🔄 推荐工作流

1. 开发前运行 `npm install` 并使用 `python3 -m http.server 8080` 进行本地预览。
2. 迭代完成后执行 `npm test` 确认自动化回归通过。
3. `npm run build` 产出稳定包，推送到 `main` 触发 GitHub Pages 部署。
4. 将 Pages 链接分享给家人朋友；如需离线演示，可直接发送 `dist/`（压缩包）。

祝试玩愉快，欢迎继续扩展这款小游戏！🎮
# 🚁 飞行器逃生# 🚁 飞行器逃生



一个基于 **Phaser 3** 的横版躲避游戏，支持桌面和移动浏览器，包含 5 个逐步进阶的洞穴关卡。一个基于 **Phaser 3** 的横版躲避游戏，支持桌面和移动浏览器，包含 5 个逐步进阶的洞穴关卡。



## 🎮 快速上手## 🎮 快速上手



```bash```bash

# 安装依赖（构建脚本 + 自动化测试）# 安装依赖（构建脚本 + 自动化测试）

npm installnpm install



# 本地调试：静态服务器 + 调试工具（推荐）# 本地调试：静态服务器 + 调试工具（推荐）

python3 -m http.server 8080python3 -m http.server 8080

# 浏览器访问 http://localhost:8080# 浏览器访问 http://localhost:8080



# 打包生产版本（输出 dist/）# 打包生产版本（输出 dist/）

npm run buildnpm run build



# 预览 dist/（会自动启动静态服务器）# 预览 dist/（会自动启动静态服务器）

npm run previewnpm run preview



# 自动化回归测试（包含通关验证）# 自动化回归测试（包含通关验证）

npm testnpm test

``````



> 测试脚本采用 Puppeteer，会自动启动本地服务器、模拟操作并验证通关进度。首次运行 `npm test` 前请确保 `npm install puppeteer --save-dev` 已执行（当前项目已安装）。> 测试脚本采用 Puppeteer，会自动启动本地服务器、模拟操作并验证通关进度。首次运行 `npm test` 前请确保 `npm install puppeteer --save-dev` 已执行（当前项目已安装）。



## 🕹️ 操作说明## 🕹️ 操作说明



- **键盘**：`Space` / `↑` 控制上升，`P` 或 `Esc` 暂停- **键盘**：`Space` / `↑` 控制上升，`P` 或 `Esc` 暂停

- **触摸**：点击屏幕控制直升机抬升- **触摸**：点击屏幕控制直升机抬升



## 📦 构建与部署## 📦 构建与部署



- `npm run build` 将源码打包到 `dist/`（默认压缩、Tree Shaking、静态资源拷贝）- `npm run build` 将源码打包到 `dist/`（默认压缩、Tree Shaking、静态资源拷贝）

- `npm run preview` 会基于 `dist/` 启动一个本地静态服务器方便检查构建结果- `npm run preview` 会基于 `dist/` 启动一个本地静态服务器方便检查构建结果

- 直接将 `dist/` 目录部署到任意静态托管（GitHub Pages、Netlify、Vercel、CDN 等）即可获得与本地测试一致的体验- 直接将 `dist/` 目录部署到任意静态托管（GitHub Pages、Netlify、Vercel、CDN 等）即可获得与本地测试一致的体验

- 发布到 GitHub Pages 的常见做法：- 发布到 GitHub Pages 的常见做法：

  1. 运行 `npm run build`  1. 运行 `npm run build`

  2. 将 `dist/` 改名为 `docs/` 或者推送到 `gh-pages` 分支  2. 将 `dist/` 改名为 `docs/` 或者推送到 `gh-pages` 分支

  3. 在仓库设置中启用 Pages 并指向对应目录/分支  3. 在仓库设置中启用 Pages 并指向对应目录/分支



> 注意：源码模式下会自动打开 Arcade Physics 的调试可视化，并暴露 `window.__GAME__` 以便自动化测试使用；构建产物在非 `localhost` 环境会关闭调试并隐藏这些开发专用能力，从而与线上体验保持一致。> 注意：源码模式下会自动打开 Arcade Physics 的调试可视化，并暴露 `window.__GAME__` 以便自动化测试使用；构建产物在非 `localhost` 环境会关闭调试并隐藏这些开发专用能力，从而与线上体验保持一致。



## 🧪 自动化测试## 🧪 自动化测试



- 测试脚本：`test-game.js`- 测试脚本：`test-game.js`

- 覆盖流程：菜单 -> 关卡选择 -> 自动游玩 -> 强制触发通关 -> 校验本地存档 -> 性能指标 -> 截图- 覆盖流程：菜单 -> 关卡选择 -> 自动游玩 -> 强制触发通关 -> 校验本地存档 -> 性能指标 -> 截图

- 运行结果会生成 `test-screenshot.png`，并打印内存占用、节点数量等指标- 运行结果会生成 `test-screenshot.png`，并打印内存占用、节点数量等指标



## 📁 项目结构## 📁 项目结构



``````

飞行器App/飞行器App/

├── index.html          # 入口页面（加载 Phaser CDN + 模块化脚本）├── index.html          # 入口页面（加载 Phaser CDN + 模块化脚本）

├── src/├── src/

│   ├── main.js         # Phaser 游戏配置入口│   ├── main.js         # Phaser 游戏配置入口

│   ├── constants.js    # 全局常量与关卡配置│   ├── constants.js    # 全局常量与关卡配置

│   ├── scenes/         # 各场景（Boot、Menu、Play、UI、完成面板等）│   ├── scenes/         # 各场景（Boot、Menu、Play、UI、完成面板等）

│   ├── systems/        # 进度/障碍/天气/音频等系统模块│   ├── systems/        # 进度/障碍/天气/音频等系统模块

│   └── ui/             # DOM HUD 样式│   └── ui/             # DOM HUD 样式

├── scripts/            # `npm run build` / `npm run preview` 脚本├── scripts/            # `npm run build` / `npm run preview` 脚本

├── test-game.js        # Puppeteer 自动化测试├── test-game.js        # Puppeteer 自动化测试

├── manifest.json       # PWA 配置（可选）├── manifest.json       # PWA 配置（可选）

├── sw.js               # Service Worker（可选）├── sw.js               # Service Worker（可选）

└── README.md└── README.md

``````



## 🎨 特性概览## 🎨 特性概览



- ✅ 5 个逐级难度关卡，覆盖晴天 / 大风 / 雨雪天气- ✅ 5 个逐级难度关卡，覆盖晴天 / 大风 / 雨雪天气

- ✅ 乐高山字型障碍生成，难度随进度动态调整- ✅ 乐高山字型障碍生成，难度随进度动态调整

- ✅ 多语言 UI（中/英）+ HUD 显示分数、生命、进度与提示- ✅ 多语言 UI（中/英）+ HUD 显示分数、生命、进度与提示

- ✅ 本地存档，自动解锁下一关- ✅ 本地存档，自动解锁下一关

- ✅ 粒子天气效果、音效系统、响应式布局- ✅ 粒子天气效果、音效系统、响应式布局



## 🛠️ 技术栈## 🛠️ 技术栈



- Phaser 3 + Arcade Physics- Phaser 3 + Arcade Physics

- ES Modules + 原生浏览器运行- ES Modules + 原生浏览器运行

- esbuild（打包/压缩）- esbuild（打包/压缩）

- Puppeteer（自动化回归测试）- Puppeteer（自动化回归测试）

- LocalStorage（本地进度存档）- LocalStorage（本地进度存档）



## 🧩 自定义指南## 🧩 自定义指南



主要参数集中在 `src/constants.js`：主要参数集中在 `src/constants.js`：



- 关卡长度、障碍密度、天气类型、星级阈值- 关卡长度、障碍密度、天气类型、星级阈值

- 重力、推力等物理参数- 重力、推力等物理参数

- 进度条长度、音效开关等游戏规则- 进度条长度、音效开关等游戏规则



其他拓展点：其他拓展点：



- 在 `src/systems/` 内添加新的系统（如成就、商城、皮肤等）- 在 `src/systems/` 内添加新的系统（如成就、商城、皮肤等）

- 在 `src/ui/` 下扩展 DOM HUD 的样式与布局- 在 `src/ui/` 下扩展 DOM HUD 的样式与布局

- 使用 `scripts/build.mjs` 作为参考，添加更多构建步骤（如压缩图片、版本号注入）- 使用 `scripts/build.mjs` 作为参考，添加更多构建步骤（如压缩图片、版本号注入）



------



祝你玩得开心，也欢迎继续扩展这款小游戏！🎮祝你玩得开心，也欢迎继续扩展这款小游戏！🎮

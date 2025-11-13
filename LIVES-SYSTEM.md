# 生命系统更新说明

## 新增功能 ✨

### 1. 五条命系统
- 玩家现在拥有 **5 条命**
- 每次碰撞减少 1 条命
- 生命值归零才会游戏结束
- 实时显示当前生命值（❤️ × 数量）

### 2. 无敌时间
- 受伤后触发 **2 秒无敌时间**
- 无敌期间直升机会闪烁提示
- 无敌期间不会受到伤害

### 3. 看广告复活
- 生命值归零后，可以选择**看广告复活**
- 复活后获得 **1 条命**
- 复活后自动触发无敌时间
- 直升机回到屏幕中央安全位置

### 4. 广告API占位
- 当前点击"看广告复活"直接复活（用于测试）
- 代码中已预留广告API接入位置
- 后续接入抖音/微信小游戏广告API

---

## 代码修改位置

### PlayScene.js
```javascript
// 1. 添加生命系统变量
this.lives = 5;
this.maxLives = 5;
this.isInvincible = false;
this.invincibleTimer = 0;

// 2. 添加生命值UI显示
this.livesValue = this.add.text(...); // ❤️ × 5

// 3. 修改碰撞处理逻辑
onHit() {
  this.lives -= 1; // 减命
  if (this.lives <= 0) {
    // 游戏结束，显示复活选项
  } else {
    // 触发无敌时间
    this.triggerInvincible();
  }
}

// 4. 添加复活方法
revivePlayer() {
  // TODO: 这里接入抖音/微信广告API
  console.log('播放广告中...');
  this.lives = 1;
  this.triggerInvincible();
}
```

### UIScene.js
```javascript
// 添加复活按钮
if (onRevive) {
  mkBtn(cy + 180, 
    { zh: '看广告复活', en: 'Revive (Watch Ad)' }, 
    0x2ecc71, 
    () => { if (onRevive) onRevive(); }
  );
}
```

---

## 后续接入广告API

### 抖音小游戏
```javascript
// 在 revivePlayer() 中替换
tt.createRewardedVideoAd({
  adUnitId: 'your-ad-unit-id'
}).onClose((res) => {
  if (res.isEnded) {
    // 广告看完，执行复活
    this.lives = 1;
    this.isDead = false;
    this.triggerInvincible();
  }
});
```

### 微信小游戏
```javascript
// 在 revivePlayer() 中替换
wx.createRewardedVideoAd({
  adUnitId: 'your-ad-unit-id'
}).onClose((res) => {
  if (res.isEnded) {
    // 广告看完，执行复活
    this.lives = 1;
    this.isDead = false;
    this.triggerInvincible();
  }
});
```

---

## 游戏体验优化

### 视觉反馈
- ✅ 生命值低于 3 时显示红色警告
- ✅ 受伤时直升机闪烁
- ✅ 生命值实时更新显示

### 音效反馈
- ✅ 碰撞时播放撞击音效
- ✅ 复活按钮点击音效

### 难度平衡
- 5 条命让新手更容易上手
- 无敌时间避免连续受伤
- 复活机制增加游戏时长

---

## 测试方式

1. 启动游戏：`python3 -m http.server 8080`
2. 故意撞击障碍物，观察生命值减少
3. 生命值归零后，点击"看广告复活"
4. 验证复活后有 1 条命和无敌时间

---

更新日期：2025-11-11

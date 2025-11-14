const WEATHER_CONFIG = {
  windy: {
    textureKey: 'leaf',
    depth: -1,
    emitter: {
      x: { min: 720 + 40, max: 720 + 140 },
      y: { min: 220, max: 1280 - 360 },
      lifespan: 5200,
      speedX: { min: -180, max: -120 },
      speedY: { min: -40, max: 40 },
      scale: { start: 0.9, end: 0.4 },
      rotate: { min: -140, max: 140 },
      alpha: { start: 0.9, end: 0 },
      quantity: 1,
      frequency: 190
    }
  },
  rain: {
    textureKey: 'rain-drop',
    depth: -1,
    emitter: {
      x: { min: -60, max: 720 + 60 },
      y: 0,
      lifespan: 1000,
      speedX: { min: -60, max: -20 },
      speedY: { min: 520, max: 640 },
      quantity: 2,
      frequency: 120,
      alpha: { start: 0.8, end: 0 }
    }
  },
  snow: {
    textureKey: 'snow-flake',
    depth: -1,
    emitter: {
      x: { min: -60, max: 720 + 60 },
      y: -20,
      lifespan: 2400,
      speedX: { min: -40, max: -5 },
      speedY: { min: 80, max: 120 },
      scale: { start: 1.0, end: 0.4 },
      rotate: { min: -45, max: 45 },
      quantity: 2,
      frequency: 180,
      alpha: { start: 0.9, end: 0.2 }
    }
  }
};

export default class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.manager = null;
    this.emitter = null;
    this.activeType = null;
  }

  apply(weatherType) {
    if (!weatherType || this.activeType === weatherType) {
      return;
    }
    this.clear();
    const config = WEATHER_CONFIG[weatherType];
    if (!config) {
      return;
    }
    this.manager = this.scene.add.particles(0, 0, config.textureKey).setDepth(config.depth ?? -1);
    this.manager.setScrollFactor(0);
    this.emitter = this.manager.createEmitter(config.emitter);
    this.activeType = weatherType;
  }

  clear() {
    if (this.emitter) {
      this.emitter.stop();
      this.emitter = null;
    }
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
    this.activeType = null;
  }

  destroy() {
    this.clear();
  }
}

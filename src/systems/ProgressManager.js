const STORAGE_KEY = 'HELI_PROGRESS';

export default class ProgressManager {
  constructor(scene) {
    this.scene = scene;
    this.cache = this._loadFromRegistry() || this._loadFromStorage();
    this.scene.registry.set('levelProgress', this.cache);
  }

  _loadFromRegistry() {
    const cached = this.scene.registry.get('levelProgress');
    return cached && typeof cached === 'object' ? cached : null;
  }

  _loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (error) {
      console.error('读取进度失败', error);
    }
    return {};
  }

  _persist() {
    this.scene.registry.set('levelProgress', this.cache);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('保存进度失败', error);
    }
  }

  getChapterProgress(chapterId) {
    return this.cache[chapterId] || { unlockedLevels: 0 };
  }

  unlockLevel(chapterId, nextLevelIndex) {
    if (!this.cache[chapterId]) {
      this.cache[chapterId] = { unlockedLevels: 0 };
    }
    const chapterProgress = this.cache[chapterId];
    chapterProgress.unlockedLevels = Math.max(chapterProgress.unlockedLevels, nextLevelIndex);
    this._persist();
    return chapterProgress;
  }

  resetChapter(chapterId) {
    if (this.cache[chapterId]) {
      delete this.cache[chapterId];
      this._persist();
    }
  }
}

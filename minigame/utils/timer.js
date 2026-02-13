/**
 * 游戏倒计时组件 - 基于时间戳，支持丝滑动画
 * @file utils/timer.js
 */

var TIME_CONFIG = {
  wordFind:        { easy: 20, normal: 30, hard: 40 },
  charDiff:        { easy: 5, normal: 10, hard: 15, hell: 20 },  // 优化后的时间配置
  poetryConnect:   { easy: 30, normal: 45, hard: 70 },
};

/**
 * @param {number} totalSeconds 总时长（秒）
 * @param {function} onFrame  每帧回调 (remainingFloat, total)  —— 用于丝滑重绘
 * @param {function} onTimeout 时间到回调
 */
function GameTimer(totalSeconds, onFrame, onTimeout) {
  this.total = totalSeconds;
  this.remaining = totalSeconds;
  this.onFrame = onFrame || function() {};
  this.onTimeout = onTimeout || function() {};
  this._running = false;
  this._startMs = 0;
  this._rafId = null;       // requestAnimationFrame id
  this._intervalId = null;  // 兜底 setInterval id
}

GameTimer.prototype.start = function() {
  if (this._running) return;
  this._running = true;
  this._startMs = Date.now();
  var self = this;

  // 尝试用 canvas 的 requestAnimationFrame（小程序环境）
  // 如果没有，则用 setInterval 16ms 模拟
  function tick() {
    if (!self._running) return;
    var elapsed = (Date.now() - self._startMs) / 1000;
    self.remaining = Math.max(0, self.total - elapsed);
    self.onFrame(self.remaining, self.total);
    if (self.remaining <= 0) {
      self.remaining = 0;
      self.stop();
      self.onTimeout();
      return;
    }
    // 继续下一帧
    if (typeof requestAnimationFrame === 'function') {
      self._rafId = requestAnimationFrame(tick);
    }
  }

  if (typeof requestAnimationFrame === 'function') {
    this._rafId = requestAnimationFrame(tick);
  } else {
    // 兜底：16ms 间隔 ≈ 60fps
    this._intervalId = setInterval(function() {
      tick();
    }, 16);
  }
};

GameTimer.prototype.stop = function() {
  this._running = false;
  if (this._rafId != null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
  if (this._intervalId != null) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }
};

GameTimer.prototype.addTime = function(seconds) {
  // 把 startMs 往前推，等效于增加了时间
  this._startMs += seconds * 1000;
  this.remaining = Math.min(this.total, this.remaining + seconds);
};

/** 剩余整数秒（显示用） */
GameTimer.prototype.getRemainingSec = function() {
  return Math.ceil(this.remaining);
};

/** 剩余百分比 0~1 */
GameTimer.prototype.getPercent = function() {
  if (this.total <= 0) return 0;
  return this.remaining / this.total;
};

function getTimeLimit(gameId, difficulty) {
  var cfg = TIME_CONFIG[gameId];
  if (!cfg) return 30;
  // 支持 hell 难度
  if (difficulty === 'hell' && cfg.hell) return cfg.hell;
  return cfg[difficulty] || cfg.normal || 30;
}

module.exports = {
  GameTimer: GameTimer,
  getTimeLimit: getTimeLimit,
  TIME_CONFIG: TIME_CONFIG,
};

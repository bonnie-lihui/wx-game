/**
 * 按钮动效：点击缩放 + 朱砂红高光（轻量 60fps）
 * Cursor 可调试点：帧率、颜色、时长
 * @file animation/btnAnimate.js
 */

const THEME = require('../utils/canvas.js').THEME;

/** 按下缩放比例 */
const PRESS_SCALE = 0.96;
/** 动画时长(ms) */
const DURATION = 120;

/**
 * 按钮动画状态
 * @param {number} startTime - 开始时间戳
 * @param {boolean} isPress - 是否按下
 * @returns {number} 当前 scale 0~1
 */
function getButtonScale(startTime, isPress) {
  const elapsed = Date.now() - startTime;
  if (elapsed >= DURATION) return isPress ? PRESS_SCALE : 1;
  const t = elapsed / DURATION;
  const ease = t * (2 - t);
  return isPress ? 1 - (1 - PRESS_SCALE) * ease : PRESS_SCALE + (1 - PRESS_SCALE) * ease;
}

/**
 * 是否动画结束
 */
function isButtonAnimDone(startTime) {
  return Date.now() - startTime >= DURATION;
}

module.exports = {
  PRESS_SCALE,
  DURATION,
  getButtonScale,
  isButtonAnimDone,
};

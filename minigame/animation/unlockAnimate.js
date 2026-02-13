/**
 * 解锁动效：折扇展开，可调帧率/颜色（Cursor 调试点）
 * @file animation/unlockAnimate.js
 */

const { drawUnlockAnimation } = require('../gameLogic/hiddenGame.js');

const UNLOCK_DURATION = 800;

/**
 * 获取解锁动画进度 0~1
 * @param {number} startTime
 * @returns {number}
 */
function getUnlockProgress(startTime) {
  const elapsed = Date.now() - startTime;
  if (elapsed >= UNLOCK_DURATION) return 1;
  const t = elapsed / UNLOCK_DURATION;
  return t * t * (3 - 2 * t); // smoothstep
}

/**
 * 绘制解锁帧
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} startTime
 * @param {number} cx
 * @param {number} cy
 */
function drawUnlockFrame(ctx, startTime, cx, cy) {
  const progress = getUnlockProgress(startTime);
  drawUnlockAnimation(ctx, progress, cx, cy);
}

function isUnlockAnimDone(startTime) {
  return Date.now() - startTime >= UNLOCK_DURATION;
}

module.exports = {
  UNLOCK_DURATION,
  getUnlockProgress,
  drawUnlockFrame,
  isUnlockAnimDone,
};

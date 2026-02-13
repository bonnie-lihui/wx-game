/**
 * 隐藏玩法解锁：满足主题包解锁数量后激活，折扇展开+祥云动效
 * 后端：/api/user/unlockHidden 记录激活状态，返回彩蛋玩法数据
 * @file gameLogic/hiddenGame.js
 */

const { drawFan, drawCloud } = require('../utils/canvas.js');
const THEME = require('../utils/canvas.js').THEME;

/** 解锁所需最少主题包数量 */
const UNLOCK_THEME_COUNT = 2;

/**
 * 是否满足隐藏玩法解锁条件（前端判断）
 * @param {string[]} unlockedThemes - 已解锁主题 id 列表
 * @returns {boolean}
 */
function canUnlockHidden(unlockedThemes) {
  return (unlockedThemes || []).length >= UNLOCK_THEME_COUNT;
}

/**
 * 隐藏玩法：彩蛋文案与简单交互数据
 * @returns {{ name: string, hint: string, steps: string[] }}
 */
function getHiddenGameData() {
  return {
    name: '墨韵彩蛋',
    hint: '折扇轻展，祥云自来。',
    steps: ['点击折扇', '观看祥云动画', '获得彩蛋祝福'],
  };
}

/**
 * 绘制解锁动效：折扇展开 + 祥云
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} progress - 0~1 动画进度
 * @param {number} cx
 * @param {number} cy
 */
function drawUnlockAnimation(ctx, progress, cx, cy) {
  ctx.save();
  const fanRadius = 80;
  const startAngle = Math.PI * 0.5 - progress * Math.PI * 0.4;
  const endAngle = Math.PI * 0.5 + progress * Math.PI * 0.4;
  drawFan(ctx, cx, cy, fanRadius, startAngle, endAngle, THEME.zhuSha);
  const cloudScale = 1 + progress * 0.5;
  drawCloud(ctx, cx - 50, cy - 30, cloudScale, THEME.qingLan);
  drawCloud(ctx, cx + 55, cy - 20, cloudScale * 0.8, THEME.miHuang);
  ctx.restore();
}

/**
 * 古风文案（解锁成功提示）
 * @returns {string}
 */
function getUnlockTip() {
  const tips = [
    '折扇轻展，祥云自来，彩蛋已开启。',
    '墨韵轻玩，隐藏玩法已为你展开。',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

module.exports = {
  UNLOCK_THEME_COUNT,
  canUnlockHidden,
  getHiddenGameData,
  drawUnlockAnimation,
  getUnlockTip,
};

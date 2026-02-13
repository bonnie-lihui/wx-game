/**
 * 综合算分模式模板（预留扩展）
 * 适用于需要同时考量速度和准确度的游戏类型
 * 
 * 【综合评分模式】
 * 计分公式：基础分 + 时间奖励 - 错误惩罚
 * 
 * 推荐参数（方案B）：
 * - 基础分：100分
 * - 时间奖励系数：1.5分/秒
 * - 错误惩罚：8分/次
 * - 保底分：10分
 * - 满分封顶：100分
 * 
 * 设计理念：
 * - 3次错误约等于抵消15秒时间奖励
 * - 多种玩家类型（速度型/稳健型/平衡型）都能获得满分
 * - 避免极端策略（纯速度或纯准确都不是最优）
 * 
 * @file gameLogic/compositeScore.js
 */

var canvasUtils = require('../utils/canvas.js');
var THEME = canvasUtils.THEME;
var roundRect = canvasUtils.roundRect;

/**
 * 综合算分逻辑构造函数
 * @param {Object} options 配置项
 * @param {string} options.difficulty 难度等级 (easy/normal/hard)
 */
function CompositeScoreLogic(options) {
  options = options || {};
  this.difficulty = options.difficulty || 'normal';
  
  // 游戏状态
  this.isComplete = false;
  this.wrongCount = 0;       // 错误次数
  this.score = 0;
  
  // 配置参数（可根据难度调整）
  this.config = this._getConfig(this.difficulty);
  
  // TODO: 根据具体游戏类型初始化其他数据
  this.initGame();
}

/**
 * 获取难度配置
 */
CompositeScoreLogic.prototype._getConfig = function(difficulty) {
  var configs = {
    easy: {
      baseScore: 100,
      timeBonusRate: 1.5,    // 时间奖励系数
      errorPenalty: 8,       // 错误惩罚
      minScore: 10,          // 保底分
      maxScore: 100          // 满分封顶
    },
    normal: {
      baseScore: 100,
      timeBonusRate: 1.5,
      errorPenalty: 8,
      minScore: 10,
      maxScore: 100
    },
    hard: {
      baseScore: 100,
      timeBonusRate: 1.5,
      errorPenalty: 10,      // 困难模式惩罚更重
      minScore: 10,
      maxScore: 100
    }
  };
  return configs[difficulty] || configs.normal;
};

/**
 * 初始化游戏
 */
CompositeScoreLogic.prototype.initGame = function() {
  // TODO: 实现具体游戏的初始化逻辑
  console.log('[CompositeScore] 游戏初始化');
};

/**
 * 处理玩家操作
 * @param {boolean} isCorrect 操作是否正确
 * @returns {Object} 操作结果
 */
CompositeScoreLogic.prototype.handleAction = function(isCorrect) {
  if (!isCorrect) {
    this.wrongCount++;
    return { success: false, wrongCount: this.wrongCount };
  }
  
  // TODO: 实现正确操作的逻辑
  this.isComplete = true; // 示例：完成游戏
  this.score = this.calcScore(0); // 临时计算，最终分数在calcFinalScore中计算
  
  return { success: true, isComplete: this.isComplete };
};

/**
 * 计算当前分数（不含时间奖励）
 * @param {number} remainingSec 剩余秒数
 * @returns {number} 当前分数
 */
CompositeScoreLogic.prototype.calcScore = function(remainingSec) {
  var cfg = this.config;
  var baseScore = cfg.baseScore;
  var timeBonus = Math.floor((remainingSec || 0) * cfg.timeBonusRate);
  var penalty = this.wrongCount * cfg.errorPenalty;
  
  var rawScore = baseScore + timeBonus - penalty;
  var finalScore = Math.max(cfg.minScore, Math.min(cfg.maxScore, rawScore));
  
  return finalScore;
};

/**
 * 【综合评分模式】
 * 最终得分 = 基础分 + 剩余秒数×1.5 - 错误次数×8
 * 保底10分，满分封顶100分
 * 
 * @param {number} remainingSec 剩余秒数
 * @returns {number} 最终得分
 */
CompositeScoreLogic.prototype.calcFinalScore = function(remainingSec) {
  return this.calcScore(remainingSec);
};

/**
 * 获取分数详情（用于结果页展示）
 * @param {number} remainingSec 剩余秒数
 * @returns {Object} 分数详情
 */
CompositeScoreLogic.prototype.getScoreBreakdown = function(remainingSec) {
  var cfg = this.config;
  var timeBonus = Math.floor((remainingSec || 0) * cfg.timeBonusRate);
  var penalty = this.wrongCount * cfg.errorPenalty;
  var totalScore = this.calcFinalScore(remainingSec);
  
  return {
    totalScore: totalScore,
    baseScore: cfg.baseScore,
    timeBonus: timeBonus,
    penalty: penalty,
    wrongCount: this.wrongCount,
    remainingSec: remainingSec
  };
};

/**
 * 绘制游戏界面
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {number} offsetX X偏移
 * @param {number} offsetY Y偏移
 */
CompositeScoreLogic.prototype.draw = function(ctx, offsetX, offsetY) {
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);
  
  // TODO: 实现具体游戏的绘制逻辑
  ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = THEME.moHei || '#2C2416';
  ctx.fillText('综合算分游戏模板', 200, 100);
  ctx.fillText('错误次数: ' + this.wrongCount, 200, 130);
  
  ctx.restore();
};

/**
 * 导出模块
 */
module.exports = { 
  CompositeScoreLogic: CompositeScoreLogic 
};

/**
 * 综合算分模板 - 适用于需要同时考量速度和准确度的游戏
 * 【综合评分模式】v1.2
 * 公式：100 + 剩余时间×1.5 - 错误次数×8
 * @file gameLogic/compositeScoreTemplate.js
 */

/**
 * 综合算分逻辑构造函数
 * @param {Object} options 配置选项
 * @param {string} options.difficulty 难度：'easy' | 'normal' | 'hard'
 * @param {Object} options.config 自定义配置（可选）
 */
function CompositeScoreLogic(options) {
  options = options || {};
  this.difficulty = options.difficulty || 'normal';
  
  // 默认配置（方案B：基础分 + 奖惩机制）
  this.config = options.config || {
    baseScore: 100,        // 基础分
    timeBonusRate: 1.5,    // 时间奖励系数（分/秒）
    errorPenalty: 8,       // 错误惩罚（分/次）
    minScore: 10,          // 最低分（保底）
    maxScore: 100          // 最高分（封顶）
  };
  
  // 游戏状态
  this.wrongCount = 0;     // 错误次数
  this.isComplete = false; // 是否完成
  this.score = 0;          // 当前分数
}

/**
 * 记录错误操作
 */
CompositeScoreLogic.prototype.recordWrong = function() {
  this.wrongCount++;
};

/**
 * 计算最终分数
 * @param {number} remainingSec 剩余秒数
 * @param {number} totalSec 总时限秒数（可选）
 * @returns {number} 最终分数
 */
CompositeScoreLogic.prototype.calcFinalScore = function(remainingSec, totalSec) {
  var cfg = this.config;
  var baseScore = cfg.baseScore;
  var timeBonus = Math.floor((remainingSec || 0) * cfg.timeBonusRate);
  var errorPenalty = this.wrongCount * cfg.errorPenalty;
  
  var rawScore = baseScore + timeBonus - errorPenalty;
  var totalScore = Math.max(cfg.minScore, Math.min(cfg.maxScore, rawScore));
  
  this.score = totalScore;
  return totalScore;
};

/**
 * 获取分数详情（用于结果页展示）
 * @param {number} remainingSec 剩余秒数
 * @param {number} totalSec 总时限秒数
 * @returns {Object} 分数详情
 */
CompositeScoreLogic.prototype.getScoreBreakdown = function(remainingSec, totalSec) {
  var cfg = this.config;
  var timeBonus = Math.floor((remainingSec || 0) * cfg.timeBonusRate);
  var errorPenalty = this.wrongCount * cfg.errorPenalty;
  
  return {
    totalScore: this.calcFinalScore(remainingSec, totalSec),
    baseScore: cfg.baseScore,
    timeBonus: timeBonus,
    errorPenalty: errorPenalty,
    remainingSec: remainingSec,
    wrongCount: this.wrongCount
  };
};

/**
 * 难度配置示例
 * 可根据不同难度调整参数
 */
CompositeScoreLogic.DIFFICULTY_CONFIGS = {
  easy: {
    baseScore: 100,
    timeBonusRate: 2.0,    // 简单模式奖励更多时间分
    errorPenalty: 5,       // 简单模式惩罚更轻
    minScore: 10,
    maxScore: 100
  },
  normal: {
    baseScore: 100,
    timeBonusRate: 1.5,    // 标准配置
    errorPenalty: 8,
    minScore: 10,
    maxScore: 100
  },
  hard: {
    baseScore: 100,
    timeBonusRate: 1.0,    // 困难模式奖励更少
    errorPenalty: 10,      // 困难模式惩罚更重
    minScore: 10,
    maxScore: 100
  }
};

/**
 * 使用示例
 * 
 * // 创建逻辑实例
 * var logic = new CompositeScoreLogic({
 *   difficulty: 'normal'
 * });
 * 
 * // 或使用自定义配置
 * var logic = new CompositeScoreLogic({
 *   difficulty: 'hard',
 *   config: CompositeScoreLogic.DIFFICULTY_CONFIGS.hard
 * });
 * 
 * // 游戏过程中记录错误
 * logic.recordWrong();
 * 
 * // 游戏结束时计算分数
 * var score = logic.calcFinalScore(remainingSec, totalSec);
 * 
 * // 获取分数详情用于结果页展示
 * var breakdown = logic.getScoreBreakdown(remainingSec, totalSec);
 * console.log('总分:', breakdown.totalScore);
 * console.log('基础分:', breakdown.baseScore);
 * console.log('时间奖励:', breakdown.timeBonus);
 * console.log('错误惩罚:', breakdown.errorPenalty);
 */

module.exports = { 
  CompositeScoreLogic: CompositeScoreLogic 
};

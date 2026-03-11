/**
 * 综合算分模板（预留扩展）
 *
 * 计分公式：基础分 + 时间奖励 - 错误惩罚
 * 保底 10 分，满分 100 分
 */

function CompositeScoreLogic(options) {
  options = options || {}
  this.difficulty = options.difficulty || 'normal'
  this.isComplete = false
  this.wrongCount = 0
  this.score = 0
  this.config = this._getConfig(this.difficulty)
}

CompositeScoreLogic.prototype._getConfig = function (difficulty) {
  var configs = {
    easy:   { baseScore: 100, timeBonusRate: 1.5, errorPenalty: 8,  minScore: 10, maxScore: 100 },
    normal: { baseScore: 100, timeBonusRate: 1.5, errorPenalty: 8,  minScore: 10, maxScore: 100 },
    hard:   { baseScore: 100, timeBonusRate: 1.5, errorPenalty: 10, minScore: 10, maxScore: 100 },
  }
  return configs[difficulty] || configs.normal
}

CompositeScoreLogic.prototype.calcScore = function (remainingSec) {
  var cfg = this.config
  var timeBonus = Math.floor((remainingSec || 0) * cfg.timeBonusRate)
  var penalty = this.wrongCount * cfg.errorPenalty
  return Math.max(cfg.minScore, Math.min(cfg.maxScore, cfg.baseScore + timeBonus - penalty))
}

CompositeScoreLogic.prototype.calcFinalScore = function (remainingSec) {
  return this.calcScore(remainingSec)
}

CompositeScoreLogic.prototype.getScoreBreakdown = function (remainingSec) {
  var cfg = this.config
  return {
    totalScore: this.calcFinalScore(remainingSec),
    baseScore: cfg.baseScore,
    timeBonus: Math.floor((remainingSec || 0) * cfg.timeBonusRate),
    penalty: this.wrongCount * cfg.errorPenalty,
    wrongCount: this.wrongCount,
    remainingSec: remainingSec,
  }
}

module.exports = { CompositeScoreLogic: CompositeScoreLogic }

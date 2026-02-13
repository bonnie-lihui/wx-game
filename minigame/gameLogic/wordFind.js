/**
 * 国风找成语：水墨成语矩阵，点击拼字
 * 难度：简单(4x4=16字) / 一般(5x5=25字) / 困难(5x7=35字)
 * @file gameLogic/wordFind.js
 */

var canvasUtils = require('../utils/canvas.js');
var THEME = canvasUtils.THEME;
var roundRect = canvasUtils.roundRect;

var CELL_GAP = 6;

// 难度配置
var DIFFICULTY_CONFIG = {
  easy:   { cols: 4, rows: 4, cellSize: 72 },   // 16 字
  normal: { cols: 5, rows: 5, cellSize: 64 },   // 25 字
  hard:   { cols: 5, rows: 7, cellSize: 52 },   // 35 字
};

// 纯中文干扰字池
var FILLER_POOL = '风云雨雷电山河湖海川日月星辰天地人和春秋冬夏东西南北金木水火土梅兰竹菊松柏桃李花鸟鱼虫龙凤鹤鹿琴棋书画诗词歌赋仁义礼智信忠孝勇勤俭'.split('');

function WordFindLogic(options) {
  options = options || {};
  this.answer = options.answer || '';
  this.difficulty = options.difficulty || 'easy';
  var cfg = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.easy;
  this.cols = cfg.cols;
  this.rows = cfg.rows;
  this.cellSize = cfg.cellSize;
  this.matrix = [];
  this.selected = [];
  this.cells = [];
  this.isComplete = false;
  this.score = 0;
  this.attempts = 0;
  this.wrongCount = 0;  // 新增：记录错误点击次数
  this.initMatrix();
}

WordFindLogic.prototype.initMatrix = function() {
  var chars = this.answer.split('');
  var pool = FILLER_POOL.filter(function(c) { return chars.indexOf(c) < 0; });
  var flat = chars.slice();
  var total = this.cols * this.rows;
  while (flat.length < total) {
    flat.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  // 洗牌
  for (var i = flat.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = flat[i]; flat[i] = flat[j]; flat[j] = tmp;
  }
  this.matrix = [];
  this.cells = [];
  for (var r = 0; r < this.rows; r++) {
    var row = [];
    for (var c = 0; c < this.cols; c++) {
      var idx = r * this.cols + c;
      var ch = flat[idx];
      row.push(ch);
      this.cells.push({
        row: r, col: c,
        x: c * (this.cellSize + CELL_GAP),
        y: r * (this.cellSize + CELL_GAP),
        char: ch,
      });
    }
    this.matrix.push(row);
  }
};

WordFindLogic.prototype.tapCell = function(row, col) {
  var self = this;
  var cell = null;
  for (var i = 0; i < this.cells.length; i++) {
    if (this.cells[i].row === row && this.cells[i].col === col) { cell = this.cells[i]; break; }
  }
  if (!cell) return { success: false };
  // 已选中则取消
  var existIdx = -1;
  for (var k = 0; k < this.selected.length; k++) {
    if (this.selected[k].row === row && this.selected[k].col === col) { existIdx = k; break; }
  }
  if (existIdx >= 0) {
    this.selected.splice(existIdx, 1);
    return { success: true, isComplete: false };
  }
  if (this.selected.length >= 4) return { success: false };
  this.selected.push({ row: cell.row, col: cell.col, char: cell.char });
  this.attempts++;
  var str = '';
  for (var m = 0; m < this.selected.length; m++) str += this.selected[m].char;
  this.isComplete = str === this.answer;
  
  // 判断是否选满4个字
  var isFull = this.selected.length === 4;
  var isCorrect = this.isComplete;
  
  // 选满4个字但答案错误时，记录为错误（新增）
  if (isFull && !isCorrect) {
    this.wrongCount++;
  }
  
  if (this.isComplete) {
    this.score = Math.max(10, 100 - (this.attempts - this.answer.length) * 10);
  }
  
  return { 
    success: true, 
    isComplete: this.isComplete,
    isFull: isFull,      // 是否选满4个字
    isCorrect: isCorrect // 是否正确
  };
};

/**
 * 【速度导向模式 + 耗时惩罚 + 错误惩罚】v1.2（优化版）
 * 公式：100 + 剩余时间×1.2 - 已用时间×1.0 - 错误次数×8
 * 满分封顶100分，保底10分
 * @param {number} remainingSec 剩余秒数
 * @param {number} totalSec 总时限秒数
 * @returns {number} 最终分数
 */
WordFindLogic.prototype.calcFinalScore = function(remainingSec, totalSec) {
  var baseScore = 100;
  var elapsedSec = (totalSec || 0) - (remainingSec || 0);  // 计算已用时间
  
  var timeBonus = Math.floor((remainingSec || 0) * 1.2);   // 剩余时间奖励（降低：2→1.2）
  var timePenalty = Math.floor(elapsedSec * 1.0);          // 耗时惩罚（提高：0.5→1.0）
  var errorPenalty = this.wrongCount * 8;                  // 错误惩罚（提高：3→8）
  
  var rawScore = baseScore + timeBonus - timePenalty - errorPenalty;
  var totalScore = Math.max(10, Math.min(100, rawScore));
  
  return totalScore;
};

/**
 * 获取分数详情（用于结果页展示）
 * @param {number} remainingSec 剩余秒数
 * @param {number} totalSec 总时限秒数
 */
WordFindLogic.prototype.getScoreBreakdown = function(remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0);
  var timeBonus = Math.floor((remainingSec || 0) * 1.2);
  var timePenalty = Math.floor(elapsedSec * 1.0);
  var errorPenalty = this.wrongCount * 8;
  
  return {
    totalScore: this.calcFinalScore(remainingSec, totalSec),
    baseScore: 100,
    timeBonus: timeBonus,
    timePenalty: timePenalty,
    errorPenalty: errorPenalty,
    elapsedSec: elapsedSec,
    remainingSec: remainingSec,
    wrongCount: this.wrongCount
  };
};

WordFindLogic.prototype.draw = function(ctx, offsetX, offsetY) {
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  var cs = this.cellSize;
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 已选中字的拼接预览
  if (this.selected.length > 0) {
    var previewY = -42;
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var str = '';
    for (var s = 0; s < this.selected.length; s++) str += this.selected[s].char;
    var totalW = this.cols * cs + (this.cols - 1) * CELL_GAP;
    roundRect(ctx, 0, previewY - 16, totalW, 32, 6);
    ctx.fillStyle = 'rgba(200, 37, 6, 0.08)';
    ctx.fill();
    ctx.fillStyle = THEME.zhuSha;
    ctx.fillText('已选：' + str, totalW / 2, previewY);
  }

  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i];
    var x = cell.x;
    var y = cell.y;
    var cx = x + cs / 2;
    var cy = y + cs / 2;
    var selIdx = -1;
    for (var k = 0; k < this.selected.length; k++) {
      if (this.selected[k].row === cell.row && this.selected[k].col === cell.col) { selIdx = k; break; }
    }
    var selected = selIdx >= 0;

    ctx.save();
    if (!selected) {
      ctx.shadowColor = 'rgba(35, 35, 35, 0.1)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
    }
    roundRect(ctx, x, y, cs, cs, 10);
    if (selected) {
      var g = ctx.createLinearGradient(x, y, x, y + cs);
      g.addColorStop(0, '#E63322');
      g.addColorStop(1, THEME.zhuSha);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#FFFBF5';
    }
    ctx.fill();
    ctx.restore();

    // 边框
    roundRect(ctx, x, y, cs, cs, 10);
    ctx.strokeStyle = selected ? THEME.zhuSha : (THEME.danJin || '#D4A84B');
    ctx.lineWidth = selected ? 2 : 1;
    ctx.stroke();

    // 序号标记
    if (selected) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + cs - 8, y + 8, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF8EE';
      ctx.fill();
      ctx.fillStyle = THEME.zhuSha;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(selIdx + 1), x + cs - 8, y + 8);
      ctx.restore();
    }

    // 汉字 - 根据格子大小调整字号
    var fontSize = cs > 60 ? 32 : (cs > 48 ? 26 : 22);
    ctx.font = selected
      ? ('bold ' + (fontSize + 2) + 'px "PingFang SC", "Microsoft YaHei", serif')
      : (fontSize + 'px "PingFang SC", "Microsoft YaHei", serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = selected ? '#FFF8EE' : THEME.moHei;
    ctx.fillText(cell.char, cx, cy);
  }
  ctx.restore();
};

WordFindLogic.prototype.getCellByPoint = function(x, y) {
  var cs = this.cellSize;
  // 修复：点击判定只判断格子本身，不包含间隙
  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i];
    // 判定时使用格子实际可点击区域（不含 gap）
    var clickX = cell.x;
    var clickY = cell.y;
    var clickW = cs; // 只判定格子本身的大小
    var clickH = cs;
    
    if (x >= clickX && x <= clickX + clickW && y >= clickY && y <= clickY + clickH) {
      console.log('[WordFind] 点击命中:', { 
        cell: cell.char, 
        row: cell.row, 
        col: cell.col,
        cellBounds: { x: clickX, y: clickY, w: clickW, h: clickH },
        clickPoint: { x, y }
      });
      return { row: cell.row, col: cell.col };
    }
  }
  console.log('[WordFind] 点击未命中任何格子:', { x, y });
  return null;
};

module.exports = { WordFindLogic: WordFindLogic };

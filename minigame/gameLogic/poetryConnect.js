/**
 * 诗词连线：左侧上句、右侧下句，连线配对
 * 难度：简单(3组) / 一般(5组) / 困难(8组)
 * @file gameLogic/poetryConnect.js
 */

var canvasUtils = require('../utils/canvas.js');
var THEME = canvasUtils.THEME;
var roundRect = canvasUtils.roundRect;

var ITEM_GAP = 8;
var COL_GAP = 24;

function PoetryConnectLogic(options) {
  options = options || {};
  this.difficulty = options.difficulty || 'easy';
  
  // ⚠️ 必须从后端传入 items 和 pairs，不再使用本地默认数据
  this.items = options.items || null;
  this.pairs = options.pairs || null;
  
  if (!this.items || !this.pairs) {
    console.error('[PoetryConnectLogic] 缺少必要参数：items 或 pairs');
    throw new Error('PoetryConnectLogic: 缺少必要的题目数据 (items, pairs)');
  }
  
  this.connections = [];
  this.selectedId = null;
  this.isComplete = false;
  this.score = 0;
  this.wrongCount = 0;

  this._buildPositions();
}

PoetryConnectLogic.prototype._buildPositions = function() {
  var upper = [];
  var lower = [];
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i].type === 'upper') upper.push(this.items[i]);
    else lower.push(this.items[i]);
  }
  // 打乱下句
  for (var j = lower.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = lower[j]; lower[j] = lower[k]; lower[k] = tmp;
  }
  // 根据组数调整尺寸
  var count = upper.length;
  var itemH = count <= 3 ? 48 : (count <= 5 ? 40 : 34);
  var colW = count <= 3 ? 160 : (count <= 5 ? 150 : 130);
  var gap = count <= 5 ? ITEM_GAP : 6;
  this._itemH = itemH;
  this._colW = colW;
  this._itemGap = gap;

  var y = 0;
  for (var a = 0; a < upper.length; a++) {
    upper[a].x = 0;
    upper[a].y = y;
    upper[a].width = colW;
    upper[a].height = itemH;
    y += itemH + gap;
  }
  y = 0;
  for (var b = 0; b < lower.length; b++) {
    lower[b].x = colW + COL_GAP;
    lower[b].y = y;
    lower[b].width = colW;
    lower[b].height = itemH;
    y += itemH + gap;
  }
};

PoetryConnectLogic.prototype.getItemByPoint = function(x, y) {
  for (var i = 0; i < this.items.length; i++) {
    var it = this.items[i];
    if (x >= it.x && x <= it.x + it.width && y >= it.y && y <= it.y + it.height) {
      return it;
    }
  }
  return null;
};

PoetryConnectLogic.prototype.tapItem = function(id) {
  // 已连线不能再选
  for (var ci = 0; ci < this.connections.length; ci++) {
    if (this.connections[ci].fromId === id || this.connections[ci].toId === id) {
      return { action: 'already' };
    }
  }
  if (this.selectedId === null) {
    this.selectedId = id;
    return { action: 'select' };
  }
  if (this.selectedId === id) {
    this.selectedId = null;
    return { action: 'clear' };
  }
  var fromId = this.selectedId;
  this.selectedId = null;
  var valid = false;
  for (var pi = 0; pi < this.pairs.length; pi++) {
    var a = this.pairs[pi][0], b = this.pairs[pi][1];
    if ((a === fromId && b === id) || (a === id && b === fromId)) { valid = true; break; }
  }
  if (valid) {
    this.connections.push({ fromId: fromId, toId: id });
    var upperCount = 0;
    for (var ui = 0; ui < this.items.length; ui++) {
      if (this.items[ui].type === 'upper') upperCount++;
    }
    this.isComplete = this.connections.length >= upperCount;
    // 注意：分数计算需要在外部传入 elapsedSec，这里不再计算
    // this.score 将在游戏页面调用 calcScore 时更新
    return { action: 'connect', isComplete: this.isComplete };
  }
  this.wrongCount++;
  return { action: 'wrong' };
};

/**
 * 【准确度导向模式 + 耗时惩罚】v1.2
 * 公式：100 - 已用时间×0.6 - 错误连线次数×10
 * 保底10分，无时间奖励
 * @param {number} elapsedSec 已用时间（秒）
 */
PoetryConnectLogic.prototype.calcScore = function(elapsedSec) {
  var baseScore = 100;
  var timePenalty = Math.floor((elapsedSec || 0) * 0.6);  // 耗时惩罚（新增）
  var errorPenalty = this.wrongCount * 10;
  
  var rawScore = baseScore - timePenalty - errorPenalty;
  return Math.max(10, rawScore);
};

/**
 * 最终得分（准确度导向 + 耗时惩罚）
 * @param {number} remainingSec 剩余秒数
 * @param {number} totalSec 总时限秒数
 */
PoetryConnectLogic.prototype.calcFinalScore = function(remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0);
  return this.calcScore(elapsedSec);
};

/**
 * 获取分数详情（用于结果页展示）
 * @param {number} remainingSec 剩余秒数
 * @param {number} totalSec 总时限秒数
 */
PoetryConnectLogic.prototype.getScoreBreakdown = function(remainingSec, totalSec) {
  var elapsedSec = (totalSec || 0) - (remainingSec || 0);
  var timePenalty = Math.floor(elapsedSec * 0.6);
  var errorPenalty = this.wrongCount * 10;
  
  return {
    totalScore: this.calcScore(elapsedSec),
    baseScore: 100,
    timePenalty: timePenalty,
    errorPenalty: errorPenalty,
    elapsedSec: elapsedSec,
    wrongCount: this.wrongCount
  };
};

PoetryConnectLogic.prototype.draw = function(ctx, offsetX, offsetY) {
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  var colW = this._colW;
  var itemH = this._itemH;
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 提示
  var totalW = colW * 2 + COL_GAP;
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = THEME.nuanHui || '#B8A48C';
  ctx.fillText('点击上句再点击对应下句完成连线', totalW / 2, -14);

  // 连线
  var connColors = [THEME.zhuSha, THEME.qingLan || '#1E6F9F', '#2E7D32', '#6A1B9A', '#F57C00', '#00838F', '#AD1457', '#4E342E'];
  for (var ci = 0; ci < this.connections.length; ci++) {
    var conn = this.connections[ci];
    var from = null, to = null;
    for (var fi = 0; fi < this.items.length; fi++) {
      if (this.items[fi].id === conn.fromId) from = this.items[fi];
      if (this.items[fi].id === conn.toId) to = this.items[fi];
    }
    if (from && to) {
      ctx.save();
      ctx.beginPath();
      var fx = from.x + from.width;
      var fy = from.y + from.height / 2;
      var tx = to.x;
      var ty = to.y + to.height / 2;
      ctx.moveTo(fx, fy);
      ctx.bezierCurveTo(fx + COL_GAP * 0.6, fy, tx - COL_GAP * 0.6, ty, tx, ty);
      ctx.strokeStyle = connColors[ci % connColors.length];
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 卡片
  var baseFontSize = itemH > 40 ? 15 : (itemH > 34 ? 13 : 11);
  for (var idx = 0; idx < this.items.length; idx++) {
    var it = this.items[idx];
    var isSel = this.selectedId === it.id;
    var isConn = false;
    for (var cci = 0; cci < this.connections.length; cci++) {
      if (this.connections[cci].fromId === it.id || this.connections[cci].toId === it.id) {
        isConn = true; break;
      }
    }

    ctx.save();
    ctx.shadowColor = 'rgba(35,35,35,0.08)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    roundRect(ctx, it.x, it.y, it.width, it.height, 8);
    if (isSel) {
      ctx.fillStyle = 'rgba(200,37,6,0.1)';
    } else if (isConn) {
      ctx.fillStyle = '#F0F7F0';
    } else {
      ctx.fillStyle = '#FFFBF5';
    }
    ctx.fill();
    ctx.restore();

    roundRect(ctx, it.x, it.y, it.width, it.height, 8);
    ctx.strokeStyle = isSel ? THEME.zhuSha : isConn ? '#4CAF50' : (THEME.danJin || '#D4A84B');
    ctx.lineWidth = isSel ? 2 : 1;
    ctx.stroke();

    // ✅ 根据文本长度自适应字体大小
    var textLen = it.text.length;
    var fontSize = baseFontSize;
    var maxWidth = it.width - 16; // 左右各留8px边距
    
    // 根据文本长度调整字体大小
    if (textLen > 10) {
      fontSize = Math.max(baseFontSize - 3, 10); // 长文本缩小字体
    } else if (textLen > 7) {
      fontSize = Math.max(baseFontSize - 2, 11);
    } else if (textLen > 5) {
      fontSize = Math.max(baseFontSize - 1, 12);
    }
    
    ctx.font = fontSize + 'px "PingFang SC", "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isConn ? '#4CAF50' : THEME.moHei;
    
    // 测量文本宽度，如果超出则继续缩小字体
    var textWidth = ctx.measureText(it.text).width;
    var attempts = 0;
    while (textWidth > maxWidth && fontSize > 9 && attempts < 5) {
      fontSize -= 1;
      ctx.font = fontSize + 'px "PingFang SC", "Microsoft YaHei", serif';
      textWidth = ctx.measureText(it.text).width;
      attempts++;
    }
    
    ctx.fillText(it.text, it.x + it.width / 2, it.y + it.height / 2);

    if (isConn) {
      ctx.save();
      ctx.beginPath();
      var markX = it.type === 'upper' ? it.x + it.width - 10 : it.x + 10;
      ctx.arc(markX, it.y + 10, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', markX, it.y + 10);
      ctx.restore();
    }
  }
  ctx.restore();
};

module.exports = { PoetryConnectLogic: PoetryConnectLogic };

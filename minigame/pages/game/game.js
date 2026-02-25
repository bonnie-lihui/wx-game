/**
 * 玩法页：根据 gameId 加载对应玩法，顶部标题+关卡，中部玩法区，底部操作按钮
 * @file pages/game/game.js
 */

var getGameModule = require('../../game.js');
var getGame = getGameModule.getGame;
var canvasUtils = require('../../utils/canvas.js');
var drawButton = canvasUtils.drawButton;
var drawInkBg = canvasUtils.drawInkBg;
var drawDivider = canvasUtils.drawDivider;
var THEME = canvasUtils.THEME;
var roundRect = canvasUtils.roundRect;
var api = require('../../utils/api.js');
var share = require('../../utils/share.js');
var WordFindLogic = require('../../gameLogic/wordFind.js').WordFindLogic;
var CharDiffLogic = require('../../gameLogic/charDiff.js').CharDiffLogic;
var PoetryConnectLogic = require('../../gameLogic/poetryConnect.js').PoetryConnectLogic;
var timerModule = require('../../utils/timer.js');
var GameTimer = timerModule.GameTimer;
var getTimeLimit = timerModule.getTimeLimit;

const GAME_NAMES = {
  wordFind: '国风找成语',
  charDiff: '汉字找不同',
  poetryConnect: '诗词连线',
  // numberEliminate 已移除
};

Page({
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  gameId: '',
  level: 1,
  logic: null,
  levelData: null,
  answer: '',
  canvasReady: false,
  dataReady: false,
  hintUsed: false,
  timer: null,
  timerRemaining: 0,
  timerTotal: 0,
  difficulty: 'easy',
  customTimeLimit: null,  // ✅ 后端返回的自定义时间（诗词连线使用）
  gameState: 'ready',  // 游戏状态：'ready'(准备) | 'playing'(进行中) | 'finished'(结束)

  onShareAppMessage() {
    return share.getShareAppMessageConfig();
  },

  onShareTimeline() {
    return share.getShareTimelineConfig();
  },

  onLoad(options) {
    console.log('[Game] onLoad', options);
    this.gameId = options.gameId || 'wordFind';
    this.level = parseInt(options.level, 10) || 1;
    // 检查是否需要重置进度（URL 参数 reset=1）
    this.resetProgress = options.reset === '1';
    // 检查是否需要自动开始（从结果页点击"下一关"进入）
    this.autoStart = options.autoStart === '1';
    
    if (this.resetProgress) {
      console.log('[Game] ⚠️  将重置游戏进度，从第一关开始');
    }
  },

  onReady() {
    console.log('[Game] onReady');
    this.initCanvas();
    this.loadLevelAndStart();
  },

  initCanvas() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#gameCanvas').fields({ node: true, size: true }).exec((res) => {
      console.log('[Game] Canvas exec', res ? { hasFirst: !!res[0], width: res[0] && res[0].width, height: res[0] && res[0].height } : 'null');
      if (!res || !res[0]) {
        console.warn('[Game] Canvas 节点未找到');
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('[Game] getContext 2d 失败');
        return;
      }
      const sys = wx.getSystemInfoSync();
      const dpr = sys.pixelRatio || 2;
      let width = res[0].width;
      let height = res[0].height;
      if (!width || !height) {
        width = sys.windowWidth || 375;
        height = sys.windowHeight || 667;
      }
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      this.canvas = canvas;
      this.ctx = ctx;
      this.width = width;
      this.height = height;
      this.dpr = dpr;
      this.canvasReady = true;
      console.log('[Game] Canvas 就绪', { width, height, dpr });
      this.tryDraw();
    });
  },

  loadLevelAndStart() {
    console.log('[Game] loadLevelAndStart', this.gameId, 'level:', this.level, 'autoStart:', this.autoStart);
    // 获取 openid（从全局或本地存储）
    const app = getApp();
    const openid = (app.globalData && app.globalData.openid) || wx.getStorageSync('openid') || 'guest';
    
    // ✅ 根据关卡数计算难度
    const difficulty = this.getDifficulty(this.level);
    console.log('[Game] 📊 关卡', this.level, '→ 难度', difficulty);
    
    // 🎯 检查是否需要重置进度（URL 参数 reset=1）
    const resetProgress = this.resetProgress || false;
    
    // 传递正确的 difficulty 和 level 给后端
    api.getLevelData(this.gameId, difficulty, this.level, openid, null, resetProgress).then((res) => {
      console.log('[Game] 接口返回', res);
      this.levelData = res.levelData || {};
      this.answer = res.answer || '';
      
      // 从返回的数据中获取实际的难度
      this.difficulty = res.difficulty || 'normal';
      console.log('[Game] 后端返回难度:', this.difficulty);
      
      // ✅ 如果后端返回了时间限制，使用后端的；否则使用前端配置
      if (res.timeLimit) {
        this.customTimeLimit = res.timeLimit;
        console.log('[Game] 使用后端时间:', res.timeLimit, '秒');
      } else {
        this.customTimeLimit = null;
        console.log('[Game] 使用前端默认时间');
      }
      
      this.dataReady = true;
      this.createLogic();
      
      // 如果是自动开始（从下一关进入），直接启动游戏
      if (this.autoStart) {
        this.gameState = 'playing';
        var totalSec = this.customTimeLimit || getTimeLimit(this.gameId, this.difficulty);
        this.timerTotal = totalSec;
        this.timerRemaining = totalSec;
        this.startTimer();
      }
      
      this.tryDraw();
    }).catch((err) => {
      console.error('[Game] 接口失败，无法获取题目数据', err);
      // 不再使用本地题库，显示错误提示
      wx.showModal({
        title: '加载失败',
        content: '无法获取关卡数据，请检查网络连接后重试',
        showCancel: true,
        cancelText: '返回',
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            // 重试
            this.loadLevelAndStart();
          } else {
            // 返回首页
            wx.navigateBack();
          }
        }
      });
    });
  },

  /** 根据关卡数确定难度 */
  getDifficulty(level) {
    if (level >= 1 && level <= 3) return 'easy';      // 1-3关：简单 (3x3)
    if (level >= 4 && level <= 6) return 'normal';    // 4-6关：一般 (4x4)
    if (level >= 7 && level <= 10) return 'hard';     // 7-10关：困难 (5x5)
    return 'hell';                                     // 11+关：地狱 (5x8)
  },

  /** 只有 canvas 和数据都准备好了才绘制 */
  tryDraw() {
    if (this.canvasReady && this.dataReady) {
      console.log('[Game] tryDraw 执行');
      this.draw();
    }
  },

  createLogic() {
    const data = this.levelData || {};
    const answer = this.answer;
    console.log('[Game] createLogic', this.gameId, { dataKeys: Object.keys(data), answer });

    switch (this.gameId) {
      case 'wordFind':
        // 使用后端返回的答案，如果没有则使用默认值
        const wordAnswer = answer || '国泰民安';
        this.logic = new WordFindLogic({ answer: wordAnswer, difficulty: this.difficulty });
        break;
      case 'charDiff':
        this.logic = new CharDiffLogic({
          matrix: data.matrix || undefined,
          diffAt: data.diffAt || (data.diffRow != null ? { row: data.diffRow, col: data.diffCol } : undefined),
          base: data.base,
          diff: data.diff,
          difficulty: this.difficulty,
        });
        break;
      case 'poetryConnect':
        this.logic = new PoetryConnectLogic({
          items: data.items || undefined,
          pairs: data.pairs || undefined,
          difficulty: this.difficulty,
        });
        break;
      // numberEliminate case 已移除
      default:
        this.logic = new WordFindLogic({ answer: answer || '国泰民安' });
    }
    console.log('[Game] logic 创建完成', this.logic ? '有 draw: ' + !!this.logic.draw : 'null');
  },

  /** 启动倒计时 */
  startTimer() {
    if (this.timer) { this.timer.stop(); }
    // ✅ 优先使用后端返回的时间，否则使用前端默认配置
    var totalSec = this.customTimeLimit || getTimeLimit(this.gameId, this.difficulty);
    this.timerTotal = totalSec;
    this.timerRemaining = totalSec;
    this._lastDrawnSec = totalSec; // 上次完整重绘时的整数秒
    var self = this;
    this.timer = new GameTimer(totalSec, function(remainingFloat) {
      self.timerRemaining = remainingFloat;
      var curSec = Math.ceil(remainingFloat);
      // 每秒变化时完整重绘（更新秒数文字）；其余帧只重绘进度条区域
      if (curSec !== self._lastDrawnSec) {
        self._lastDrawnSec = curSec;
        self.draw();
      } else {
        self._drawTimerBar();
      }
    }, function() {
      self.timerRemaining = 0;
      self.draw();
      // 时间到，直接跳转结果页
      setTimeout(function() {
        self.goResult(false);
      }, 100);
    });
    this.timer.start();
  },

  /** 停止倒计时 */
  stopTimer() {
    if (this.timer) {
      this.timer.stop();
    }
  },

  /** 只重绘进度条（不碰秒数文字，避免闪烁） */
  _drawTimerBar() {
    var ctx = this.ctx;
    if (!ctx || !this.timer || this.timerTotal <= 0) return;
    var w = this.width;
    var titleBarH = 44;
    var barY = titleBarH + 4;
    var barH = 6;
    var barX = 16;
    var barW = w - 32;
    var pct = this.timerRemaining / this.timerTotal;
    if (pct < 0) pct = 0;
    var color = pct > 0.5 ? '#4CAF50' : (pct > 0.3 ? '#FF9800' : '#E53935');

    ctx.save();
    // 仅覆盖进度条区域（不包含下方秒数文字）
    ctx.fillStyle = '#F5E9D6';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // 背景条
    roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fill();
    // 进度
    if (pct > 0) {
      roundRect(ctx, barX, barY, barW * pct, barH, 3);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
  },

  onUnload() {
    this.stopTimer();
  },

  draw() {
    const ctx = this.ctx;
    if (!ctx) {
      console.warn('[Game] draw() 无 ctx');
      return;
    }
    const w = this.width;
    const h = this.height;
    console.log('[Game] draw()', { w, h, gameId: this.gameId, hasLogic: !!this.logic, gameState: this.gameState });

    drawInkBg(ctx, w, h);

    // ---- 标题区（紧凑居中） ----
    const gameName = GAME_NAMES[this.gameId] || this.gameId;
    const GAME_ICONS = {
      wordFind: '📜', charDiff: '🔍', poetryConnect: '🖌️',
      // numberEliminate 已移除
    };
    const icon = GAME_ICONS[this.gameId] || '🎮';
    const titleBarH = 44;

    ctx.save();
    ctx.font = '18px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, w / 2 - 56, titleBarH / 2);

    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = THEME.moHei;
    ctx.fillText(gameName, w / 2 + 4, titleBarH / 2);

    // 关卡药丸
    const lvText = '第' + this.level + '关';
    const lvW = 50;
    roundRect(ctx, w - lvW - 12, (titleBarH - 22) / 2, lvW, 22, 11);
    ctx.fillStyle = 'rgba(200, 37, 6, 0.08)';
    ctx.fill();
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = THEME.zhuSha;
    ctx.fillText(lvText, w - lvW / 2 - 12, titleBarH / 2);

    drawDivider(ctx, 16, titleBarH, w - 32);
    ctx.restore();

    // ==== 如果是准备状态，显示开始按钮和计分规则 ====
    if (this.gameState === 'ready') {
      this.drawReadyScreen(ctx, w, h, titleBarH);
      return;
    }

    // ---- 倒计时进度条 ----
    var timerBarY = titleBarH + 4;
    var timerBarH = 6;
    var timerBarX = 16;
    var timerBarW = w - 32;
    if (this.timer && this.timerTotal > 0) {
      var pct = this.timerRemaining / this.timerTotal;
      if (pct < 0) pct = 0;
      var timerColor = pct > 0.5 ? '#4CAF50' : (pct > 0.3 ? '#FF9800' : '#E53935');
      // 背景
      ctx.save();
      roundRect(ctx, timerBarX, timerBarY, timerBarW, timerBarH, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fill();
      // 进度
      if (pct > 0) {
        roundRect(ctx, timerBarX, timerBarY, timerBarW * pct, timerBarH, 3);
        ctx.fillStyle = timerColor;
        ctx.fill();
      }
      // 剩余秒数（右侧小字）
      ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = timerColor;
      var secText = Math.ceil(this.timerRemaining) + 's';
      // 最后 5 秒文字放大+闪烁
      if (this.timerRemaining <= 5 && this.timerRemaining > 0) {
        ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
      }
      ctx.fillText(secText, w - 16, timerBarY + timerBarH + 12);
      ctx.restore();
    }

    // ---- 玩法区域（紧贴标题下方，水平居中） ----
    var areaTop = titleBarH + 28;
    const availW = w - 24;

    // 根据玩法实际内容尺寸动态计算
    var nativeW = 390, nativeH = 312;
    if (this.logic) {
      if (this.gameId === 'wordFind' && this.logic.cols) {
        nativeW = this.logic.cols * (this.logic.cellSize + 6) - 6;
        nativeH = this.logic.rows * (this.logic.cellSize + 6) - 6;
      } else if (this.gameId === 'charDiff' && this.logic.cols) {
        nativeW = this.logic.cols * (this.logic.cellSize + 4) - 4;
        nativeH = this.logic.rows * (this.logic.cellSize + 4) - 4;
      } else if (this.gameId === 'poetryConnect' && this.logic._colW) {
        nativeW = this.logic._colW * 2 + 24;
        var upperCount = 0;
        for (var ui = 0; ui < (this.logic.items || []).length; ui++) {
          if (this.logic.items[ui].type === 'upper') upperCount++;
        }
        nativeH = upperCount * (this.logic._itemH + (this.logic._itemGap || 8)) - (this.logic._itemGap || 8);
      }
    }

    let contentBottomY = areaTop; // 记录内容底部 y，按钮紧跟其后

    if (this.logic && typeof this.logic.draw === 'function') {
      ctx.save();
      const extraTop = this.gameId === 'wordFind' ? 50 : (this.gameId === 'charDiff' || this.gameId === 'poetryConnect' ? 40 : 24);
      const totalNativeH = nativeH + extraTop;
      const maxH = h - areaTop - 80; // 留 80 给按钮
      const scale = Math.min(availW / nativeW, maxH / totalNativeH, 1.15);
      const scaledW = nativeW * scale;
      const cx = (w - scaledW) / 2;
      const cy = areaTop + extraTop * scale;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      this.logic.draw(ctx, 0, 0);
      ctx.restore();
      contentBottomY = cy + nativeH * scale + 16;
    } else if (this.logic && this.logic.drawPrompt) {
      ctx.save();
      const promptH = h - areaTop - 80;
      this.logic.drawPrompt(ctx, 20, areaTop + 4, w - 40, promptH);
      ctx.restore();
      contentBottomY = areaTop + 260;
    } else {
      ctx.save();
      ctx.fillStyle = THEME.nuanHui || '#B8A48C';
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('加载中...', w / 2, h / 2);
      ctx.restore();
      contentBottomY = h / 2 + 30;
    }

    // ---- 底部按钮区 ----
    const btnH = 44;
    const btnMinY = contentBottomY + 8;
    const btnMaxY = h - btnH - 16;
    const btnY = Math.min(btnMinY, btnMaxY);

    // 所有游戏都自动跳转，只显示提示按钮（居中）
    var hintOnlyW = 140;
    var hintOnlyX = (w - hintOnlyW) / 2;
    ctx.save();
    roundRect(ctx, hintOnlyX, btnY, hintOnlyW, btnH, btnH / 2);
    ctx.fillStyle = this.hintUsed ? '#EEE' : 'rgba(212, 168, 75, 0.12)';
    ctx.fill();
    ctx.strokeStyle = this.hintUsed ? '#CCC' : (THEME.danJin || '#D4A84B');
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.hintUsed ? '#AAA' : (THEME.danJin || '#D4A84B');
    ctx.fillText('💡 提示', hintOnlyX + hintOnlyW / 2, btnY + btnH / 2);
    ctx.restore();
  },

  /** 显示提示 */
  showHint() {
    if (this.hintUsed) {
      wx.showToast({ title: '已使用过提示', icon: 'none' });
      return;
    }
    
    // 直接给提示，不弹窗
    this.hintUsed = true;
    this.provideHint();
  },

  /** 根据玩法提供提示 */
  provideHint() {
    let hintText = '';
    
    switch (this.gameId) {
      case 'wordFind':
        if (this.answer && this.answer.length > 0) {
          hintText = `成语的第一个字是"${this.answer[0]}"`;
        }
        break;
      case 'charDiff':
        if (this.logic && this.logic.diffAt) {
          const row = this.logic.diffAt.row + 1;
          const col = this.logic.diffAt.col + 1;
          hintText = `不同的字在第 ${row} 行附近`;
        }
        break;
      case 'poetryConnect':
        hintText = '试试从第一句开始连线';
        break;
      // numberEliminate 已移除
      default:
        hintText = '仔细观察，你一定能找到答案！';
    }
    
    wx.showModal({
      title: '💡 提示',
      content: hintText,
      showCancel: false
    });
    
    this.draw();
  },

  handleTap(x, y) {
    var self = this;
    var w = this.width;
    var h = this.height;
    var titleBarH = 44;
    var areaTop = titleBarH + 28; // ✅ 与 draw() 中保持一致
    var availW = w - 24;
    
    // ✅ 修复：使用与 draw() 中一致的动态计算逻辑
    var nativeW = 390, nativeH = 312;
    if (this.logic) {
      if (this.gameId === 'wordFind' && this.logic.cols) {
        nativeW = this.logic.cols * (this.logic.cellSize + 6) - 6;
        nativeH = this.logic.rows * (this.logic.cellSize + 6) - 6;
      } else if (this.gameId === 'charDiff' && this.logic.cols) {
        nativeW = this.logic.cols * (this.logic.cellSize + 4) - 4;
        nativeH = this.logic.rows * (this.logic.cellSize + 4) - 4;
      } else if (this.gameId === 'poetryConnect' && this.logic._colW) {
        nativeW = this.logic._colW * 2 + 24;
        var upperCount = 0;
        for (var ui = 0; ui < (this.logic.items || []).length; ui++) {
          if (this.logic.items[ui].type === 'upper') upperCount++;
        }
        nativeH = upperCount * (this.logic._itemH + (this.logic._itemGap || 8)) - (this.logic._itemGap || 8);
      }
    }
    
    var extraTop = this.gameId === 'wordFind' ? 50 : (this.gameId === 'charDiff' || this.gameId === 'poetryConnect' ? 40 : 24);
    var totalNativeH = nativeH + extraTop;
    var maxH = h - areaTop - 80;
    var sc = Math.min(availW / nativeW, maxH / totalNativeH, 1.15);
    var offsetX = (w - nativeW * sc) / 2;
    var offsetY = areaTop + extraTop * sc;

    // ====== 1. 先检测底部按钮（用屏幕坐标） ======
    var btnH2 = 44;
    var contentBottom = offsetY + nativeH * sc + 16;
    var btnMinY2 = contentBottom + 8;
    var btnMaxY2 = h - btnH2 - 16;
    var btnY2 = Math.min(btnMinY2, btnMaxY2);

    // 所有游戏统一：只有提示按钮（居中）
    var hintOnlyW = 140;
    var hintOnlyX = (w - hintOnlyW) / 2;
    
    console.log('[Game] 提示按钮区域:', {
      hintBtn: { x: hintOnlyX, y: btnY2, w: hintOnlyW, h: btnH2 },
      tapPoint: { x, y }
    });
    
    if (y >= btnY2 && y <= btnY2 + btnH2 && x >= hintOnlyX && x <= hintOnlyX + hintOnlyW) {
      console.log('[Game] 点击了提示按钮');
      this.showHint();
      return;
    }

    // ====== 2. 游戏区域点击 ======
    console.log('[Game] 转换为游戏区域本地坐标:', {
      offsetX, offsetY, scale: sc,
      localX: (x - offsetX) / sc,
      localY: (y - offsetY) / sc
    });
    
    var localX = (x - offsetX) / sc;
    var localY = (y - offsetY) / sc;

    if (this.logic) {
      if (this.gameId === 'wordFind' && this.logic.getCellByPoint) {
        var cell = this.logic.getCellByPoint(localX, localY);
        if (cell) {
          var ret = this.logic.tapCell(cell.row, cell.col);
          this.draw();
          // 选够4个字后判断
          if (ret && ret.isFull) {
            if (ret.isCorrect) {
              // 答案正确 → 立即跳转结算
              self.goResult(true);
            } else {
              // 答案错误 → 提示并自动清空
              wx.showToast({ 
                title: '答案不对，再试试', 
                icon: 'none',
                duration: 1500
              });
              // 延迟清空选择
              setTimeout(function() {
                self.logic.selected = [];
                self.draw();
              }, 1500);
            }
          }
          return;
        }
      }
      if (this.gameId === 'charDiff' && this.logic.getCellByPoint) {
        var cell2 = this.logic.getCellByPoint(localX, localY);
        if (cell2) {
          var ret = this.logic.tap(cell2.row, cell2.col);
          this.draw();
          // 找到正确答案 → 立即跳转结算
          if (ret.hit) {
            self.goResult(true);
          } else {
            // 选错了，根据情况给出友好提示
            if (ret.isRepeated) {
              // 重复点击同一个错误格子
              wx.showToast({
                title: '这个字已经试过了哦～',
                icon: 'none',
                duration: 1200
              });
            } else {
              // 首次点击错误格子，根据错误次数给出不同的提示
              var wrongCount = ret.wrongCount;
              var penalty = wrongCount * 15;
              var tip = '';
              
              if (wrongCount === 1) {
                tip = '不对哦～再仔细看看';
              } else if (wrongCount === 2) {
                tip = '还不是这个，别着急';
              } else if (wrongCount === 3) {
                tip = '提示：注意笔画的细微差别';
              } else if (wrongCount === 4) {
                tip = '加油！仔细观察每个字';
              } else if (wrongCount >= 5) {
                tip = '可以试试提示按钮哦';
              }
              
              wx.showToast({
                title: tip + '（已错' + wrongCount + '次，-' + penalty + '分）',
                icon: 'none',
                duration: 1800
              });
            }
          }
          return;
        }
      }
      if (this.gameId === 'poetryConnect' && this.logic.getItemByPoint) {
        var item = this.logic.getItemByPoint(localX, localY);
        if (item) {
          var res = this.logic.tapItem(item.id);
          this.draw();
          // 全部连线完成 → 立即跳转结算
          if (res.isComplete) {
            self.goResult(true);
          }
          return;
        }
      }
    }
  },

  goResult(success) {
    this.gameState = 'finished';
    this.stopTimer();
    var remaining = this.timerRemaining || 0;
    var total = this.timerTotal || 0;
    var score = (this.logic && this.logic.score) || 0;
    // 如果成功且有时间计分，用带时间奖励/惩罚的分数
    if (success && this.logic && typeof this.logic.calcFinalScore === 'function') {
      score = this.logic.calcFinalScore(remaining, total);  // 传递 total 参数
    }
    wx.redirectTo({
      url: '/pages/result/result?gameId=' + this.gameId + '&level=' + this.level +
           '&success=' + (success ? 1 : 0) + '&score=' + score +
           '&remaining=' + remaining + '&total=' + total,
    });
  },

  /** 绘制准备状态界面（开始按钮 + 计分规则） */
  drawReadyScreen(ctx, w, h, titleBarH) {
    var startY = titleBarH + 60;
    
    // 获取计分规则说明
    var rules = this.getScoringRules();
    
    // 绘制计分规则卡片
    var cardW = w - 48;
    var cardX = 24;
    var cardY = startY;
    var cardH = 200;
    
    ctx.save();
    // 卡片背景
    roundRect(ctx, cardX, cardY, cardW, cardH, 12);
    ctx.fillStyle = 'rgba(255, 251, 245, 0.95)';
    ctx.fill();
    ctx.strokeStyle = THEME.danJin || '#D4A84B';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 标题
    ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = THEME.zhuSha;
    ctx.textAlign = 'center';
    ctx.fillText('📋 计分规则', w / 2, cardY + 28);
    
    // 规则内容
    ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = THEME.moHei;
    ctx.textAlign = 'left';
    var lineY = cardY + 56;
    var lineHeight = 24;
    for (var i = 0; i < rules.length; i++) {
      ctx.fillText(rules[i], cardX + 20, lineY + i * lineHeight);
    }
    
    // 难度提示
    var diffText = this.difficulty === 'easy' ? '简单' : (this.difficulty === 'normal' ? '一般' : '困难');
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = THEME.nuanHui || '#B8A48C';
    ctx.textAlign = 'center';
    ctx.fillText('当前难度：' + diffText + '  |  时限：' + this.timerTotal + '秒', w / 2, cardY + cardH - 16);
    
    ctx.restore();
    
    // 开始按钮
    var btnW = 200;
    var btnH = 50;
    var btnX = (w - btnW) / 2;
    var btnY = cardY + cardH + 40;
    
    ctx.save();
    // 按钮阴影
    ctx.shadowColor = 'rgba(200, 37, 6, 0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    
    roundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
    var gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    gradient.addColorStop(0, '#E63322');
    gradient.addColorStop(1, THEME.zhuSha);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
    
    // 按钮文字
    ctx.save();
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎮 开始游戏', w / 2, btnY + btnH / 2);
    ctx.restore();
    
    // 保存按钮位置供点击检测
    this._startBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
  },

  /** 获取当前游戏的计分规则 */
  getScoringRules() {
    var rules = [];
    switch (this.gameId) {
      case 'wordFind':
        rules = [
          '• 基础分：100分',
          '• 时间奖励：剩余时间 × 1.2分',
          '• 耗时惩罚：已用时间 × 1.0分',
          '• 错误惩罚：每次错误 -8分',
          '• 策略：快速且准确，避免盲目点击'
        ];
        break;
      case 'charDiff':
        rules = [
          '• 基础分：100分',
          '• 耗时惩罚：已用时间 × 0.8分',
          '• 错误惩罚：每次错误 -15分',
          '• 策略：快速观察，精准点击',
          '• 90-100分 ⭐⭐⭐ | 60-79分 ⭐'
        ];
        break;
      case 'poetryConnect':
        rules = [
          '• 基础分：100分',
          '• 耗时惩罚：已用时间 × 0.6分',
          '• 错误惩罚：每次错误连线 -10分',
          '• 策略：平衡速度与准确度',
          '• 90-100分 ⭐⭐⭐ | 60-79分 ⭐'
        ];
        break;
      default:
        rules = [
          '• 基础分：100分',
          '• 完成游戏即可获得分数',
          '• 速度和准确度影响得分'
        ];
    }
    return rules;
  },

  /** 开始游戏 */
  onStartGame() {
    console.log('[Game] 开始游戏');
    this.gameState = 'playing';
    // ✅ 优先使用后端返回的时间，否则使用前端默认配置
    var totalSec = this.customTimeLimit || getTimeLimit(this.gameId, this.difficulty);
    this.timerTotal = totalSec;
    this.timerRemaining = totalSec;
    this.startTimer();
    this.draw();
  },

  onTouchStart() {},
  onTouchMove(e) { e.preventDefault(); },
  onTouchEnd(e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const t = e.changedTouches[0];
    const x = t.x != null ? t.x : t.clientX;
    const y = t.y != null ? t.y : t.clientY;
    console.log('[Game] onTouchEnd 坐标:', { x, y, width: this.width, height: this.height, gameState: this.gameState });
    
    // 如果是准备状态，检测是否点击开始按钮
    if (this.gameState === 'ready' && this._startBtnBounds) {
      var btn = this._startBtnBounds;
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        console.log('[Game] 点击开始按钮');
        this.onStartGame();
        return;
      }
    }
    
    // 游戏进行中才处理游戏点击
    if (this.gameState === 'playing') {
      this.handleTap(x, y);
    }
  },
});

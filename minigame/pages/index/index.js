/**
 * 首页：2x3 国风卡片矩阵，精美排版，带图标/渐变/装饰
 * @file pages/index/index.js
 */

const { getGame, GLOBAL_CONFIG } = require('../../game.js');
const {
  roundRect, drawGradientCard, drawInkBg,
  drawCloud, drawDivider, drawDecorativeFlowers, THEME,
} = require('../../utils/canvas.js');
const ad = require('../../utils/ad.js');

const GAMES = [
  { id: 'wordFind',        name: '找成语',     icon: '📜', desc: '字阵寻宝', colors: ['#FFF5F0', '#FFE8DC'] },
  { id: 'charDiff',        name: '汉字找不同', icon: '🔍', desc: '火眼金睛', colors: ['#FFF8EE', '#FFECD2'] },
  { id: 'poetryConnect',   name: '诗词连线',   icon: '🖌️', desc: '对句成诗', colors: ['#F0F7FF', '#DCE8F5'] },
  // 数字消消乐已移除
];

const PADDING = 20;
const GAP = 16;
const COLS = 2;
const ROWS = 3;
const CARD_RADIUS = 14;
const TITLE_AREA_H = 123; // 标题区域高度（增加间距）

Page({
  data: {
    bannerAdUnitId: ad.AD_IDS.BANNER,
  },

  canvas: null,
  ctx: null,
  dpr: 1,
  width: 0,
  height: 0,
  cardsBounds: [],

  onLoad() {
    console.log('[Index] onLoad');
  },

  onReady() {
    console.log('[Index] onReady，开始 initCanvas');
    this.initCanvas();
  },

  onShow() {
    console.log('[Index] onShow', this.ctx ? '有 ctx 将重绘' : '无 ctx');
    if (this.ctx) this.draw();
  },

  initCanvas() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#mainCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        console.log('[Index] SelectorQuery.exec 回调');
        if (!res || !res[0]) {
          console.warn('[Index] Canvas 节点未找到');
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('[Index] getContext 2d 失败');
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
        this.dpr = dpr;
        this.width = width;
        this.height = height;
        console.log('[Index] Canvas 初始化完成', { width, height, dpr });
        this.draw();
      });
  },

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;
    console.log('[Index] draw() 开始', { w, h });

    // ---- 背景 ----
    drawInkBg(ctx, w, h);

    // ---- 标题区域（饱满版）----
    ctx.save();
    
    // 主标题
    ctx.fillStyle = THEME.moHei;
    ctx.font = 'bold 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('国风益智集', w / 2, 40);

    // 副标题
    ctx.fillStyle = THEME.nuanHui;
    ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('— 经典国风益智小游戏 —', w / 2, 70);
    
    ctx.restore();

    // 分隔线（与卡片紧凑）
    drawDivider(ctx, PADDING, 102, w - PADDING * 2);

    // ---- 卡片区域 ----
    const cardAreaTop = 115;  // 分隔线下方13px开始卡片，过渡更平缓
    const cardAreaH = h - cardAreaTop - 100;
    const cardW = (w - PADDING * 2 - GAP) / COLS;
    const cardH = (cardAreaH - GAP * (ROWS - 1)) / ROWS;

    this.cardsBounds = [];

    for (let i = 0; i < GAMES.length; i++) {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const x = PADDING + col * (cardW + GAP);
      const y = cardAreaTop + row * (cardH + GAP);
      const item = GAMES[i];

      // 渐变卡片（带阴影）
      drawGradientCard(ctx, x, y, cardW, cardH, CARD_RADIUS, item.colors[0], item.colors[1]);

      // 图标（emoji）
      ctx.save();
      ctx.font = `${Math.min(cardH * 0.26, 40)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, x + cardW / 2, y + cardH * 0.32);
      ctx.restore();

      // 玩法名称
      ctx.save();
      ctx.fillStyle = THEME.moHei;
      ctx.font = `bold ${Math.min(cardW * 0.14, 16)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, x + cardW / 2, y + cardH * 0.58);
      ctx.restore();

      // 游戏描述（新增）
      ctx.save();
      ctx.fillStyle = '#A0937E';
      ctx.font = `${Math.min(cardW * 0.11, 12)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.desc, x + cardW / 2, y + cardH * 0.76);
      ctx.restore();

      // 小装饰点（右上角）
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + cardW - 12, y + 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 168, 75, 0.3)';
      ctx.fill();
      ctx.restore();

      this.cardsBounds[i] = { x, y, w: cardW, h: cardH, game: item };
    }

    // ---- 底部提示 ----
    ctx.save();
    ctx.fillStyle = THEME.nuanHui;
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击卡片开始游戏', w / 2, h - 70); // 调整位置：距离底部70px
    ctx.restore();

    // ---- 装饰花朵（最上层，避免被遮盖）----
    drawDecorativeFlowers(ctx, w, h);

    console.log('[Index] draw() 完成');
  },

  getTouchCard(touch) {
    const x = touch.x;
    const y = touch.y;
    for (let i = 0; i < this.cardsBounds.length; i++) {
      const b = this.cardsBounds[i];
      if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        return { index: i, game: b.game };
      }
    }
    return null;
  },

  onTouchStart(e) {
    // 记录按下状态（可扩展为按压动效）
  },

  onTouchMove(e) {
    e.preventDefault();
  },

  onTouchEnd(e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const t = e.changedTouches[0];
    const x = t.x != null ? t.x : t.clientX;
    const y = t.y != null ? t.y : t.clientY;
    const card = this.getTouchCard({ x, y });
    if (!card) return;
    const { game } = card;
    wx.navigateTo({
      url: `/pages/game/game?gameId=${game.id}`,
    });
  },
});

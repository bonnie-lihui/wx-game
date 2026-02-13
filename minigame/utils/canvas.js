/**
 * Canvas 绘制工具：国风通用元素、动效
 * 主色：朱砂红 #C82506、米黄 #F5E9D6、墨黑 #232323、青蓝 #1E6F9F
 * 辅色：淡金 #D4A84B、暗红 #8B1A04、浅米 #FFF8EE、暖灰 #B8A48C
 * @file utils/canvas.js
 */

const THEME = {
  zhuSha: '#C82506',
  miHuang: '#F5E9D6',
  moHei: '#232323',
  qingLan: '#1E6F9F',
  danJin: '#D4A84B',
  anHong: '#8B1A04',
  qianMi: '#FFF8EE',
  nuanHui: '#B8A48C',
};

/**
 * 绘制圆角矩形路径
 */
function roundRect(ctx, x, y, w, h, r) {
  if (r > Math.min(w, h) / 2) r = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * 绘制带阴影的圆角矩形（卡片底板）
 */
function drawCardShadow(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.shadowColor = 'rgba(35, 35, 35, 0.15)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = '#FFF8EE';
  ctx.fill();
  ctx.restore();
}

/**
 * 绘制国风渐变卡片
 */
function drawGradientCard(ctx, x, y, w, h, r, topColor, bottomColor) {
  drawCardShadow(ctx, x, y, w, h, r);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = g;
  ctx.fill();
  // 金色边框
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = THEME.danJin;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * 绘制简化祥云
 */
function drawCloud(ctx, cx, cy, scale, fillColor) {
  fillColor = fillColor || 'rgba(212, 168, 75, 0.15)';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.arc(12, -2, 6, 0, Math.PI * 2);
  ctx.arc(-10, 2, 5, 0, Math.PI * 2);
  ctx.arc(5, 5, 4, 0, Math.PI * 2);
  ctx.arc(-5, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 绘制简约花朵装饰（优化版）
 */
function drawFlower(ctx, cx, cy, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha || 0.08;
  ctx.translate(cx, cy);
  
  // 绘制5片花瓣（增加描边）
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 / 5) * i);
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.5, size * 0.38, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // 添加淡淡的描边
    ctx.strokeStyle = color;
    ctx.globalAlpha = (alpha || 0.08) * 0.5;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }
  
  // 花心（加大）
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = (alpha || 0.08) * 1.5;
  ctx.fill();
  
  // 花心内圈
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = (alpha || 0.08) * 0.8;
  ctx.fill();
  
  ctx.restore();
}

/**
 * 绘制折扇
 */
function drawFan(ctx, cx, cy, radius, startAngle, endAngle, fillColor) {
  fillColor = fillColor || THEME.zhuSha;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.restore();
}

/**
 * 绘制锁图标（更精致）
 */
function drawLock(ctx, x, y, size) {
  size = size || 20;
  const bodyW = size * 0.6;
  const bodyH = size * 0.5;
  const bodyY = y + size * 0.4;
  const bodyX = x + (size - bodyW) / 2;
  ctx.save();
  // 锁体
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 3);
  ctx.fillStyle = THEME.danJin;
  ctx.fill();
  ctx.strokeStyle = THEME.anHong;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // 锁环
  ctx.beginPath();
  ctx.arc(x + size / 2, bodyY, bodyW * 0.32, Math.PI, 0);
  ctx.strokeStyle = THEME.anHong;
  ctx.lineWidth = 2;
  ctx.stroke();
  // 锁孔
  ctx.beginPath();
  ctx.arc(x + size / 2, bodyY + bodyH * 0.4, 2, 0, Math.PI * 2);
  ctx.fillStyle = THEME.anHong;
  ctx.fill();
  ctx.restore();
}

/**
 * 绘制水墨国风背景（多层渐变）
 */
function drawInkBg(ctx, w, h) {
  // 主背景渐变（从导航栏颜色#F5E9D6开始）
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#F5E9D6');
  g.addColorStop(0.15, '#F3E6D2');
  g.addColorStop(0.35, '#F0E2CC');
  g.addColorStop(0.6, '#EEDDC4');
  g.addColorStop(0.85, '#ECD9BE');
  g.addColorStop(1, '#EAD6BA');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 装饰祥云（底层，更淡）
  drawCloud(ctx, w * 0.08, h * 0.12, 28, 0.04);
  drawCloud(ctx, w * 0.88, h * 0.95, 24, 0.04);

  // 底部水墨晕染
  const btmG = ctx.createLinearGradient(0, h - 80, 0, h);
  btmG.addColorStop(0, 'rgba(237, 224, 200, 0)');
  btmG.addColorStop(1, 'rgba(184, 164, 140, 0.1)');
  ctx.fillStyle = btmG;
  ctx.fillRect(0, h - 80, w, 80);
}

/**
 * 绘制装饰花朵（最上层，避免被遮盖）
 */
function drawDecorativeFlowers(ctx, w, h) {
  // 装饰花朵（5朵，疏朗有致）
  drawFlower(ctx, w * 0.88, h * 0.09, 20, '#E8744B', 0.20);  // 标题右侧，橙红色
  drawFlower(ctx, w * 0.08, h * 0.32, 22, '#D4A84B', 0.22);  // 左上，金色
  drawFlower(ctx, w * 0.92, h * 0.55, 19, '#5BA3C8', 0.18);  // 右中，蓝色
  drawFlower(ctx, w * 0.10, h * 0.75, 21, '#E8744B', 0.20);  // 左下，橙红色
  drawFlower(ctx, w * 0.88, h * 0.88, 18, '#D4A84B', 0.19);  // 右底，金色
}

/**
 * 绘制国风按钮
 */
function drawButton(ctx, x, y, w, h, text, opts) {
  opts = opts || {};
  const pressed = opts.pressed || false;
  const fontSize = opts.fontSize || 32;
  const scale = pressed ? 0.96 : 1;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  // 阴影
  if (!pressed) {
    ctx.shadowColor = 'rgba(200, 37, 6, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
  }
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#E63322');
  g.addColorStop(1, THEME.zhuSha);
  roundRect(ctx, 0, 0, w, h, 10);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // 高光
  if (!pressed) {
    const highlight = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    highlight.addColorStop(0, 'rgba(255,255,255,0.28)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    roundRect(ctx, 2, 2, w - 4, h * 0.5, 8);
    ctx.fillStyle = highlight;
    ctx.fill();
  }
  ctx.fillStyle = '#FFF8EE';
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  ctx.restore();
}

/**
 * 绘制分隔线（水墨横线）
 */
function drawDivider(ctx, x, y, w) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, 'rgba(212, 168, 75, 0)');
  g.addColorStop(0.2, 'rgba(212, 168, 75, 0.4)');
  g.addColorStop(0.5, 'rgba(212, 168, 75, 0.6)');
  g.addColorStop(0.8, 'rgba(212, 168, 75, 0.4)');
  g.addColorStop(1, 'rgba(212, 168, 75, 0)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * 绘制分享海报
 */
function drawPosterToCanvas(ctx, opts) {
  const w = opts.width || 750;
  const h = opts.height || 1000;
  drawInkBg(ctx, w, h);
  ctx.fillStyle = THEME.moHei;
  ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opts.title || '国风轻玩', w / 2, 180);
  ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(opts.subTitle || '', w / 2, 260);
  ctx.fillStyle = THEME.zhuSha;
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(opts.hint || '', w / 2, 340);
  drawCloud(ctx, w / 2 - 60, 500, 3, 'rgba(200, 37, 6, 0.2)');
  drawCloud(ctx, w / 2 + 60, 520, 2.5, 'rgba(30, 111, 159, 0.2)');
}

module.exports = {
  THEME,
  roundRect,
  drawCardShadow,
  drawGradientCard,
  drawCloud,
  drawFlower,
  drawFan,
  drawLock,
  drawInkBg,
  drawDecorativeFlowers,
  drawButton,
  drawDivider,
  drawPosterToCanvas,
};

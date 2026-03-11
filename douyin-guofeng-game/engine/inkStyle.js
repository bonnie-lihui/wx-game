/**
 * 国风水墨视觉绘制工具
 *
 * 职责：
 * 1. 基础图形：圆角矩形、渐变卡片、分隔线
 * 2. 国风装饰：祥云、花朵、折扇、锁
 * 3. 背景渲染：水墨渐变背景
 * 4. 交互元素：国风按钮（按压态）
 *
 * 所有函数接收 ctx (CanvasRenderingContext2D) 作为第一个参数，
 * 纯 Canvas 2D 标准绑制。
 */

const { THEME, FONT_FAMILY } = require('./constants')

function roundRect(ctx, x, y, w, h, r) {
  if (r > Math.min(w, h) / 2) r = Math.min(w, h) / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawCardShadow(ctx, x, y, w, h, r) {
  ctx.save()
  ctx.shadowColor = 'rgba(35, 35, 35, 0.15)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 4
  roundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = THEME.qianMi
  ctx.fill()
  ctx.restore()
}

function drawGradientCard(ctx, x, y, w, h, r, topColor, bottomColor) {
  drawCardShadow(ctx, x, y, w, h, r)
  const g = ctx.createLinearGradient(x, y, x, y + h)
  g.addColorStop(0, topColor)
  g.addColorStop(1, bottomColor)
  roundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = g
  ctx.fill()
  roundRect(ctx, x, y, w, h, r)
  ctx.strokeStyle = THEME.danJin
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawCloud(ctx, cx, cy, scale, fillColor) {
  fillColor = fillColor || 'rgba(212, 168, 75, 0.15)'
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, Math.PI * 2)
  ctx.arc(12, -2, 6, 0, Math.PI * 2)
  ctx.arc(-10, 2, 5, 0, Math.PI * 2)
  ctx.arc(5, 5, 4, 0, Math.PI * 2)
  ctx.arc(-5, -4, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawFlower(ctx, cx, cy, size, color, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha || 0.08
  ctx.translate(cx, cy)

  for (var i = 0; i < 5; i++) {
    ctx.save()
    ctx.rotate((Math.PI * 2 / 5) * i)
    ctx.beginPath()
    ctx.ellipse(0, -size * 0.5, size * 0.38, size * 0.65, 0, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = color
    ctx.globalAlpha = (alpha || 0.08) * 0.5
    ctx.lineWidth = 0.5
    ctx.stroke()
    ctx.restore()
  }

  ctx.beginPath()
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = (alpha || 0.08) * 1.5
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.globalAlpha = (alpha || 0.08) * 0.8
  ctx.fill()

  ctx.restore()
}

function drawFan(ctx, cx, cy, radius, startAngle, endAngle, fillColor) {
  fillColor = fillColor || THEME.zhuSha
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, radius, startAngle, endAngle)
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.restore()
}

function drawLock(ctx, x, y, size) {
  size = size || 20
  var bodyW = size * 0.6
  var bodyH = size * 0.5
  var bodyY = y + size * 0.4
  var bodyX = x + (size - bodyW) / 2
  ctx.save()
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 3)
  ctx.fillStyle = THEME.danJin
  ctx.fill()
  ctx.strokeStyle = THEME.anHong
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + size / 2, bodyY, bodyW * 0.32, Math.PI, 0)
  ctx.strokeStyle = THEME.anHong
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + size / 2, bodyY + bodyH * 0.4, 2, 0, Math.PI * 2)
  ctx.fillStyle = THEME.anHong
  ctx.fill()
  ctx.restore()
}

function drawInkBg(ctx, w, h) {
  var g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#F5E9D6')
  g.addColorStop(0.15, '#F3E6D2')
  g.addColorStop(0.35, '#F0E2CC')
  g.addColorStop(0.6, '#EEDDC4')
  g.addColorStop(0.85, '#ECD9BE')
  g.addColorStop(1, '#EAD6BA')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  drawCloud(ctx, w * 0.08, h * 0.12, 28, 0.04)
  drawCloud(ctx, w * 0.88, h * 0.95, 24, 0.04)

  var btmG = ctx.createLinearGradient(0, h - 80, 0, h)
  btmG.addColorStop(0, 'rgba(237, 224, 200, 0)')
  btmG.addColorStop(1, 'rgba(184, 164, 140, 0.1)')
  ctx.fillStyle = btmG
  ctx.fillRect(0, h - 80, w, 80)
}

function drawDecorativeFlowers(ctx, w, h) {
  drawFlower(ctx, w * 0.88, h * 0.09, 20, '#E8744B', 0.20)
  drawFlower(ctx, w * 0.08, h * 0.32, 22, '#D4A84B', 0.22)
  drawFlower(ctx, w * 0.92, h * 0.55, 19, '#5BA3C8', 0.18)
  drawFlower(ctx, w * 0.10, h * 0.75, 21, '#E8744B', 0.20)
  drawFlower(ctx, w * 0.88, h * 0.88, 18, '#D4A84B', 0.19)
}

function drawButton(ctx, x, y, w, h, text, opts) {
  opts = opts || {}
  var pressed = opts.pressed || false
  var fontSize = opts.fontSize || 32
  var scale = pressed ? 0.96 : 1

  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.scale(scale, scale)
  ctx.translate(-w / 2, -h / 2)

  if (!pressed) {
    ctx.shadowColor = 'rgba(200, 37, 6, 0.3)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 3
  }
  var g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#E63322')
  g.addColorStop(1, THEME.zhuSha)
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.fillStyle = g
  ctx.fill()
  ctx.shadowColor = 'transparent'

  if (!pressed) {
    var highlight = ctx.createLinearGradient(0, 0, 0, h * 0.5)
    highlight.addColorStop(0, 'rgba(255,255,255,0.28)')
    highlight.addColorStop(1, 'rgba(255,255,255,0)')
    roundRect(ctx, 2, 2, w - 4, h * 0.5, 8)
    ctx.fillStyle = highlight
    ctx.fill()
  }

  ctx.fillStyle = THEME.qianMi
  ctx.font = 'bold ' + fontSize + 'px ' + FONT_FAMILY
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2)
  ctx.restore()
}

function drawDivider(ctx, x, y, w) {
  ctx.save()
  var g = ctx.createLinearGradient(x, y, x + w, y)
  g.addColorStop(0, 'rgba(212, 168, 75, 0)')
  g.addColorStop(0.2, 'rgba(212, 168, 75, 0.4)')
  g.addColorStop(0.5, 'rgba(212, 168, 75, 0.6)')
  g.addColorStop(0.8, 'rgba(212, 168, 75, 0.4)')
  g.addColorStop(1, 'rgba(212, 168, 75, 0)')
  ctx.strokeStyle = g
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  ctx.restore()
}

var ICON_STYLES = {
  wordFind:      { bg: 'rgba(200, 37, 6, 0.10)',  color: '#C82506' },
  charDiff:      { bg: 'rgba(30, 111, 159, 0.10)', color: '#1E6F9F' },
  poetryConnect: { bg: 'rgba(212, 168, 75, 0.12)', color: '#8B6F47' },
}

function _drawGridIcon(ctx, cx, cy, s, color) {
  var half = s * 0.30
  var lw = s * 0.05
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.lineCap = 'round'

  roundRect(ctx, cx - half, cy - half, half * 2, half * 2, s * 0.06)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - half, cy)
  ctx.lineTo(cx + half, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy - half)
  ctx.lineTo(cx, cy + half)
  ctx.stroke()

  var cellR = s * 0.05
  var cells = [
    { x: cx - half * 0.5, y: cy - half * 0.5 },
    { x: cx + half * 0.5, y: cy - half * 0.5 },
    { x: cx + half * 0.5, y: cy + half * 0.5 },
  ]
  ctx.fillStyle = color
  for (var i = 0; i < cells.length; i++) {
    ctx.beginPath()
    ctx.arc(cells[i].x, cells[i].y, cellR, 0, Math.PI * 2)
    ctx.fill()
  }
}

function _drawDiffIcon(ctx, cx, cy, s, color) {
  var lw = s * 0.05
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  var boxW = s * 0.32, boxH = s * 0.38
  var off = s * 0.10

  ctx.strokeStyle = color
  ctx.globalAlpha = 0.35
  roundRect(ctx, cx - boxW - off * 0.2, cy - boxH, boxW, boxH * 2, s * 0.05)
  ctx.stroke()
  ctx.globalAlpha = 1

  roundRect(ctx, cx + off * 0.2, cy - boxH, boxW, boxH * 2, s * 0.05)
  ctx.stroke()

  ctx.fillStyle = color
  ctx.font = 'bold ' + Math.round(s * 0.28) + 'px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = 0.35
  ctx.fillText('字', cx - boxW * 0.5 - off * 0.2, cy)
  ctx.globalAlpha = 1
  ctx.fillText('宇', cx + boxW * 0.5 + off * 0.2, cy)

  var circR = s * 0.08
  ctx.beginPath()
  ctx.arc(cx + boxW * 0.5 + off * 0.2, cy + s * 0.12, circR, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = lw * 0.8
  ctx.stroke()
}

function _drawConnectIcon(ctx, cx, cy, s, color) {
  var lw = s * 0.05
  ctx.lineWidth = lw
  ctx.lineCap = 'round'

  var dotR = s * 0.055
  var colOff = s * 0.24
  var rowSpan = s * 0.22

  var leftDots = [
    { x: cx - colOff, y: cy - rowSpan },
    { x: cx - colOff, y: cy },
    { x: cx - colOff, y: cy + rowSpan },
  ]
  var rightDots = [
    { x: cx + colOff, y: cy - rowSpan },
    { x: cx + colOff, y: cy },
    { x: cx + colOff, y: cy + rowSpan },
  ]

  ctx.strokeStyle = color
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.moveTo(leftDots[0].x, leftDots[0].y)
  ctx.lineTo(rightDots[1].x, rightDots[1].y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(leftDots[1].x, leftDots[1].y)
  ctx.lineTo(rightDots[2].x, rightDots[2].y)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.moveTo(leftDots[2].x, leftDots[2].y)
  ctx.lineTo(rightDots[0].x, rightDots[0].y)
  ctx.stroke()

  ctx.fillStyle = color
  for (var i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(leftDots[i].x, leftDots[i].y, dotR, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(rightDots[i].x, rightDots[i].y, dotR, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawGameIcon(ctx, cx, cy, size, gameId) {
  var style = ICON_STYLES[gameId] || { bg: 'rgba(212, 168, 75, 0.12)', color: '#8B6F47' }

  ctx.save()
  if (gameId === 'wordFind') {
    _drawGridIcon(ctx, cx, cy, size, style.color)
  } else if (gameId === 'charDiff') {
    _drawDiffIcon(ctx, cx, cy, size, style.color)
  } else if (gameId === 'poetryConnect') {
    _drawConnectIcon(ctx, cx, cy, size, style.color)
  } else {
    ctx.font = 'bold ' + Math.round(size * 0.48) + 'px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = style.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('游', cx, cy)
  }
  ctx.restore()
}

/**
 * 绘制统一导航栏（返回按钮 + 居中标题，与胶囊同一行对齐）
 * capsuleTop/capsuleBottom 为胶囊按钮的上下边界
 * 返回 { barBottom, backBtnBounds }
 */
function drawNavBar(ctx, w, capsuleTop, capsuleBottom, opts) {
  opts = opts || {}
  var title = opts.title || ''
  var centerY = (capsuleTop + capsuleBottom) / 2
  var capsuleH = capsuleBottom - capsuleTop
  var barBottom = capsuleBottom + 10

  var backSize = Math.min(capsuleH, 32)
  var backX = 12
  var backY = centerY - backSize / 2
  var tapPad = 8
  var tapX = backX - tapPad
  var tapY = backY - tapPad
  var tapW = backSize + tapPad * 2
  var tapH = backSize + tapPad * 2

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(backX + backSize * 0.52, backY + backSize * 0.24)
  ctx.lineTo(backX + backSize * 0.30, centerY)
  ctx.lineTo(backX + backSize * 0.52, backY + backSize * 0.76)
  ctx.strokeStyle = '#8B6F47'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.font = 'bold 17px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = THEME.moHei
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(title, w / 2, centerY)
  ctx.restore()

  drawDivider(ctx, 16, barBottom, w - 32)

  return {
    barBottom: barBottom,
    backBtnBounds: { x: tapX, y: tapY, w: tapW, h: tapH },
  }
}

function drawPosterToCanvas(ctx, opts) {
  var w = opts.width || 750
  var h = opts.height || 1000
  drawInkBg(ctx, w, h)
  ctx.fillStyle = THEME.moHei
  ctx.font = 'bold 48px ' + FONT_FAMILY
  ctx.textAlign = 'center'
  ctx.fillText(opts.title || '国风轻玩', w / 2, 180)
  ctx.font = '28px ' + FONT_FAMILY
  ctx.fillText(opts.subTitle || '', w / 2, 260)
  ctx.fillStyle = THEME.zhuSha
  ctx.font = '24px ' + FONT_FAMILY
  ctx.fillText(opts.hint || '', w / 2, 340)
  drawCloud(ctx, w / 2 - 60, 500, 3, 'rgba(200, 37, 6, 0.2)')
  drawCloud(ctx, w / 2 + 60, 520, 2.5, 'rgba(30, 111, 159, 0.2)')
}

module.exports = {
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
  drawGameIcon,
  drawNavBar,
  drawPosterToCanvas,
}

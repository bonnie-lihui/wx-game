/**
 * 动画效果：彩带纸屑庆祝（party popper 风格）、按钮缩放
 */

/* ── 彩带纸屑庆祝系统 ── */

var CONFETTI_DURATION = 4000

var CONFETTI_COLORS = [
  '#C82506', '#D4A84B', '#E8744B',
  '#FF6B6B', '#FFD700', '#5BA3C8',
  '#4CAF50', '#FF69B4', '#9B59B6',
]

/**
 * @param {number} w  画布宽
 * @param {number} h  画布高
 * @param {number} [ox] 喷射原点 X（默认屏幕中央）
 * @param {number} [oy] 喷射原点 Y（默认 h*0.28）
 */
function createConfetti(w, h, ox, oy) {
  ox = (ox != null) ? ox : w / 2
  oy = (oy != null) ? oy : h * 0.28

  var particles = []

  for (var i = 0; i < 120; i++) {
    var r = Math.random()
    var pType = r < 0.55 ? 'ribbon' : (r < 0.85 ? 'square' : 'circle')

    var angle = (-160 + Math.random() * 140) * Math.PI / 180
    var speed = 2.5 + Math.random() * 3.5

    var pw, ph
    if (pType === 'ribbon') {
      pw = 2 + Math.random() * 2.5
      ph = 14 + Math.random() * 26
    } else if (pType === 'square') {
      pw = 3 + Math.random() * 6
      ph = 3 + Math.random() * 5
    } else {
      pw = 2 + Math.random() * 3
      ph = pw
    }

    particles.push({
      x: ox + (Math.random() - 0.5) * 12,
      y: oy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.18,
      wobbleSpeed: 2 + Math.random() * 4,
      wobbleAmp: 0.5 + Math.random() * 1.5,
      wobbleOffset: Math.random() * Math.PI * 2,
      type: pType,
      w: pw,
      h: ph,
      life: 0,
      maxLife: CONFETTI_DURATION,
      opacity: 0.8 + Math.random() * 0.2,
      flipSpeed: 2 + Math.random() * 5,
      gravity: 0.018 + Math.random() * 0.012,
    })
  }

  return particles
}

function updateAndDrawConfetti(ctx, particles, dt) {
  ctx.save()
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i]
    p.life += dt
    if (p.life > p.maxLife) continue

    var t = p.life / 1000

    p.vy += p.gravity
    p.vx *= 0.975
    p.vy *= 0.985
    p.rotation += p.rotSpeed
    p.x += p.vx + Math.sin(t * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmp * 0.12
    p.y += p.vy

    var fadeProgress = p.life / p.maxLife
    var alpha = fadeProgress > 0.75 ? Math.max(0, (1 - fadeProgress) / 0.25) : 1
    alpha *= p.opacity

    var scaleX = Math.cos(t * p.flipSpeed)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.scale(scaleX, 1)

    if (p.type === 'ribbon') {
      ctx.beginPath()
      var segs = 6
      var segH = p.h / segs
      for (var s = 0; s <= segs; s++) {
        var sx = Math.sin(s * 0.9 + t * 3.5) * p.w * 1.3
        var sy = s * segH - p.h / 2
        if (s === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.w * 0.7
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    } else if (p.type === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
    } else {
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    }

    ctx.restore()
  }
  ctx.restore()
}

function isConfettiDone(particles) {
  for (var i = 0; i < particles.length; i++) {
    if (particles[i].life < particles[i].maxLife) return false
  }
  return true
}

/* ── 兼容旧接口 ── */

var FALL_DURATION = CONFETTI_DURATION
function createPassParticles(w, h, ox, oy) { return createConfetti(w, h, ox, oy) }
function updateAndDrawPassParticles(ctx, p, dt) { return updateAndDrawConfetti(ctx, p, dt) }
function isPassAnimDone(p) { return isConfettiDone(p) }

/* ── 按钮动画 ── */

var PRESS_SCALE = 0.96
var BTN_DURATION = 120

function getButtonScale(startTime, isPress) {
  var elapsed = Date.now() - startTime
  if (elapsed >= BTN_DURATION) return isPress ? PRESS_SCALE : 1
  var t = elapsed / BTN_DURATION
  var ease = t * (2 - t)
  return isPress ? 1 - (1 - PRESS_SCALE) * ease : PRESS_SCALE + (1 - PRESS_SCALE) * ease
}

function isButtonAnimDone(startTime) {
  return Date.now() - startTime >= BTN_DURATION
}

module.exports = {
  FALL_DURATION: FALL_DURATION,
  CONFETTI_DURATION: CONFETTI_DURATION,
  BTN_DURATION: BTN_DURATION,
  createConfetti: createConfetti,
  updateAndDrawConfetti: updateAndDrawConfetti,
  isConfettiDone: isConfettiDone,
  createPassParticles: createPassParticles,
  updateAndDrawPassParticles: updateAndDrawPassParticles,
  isPassAnimDone: isPassAnimDone,
  getButtonScale: getButtonScale,
  isButtonAnimDone: isButtonAnimDone,
}

/**
 * 动画效果：过关粒子、按钮缩放
 */

const { THEME } = require('./constants')

var PARTICLE_COUNT = 24
var FALL_DURATION = 1500

function createPassParticles(w, h) {
  var list = []
  var cx = w / 2
  var top = h * 0.3
  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5
    var speed = 2 + Math.random() * 4
    list.push({
      x: cx,
      y: top,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 1,
      life: 0,
      maxLife: FALL_DURATION,
    })
  }
  return list
}

function updateAndDrawPassParticles(ctx, particles, dt) {
  ctx.save()
  ctx.fillStyle = THEME.zhuSha
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life += dt
    var alpha = 1 - p.life / p.maxLife
    if (alpha <= 0) continue
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function isPassAnimDone(particles) {
  for (var i = 0; i < particles.length; i++) {
    if (particles[i].life < particles[i].maxLife) return false
  }
  return true
}

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
  BTN_DURATION: BTN_DURATION,
  createPassParticles: createPassParticles,
  updateAndDrawPassParticles: updateAndDrawPassParticles,
  isPassAnimDone: isPassAnimDone,
  getButtonScale: getButtonScale,
  isButtonAnimDone: isButtonAnimDone,
}

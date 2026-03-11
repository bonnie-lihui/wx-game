/**
 * 过关动效：水墨散开 + 金币飘落（可配合微信音频 API 播放古风音效）
 * @file animation/passAnimate.js
 */

const { THEME } = require('../utils/canvas.js');

const PARTICLE_COUNT = 24;
const FALL_DURATION = 1500;

/**
 * 过关粒子状态
 * @param {number} w - 画布宽
 * @param {number} h - 画布高
 * @returns {Array<{ x, y, vx, vy, life, maxLife }>}
 */
function createPassParticles(w, h) {
  const list = [];
  const cx = w / 2;
  const top = h * 0.3;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    list.push({
      x: cx,
      y: top,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 1,
      life: 0,
      maxLife: FALL_DURATION,
    });
  }
  return list;
}

/**
 * 更新粒子并绘制
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} particles
 * @param {number} dt
 */
function updateAndDrawPassParticles(ctx, particles, dt) {
  ctx.save();
  ctx.fillStyle = THEME.zhuSha;
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life += dt;
    const alpha = 1 - p.life / p.maxLife;
    if (alpha <= 0) continue;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 是否全部粒子结束
 * @param {Array} particles
 * @returns {boolean}
 */
function isPassAnimDone(particles) {
  return particles.every(p => p.life >= p.maxLife);
}

module.exports = {
  createPassParticles,
  updateAndDrawPassParticles,
  isPassAnimDone,
  FALL_DURATION,
};

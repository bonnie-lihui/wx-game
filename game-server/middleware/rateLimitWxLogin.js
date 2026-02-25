/**
 * wxLogin 接口限流：按 IP，1 分钟内最多 10 次
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

/** key: IP, value: 时间戳数组（本次窗口内的请求时间） */
const store = new Map();

/** 定期清理过期记录 */
setInterval(() => {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  for (const [ip, timestamps] of store.entries()) {
    const valid = timestamps.filter(ts => ts > cutoff);
    if (valid.length === 0) store.delete(ip);
    else store.set(ip, valid);
  }
}, 60 * 1000);

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

/**
 * 限流中间件：1 分钟最多 10 次
 */
function rateLimitWxLogin(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let timestamps = store.get(ip) || [];
  timestamps = timestamps.filter(ts => ts > cutoff);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({ code: 429, msg: '登录失败，请重试' });
  }

  timestamps.push(now);
  store.set(ip, timestamps);
  next();
}

module.exports = rateLimitWxLogin;

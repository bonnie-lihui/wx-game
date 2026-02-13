/**
 * 国风轻玩合集2.0 - Node.js 服务入口
 * 职责：跨域、路由、错误兜底
 * @file server-node/app.js
 */

const express = require('express');
const config = require('./config');

const levelRouter = require('./router/levelRouter');
const userRouter = require('./router/userRouter');

const app = express();

app.use(express.json({ limit: '1mb' }));

/** 跨域：仅放行配置中的小游戏 AppID 对应来源 */
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const appId = req.headers['x-wechat-appid'] || (req.query && req.query.appid);
  const allowed = config.allowedAppIds.length === 0 || config.allowedAppIds.includes(appId) || origin.includes(config.serverDomain);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client, X-Sign, X-Wechat-Appid');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use('/api/level', levelRouter);
app.use('/api/user', userRouter);

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/** 404 */
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: 'Not Found' });
});

/** 全局异常兜底：打印 ERROR 日志并返回 500 */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err && err.stack ? err.stack : err);
  res.status(500).json({ code: 500, msg: err && err.message ? err.message : 'Internal Server Error' });
});

app.listen(config.port, () => {
  console.log(`server listening on port ${config.port}`);
});

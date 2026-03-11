/**
 * 后端配置：数据库、域名、混元 API 密钥
 * 【数据库配置替换位】【混元 API 密钥替换位】【服务器域名替换位】
 * @file server-node/config.js
 */

module.exports = {
  /** 服务端口 */
  port: process.env.PORT || 5565,

  /** MySQL 配置 - 替换为你的数据库地址/账号/密码 */
  db: {
    host: process.env.DB_HOST || '127.0.0.1', // 使用 127.0.0.1 而不是 localhost，避免 IPv6 问题
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'guofeng_game',
    charset: 'utf8mb4',  // ✅ 明确指定字符集为 UTF-8
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },

  /** 允许跨域的小游戏 AppID（仅放行你的 AppID，避免接口被滥用） */
  allowedAppIds: (process.env.ALLOWED_APPIDS || 'your_appid_here').split(',').map(s => s.trim()).filter(Boolean),

  /** 腾讯混元 API - 用于造句评分等，替换为你的密钥 */
  hunyuan: {
    secretId: process.env.HUNYUAN_SECRET_ID || 'your_secret_id',
    secretKey: process.env.HUNYUAN_SECRET_KEY || 'your_secret_key',
  },

  /** 微信小程序配置 - 用于无感登录 */
  wechat: {
    appId: process.env.WX_APPID || 'wx6bf6458487991f97',
    appSecret: process.env.WX_APP_SECRET || 'aff39c2bf45cb1a64a74a6555fc0a4c2',
  },

  /** 抖音小程序配置 - 用于无感登录 */
  tiktok: {
    appId: process.env.TT_APPID || 'tt6ddf1b62f3bf327902',
    appSecret: process.env.TT_APP_SECRET || '128d1422ea3e64e1f040b6a9929de3dc9cb30fab',
  },

  /** 你的服务器域名（用于 CORS 等） */
  serverDomain: process.env.SERVER_DOMAIN || 'https://mini-game.solaboom.cn',
};

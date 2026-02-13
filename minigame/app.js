/**
 * 国风轻玩合集2.0 - 小程序入口
 * 框架会先执行本文件，再根据 app.json 的 pages 加载首屏（pages/index/index）
 */

console.log('[App] app.js 开始执行');
// 提前加载 game.js，确保 Game 单例在页面 require 前完成初始化
require('./game.js');
console.log('[App] game.js 已加载');

App({
  onLaunch(options) {
    console.log('[App] onLaunch 执行', options);
  },

  onShow() {
    // 从后台切到前台
  },

  onHide() {
    // 切到后台
  },
});

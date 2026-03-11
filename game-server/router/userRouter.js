/**
 * 用户相关路由
 * @file server-node/router/userRouter.js
 */

const express = require('express');
const userController = require('../controller/userController');
const rateLimitWxLogin = require('../middleware/rateLimitWxLogin');

const router = express.Router();

router.post('/wxLogin', rateLimitWxLogin, userController.wxLogin);
router.post('/tiktokLogin', rateLimitWxLogin, userController.tiktokLogin);
router.post('/ttLogin', rateLimitWxLogin, userController.tiktokLogin);
router.post('/init', userController.init);
router.post('/saveProgress', userController.saveProgress);

module.exports = router;

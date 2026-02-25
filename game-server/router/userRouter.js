/**
 * 用户相关路由
 * @file server-node/router/userRouter.js
 */

const express = require('express');
const userController = require('../controller/userController');
const rateLimitWxLogin = require('../middleware/rateLimitWxLogin');

const router = express.Router();

router.post('/wxLogin', rateLimitWxLogin, userController.wxLogin);
router.post('/init', userController.init);
router.post('/saveProgress', userController.saveProgress);
router.post('/unlockGame', userController.unlockGame);
router.post('/unlockHidden', userController.unlockHidden);
router.post('/shareSuccess', userController.shareSuccess);

module.exports = router;

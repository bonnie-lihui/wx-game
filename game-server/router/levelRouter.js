/**
 * 关卡/主题路由
 * @file server-node/router/levelRouter.js
 */

const express = require('express');
const levelController = require('../controller/levelController');

const router = express.Router();

router.get('/getLevelData', levelController.getLevelData);
router.get('/getThemeData', levelController.getThemeData);

module.exports = router;

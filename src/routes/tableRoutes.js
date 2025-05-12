const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

/**
 * @route GET /api/tables
 * @desc 獲取所有可用的桌次號碼
 * @access Public
 */
router.get('/', tableController.getAvailableTables);

/**
 * @route GET /api/tables/:tableNumber
 * @desc 獲取指定桌次的圖片
 * @access Public
 */
router.get('/:tableNumber', tableController.getTableImage);

module.exports = router; 
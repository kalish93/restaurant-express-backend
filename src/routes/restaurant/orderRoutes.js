const express = require('express');

const orderController = require('../../controllers/restaurant/orderController');
const router = express.Router();


router.get('/orders/active/:tableId',  orderController.getActiveOrdersByTableId);
router.post('/orders',  orderController.createOrder);

module.exports = router;

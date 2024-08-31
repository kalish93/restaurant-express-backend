const express = require('express');

const orderController = require('../../controllers/restaurant/orderController');
const router = express.Router();


router.get('/orders/active/:tableId',  orderController.getActiveOrdersByTableId);
router.post('/orders',  orderController.createOrder);

const authenticate = require('../../middlewares/authenticate');
router.use(authenticate);

router.put('/orders/status', orderController.updateOrderStatus);
router.get('/orders/active', orderController.getActiveOrders);
router.get('/orders/history', orderController.getOrderHistory);

module.exports = router;

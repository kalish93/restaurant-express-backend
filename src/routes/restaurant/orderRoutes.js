const express = require('express');

const orderController = require('../../controllers/restaurant/orderController');
const router = express.Router();


router.get('/orders/active/:tableId',  orderController.getActiveOrdersByTableId);
router.post('/orders',  orderController.createOrder);
router.post('/orders/:tableId/request-payment', orderController.requestPaymentByTable);

const authenticate = require('../../middlewares/authenticate');
router.use(authenticate);

router.put('/orders/status', orderController.updateOrderStatus);
router.get('/orders/active', orderController.getActiveOrders);
router.get('/orders/history', orderController.getOrderHistory);
router.delete('/orders/items/:id', orderController.removeOrderItem);
router.put('/orders/items', orderController.updateOrderItem);
router.post('/orders/items', orderController.addOrderItem);
router.post('/orders/bill', orderController.generateBillForTableOrders);
router.post('/orders/:tableId/bill', orderController.generateBillForOrder);
router.post('/orders/print-bill', orderController.printBill);



module.exports = router;

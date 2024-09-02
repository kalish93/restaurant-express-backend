const express = require('express');
const notificationController = require('../../controllers/restaurant/notificationController');
const authenticate = require('../../middlewares/authenticate');


const router = express.Router();
router.post('/notifications/call-waiter', notificationController.createCallWaiterNotification);


router.use(authenticate);

router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadNotificationsCount);
router.post('/notifications/mark-as-read', notificationController.markNotificationsAsRead);
router.post('/notifications/:id/mark-as-read', notificationController.markNotificationAsRead);



module.exports = router;
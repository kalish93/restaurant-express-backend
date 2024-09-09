const express = require('express');

const dashboardController = require('../../controllers/restaurant/dashboardController');

const authenticate = require('../../middlewares/authenticate');
const router = express.Router();
router.use(authenticate);


router.get('/number-of-restaurants',  dashboardController.getNumberOfRestaurants);
router.get('/number-of-admins',  dashboardController.getNumberOfAdmins);
router.get('/number-of-restaurant-staff',  dashboardController.getNumberOfRestaurantStaff);


module.exports = router;
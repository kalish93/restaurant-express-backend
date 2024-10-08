const express = require('express');
const restaurantController = require('../../controllers/restaurant/restaurantController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

// Public routes

router.get('/restaurants/:id',  restaurantController.getRestaurant);


router.use(authenticate);

router.get('/restaurants', (req, res) => {
  req.requiredPermissions = ['GetRestaurants'];
  authenticate(req, res, () => restaurantController.getRestaurants(req, res));
});

router.post('/restaurants', (req, res) => {
  req.requiredPermissions = ['CreateRestaurant'];
  authenticate(req, res, () => restaurantController.createRestaurant(req, res));
});

router.post('/restaurants/staff', (req, res) => {
  req.requiredPermissions = ['AddRestaurantStaff'];
  authenticate(req, res, () => restaurantController.addRestaurantStaff(req, res));
});

router.delete('/restaurants/:id', (req, res) => {
  req.requiredPermissions = ['DeleteRestaurant'];
  authenticate(req, res, () => restaurantController.deleteRestaurant(req, res));
});

router.put('/restaurants/:id', (req, res) => {
  req.requiredPermissions = ['UpdateRestaurant'];
  authenticate(req, res, () => restaurantController.updateRestaurant(req, res));
});

router.put('/restaurants/:id/status', restaurantController.setRestaurantOpenStatus);
router.post('/credit-cards', restaurantController.createCreditCard);
router.get('/restaurants/:id/credit-cards', restaurantController.getCreditCards);
router.delete('/credit-cards/:id', restaurantController.deleteCreditCard);
router.post('/discounts', restaurantController.createDiscount);
router.get('/restaurants/:id/discounts', restaurantController.getDiscounts);
router.delete('/discounts/:id', restaurantController.deleteDiscount);
router.get('/restaurants/:id/z-report', restaurantController.getZreportData);

module.exports = router;

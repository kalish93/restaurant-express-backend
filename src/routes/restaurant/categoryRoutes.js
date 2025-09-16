const express = require('express');
const categoryController = require('../../controllers/restaurant/categoryController');
const authenticate = require('../../middlewares/authenticate');
const upload = require('../../middlewares/multerConfig');


const router = express.Router();

router.use(authenticate);

router.get('/categories/:restaurantId', (req, res) => {
  req.requiredPermissions = ['GetCategories'];
  authenticate(req, res, () => categoryController.getCategories(req, res));
});
router.post('/categories', (req, res) => {
  req.requiredPermissions = ['CreateCategory'];
  authenticate(req, res, () => categoryController.createCategory(req, res));
});
router.put('/categories/:id', (req, res) => {
  req.requiredPermissions = ['UpdateCategory'];
  authenticate(req, res, () => categoryController.updateCategory(req, res));
});
router.delete('/categories/:id', (req, res) => {
  req.requiredPermissions = ['DeleteCategory'];
  authenticate(req, res, () => categoryController.deleteCategory(req, res));
});



module.exports = router;

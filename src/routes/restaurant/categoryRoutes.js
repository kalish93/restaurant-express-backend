const express = require('express');
const categoryController = require('../../controllers/restaurant/categoryController');
const authenticate = require('../../middlewares/authenticate');
const upload = require('../../middlewares/multerConfig');


const router = express.Router();

router.use(authenticate);

router.get('/categories', (req, res) => {
  req.requiredPermissions = ['GetCategories'];
  authenticate(req, res, () => categoryController.getCategories(req, res));
});



module.exports = router;

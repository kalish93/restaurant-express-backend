const express = require('express');
const menuController = require('../../controllers/restaurant/menuController');
const authenticate = require('../../middlewares/authenticate');
const upload = require('../../middlewares/multerConfig');


const router = express.Router();

router.use(authenticate);

router.get('/categories', (req, res) => {
  req.requiredPermissions = ['GetCategories'];
  authenticate(req, res, () => categoryController.getCategories(req, res));
});



module.exports = router;

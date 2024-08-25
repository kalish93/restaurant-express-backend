const express = require('express');
const stockController = require('../../controllers/restaurant/stockController');
const authenticate = require('../../middlewares/authenticate');
const upload = require('../../middlewares/multerConfig');

const router = express.Router();

router.use(authenticate);

router.post('/stocks', upload.single('image'),  (req, res) => {
    
  req.requiredPermissions = ['CreateStock'];
  authenticate(req, res, () => stockController.createStock(req, res));

});

router.get('/stocks', (req, res) => {
  req.requiredPermissions = ['GetStock'];
  authenticate(req, res, () => stockController.getStocks(req, res));
});

module.exports = router;
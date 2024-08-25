const express = require('express');

const tableController = require('../../controllers/restaurant/tableController');

const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.post('/tables', (req, res) => {
    req.requiredPermissions = ['CreateTable'];
    authenticate(req, res, () => tableController.createTableWithQRCode(req, res));
});

router.get('/tables', (req, res) => {
    req.requiredPermissions = ['GetTables'];
    authenticate(req, res, () => tableController.getTablesByRestaurantId(req, res));
  });

router.get('/tables/:id/download-qr', (req, res) => {
    req.requiredPermissions = ['DowloadQrCode'];
    authenticate(req, res, () => tableController.downloadQrCode(req, res));
});
module.exports = router;

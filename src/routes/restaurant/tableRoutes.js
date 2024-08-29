const express = require('express');

const tableController = require('../../controllers/restaurant/tableController');
const router = express.Router();


// router.get('/tables/:id',  tableController.getTable);

const authenticate = require('../../middlewares/authenticate');


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

router.put('/tables/:id', (req, res) => {
    req.requiredPermissions = ['UpdateTable'];
    authenticate(req, res, () => tableController.updateTable(req, res));
});

router.delete('/tables/:id', (req, res) => {
    req.requiredPermissions = ['DeleteTable'];
    authenticate(req, res, () => tableController.deleteTable(req, res));
});
module.exports = router;

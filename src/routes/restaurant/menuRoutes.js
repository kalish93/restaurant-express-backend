const express = require('express');
const menuController = require('../../controllers/restaurant/menuController');
const authenticate = require('../../middlewares/authenticate');
const upload = require('../../middlewares/multerConfig');


const router = express.Router();

router.use(authenticate);

router.get('/menus', (req, res) => {
  req.requiredPermissions = ['GetMenus'];
  authenticate(req, res, () => menuController.getMenus(req, res));
});

router.post('/menus', upload.single('image') ,(req, res) => {
  req.requiredPermissions = ['CreateMenu'];
  authenticate(req, res, () => menuController.createMenu(req, res));
});

router.get('/menus/:id', (req, res) => {
  req.requiredPermissions = ['GetMenu'];
  authenticate(req, res, () => menuController.getMenu(req, res));
});

router.delete('/menus/:id', (req, res) => {
  req.requiredPermissions = ['DeleteMenu'];
  authenticate(req, res, () => menuController.deleteMenu(req, res));
});

router.put('/menus/:id', upload.single('image') , (req,res)=>{
  req.requiredPermissions = ['UpdateMenu'];
  authenticate(req,res, ()=>menuController.updateMenu(req,res));
});


module.exports = router;

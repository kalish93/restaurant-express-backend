const express = require('express');
const userController = require('../../controllers/auth/userContoller');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

// Public routes
router.post('/login', userController.login);
router.post('/refresh', userController.refreshToken);

// Routes that require authentication
router.use(authenticate);

// Routes with specific permission checks
router.get('/users', (req, res) => {
  req.requiredPermissions = ['GetUsers'];
  authenticate(req, res, () => userController.getUsers(req, res));
});

router.get('/users/:id', (req, res) => {
  req.requiredPermissions = ['GetUser'];
  authenticate(req, res, () => userController.getUserById(req, res));
});

router.post('/users', (req, res) => {
  req.requiredPermissions = ['CreateUser'];
  authenticate(req, res, () => userController.createUser(req, res));
});

router.put('/users/:id', (req, res) => {
  req.requiredPermissions = ['UpdateUser'];
  authenticate(req, res, () => userController.updateUser(req, res));
});

router.delete('/users/:id', (req, res) => {
  req.requiredPermissions = ['DeleteUser'];
  authenticate(req, res, () => userController.deleteUser(req, res));
});

router.put('/change-password', (req, res) => {
  req.requiredPermissions = ['ChangePassword'];
  authenticate(req, res, () => userController.changePassword(req, res));
});

module.exports = router;

const express = require('express');
const roleController = require('../../controllers/auth/roleController');
const permsssionController = require('../../controllers/auth/permissionController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

// Routes for Roles
router.get('/roles', (req, res) => {
  req.requiredPermissions = ['GetRoles'];
  authenticate(req, res, () => roleController.getRoles(req, res));
});

router.post('/roles', (req, res) => {
  req.requiredPermissions = ['CreateRole'];
  authenticate(req, res, () =>  roleController.createRole(req, res));
});

router.put('/roles/:id', (req, res) => {
  req.requiredPermissions = ['UpdateRole'];
  authenticate(req, res, () =>  roleController.updateRole(req, res));
});

router.delete('/roles/:id', (req, res) => {
  req.requiredPermissions = ['DeleteRole'];
  authenticate(req, res, () => roleController.deleteRole(req, res));
});

router.get('/roles/:roleId/permissions', (req, res) => {
  req.requiredPermissions = ['GetRolePermissions'];
  authenticate(req, res, () => roleController.getRolePermissions(req, res));
});

// Routes for Permissions
router.get('/permissions', (req, res) => {
  req.requiredPermissions = ['GetPermissions'];
  authenticate(req, res, () => permsssionController.getPermissions(req, res));
});

router.post('/roles/:roleId/assign-revoke-permissions', (req, res) => {
  req.requiredPermissions = ['AssignRevokePermissions'];
  authenticate(req, res, () => permsssionController.assignRevokePermissionsToRole(req, res));
});

module.exports = router;

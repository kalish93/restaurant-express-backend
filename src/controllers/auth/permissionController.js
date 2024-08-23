const prisma = require('../../database');

async function getPermissions(req, res) {
  try {
    const permissions = await prisma.permission.findMany();
    res.json(permissions);
  } catch (error) {
    console.error('Error retrieving permissions:', error);
    res.status(500).send('Internal Server Error');
  }
}
async function assignRevokePermissionsToRole(req, res) {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;
      // Fetch existing role permissions
      const existingRolePermissions = await prisma.rolePermission.findMany({
        where: {
          roleId: roleId,
        },
      });
  
      // Extract existing permission IDs
      const existingPermissionIds = existingRolePermissions.map((rolePermission) => rolePermission.permissionId);
  
      // Identify permissions to be connected (assigned)
      const permissionsToConnect = permissions.filter((permissionId) => !existingPermissionIds.includes(permissionId));
  
      // Identify permissions to be disconnected (revoked)
      const permissionsToDisconnect = existingPermissionIds.filter((permissionId) => !permissions.includes(permissionId));
  
      // Update the role by connecting new permissions and disconnecting revoked permissions
      const updatedRolePermissions = await Promise.all([
        ...permissionsToConnect.map((permissionId) =>
          prisma.rolePermission.create({
            data: {
              roleId,
              permissionId,
            },
          })
        ),
        ...permissionsToDisconnect.map((permissionId) =>
          prisma.rolePermission.delete({
            where: {
              roleId_permissionId: {
                roleId,
                permissionId,
              },
            },
          })
        ),
      ]);
  
      const newRolePermissions = await prisma.rolePermission.findMany({
        where: {
          roleId: roleId,
        },
      });
      res.json(newRolePermissions);
    } catch (error) {
      console.error('Error assigning/revoking permissions to role:', error);
      res.status(500).send('Internal Server Error');
    }
  }
  

module.exports = {
  getPermissions,
  assignRevokePermissionsToRole,
};

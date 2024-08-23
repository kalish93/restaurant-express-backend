const prisma = require('../../database');

async function getRoles(req, res) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
      },
    });
    res.json(roles);
  } catch (error) {
    console.error('Error retrieving roles:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function createRole(req, res) {
  try {
    const { name } = req.body;
    const createdRole = await prisma.role.create({
      data: {
        name,
        // Add other role properties as needed
      },
    });
    res.status(201).json(createdRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedRole = await prisma.role.update({
      where: {
        id,
      },
      data: {
        name,
        // Add other role properties as needed
      },
    });
    res.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const usersWithRole = await prisma.user.findMany({
      where: {
        roleId: id
        },
    });

    if (usersWithRole.length > 0) {
      return res.status(400).json({
        error: "Role is assigned to one or more users. Cannot delete.",
      });
    }

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: id,
      },
    });
    
    const deletedRole = await prisma.role.delete({
      where: {
        id,
      },
    });
    res.json(deletedRole);
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function getRolePermissions(req, res) {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where:{
        roleId: roleId
      }
    })
    res.json(rolePermissions);
  } catch (error) {
    console.error('Error retrieving role permissions:', error);
    res.status(500).send('Internal Server Error');
  }
}


module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions
};

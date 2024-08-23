const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

const roles = [
  { name: "Admin" },
  { name: "Restaurant Manager" },
  { name: "Waiter" },
  { name: "Bartender" },
  { name: "Kitchen Staff" },
];

async function seedRoles() {
  const createdRoles = [];
  for (const role of roles) {
    const createdRole = await prisma.role.create({
      data: role,
    });
    createdRoles.push(createdRole);
  }
  return createdRoles;
}

const seedUser = async (roleId) => {
  const hashedPassword = await bcrypt.hash("12345", 10);

  await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      firstName: "Admin",
      lastName: "Admin",
      roleId: roleId,
      password: hashedPassword,
    },
  });
};

async function seedPermissions() {
  const createdPermissions = [];
  const permissionsFilePath = path.resolve(__dirname, 'permissions.json');
  const permissionsData = await fs.readFile(permissionsFilePath, 'utf-8');
  const permissions = JSON.parse(permissionsData);

  for (const permission of permissions) {
    const createdPermission = await prisma.permission.create({
      data: permission,
    });
    createdPermissions.push(createdPermission);
  }
  return createdPermissions;
}

async function seedRolePermissions(roleId, permissions) {
  const createdPermissions = [];
  // const permissionsFilePath = path.resolve(__dirname, 'permissions.json');
  // const permissionsData = await fs.readFile(permissionsFilePath, 'utf-8');
  // const permissions = JSON.parse(permissionsData);

  for (const permission of permissions) {
    const createdPermission = await prisma.rolePermission.create({
      data: {
        roleId: roleId,
        permissionId: permission.id
      },
    });
    createdPermissions.push(createdPermission);
  }
  return createdPermissions;
}

async function main() {
  try {
    const createdRoles = await seedRoles();
    await seedUser(createdRoles[0].id);
    // const createdPermissions = await seedPermissions()
    // await seedRolePermissions(createdRoles[0].id, createdPermissions)
    console.log("Seeded successfully.");
  } catch (error) {
    console.error("Error while seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

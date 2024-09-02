const bcrypt = require('bcrypt');
const jwtUtils = require('../../services/jwtUtils');
const prisma = require('../../database');
const jwt = require('jsonwebtoken');

async function getUsers(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    let totalCount;
    let users;

    if (page && pageSize) {
      totalCount = await prisma.user.count();

      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roleId: true,
          restaurant: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });
    } else {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roleId: true,
          restaurant: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      totalCount = users.length;
    }

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: users,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createUser(req, res) {
  try {
    const { email, firstName, lastName, password, passwordConfirmation, roleId } = req.body;

    if (!email || !password || !passwordConfirmation || !roleId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== passwordConfirmation) {
      return res
        .status(400)
        .json({ error: "Password and password confirmation do not match" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
        roleId,
      },
      include: { role: true },
    });

    res.json(createdUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const { email, firstName, lastName, roleId } = req.body;

    if (!email || !roleId) {
      return res
        .status(400)
        .json({ error: "Email and role are required fields" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        firstName: firstName,
        lastName: lastName,
        roleId,
      },
      include: { role: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).send("Internal Server Error");
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    const deletedUser = await prisma.user.delete({
      where: { id: userId },
      include: { role: true },
    });

    res.json(deletedUser);
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).send("Internal Server Error");
  }
}

async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required fields" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, restaurant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.role.id },
      select: { permissionId: true },
    });

    // Extract permission IDs from the rolePermissions
    const permissionIds = rolePermissions.map(rolePermission => rolePermission.permissionId);

    // Fetch the actual permissions based on the extracted permission IDs
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    // Extract permission names
    const permissionNames = permissions.map(permission => permission.name);

    const accessToken = jwtUtils.generateToken({
      id: user.id,
      email: user.email,
      role: user?.role,
      permissions: permissionNames,
      restaurantId: user?.restaurantId

    });

    const refreshToken = jwtUtils.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user?.role,
      permissions: permissionNames,
      restaurantId: user?.restaurantId
    });

    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, jwtUtils.getSecretKey());

    const newAccessToken = jwtUtils.generateToken({id: decoded.id,
      userName:decoded.userName, roleId: decoded.roleId, permissions: decoded.permissions});

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
}


async function changePassword(req, res) {
  try {
    const { username, oldPassword, newPassword, newPasswordConfirmation } = req.body;

    const user = await prisma.user.findUnique({
      where: { userName: username },
    });

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({ error: "Incorrenct old password." });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: "New password can not be old password." });
    }

    if (newPasswordConfirmation !== newPassword) {
      return res.status(400).json({ error: "Password and confirmation must be the same." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
    where: { userName: username },
    data: {
      password: hashedPassword}
    });
    
    return updatedUser;
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
}
module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  login,
  refreshToken,
  changePassword
};

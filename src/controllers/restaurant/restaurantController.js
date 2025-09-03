const prisma = require('../../database');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

async function getRestaurants(req, res) {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.query;
    const skip = (parseInt(pageNumber, 10) - 1) * parseInt(pageSize, 10);

    const totalCount = await prisma.restaurant.count();

    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        logo: true,
        subscription: true,
        isOpen: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tables: true,
        menuItems: true,
        orders: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        categories: true,
      },
      skip,
      take: parseInt(pageSize, 10),
    });

    res.json({
      items: restaurants,
      totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(pageNumber, 10),
      totalPages: Math.ceil(totalCount / parseInt(pageSize, 10)),
    });
  } catch (error) {
    console.error("Error retrieving restaurants:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createRestaurant(req, res) {
  try {
    const { name, phone, address, subscription } = req.body;
    const image = req.file ? req.file.filename : null; 

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        phone,
        address,
        logo: image,
        subscription,
      },
    });

    res.json(restaurant);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getRestaurant(req, res) {
  try {
    const id = req.params.id;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        logo: true,
        subscription: true,
        isOpen: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tables: true,
        menuItems: true,
        orders: true,
        qrCodeImage: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        categories: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).send("Internal Server Error");
  }
} 

async function addRestaurantStaff(req, res) {
    try { 
      const { email, firstName, lastName, password, passwordConfirmation, roleId, restaurantId } = req.body;
  
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
          email: email,
          firstName: firstName,
          lastName: lastName,
          password: hashedPassword,
          restaurantId: restaurantId,
          roleId: roleId,
        },
        include: { role: true },
      });
  
      res.json(createdUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function deleteRestaurant(req, res) {
    try {
      const id = req.params.id;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const deleted = await prisma.restaurant.delete({
        where: { id: id },
      });
  
      res.status(200).json(deleted);
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }

 async function updateRestaurant(req, res) {
  try {
    const id = req.params.id;
    const { name, phone, address, subscription, isOpen, isActive } = req.body;
    const image = req.file ? req.file.filename : null;

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (image && restaurant.logo) {
            const oldImagePath = path.join(__dirname, '../../public/uploads', restaurant.logo);
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error("Error deleting old image:", err);
            });
          }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: name ?? restaurant.name,
        phone: phone ?? restaurant.phone,
        address: address ?? restaurant.address,
        logo: image || restaurant.logo,
        subscription: subscription ?? restaurant.subscription,
        isOpen: isOpen ?? restaurant.isOpen,
        isActive: isActive ?? restaurant.isActive,
      },
    });

    res.json(updatedRestaurant);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).send("Internal Server Error");
  }
}


  async function setRestaurantOpenStatus(req, res) {
    try {
      const id = req.params.id;
      const { isOpen } = req.body;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: id },
        data: {
          isOpen: isOpen,
        },
      });
  
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function setRestaurantActiveStatus(req, res) {
    try {
      const id = req.params.id;
      const { isActive } = req.body;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: id },
        data: {
          isActive: isActive,
        },
      });
  
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

module.exports = {
    getRestaurants,
    createRestaurant,
    getRestaurant,
    addRestaurantStaff,
    deleteRestaurant,
    updateRestaurant, 
    setRestaurantOpenStatus,
    setRestaurantActiveStatus
}
const prisma = require('../../database');
const bcrypt = require('bcrypt');

async function getRestaurants(req, res) {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.query;
    let totalCount;

      totalCount = await prisma.restaurant.count();

     const restaurants = await prisma.restaurant.findMany({
        select: {
            id: true,
            name : true,
            qrCodes : true, 
            menuItems: true,
            orders : true,
            users : true,
            isActive : true,
            createdAt : true,
        },
        skip: (pageNumber - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });

      const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: restaurants,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(pageNumber, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving restaurants:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createRestaurant(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name
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
      const id  = req.params.id;
  
       const restaurant = await prisma.restaurant.findUnique({
        where:{
            id: id
        },
          select: {
              id: true,
              name : true,
              qrCodes : true, 
              menuItems: true,
              orders : true,
              users: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true
                }
              },
              isActive : true,
              createdAt : true,
          }
        });
    res.json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
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

module.exports = {
    getRestaurants,
    createRestaurant,
    getRestaurant,
    addRestaurantStaff
}
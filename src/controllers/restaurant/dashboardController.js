const prisma = require('../../database');

async function getNumberOfRestaurants(req, res) {
  try {
    
    const restaurants = await prisma.restaurant.findMany();
    const count = restaurants.length

    res.json(count);
  } catch (error) {
    console.error("Error retrieving menus:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getNumberOfRestaurantStaff(req, res) {
  try {
    
    const users = await prisma.user.findMany({
        where: {restaurantId: {
            not: null
        }
    }
    });
    const count = users.length

    res.json(count);
  } catch (error) {
    console.error("Error retrieving menus:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getNumberOfAdmins(req, res) {
  try {
    
    const role = await prisma.role.findFirst({
        where: {
            name: 'Admin'
        }
    })
    const users = await prisma.user.findMany({
        where: {roleId: role.id}
    });
    const count = users.length

    res.json(count);
  } catch (error) {
    console.error("Error retrieving menus:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
    getNumberOfAdmins,
    getNumberOfRestaurantStaff,
    getNumberOfRestaurants
}
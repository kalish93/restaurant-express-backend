const prisma = require('../../database');
const bcrypt = require('bcrypt');

async function getCategories(req, res) {
  try {
     const categories = await prisma.category.findMany({
        select: {
          id : true,
          name : true,  
        },
      });

    res.json(categories);
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).send("Internal Server Error");
  }
} 

module.exports = {
  getCategories
}
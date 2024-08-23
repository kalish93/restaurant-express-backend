const prisma = require("../../database");
const bcrypt = require("bcrypt");

async function getStocks(req, res) {
  try {
    const restaurantId = req.user.restaurantId;
    const { pageNumber = 1, pageSize = 10 } = req.query;
    let totalCount;

    totalCount = await prisma.stock.count();

    const stocks = await prisma.stock.findMany({
      where: {
        restaurantId: restaurantId,
      },
      skip: (pageNumber - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: stocks,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(pageNumber, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving stocks:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createStock(req, res) {
  try {
    
    const { quantity, price, drinkName } = req.body;
    const image = req.file ? req.file.filename : null; // File path or null if no file
// console.log(image,'ooooooooooooo')
    if (
      quantity === undefined ||
      price === undefined ||
      drinkName === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const restaurantId = req.user.restaurantId;

    const stock = await prisma.stock.create({
      data: {
        drinkName: drinkName,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        restaurantId: restaurantId,
        image: image,
      },
    });

    res.json(stock);
  } catch (error) {
    console.error("Error creating stock:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getStocks,
  createStock,
};

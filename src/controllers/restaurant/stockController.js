const prisma = require("../../database");
const fs = require('fs');
const path = require('path');

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

async function updateStock(req, res) {
  try {
    const { id } = req.params;
    const { quantity, price, drinkName } = req.body;
    const image = req.file ? req.file.filename : null;

    if (
      quantity === undefined ||
      price === undefined ||
      drinkName === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Fetch the existing stock to get the old image path
    const existingStock = await prisma.stock.findUnique({
      where: { id: id },
    });

    if (!existingStock) {
      return res.status(404).send("Stock not found");
    }

    // Delete the old image if a new one is provided
    if (image && existingStock.image) {
      const oldImagePath = path.join(__dirname, '../../public/uploads', existingStock.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error("Error deleting old image:", err);
      });
    }

    const updatedStock = await prisma.stock.update({
      where: { id: id },
      data: {
        drinkName: drinkName,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        image: image || existingStock.image, // Keep the existing image if no new one is provided
      },
    });

    res.json(updatedStock);
  } catch (error) {
    console.error("Error updating stock:", error);
    if (error.code === 'P2025') {
      res.status(404).send("Stock not found");
    } else {
      res.status(500).send("Internal Server Error");
    }
  }
}

async function deleteStock(req, res) {
  try {
    const  id  = req.params.id;

    // Fetch the existing stock to get the image path
    const existingStock = await prisma.stock.findUnique({
      where: { id: id },
    });

    if (!existingStock) {
      return res.status(404).send("Stock not found");
    }

    // Delete the associated image file
    if (existingStock.image) {
      const imagePath = path.join(__dirname, '../../public/uploads/', existingStock.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    // Delete the stock record from the database
    const deleted = await prisma.stock.delete({
      where: { id: id },
    });

    res.status(204).send(deleted); // No content to send after successful deletion
  } catch (error) {
    console.error("Error deleting stock:", error);
    if (error.code === 'P2025') {
      res.status(404).send("Stock not found");
    } else {
      res.status(500).send("Internal Server Error");
    }
  }
}


module.exports = {
  getStocks,
  createStock,
  updateStock,
  deleteStock
};

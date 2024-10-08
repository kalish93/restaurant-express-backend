const prisma = require("../../database");
const fs = require('fs');
const path = require('path');

async function getStocks(req, res) {
  try {
    const restaurantId = req.user.restaurantId;
    const { pageNumber, pageSize } = req.query;

    let stocks;
    let totalCount;

    totalCount = await prisma.stock.count({
      where: {
        restaurantId: restaurantId,
      },
    });

    if (pageNumber && pageSize) {
      // Parse pageNumber and pageSize to ensure they are numbers
      const parsedPageNumber = parseInt(pageNumber, 10);
      const parsedPageSize = parseInt(pageSize, 10);

      stocks = await prisma.stock.findMany({
        where: {
          restaurantId: restaurantId,
        },
        skip: (parsedPageNumber - 1) * parsedPageSize,
        take: parsedPageSize,
      });

      const totalPages = Math.ceil(totalCount / parsedPageSize);

      res.json({
        items: stocks,
        totalCount: totalCount,
        pageSize: parsedPageSize,
        currentPage: parsedPageNumber,
        totalPages: totalPages,
      });
    } else {
      stocks = await prisma.stock.findMany({
        where: {
          restaurantId: restaurantId,
        },
      });

      res.json({
        items: stocks,
        totalCount: totalCount,
        pageSize: totalCount, // No pagination, show all items
        currentPage: 1,
        totalPages: 1,
      });
    }
  } catch (error) {
    console.error("Error retrieving stocks:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createStock(req, res) {
  try {
    
    const { quantity, name } = req.body;
    const image = req.file ? req.file.filename : null; // File path or null if no file
// console.log(image,'ooooooooooooo')
    if (
      quantity === undefined ||
      name === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const restaurantId = req.user.restaurantId;

    const stock = await prisma.stock.create({
      data: {
        name: name,
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
    const { quantity, name } = req.body;
    const image = req.file ? req.file.filename : null;

    if (
      quantity === undefined ||
      name === undefined
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
        name: name,
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

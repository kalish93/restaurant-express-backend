const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../../database");
const BASE_URL = process.env.FRONTEND_BASE_URL;

const createTableWithQRCode = async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "number is required" });
  }

  try {
    const restaurantId = req.user.restaurantId;
    // Generate a unique ID for the table
    const tableId = uuidv4();
    // Generate the QR code URL
    const url = `${BASE_URL}/menu/${restaurantId}/${tableId}`;

    // Generate the QR code image
    const qrCodeImage = await QRCode.toDataURL(url);

    // Create a new table with the QR code image included
    const table = await prisma.table.create({
      data: {
        id: tableId,
        number: number.toString(),
        restaurantId: restaurantId,
        qrCodeImage: qrCodeImage, // Save the QR code image directly in the table
      },
    });

    res.status(201).json({ table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create table with QR code" });
  }
};

const getTablesByRestaurantId = async (req, res) => {
  const restaurantId = req.user.restaurantId;

  if (!restaurantId) {
    return res.status(400).json({ error: "Restaurant ID is required" });
  }

  try {
    // Fetch tables by restaurant ID
    const tables = await prisma.table.findMany({
      where: {
        restaurantId: restaurantId,
      },
    });

    res.status(200).json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve tables" });
  }
};

const downloadQrCode = async (req, res) => {
  const tableId = req.params.id;

  try {
    // Find the table by ID
    const table = await prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Check if QR code image exists for the table
    if (!table.qrCodeImage) {
      return res
        .status(404)
        .json({ error: "QR code image not found for this table" });
    }

    // Convert the base64 QR code image to a buffer
    const qrCodeBuffer = Buffer.from(table.qrCodeImage.split(",")[1], "base64");

    // Set the appropriate headers and send the QR code image
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=table-${tableId}-qrcode.png`
    );
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve QR code" });
  }
};

const updateTable = async (req, res) => {
  const tableId = req.params.id;
  const { number } = req.body;

  try {
    // Check if the table exists
    const existingTable = await prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!existingTable) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Update the table
    const updatedTable = await prisma.table.update({
      where: {
        id: tableId,
      },
      data: {
        number: number ? number.toString() : existingTable.number,
        // Optionally update QR code image if needed
        // qrCodeImage: qrCodeImage, // If you want to update QR code image
      },
    });

    res.status(200).json(updatedTable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update table" });
  }
};

const deleteTable = async (req, res) => {
  const tableId = req.params.id;

  try {
    // Check if the table exists
    const existingTable = await prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!existingTable) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Delete the table
    await prisma.table.delete({
      where: {
        id: tableId,
      },
    });

    res.status(200).json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete table" });
  }
};

const getTable = async(req, res) => {
  try {
    const tableId = req.params.id;
    
    const table = await prisma.table.findUnique({
      where: {
        id: tableId
      },
    });

    res.status(201).json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch table" });
  }
}

module.exports = {
  createTableWithQRCode,
  getTablesByRestaurantId,
  downloadQrCode,
  updateTable,
  deleteTable,
  getTable
};

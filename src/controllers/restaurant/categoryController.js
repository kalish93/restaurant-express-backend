const prisma = require('../../database');

// ✅ Get all categories by restaurantId
async function getCategories(req, res) {
  try {
    const { restaurantId } = req.params; // expecting /categories/:restaurantId

    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    let whereClause = {};

    if (restaurantId) {
      whereClause = {
        OR: [
          { restaurantId: restaurantId }, 
          { restaurantId: null }
        ]
      };
    } else {
      whereClause = { restaurantId: null };
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(categories);
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).send("Internal Server Error");
  }
}

// ✅ Create category
async function createCategory(req, res) {
  try {
    const { name, restaurantId } = req.body;

    if (!name || !restaurantId) {
      return res.status(400).json({ error: "name and restaurantId are required" });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        restaurantId,
      },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).send("Internal Server Error");
  }
}

// ✅ Update category
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(500).send("Internal Server Error");
  }
}

// ✅ Delete category
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send(); // no content
  } catch (error) {
    console.error("Error deleting category:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

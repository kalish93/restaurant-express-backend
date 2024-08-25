const prisma = require('../../database');
const bcrypt = require('bcrypt');

async function getMenus(req, res) {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.query;
    let totalCount;

      totalCount = await prisma.menuItem.count();
     const menuItems = await prisma.menuItem.findMany({
        select: {
          id : true,
          name : true,
          price : true,
          restaurantId : true,
          category : true,
          categoryId : true,
        },
        skip: (pageNumber - 1) * parseInt(pageSize, 10),
        take: parseInt(pageSize, 10),
      });

      const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: menuItems,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(pageNumber, 10),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error retrieving menus:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createMenu(req, res) {
  try {
    const { name, price, stock, ingredients ,description, restaurantId, categoryId} = req.body;
    const image = req.file ? req.file.filename : null; 
    if(!ingredients || ingredients.length === 0){
      return res.status(400).json({ error: "Invalid list of Ingredients" });
    }
    if (!name || !price || !stock || !description ) {
      return res.status(400).json({ error: "Invalid request body request" });
    }
    const restaurant = await prisma.restaurant.findUnique({
      where:{
        id: restaurantId??""
      }
    });
    if(!restaurant){
      return res.status(400).json({ error: "Selected restaurant not found." });
    }
    const category = await prisma.category.findUnique({
      where:{
        id: categoryId??"",
      }
    });
    if(!category){
      return res.status(400).json({ error: "Invalid menu category." });
    }
     const menu = await prisma.menuItem.create({
        data: {
          name: name,
          price: parseFloat(price),
          stock: parseInt(stock),
          category,
          ingredients,
          description,
          restaurant,
        },
      });
  

    res.json(menu);
  } catch (error) {
    console.error("Error creating menuItem:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getMenu(req, res) {
    try {
      const id  = req.params.id;
  
       const menu = await prisma.menuItem.findUnique({
        where:{
            id: id
        },
          select: {
              id: true,
              name : true,
              price : true, 
              stock: true,
              isDrink : true,
              restaurant: {
                select: {
                    id: true,
                    name: true,
                }
              },
              category:{
                select:{
                  id:true,
                  name:true
                }
              },
              orderItems:true,
              createdAt: true
          }
        });
    res.json(menu);
    } catch (error) {
      console.error("Error getting menu:", error);
      res.status(500).send("Internal Server Error");
    }
}  

async function updateMenu(req, res) {
    try {
      const { id, name, price, description, ingredients , stock, isDrink, categoryId } = req.body;
    
      if(!id){
        return res.status(400).json({error: "Invalid menuId."})
      }
  
     const data = {};
     if(description){
      data["description"] = description
     }
     if(name){
      data["name"] = name;
     }
     if(price){
      data["price"] = parseFloat(price);
     }
     if(stock) {
      data["stock"] = parseInt(stock);
     }
     if(isDrink && typeof isDrink == "boolean"){
      data["isDrink"] = isDrink
     }
     if(categoryId){
      const category = await prisma.category.findUnique({
        where:{
          id:categoryId
        }
      });
      if(!category){
        return res.status(400).json({error:"Category not found."});
      }
      data["category"] = category;
     }
  
      const updatedMenu = await prisma.menuItem.update({
        where:{
          id: id
        },
        data: data
      });
  
      res.json(updatedMenu);
    } catch (error) {
      console.error("Error creating menu:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

async function deleteMenu(req, res) {
    try {
      const { id } = req.params.id;
    
      if(!id){
        return res.status(400).json({error: "Invalid menu id."})
      }
     await prisma.menuItem.delete({
        where:{
          id: id
        }
      });
  
      res.json({message: "sucessfully deleted menu item."});
    } catch (error) {
      console.error("Error creating menu:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

module.exports = {
    deleteMenu,
    updateMenu,
    getMenu,
    createMenu,
    getMenus
}
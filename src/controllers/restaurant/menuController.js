const prisma = require('../../database');
const bcrypt = require('bcrypt');

async function getMenus(req, res) {
  try {
    const restaurantId = req.user.restaurantId;
    if(!restaurantId) {
      return res.status(400).json({error: "user does not belong to a restaurant"})
    }
     const menuItems = await prisma.menuItem.findMany({
      where :{
        restaurantId: restaurantId
      },
        select: {
          id : true,
          name : true,
          price : true,
          restaurantId : true,
          ingredient:true,
          category : true,
          categoryId : true,
          image:true
        },
       
      });

    res.json({
       menuItems,
    });
  } catch (error) {
    console.error("Error retrieving menus:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createMenu(req, res) {
  try {
    const { name, price, ingredients , categoryId} = req.body;
    const image = req.file ? req.file.filename : null; 
    const restaurantId = req.user.restaurantId;
    if(!restaurantId) {
      return res.status(400).json({error: "user does not have a restaurant"})
    }
    if (!name || !price || !categoryId ){
      return res.status(400).json({ error: "Invalid request body" });
    }
    const restaurant = await prisma.restaurant.findUnique({
      where:{
        id: restaurantId
      }
    });
    if(!restaurant){
      return res.status(400).json({ error: "user's restaurant not found." });
    }
    const category = await prisma.category.findUnique({
      where:{
        id: categoryId,
      }
    });
    if(!category){
      return res.status(400).json({ error: "Invalid menu category." });
    }
     const menu = await prisma.menuItem.create({
        data: {
          name: name,
          price: parseFloat(price),
          category: {
            connect: { id: categoryId } 
          },
          ingredient: ingredients ?? "", 
          restaurant: {
            connect: { id: restaurantId } 
          },
          image: image,
         
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
              ingredient:true,
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
      const id = req.params.id;
      const { name, price, ingredient, categoryId } = req.body;
      const image = req.file ? req.file.filename : null;

      const restaurantId = req.user.restaurantId;
      if(!restaurantId) res.status(400).json({error:"No restaurant found for current user."})
      if(!id){
        return res.status(400).json({error: "Invalid menuId."})
      }
  
     const data = {};
     data['ingredient'] = ingredient;
      data['image'] = image;
     if(name){
      data["name"] = name;
     }
     if(price){
      data["price"] = parseFloat(price);
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
          id: id,
          restaurantId
        },
        data: data
      });
      if(!updatedMenu) {
        res.status(404).json({error:"Menu not found"});
      }
  
      res.json(updatedMenu);
    } catch (error) {
      console.error("Error creating menu:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

async function deleteMenu(req, res) {
    try {
      const id  = req.params.id;
      const restaurantId = req.user.restaurantId;
      if(!restaurantId) res.status(400).json({error:"No restaurant found for current user."})
    
      if(!id){
        return res.status(400).json({error: "Invalid menu id."})
      }
     await prisma.menuItem.delete({
        where:{
          id: id,
          restaurantId
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
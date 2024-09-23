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
            tables : true, 
            menuItems: true,
            isOpen: true,
            taxRate: true,
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
              tables : true, 
              menuItems: true,
              isOpen: true,
              taxRate: true,
              orders : true,
              users: {
                select: {
                    id:true,
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

  async function deleteRestaurant(req, res) {
    try {
      const id = req.params.id;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const deleted = await prisma.restaurant.delete({
        where: { id: id },
      });
  
      res.status(200).json(deleted);
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async function updateRestaurant(req, res) {
    try {
      const id = req.params.id;
      const { name, isActive } = req.body;
  
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: id },
        data: {
          name: name,
          isActive: isActive !== undefined ? isActive : restaurant.isActive,
        },
      });
  
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function setRestaurantOpenStatus(req, res) {
    try {
      const id = req.params.id;
      const { isOpen } = req.body;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: id },
        data: {
          isOpen: isOpen,
        },
      });
  
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function setRestaurantTaxRate(req, res) {
    try {
      const id = req.params.id;
      const { taxRate } = req.body;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: id },
        data: {
          taxRate: taxRate,
        },
      });
  
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function createCreditCard(req, res) {
    try {
      const { restaurantId, name } = req.body;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const creditCard = await prisma.creditCard.create({
        data: {
          name: name,
          restaurantId: restaurantId,
        },
      });
  
      res.json(creditCard);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function getCreditCards(req, res) {
    try {
      const { id} = req.params;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const creditCards = await prisma.creditCard.findMany({
        where: {
          restaurantId: id
        },
      });
  
      res.json(creditCards);
    } catch (error) {
      console.error("Error geting cards:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function deleteCreditCard(req, res) {
    try {
      const { id} = req.params;
  
      const card = await prisma.creditCard.findUnique({
        where: { id: id },
      });
  
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
  
      const deletedCard = await prisma.creditCard.delete({
        where: {
          id: id
        },
      });
  
      res.json(deletedCard);
    } catch (error) {
      console.error("Error deleting credit card:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function createDiscount(req, res) {
    try {
      const { restaurantId, name, percentage } = req.body;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const discount = await prisma.discount.create({
        data: {
          name: name,
          restaurantId: restaurantId,
          percentage: percentage
        },
      });
  
      res.json(discount);
    } catch (error) {
      console.error("Error creating discount:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function getDiscounts(req, res) {
    try {
      const { id} = req.params;
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: id },
      });
  
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  
      const discount = await prisma.discount.findMany({
        where: {
          restaurantId: id
        },
      });
  
      res.json(discount);
    } catch (error) {
      console.error("Error geting discounts:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function deleteDiscount(req, res) {
    try {
      const { id} = req.params;
  
      const discount = await prisma.discount.findUnique({
        where: { id: id },
      });
  
      if (!discount) {
        return res.status(404).json({ error: "Card not found" });
      }
  
      const deletedDiscount = await prisma.discount.delete({
        where: {
          id: id
        },
      });
  
      res.json(deletedDiscount);
    } catch (error) {
      console.error("Error deleting credit discount:", error);
      res.status(500).send("Internal Server Error");
    }
  }  

  async function getZreportData(req, res) {
    try {
      const { id } = req.params;
  
      const today = new Date();
      const startDate = new Date(today.setHours(0, 0, 0, 0)); // Start of today
      const endDate = new Date(today.setHours(23, 59, 59, 999));
  
      const restaurant = await prisma.restaurant.findUnique({
        where: {
          id: id
        }
      });
  
      if (!restaurant) {
        return res.status(404).send("Restaurant not found");
      }
  
      const orders = await prisma.order.findMany({
        where: {
          restaurantId: id,
          createdAt: {
            gte: startDate, 
            lt: endDate 
          },
          status: "PAID" 
        },
        include: {
          items: {
            include: { menuItem: {include: {category: true}} },
          },
          restaurant: true,
          kitchenOrders: true, 
          barOrders: true, 
          table: true,
          bills:{ include: {
            creditCardPayments: {
              include: { card : true}
            },
            discount: true
          }}
        }
      });


      const totalSales = orders.reduce((acc, order) => {
        const orderTotal = order.items.reduce((sum, item) => {
          return sum + (item.quantity * item.menuItem.price);
        }, 0);
        acc.total += orderTotal;
  
        // Categorize items
        order.items.forEach(item => {
          const categoryName = item.menuItem.category.name;
          const categorySales = item.quantity * item.menuItem.price;
  
          if (!acc.categories[categoryName]) {
            acc.categories[categoryName] = { quantitySold: 0, totalSales: 0 };
          }
  
          acc.categories[categoryName].quantitySold += item.quantity;
          acc.categories[categoryName].totalSales += categorySales;
        });
  
        return acc;
      }, { total: 0, categories: {} });


      const totalTax = orders.reduce((acc, order) => {
        if(order.bills.length > 0){
        const bill = order.bills[0];
        return acc + (bill?.taxAmount || 0);
      } // Assuming each order has one bill
      }, 0);
  
      const totalPayments = {
        cash: 0,
        giftCard: 0,
        credit: 0,
      };
  
      let totalTips = 0; // Variable to track total tips
    const creditCardBreakdown = {}; // Object to store credit card breakdown
    const discounts = {}; // Object to store discount information


    orders.forEach(order => {
      const bill = order.bills[0]; // Assuming each order has one bill
      if (bill) {
        totalPayments.cash += bill.cashPaymentAmount || 0;
        totalPayments.giftCard += bill.giftCardPaymentAmount || 0;
        totalTips += bill.tipAmount || 0; // Add to total tips

        // Add credit card payments
        if (bill?.creditCardPayments) {
          bill.creditCardPayments.forEach(payment => {
            totalPayments.credit += payment.amount || 0;
            const cardType = payment.card.name; // Assuming card type is in the `name` field
            creditCardBreakdown[cardType] = creditCardBreakdown[cardType] || { amount: 0, transactions: 0 };
            creditCardBreakdown[cardType].amount += payment.amount || 0;
            creditCardBreakdown[cardType].transactions += 1;
          });
        }

        if (bill.discount) {
          const discountName = bill.discount.name;
          discounts[discountName] = discounts[discountName] || { count: 0, total: 0 };
          discounts[discountName].count += 1;
          discounts[discountName].total += bill.discountAmount; // Assuming there's a total field in the discount
        }
      
      }
    });
      // Prepare the response data
      const responseData = {
        orders,
        totalSales: totalSales.total,
        categorySales: totalSales.categories,
        totalTax: totalTax,
        paymentDetails: totalPayments,
        totalTips: totalTips,
        creditCardBreakdown: Object.entries(creditCardBreakdown).map(([cardType, details]) => ({
          cardType,
          amount: details.amount,
          transactions: details.transactions
        })),
        discounts: discounts
      };
  
      res.json(responseData); // Send the orders as the response
    } catch (error) {
      console.error("Error fetching Z-report data:", error);
      res.status(500).send("Internal Server Error");
    }
  }
  

module.exports = {
    getRestaurants,
    createRestaurant,
    getRestaurant,
    addRestaurantStaff,
    deleteRestaurant,
    updateRestaurant, 
    setRestaurantOpenStatus,
    setRestaurantTaxRate,
    createCreditCard,
    deleteCreditCard,
    getCreditCards,
    createDiscount,
    getDiscounts,
    deleteDiscount,
    getZreportData
}
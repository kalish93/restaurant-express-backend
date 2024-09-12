const { TableStatus, OrderStatus } = require('@prisma/client');
const prisma = require('../../database');
const io = require('../../../socketio');

async function createOrder(req, res) {
    try {
        const { restaurantId, tableId, items } = req.body;

        // Update table status to occupied
        const table = await prisma.table.update({
            where: { id: tableId },
            data: { status: TableStatus.OCCUPIED }
        });

        // Create a new order
        const order = await prisma.order.create({
            data: {
                tableId,
                restaurantId,
                status: OrderStatus.PENDING,
                items: {
                    create: items.map(item => ({
                        quantity: parseInt(item.quantity),
                        specialInstructions: item.specialInstructions || '',
                        menuItem: {
                            connect: { id: item.menuItem.id }
                        }
                    }))
                }
            },
            include: {
                items: {
                    include: { menuItem: true }
                }
            }
        });

        // Create notifications for relevant users
        const kitchenUsers = await prisma.user.findMany({
            where: { restaurantId, role: { name: 'Kitchen Staff' } } // Adjust role name as necessary
        });

        const barUsers = await prisma.user.findMany({
            where: { restaurantId, role: { name: 'Bartender' } } // Adjust role name as necessary
        });

        const waiterUsers = await prisma.user.findMany({
            where: { restaurantId, role: { name: 'Waiter' } } // Adjust role name as necessary
        });

        // Notify kitchen staff based on order items
        for (const orderItem of order.items) {
            if (orderItem.menuItem.destination === 'KITCHEN') {
                await prisma.kitchenOrder.create({
                    data: { orderId: order.id, status: OrderStatus.PENDING }
                });

                // Send notification to kitchen staff
                for (const user of kitchenUsers) {
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            message: `New order received for ${orderItem.menuItem.name}.`,
                            type: 'order',
                            status: 'unread'
                        }
                    });
                    io.to(user.socketId).emit('notification', { message: `New order received for ${orderItem.menuItem.name}.`, status: 'unread' });
                }
            } else if (orderItem.menuItem.destination === 'BAR') {
                await prisma.barOrder.create({
                    data: {
                        orderId: order.id,
                        stockId: orderItem.menuItem.stockId,
                        quantity: orderItem.quantity,
                        status: OrderStatus.PENDING
                    }
                });

                if (orderItem.menuItem.stockId) {
                  await prisma.stock.update({
                      where: { id: orderItem.menuItem.stockId },
                      data: {
                          quantity: {
                              decrement: orderItem.quantity
                          }
                      }
                  });
              }

                // Send notification to bar staff
                for (const user of barUsers) {
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            message: `New drink order for ${orderItem.menuItem.name}.`,
                            type: 'order',
                            status: 'unread'
                        }
                    });
                    io.to(user.socketId).emit('notification', { message: `New drink order for ${orderItem.menuItem.name}.` , status: 'unread'});
                }
            }
        }

        // Notify waiters about the new order
        for (const user of waiterUsers) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    message: `New order placed at Table ${table.number}.`,
                    type: 'order',
                    status: 'unread'
                }
            });
            io.to(user.socketId).emit('notification', { message: `New order placed at Table ${table.number}.`, status: 'unread' });
        }

        return res.status(201).json(order);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while creating the order.' });
    }
}


async function getActiveOrdersByTableId(req, res) {
    try {
        const { tableId } = req.params;

        // Retrieve active orders for the given table ID
        const activeOrders = await prisma.order.findMany({
            where: {
                tableId: tableId,
                status: {
                    in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.PAYMENT_REQUESTED, OrderStatus.READY, OrderStatus.SERVED],
                },
            },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                },
                kitchenOrders: true,
                barOrders: true,
                table: true,
                restaurant: true,
            }
        });

        return res.status(200).json(activeOrders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while retrieving active orders.' });
    }
}

async function getActiveOrders(req, res) {
    try {
        const { role, restaurantId } = req.user;
        // console.log(req.user);

        let whereClause = {
            restaurantId: restaurantId, // Ensure orders belong to the user's restaurant
            status: {
                in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.SERVED],
            },
        };

        if (role.name === 'Kitchen Staff') {
            whereClause.items = { some: { menuItem: { destination: 'KITCHEN' } } }; // Kitchen staff see only kitchen orders
        } else if (role.name === 'Bartender') {
            whereClause.items = { some: { menuItem: { destination: 'BAR' } } }; // Bar staff see only bar orders
        } else if (role.name === 'Waiter' && role.name === 'Restaurant Manager') {
            whereClause.status = { in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.SERVED, OrderStatus.PAYMENT_REQUESTED],}
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: {
                    include: {
                        menuItem: true,
                    }
                },
                table: true,
                kitchenOrders: true,
                barOrders: true,
            },
            orderBy: {
                createdAt: 'asc' // Orders are retrieved in the order they were created
            }
        });

        // Compute role-specific status
        // const activeOrders = orders.map(order => {
        //     const kitchenStatus = order.kitchenOrders.length > 0 
        //         ? order.kitchenOrders[0].status 
        //         : OrderStatus.PENDING;
        //     const barStatus = order.barOrders.length > 0 
        //         ? order.barOrders[0].status 
        //         : OrderStatus.PENDING;
                
        //     const roleSpecificStatus = (role.name === 'Kitchen Staff')
        //         ? kitchenStatus
        //         : (role.name === 'Bartender')
        //         ? barStatus
        //         : order.status;
                
        //     return {
        //         ...order,
        //         roleSpecificStatus: roleSpecificStatus
        //     };
        // });

        // return res.status(200).json(activeOrders);
        // Filter orders and return only relevant ones based on the role
        const activeOrders = orders.map(order => {
          const kitchenItems = order.items.filter(item => item.menuItem.destination === 'KITCHEN');
          const barItems = order.items.filter(item => item.menuItem.destination === 'BAR');
          
          // Determine role-specific view
          let relevantItems = order.items; // Default for roles like Waiter/Manager
          if (role.name === 'Kitchen Staff') {
              relevantItems = kitchenItems; // Show only kitchen items
          } else if (role.name === 'Bartender') {
              relevantItems = barItems; // Show only bar items
          }

          const kitchenStatus = order.kitchenOrders.length > 0 
              ? order.kitchenOrders[0].status 
              : OrderStatus.PENDING;
          const barStatus = order.barOrders.length > 0 
              ? order.barOrders[0].status 
              : OrderStatus.PENDING;
              
          const roleSpecificStatus = (role.name === 'Kitchen Staff')
              ? kitchenStatus
              : (role.name === 'Bartender')
              ? barStatus
              : order.status;

          // Return orders that have relevant items based on the role
          if (relevantItems.length > 0) {
              return {
                  ...order,
                  items: relevantItems,
                  roleSpecificStatus: roleSpecificStatus,
              };
          }
      }).filter(order => order !== undefined); // Filter out undefined (irrelevant orders)

      return res.status(200).json(activeOrders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while retrieving active orders.' });
    }
}


async function getOrderHistory(req, res) {
    try {
      const { role, restaurantId } = req.user;
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const pageSize = Math.max(parseInt(req.query.pageSize) || 10, 1);
  
      let whereClause = {
        restaurantId: restaurantId, // Ensure orders belong to the user's restaurant
        status: {
          in: [OrderStatus.PAID, OrderStatus.CANCELLED],
        },
      };
  
      if (role.name === 'Kitchen Staff') {
        whereClause.items = { some: { menuItem: { destination: 'KITCHEN' } } }; // Kitchen staff see only kitchen orders in history
      } else if (role.name === 'Bartender') {
        whereClause.items = { some: { menuItem: { destination: 'BAR' } } }; // Bar staff see only bar orders in history
      } else if (role.name !== 'Waiter' && role.name !== 'Restaurant Manager') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
  
      const totalCount = await prisma.order.count({
        where: whereClause,
      });
  
      const orderHistory = await prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          table: true,
          kitchenOrders: true,
          barOrders: true,
        },
        orderBy: {
          createdAt: 'asc', // Orders are retrieved in the order they were created
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
  
      const totalPages = Math.ceil(totalCount / pageSize);
  
      return res.status(200).json({
        items: orderHistory,
        totalCount: totalCount,
        pageSize: pageSize,
        currentPage: page,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while retrieving order history.' });
    }
  }
  


async function updateOrderStatus(req, res) {
    const { id, newStatus, type } = req.body;
    const { role } = req.user;
  
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'CANCELLED'];
  
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }


    const orderToUpdate = await prisma.order.findUnique({
        where: {id: id},
        include:{table: true, restaurant: true, items: {
          include: {menuItem: true}
        }}
    })

    const waiterUsers = await prisma.user.findMany({
        where: { restaurantId: orderToUpdate.restaurant.id , role: { name: 'Waiter' } } // Adjust role name as necessary
    });

    const BartenderUsers = await prisma.user.findMany({
        where: { restaurantId: orderToUpdate.restaurant.id , role: { name: 'Bartender' } } // Adjust role name as necessary
    });
  
    const KitchenUsers = await prisma.user.findMany({
        where: { restaurantId: orderToUpdate.restaurant.id , role: { name: 'Kitchen Staff' } } // Adjust role name as necessary
    });
  
    try {
      let order;
      let kitchenOrders = [];
      let barOrders = [];
  
      // Helper function to determine the final order status
      const determineFinalStatus = (kitchenOrders, barOrders) => {
        const allKitchenReady = kitchenOrders.every(k => k.status === 'READY');
        const allKitchenServed = kitchenOrders.every(k => k.status === 'SERVED');
        const allBarReady = barOrders.every(b => b.status === 'READY');
        const allBarServed = barOrders.every(b => b.status === 'SERVED');
  
        if (allKitchenServed && allBarServed) return 'SERVED';
        if (allKitchenReady && allBarReady) return 'READY';
        if (kitchenOrders.some(k => k.status === 'IN_PROGRESS') || barOrders.some(b => b.status === 'IN_PROGRESS')) return 'IN_PROGRESS';
        return 'PENDING';
      };

      if (role.name === 'Kitchen Staff') {
        order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
  
        await prisma.kitchenOrder.updateMany({
          where: { orderId: id },
          data: { status: newStatus },
        });


        kitchenOrders = await prisma.kitchenOrder.findMany({
            where: { orderId: id },
          });
    
          barOrders = await prisma.barOrder.findMany({
            where: { orderId: id },
          });
  
        if(newStatus === OrderStatus.READY){
            for (const user of waiterUsers) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        message: `Kitchen order for Table ${orderToUpdate.table.number} is ready.`,
                        type: 'order',
                        status: 'unread'
                    }
                });
                io.to(user.socketId).emit('notification', { message: `Kitchen order for Table ${orderToUpdate.table.number} is ready.`, status: 'unread' });
            }
        }
  
      } else if (role.name === 'Bartender') {
        order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
  
        await prisma.barOrder.updateMany({
          where: { orderId: id },
          data: { status: newStatus },
        });
  

        kitchenOrders = await prisma.kitchenOrder.findMany({
            where: { orderId: id },
          });
    
          barOrders = await prisma.barOrder.findMany({
            where: { orderId: id },
          });

          if(newStatus === OrderStatus.READY){
            for (const user of waiterUsers) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        message: `Bar order for Table ${orderToUpdate.table.number} is ready.`,
                        type: 'order',
                        status: 'unread'
                    }
                });
                io.to(user.socketId).emit('notification', { message: `Bar order for Table ${orderToUpdate.table.number} is ready.`, status: 'unread' });
            }
        }
  
      } else if (role.name === 'Waiter' || role.name === 'Restaurant Manager') {
        order = await prisma.order.findUnique({
          where: { id },
          include: {
            kitchenOrders: true,
            barOrders: true,
          },
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if(type === 'Kitchen'){
            await prisma.kitchenOrder.updateMany({
                where: { orderId: id },
                data: { status: newStatus },
              });
        }else if(type === 'Bar'){
            await prisma.barOrder.updateMany({
                where: { orderId: id },
                data: { status: newStatus },
              });
        }else{
            await prisma.order.update({
                where: { id },
                data: { status: newStatus },
              });

             
                await prisma.kitchenOrder.updateMany({
                  where: { orderId: id },
                  data: { status: newStatus },
                });
                await prisma.barOrder.updateMany({
                  where: { orderId: id },
                  data: { status: newStatus },
                });
        }

        if(newStatus === OrderStatus.CANCELLED){
          for (const user of BartenderUsers) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    message: `Order for Table ${orderToUpdate.table.number} has been canceled.`,
                    type: 'order',
                    status: 'unread'
                }
            });
            io.to(user.socketId).emit('notification', { message: `Order for Table ${orderToUpdate.table.number} has been canceled.`, status: 'unread' });
            
            for( const item of  orderToUpdate.items){
              if (item.menuItem.stockId) {
                await prisma.stock.update({
                    where: { id: item.menuItem.stockId },
                    data: {
                        quantity: {
                            increment: item.quantity
                        }
                    }
                });
            }
            }
        }
          for (const user of KitchenUsers) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    message: `Order for Table ${orderToUpdate.table.number} has been canceled.`,
                    type: 'order',
                    status: 'unread'
                }
            });
            io.to(user.socketId).emit('notification', { message: `Order for Table ${orderToUpdate.table.number} has been canceled.`, status: 'unread' });
        }
        }
  
       
      } else {
        return res.status(403).json({ error: 'You do not have permission to update this order' });
      }
  
      // Determine the final status based on sub-orders
      const finalStatus = determineFinalStatus(kitchenOrders, barOrders);
     
       if(kitchenOrders.length > 0 || barOrders.length > 0){
        await prisma.order.update({
            where: { id: id },
            data: { status: finalStatus },
          });
       }
      
  
      return res.status(200).json(order);
    } catch (error) {
      console.error('Error updating order status:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async function removeOrderItem(req, res) {
    try {
        const id  = req.params.id;

        // Find the order item to delete
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: id },
            include: { order: {
              include: {restaurant: true, table: true}
            } , menuItem: true}
        });

        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        if(orderItem.menuItem.stockId){
          await prisma.stock.update({
            where: {id : orderItem.menuItem.stockId},
            data: {
              quantity: {
                decrement: orderItem.quantity
            }
            }
          })
        }

        // Remove the order item
        await prisma.orderItem.delete({
            where: { id: id }
        });

        const BartenderUsers = await prisma.user.findMany({
          where: { restaurantId: orderItem.order.restaurant.id , role: { name: 'Bartender' } } // Adjust role name as necessary
      });

        const KitchenUsers = await prisma.user.findMany({
          where: { restaurantId: orderItem.order.restaurant.id , role: { name: "Kitchen Staff" } } // Adjust role name as necessary
      });

        if(orderItem.menuItem.destination === 'KITCHEN'){
          for (const user of KitchenUsers) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    message: `An item "${orderItem.menuItem.name}" has been removed from the order of table ${orderItem.order.table.name} has been removed.`,
                    type: 'order',
                    status: 'unread'
                }
            });
            io.to(user.socketId).emit('notification', { message: `An item "${orderItem.menuItem.name}" has been removed from the order of table ${orderItem.order.table.name} has been removed.`, status: 'unread' });
        }
        }else{
          for (const user of BartenderUsers) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    message: `An item "${orderItem.menuItem.name}" has been removed from the order of table ${orderItem.order.table.name} has been removed.`,
                    type: 'order',
                    status: 'unread'
                }
            });
            io.to(user.socketId).emit('notification', { message: `An item "${orderItem.menuItem.name}" has been removed from the order of table ${orderItem.order.table.name} has been removed.`, status: 'unread' });
        }
        }

        return res.status(200).json({ message: 'Order item removed successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while removing the order item.' });
    }
}


async function updateOrderItem(req, res) {
  try {
      const { id, quantity, specialInstructions } = req.body;

      // Find the order item to update
      const orderItem = await prisma.orderItem.findUnique({
          where: { id: id },
          include: { order: {
            include:{
              restaurant: true,
              table: true
            }
          } , menuItem: true}
      });

      const quantityDifference = orderItem.quantity - quantity;
      if (!orderItem) {
          return res.status(404).json({ error: 'Order item not found' });
      }

      if(orderItem.menuItem.stockId){
        await prisma.stock.update({
          where: {id : orderItem.menuItem.stockId},
          data: {
            quantity: {
              decrement: quantityDifference
          }
          }
        })
      }

      // Update the order item
      const updatedOrderItem = await prisma.orderItem.update({
          where: { id: id },
          data: {
              quantity: parseInt(quantity),
              specialInstructions: specialInstructions || ''
          }
      });

      const BartenderUsers = await prisma.user.findMany({
        where: { restaurantId: orderItem.order.restaurant.id , role: { name: 'Bartender' } } // Adjust role name as necessary
    });

      const KitchenUsers = await prisma.user.findMany({
        where: { restaurantId: orderItem.order.restaurant.id , role: { name: "Kitchen Staff" } } // Adjust role name as necessary
    });

      if(orderItem.menuItem.destination === 'KITCHEN'){
        for (const user of KitchenUsers) {
          await prisma.notification.create({
              data: {
                  userId: user.id,
                  message: `The order of table ${orderItem.order.table.name} has been updated.`,
                  type: 'order',
                  status: 'unread'
              }
          });
          io.to(user.socketId).emit('notification', { message: `The order of table ${orderItem.order.table.name} has been updated.`, status: 'unread' });
      }
      }else{
        for (const user of BartenderUsers) {
          await prisma.notification.create({
              data: {
                  userId: user.id,
                  message: `The order of table ${orderItem.order.table.name} has been updated.`,
                  type: 'order',
                  status: 'unread'
              }
          });
          io.to(user.socketId).emit('notification', { message: `The order of table ${orderItem.order.table.name} has been updated.`, status: 'unread' });
      }
      }


      return res.status(200).json(updatedOrderItem);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while updating the order item.' });
  }
}
  

async function addOrderItem(req, res) {
  try {
      const { orderId, menuItemId, quantity, specialInstructions } = req.body;

      // Fetch the order to check if it's a bar or kitchen order
      const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { menuItem: true } }, restaurant: true, table: true }
      });

      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      if(order.menuItem?.stockId){
       const stock = await prisma.stock.findUnique({
          where: {id: order.menuItem.stockId}
        })

        if(stock.quantity < quantity){
          return res.status(403).json({ error: 'You dont have this much amount for the item in the stock.' });

        }else{
        await prisma.stock.update({
          where: {id : order.menuItem.stockId},
          data: {
            quantity: {
              decrement: quantityDifference
          }
          }
        })
      }
      }


      // Create a new order item
      const orderItem = await prisma.orderItem.create({
          data: {
              quantity: parseInt(quantity),
              specialInstructions: specialInstructions || '',
              menuItem: {
                  connect: { id: menuItemId }
              },
              order: {
                connect: { id : orderId}
              }
          },
          include: {
              menuItem: true,
          }
      });

      // Check if the item is for the kitchen or bar and handle accordingly
      if (orderItem.menuItem.destination === 'KITCHEN') {
          await prisma.kitchenOrder.create({
              data: {
                  orderId: order.id,
                  status: OrderStatus.PENDING
              }
          });
      } else if (orderItem.menuItem.destination === 'BAR') {
          await prisma.barOrder.create({
              data: {
                  orderId: order.id,
                  stockId: orderItem.menuItem?.stockId,
                  status: OrderStatus.PENDING
              }
          });
      }
      

      const BartenderUsers = await prisma.user.findMany({
        where: { restaurantId: order.restaurant.id , role: { name: 'Bartender' } } // Adjust role name as necessary
    });

      const KitchenUsers = await prisma.user.findMany({
        where: { restaurantId: order.restaurant.id , role: { name: "Kitchen Staff" } } // Adjust role name as necessary
    });

      if(orderItem.menuItem.destination === 'KITCHEN'){
        for (const user of KitchenUsers) {
          await prisma.notification.create({
              data: {
                  userId: user.id,
                  message: `The order of table ${order.table.name} has been updated.`,
                  type: 'order',
                  status: 'unread'
              }
          });
          io.to(user.socketId).emit('notification', { message: `The order of table ${order.table.name} has been updated.`, status: 'unread' });
      }
      }else{
        for (const user of BartenderUsers) {
          await prisma.notification.create({
              data: {
                  userId: user.id,
                  message: `The order of table ${order.table.name} has been updated.`,
                  type: 'order',
                  status: 'unread'
              }
          });
          io.to(user.socketId).emit('notification', { message: `The order of table ${order.table.name} has been updated.`, status: 'unread' });
      }
      }

      return res.status(201).json(orderItem);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while adding the order item.' });
  }
}


async function requestPaymentByTable(req, res) {
  try {
      const { tableId } = req.params; // Table ID from the request body
      // const { role } = req.user; // Role of the current user

      // if (role.name !== 'Waiter' && role.name !== 'Restaurant Manager') {
      //     return res.status(403).json({ error: 'You do not have permission to request payment' });
      // }

      // Find all orders associated with the table that are not canceled or paid
      const orders = await prisma.order.findMany({
          where: {
              tableId: tableId,
              status: {
                  notIn: ['CANCELLED', 'PAID'] // Exclude canceled and paid orders
              }
          },
          include: {
              restaurant: true,
              kitchenOrders: true, // Include kitchen orders
              barOrders: true, // Include bar orders
              table: true
          }
      });

      if (orders.length === 0) {
          return res.status(404).json({ error: 'No orders found for the specified table' });
      }

      // Extract IDs for updating order statuses
      const orderIds = orders.map(order => order.id);
      const kitchenOrderIds = orders.flatMap(order => order.kitchenOrders.map(kitchenOrder => kitchenOrder.id));
      const barOrderIds = orders.flatMap(order => order.barOrders.map(barOrder => barOrder.id));

      // Update the status of the main orders, kitchen orders, and bar orders to "Payment Requested"
      await prisma.order.updateMany({
          where: { id: { in: orderIds } },
          data: { status: 'PAYMENT_REQUESTED' }
      });

      await prisma.kitchenOrder.updateMany({
          where: { id: { in: kitchenOrderIds } },
          data: { status: 'PAYMENT_REQUESTED' }
      });

      await prisma.barOrder.updateMany({
          where: { id: { in: barOrderIds } },
          data: { status: 'PAYMENT_REQUESTED' }
      });

      // Notify the waiters
      const waiterUsers = await prisma.user.findMany({
          where: { restaurantId: orders[0].restaurant.id, role: { name: 'Waiter' } }
      });

      for (const user of waiterUsers) {
          await prisma.notification.create({
              data: {
                  userId: user.id,
                  message: `Payment has been requested for Table ${orders[0].table.number}.`,
                  type: 'order',
                  status: 'unread'
              }
          });
          io.to(user.socketId).emit('notification', { message: `Payment has been requested for Table ${tableId}.`, status: 'unread' });
      }

      return res.status(200).json({ message: 'Payment request has been sent successfully' });
  } catch (error) {
      console.error('Error requesting payment:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
  }
}

const generateBillForTableOrders = async (req, res) => {

  try {

    const {orderIds} = req.body;
    
    // Fetch the orders by the given orderIds
    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      include: {
        items: {
          include: { menuItem: true },
        },
            restaurant: true,
            kitchenOrders: true, // Include kitchen orders
            barOrders: true, // Include bar orders
            table: true
        
    }});

    if (orders.length === 0) {
        return res.status(404).json({ error: 'No orders found for the specified table' });
    }

    const table = await prisma.table.update({
      where:{id: orders[0].table.id},
      data:{
        status: TableStatus.AVAILABLE
      }
    })

    // Extract IDs for updating order statuses
    const kitchenOrderIds = orders.flatMap(order => order.kitchenOrders.map(kitchenOrder => kitchenOrder.id));
    const barOrderIds = orders.flatMap(order => order.barOrders.map(barOrder => barOrder.id));

    // Update the status of the main orders, kitchen orders, and bar orders to "Payment Requested"
    await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: OrderStatus.PAID }
    });

    await prisma.kitchenOrder.updateMany({
        where: { id: { in: kitchenOrderIds } },
        data: { status: OrderStatus.PAID }
    });

    await prisma.barOrder.updateMany({
        where: { id: { in: barOrderIds } },
        data: { status: OrderStatus.PAID }
    });


    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found' });
    }

    // Calculate the combined total for all orders
    const total = orders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce((orderSum, item) => {
          return orderSum + item.quantity * item.menuItem.price;
        }, 0)
      );
    }, 0);

    // Create a consolidated bill
    const bill = await prisma.bill.create({
      data: {
        total: total,
        orderId: orders[0].id, // Associate it with the first order from the table
      },
    });

    res.status(201).json({
      message: 'Bill generated successfully for selected orders',
      bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating bill' });
  }
};

const generateBillForOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate the total for the order
    const total = order.items.reduce((sum, item) => {
      return sum + item.quantity * item.menuItem.price;
    }, 0);

    // Create a bill in the database
    const bill = await prisma.bill.create({
      data: {
        total: total,
        orderId: orderId,
      },
    });

    res.status(201).json({
      message: 'Bill generated successfully',
      bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating bill' });
  }
};

module.exports = {
    createOrder,
    getActiveOrdersByTableId,
    getActiveOrders,
    getOrderHistory,
    updateOrderStatus,
    removeOrderItem,
    updateOrderItem,
    addOrderItem,
    requestPaymentByTable, 
    generateBillForTableOrders,
    generateBillForOrder
};
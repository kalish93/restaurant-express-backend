const { TableStatus, OrderStatus } = require('@prisma/client');
const prisma = require('../../database');

async function createOrder(req, res) {
    try {
        const { restaurantId, tableId, items } = req.body;

        const table = await prisma.table.update({
            where:{id: tableId},
            data:{
                status: TableStatus.OCCUPIED
            }
        })

        // Create a new order
        const order = await prisma.order.create({
            data: {
                tableId: tableId,
                restaurantId: restaurantId,
                status: 'PENDING',
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
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        // Process each order item based on its destination
        for (const orderItem of order.items) {
            if (orderItem.menuItem.destination === 'KITCHEN') {
                await prisma.kitchenOrder.create({
                    data: {
                        orderId: order.id,
                        status: 'PENDING'
                    }
                });
            } else if (orderItem.menuItem.destination === 'BAR') {

                if(orderItem.menuItem.stock){
                const stock = await prisma.stock.findUnique({
                    where: { id: orderItem.menuItem.stockId }
                });


                if (stock.quantity < orderItem.quantity) {
                    return res.status(400).json({ error: `Insufficient stock for ${orderItem.menuItem.name}` });
                }

                await prisma.barOrder.create({
                    data: {
                        orderId: order.id,
                        stockId: orderItem.menuItem.stockId,
                        quantity: orderItem.quantity,
                        status: 'PENDING'
                    }
                });

                // Update stock quantity
                await prisma.stock.update({
                    where: { id: orderItem.menuItem.stockId },
                    data: { quantity: stock.quantity - orderItem.quantity }
                });
            }else{
                await prisma.barOrder.create({
                    data: {
                        orderId: order.id,
                        quantity: orderItem.quantity,
                        status: 'PENDING'
                    }
                });
            }
            }
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
            }
        });

        return res.status(200).json(activeOrders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while retrieving active orders.' });
    }
}

module.exports = {
    createOrder,
    getActiveOrdersByTableId
};
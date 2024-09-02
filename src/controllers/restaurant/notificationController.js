const prisma = require('../../database');
const io = require('../../../socketio');

async function getUnreadNotificationsCount(req, res) {
    const userId = req.user.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        status: 'unread',
      },
    });

    res.json(unreadCount);

  }
  

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const allNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

    res.json(allNotifications);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function markNotificationsAsRead(req, res) {
  try {
    const userId = req.user.id;

    const readNotification = await prisma.notification.updateMany({
          where: {
            userId,
            status: 'unread',
          },
          data: {
            status: 'read',
          },
        });

    res.json(readNotification);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const notificationId = req.params.id;

    const readNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'read' },
      });

    res.json(readNotification);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).send("Internal Server Error");
  }
}


async function createCallWaiterNotification(req, res) {
    try {
      const {restaurantId, tableId} = req.body;

      const waiterUsers = await prisma.user.findMany({
        where: { restaurantId: restaurantId , role: { name: 'Waiter' } } // Adjust role name as necessary
    });

    const table = await prisma.table.findUnique({
        where:{id: tableId}
    })
  

      for (const user of waiterUsers) {
        await prisma.notification.create({
            data: {
                userId: user.id,
                message: `Customer at Table ${table.number} is requesting to get a waiter.`,
                type: 'order',
                status: 'unread'
            }
        });
        io.to(user.socketId).emit('notification', { message: `Customer at Table ${table.number} is requesting to get a waiter.`, status: 'unread' });
    }
  
      res.json();
    } catch (error) {
      console.error("Error retrieving notifications:", error);
      res.status(500).send("Internal Server Error");
    }
  }

module.exports = {
    getUnreadNotificationsCount,
    getNotifications,
    markNotificationAsRead,
    markNotificationsAsRead,
    createCallWaiterNotification
}
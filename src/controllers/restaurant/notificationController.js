const prisma = require('../../database');


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

module.exports = {
    getUnreadNotificationsCount,
    getNotifications,
    markNotificationAsRead,
    markNotificationsAsRead
}
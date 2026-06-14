const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNotification = async (userId, title, message, eventType = "GENERAL") => {
  return prisma.notification.create({
    data: { userId, title, message, eventType },
  });
};

const getUserNotifications = async (userId, limit = 20) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
};

const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

const markAsRead = async (id, userId) => {
  return prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true },
  });
};

const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

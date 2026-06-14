const notifRepo = require("../repositories/notificationRepository");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await notifRepo.getUserNotifications(userId);
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notifRepo.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    await notifRepo.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await notifRepo.markAllAsRead(req.user.id);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const notifCtrl = require("../controllers/notificationController");

// All routes require authentication
router.use(auth);

// GET /api/notifications                   - get user's notifications
router.get("/", notifCtrl.getNotifications);

// GET /api/notifications/unread-count      - badge count
router.get("/unread-count", notifCtrl.getUnreadCount);

// PATCH /api/notifications/read-all        - mark all as read
router.patch("/read-all", notifCtrl.markAllRead);

// PATCH /api/notifications/:id/read        - mark single as read
router.patch("/:id/read", notifCtrl.markRead);

module.exports = router;

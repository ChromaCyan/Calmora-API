const express = require("express");
const router = express.Router();
const { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } = require("../controller/notificationController");

// Get all notifications for a user
router.get("/:userId", getUserNotifications);

// Mark a notification as read
router.put("/:notificationId/read", markNotificationAsRead);

// Mark all notifications as read for a user
router.put("/mark-all/:userId", markAllNotificationsAsRead);

module.exports = router;

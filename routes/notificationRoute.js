const express = require("express");
const router = express.Router();
const { getUserNotifications, markNotificationAsRead } = require("../controller/notificationController");

// Get all notifications for a user
router.get("/:userId", getUserNotifications);

// Mark a notification as read
router.put("/:notificationId/read", markNotificationAsRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  sseStream, getNotifications, markRead,
  markAllRead, deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/stream', sseStream);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;

const Notification = require('../models/Notification');
const asyncHandler = require('../middlewares/asyncHandler');
const { paginate } = require('../utils/pagination');
const { successResponse, errorResponse } = require('../utils/response');

// In-memory SSE clients map: userId -> res
const sseClients = new Map();

// ─── SSE Stream ───────────────────────────────────────────────────────────────
const sseStream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user._id.toString();
  sseClients.set(userId, res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Keep-alive every 25s
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(userId);
  });
};

// Helper — push notification to connected SSE client
const pushNotification = (userId, notification) => {
  const client = sseClients.get(userId.toString());
  if (client) {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  }
};

// ─── Get Notifications ────────────────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const result = await paginate(Notification, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: 'actor', select: 'name avatar' },
  });

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return successResponse(
    res,
    { notifications: result.data, unreadCount },
    'Notifications fetched',
    200,
    result.pagination
  );
});

// ─── Mark as Read ─────────────────────────────────────────────────────────────
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return errorResponse(res, 'Notification not found', 404);
  return successResponse(res, notification, 'Marked as read');
});

// ─── Mark All as Read ─────────────────────────────────────────────────────────
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  return successResponse(res, null, 'All notifications marked as read');
});

// ─── Delete Notification ──────────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });
  if (!notification) return errorResponse(res, 'Notification not found', 404);
  return successResponse(res, null, 'Notification deleted');
});

module.exports = {
  sseStream,
  pushNotification,
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};

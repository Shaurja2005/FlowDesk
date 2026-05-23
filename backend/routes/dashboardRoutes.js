const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getMyTasks, getRecentActivity,
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/my-tasks', getMyTasks);
router.get('/activity', getRecentActivity);

module.exports = router;

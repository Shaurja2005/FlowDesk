const express = require('express');
const router = express.Router();
const { getActivityFeed, getProjectActivity } = require('../controllers/activityController');
const { protect } = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');

router.use(protect);

router.get('/', roleGuard('admin', 'manager'), getActivityFeed);
router.get('/project/:projectId', getProjectActivity);

module.exports = router;

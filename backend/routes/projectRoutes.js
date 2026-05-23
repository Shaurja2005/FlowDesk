const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProjects, createProject, getProjectById,
  updateProject, deleteProject, addMember,
  removeMember, getProjectActivity,
} = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validate');

router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  roleGuard('admin', 'manager'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validate,
  createProject
);

router.get('/:id', getProjectById);

router.put(
  '/:id',
  roleGuard('admin', 'manager'),
  [body('title').optional().trim().notEmpty()],
  validate,
  updateProject
);

router.delete('/:id', roleGuard('admin', 'manager'), deleteProject);

router.post(
  '/:id/members',
  roleGuard('admin', 'manager'),
  [body('userId').notEmpty().withMessage('userId is required')],
  validate,
  addMember
);

router.delete('/:id/members/:userId', roleGuard('admin', 'manager'), removeMember);

router.get('/:id/activity', getProjectActivity);

module.exports = router;

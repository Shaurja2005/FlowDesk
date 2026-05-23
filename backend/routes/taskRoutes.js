const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasks, createTask, getTaskById,
  updateTask, deleteTask, addComment,
  deleteComment, logTime,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(protect);

router.get('/', getTasks);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done', 'blocked']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validate,
  createTask
);

router.get('/:id', getTaskById);

router.put(
  '/:id',
  [
    body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done', 'blocked']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validate,
  updateTask
);

router.delete('/:id', deleteTask);

router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  addComment
);

router.delete('/:id/comments/:commentId', deleteComment);

router.put(
  '/:id/log-time',
  [body('hours').isFloat({ gt: 0 }).withMessage('Hours must be a positive number')],
  validate,
  logTime
);

module.exports = router;

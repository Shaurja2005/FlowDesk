const mongoose = require('mongoose');
const { ACTIVITY_ACTIONS } = require('../config/constants');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ACTIVITY_ACTIONS),
      required: true,
    },
    entity: {
      type: String, // 'task' | 'project' | 'user' | 'comment'
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityTitle: {
      type: String, // human-readable label e.g. task title
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // extra payload (old/new values etc.)
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

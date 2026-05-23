/**
 * roleGuard — factory that returns middleware to restrict access by role.
 * Usage: roleGuard('admin', 'manager')
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = roleGuard;

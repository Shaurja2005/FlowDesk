/**
 * asyncHandler — wraps async route handlers to catch errors
 * and forward them to the central error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

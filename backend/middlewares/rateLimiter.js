const rateLimit = require('express-rate-limit');

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_GLOBAL) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: (req) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return true;
    if (req.path.startsWith('/api/integrations/github')) return true;
    return false;
  }
});

// ─── Auth Rate Limiter ───────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH) || 10,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GitHub OAuth Rate Limiter ───────────────────────────────────────────────
const githubOAuthLimiter = rateLimit({
  windowMs: parseInt(process.env.GITHUB_OAUTH_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.GITHUB_OAUTH_RATE_LIMIT_MAX) || 30,
  message: { success: false, message: 'Too many OAuth attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  githubOAuthLimiter,
};

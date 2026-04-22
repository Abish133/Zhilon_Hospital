let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  rateLimit = null;
}

const simpleLimiter = (windowMs, max, message) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = (req.ip || req.connection?.remoteAddress || 'unknown') + ':' + (req.path || '');
    const now = Date.now();
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }
    entry.count++;
    hits.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ success: false, message });
    }
    next();
  };
};

const buildLimiter = (windowMs, max, message) => {
  if (rateLimit) {
    return rateLimit({
      windowMs,
      max,
      message: { success: false, message },
      standardHeaders: true,
      legacyHeaders: false
    });
  }
  return simpleLimiter(windowMs, max, message);
};

const authLimiter = buildLimiter(15 * 60 * 1000, 20, 'Too many authentication attempts. Try again later.');
const apiLimiter = buildLimiter(15 * 60 * 1000, 2000, 'Too many requests. Please slow down.');

module.exports = { authLimiter, apiLimiter };

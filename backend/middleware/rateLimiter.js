// Middleware de limitation de débit (Rate Limiting) in-memory
const rateLimiter = ({ windowMs = 60 * 1000, max = 60, message = 'Trop de requêtes effectuées. Veuillez réessayer dans quelques instants.' } = {}) => {
  const requests = new Map();

  // Nettoyage périodique pour éviter toute fuite mémoire
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const timestamps = requests.get(key) || [];

    const windowStart = now - windowMs;
    const recent = timestamps.filter(t => t > windowStart);

    if (recent.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    recent.push(now);
    requests.set(key, recent);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recent.length));

    next();
  };
};

module.exports = rateLimiter;

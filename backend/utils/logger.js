const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const appLogPath = path.join(logsDir, 'app.log');
const errorLogPath = path.join(logsDir, 'error.log');

const sanitize = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    return data
      .replace(/("password"|"motDePasse"|"token"|"authorization"):\s*"[^"]+"/gi, '$1:"***"')
      .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer ***');
  }
  if (typeof data === 'object') {
    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const key in copy) {
      if (/password|motDePasse|token|authorization|secret/i.test(key)) {
        copy[key] = '***';
      } else if (typeof copy[key] === 'object') {
        copy[key] = sanitize(copy[key]);
      }
    }
    return copy;
  }
  return data;
};

const writeLog = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = meta ? sanitize(meta) : '';
  const metaStr = sanitizedMeta ? ` | ${typeof sanitizedMeta === 'object' ? JSON.stringify(sanitizedMeta) : sanitizedMeta}` : '';
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;

  // Console
  if (level === 'error') {
    console.error(`[${level.toUpperCase()}] ${message}`, meta || '');
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
  }

  // File
  try {
    fs.appendFileSync(appLogPath, logLine);
    if (level === 'error') {
      fs.appendFileSync(errorLogPath, logLine);
    }
  } catch (err) {
    console.error('Erreur écriture log fichier:', err.message);
  }
};

const logger = {
  info: (msg, meta) => writeLog('info', msg, meta),
  warn: (msg, meta) => writeLog('warn', msg, meta),
  error: (msg, meta) => writeLog('error', msg, meta),
  http: (req, res, duration) => {
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : (status >= 400 ? 'warn' : 'info');
    writeLog(level, `${req.method} ${req.originalUrl || req.url} - ${status} (${duration}ms)`, {
      ip: req.ip || req.headers['x-forwarded-for'],
      user: req.user?._id || 'anonymous',
    });
  },
};

module.exports = logger;

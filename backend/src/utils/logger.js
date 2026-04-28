'use strict';

// Lightweight structured logger. Wraps console so swapping to winston/pino
// later is a one-file change. Levels filtered by LOG_LEVEL env (default: info).

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;

const fmt = (level, msg, meta) => {
  const entry = { ts: new Date().toISOString(), level, msg };
  if (meta && typeof meta === 'object') {
    if (meta instanceof Error) {
      entry.error = meta.message;
      entry.stack = meta.stack;
    } else {
      Object.assign(entry, meta);
    }
  } else if (meta !== undefined) {
    entry.meta = meta;
  }
  return JSON.stringify(entry);
};

const write = (level, msg, meta) => {
  if (LEVELS[level] > current) return;
  const out = fmt(level, msg, meta);
  if (level === 'error' || level === 'warn') console.error(out);
  else console.log(out);
};

module.exports = {
  error: (msg, meta) => write('error', msg, meta),
  warn:  (msg, meta) => write('warn',  msg, meta),
  info:  (msg, meta) => write('info',  msg, meta),
  debug: (msg, meta) => write('debug', msg, meta)
};

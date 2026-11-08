/* Central error handler — never leaks stack traces in production */
export function errorHandler(err, _req, res, _next) {
  console.error('[error]', err);

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(422).json({ error: messages.join('; ') });
  }

  // Mongoose duplicate key (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `A record with this ${field} already exists.` });
  }

  // Known HTTP errors passed via next(err) with a status property
  if (err.status) {
    return res.status(err.status).json({ error: err.message || 'Error' });
  }

  // Generic
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: isProd ? 'An unexpected error occurred.' : err.message,
  });
}
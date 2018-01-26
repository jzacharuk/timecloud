/**
 * This middleware handles all errors that have flowed through the middleware/routes.
 */
module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.log('Error', err);
  console.log('ERRS', err.errors[0].message, err.errors[0].value);
  // The UnauthorizedError is thrown by checkAuth middleware.
  if (err.name === 'UnauthorizedError') {
    // log.warn({ err }, 'UnauthorizedError');
    return res.status(401).json({ error: 'You are not authenticated. Please login.' });

  // The PermissionError is throw by checkPerm middleware.
  } else if (err.name === 'PermissionError') {
    // log.warn({ err }, 'PermissionError');
    return res.status(403).json({ error: `You do not have permission (${err.permission}) to perform this action.` });

  // The ServerError is called by various middlware.
  } else if (err.name === 'ServerError') {
    // log.error({ err }, 'ServerError');
    return res.status(500).json({ error: 'Unexpected server error.' });
  }

  // Catch-All for any other errors.
  // log.error({ err }, 'UnknownError');
  return res.status(500).json({ error: 'Unspecific server error.' });
};

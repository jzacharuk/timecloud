const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('../middleware/errorHandler');
const routes = require('../routes');

const createApp = (config, db) => {
  // Create an instance of express
  const app = express();

  // Provide basic security settings.
  app.use(helmet());

  // Allow CORS requests
  app.use(cors());

  // Setup the logging middleware to log each request.
  // app.use(morgan());

  // Setup the middleware to parse the body (eg. req.body)
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Load in the routes
  app.use('/', routes);

  // Handle all errors from routes/middleware
  app.use(errorHandler);

  return app;
};

/**
 * Initializes the server.
 */
const init = (config, db, callback) => {
  // log.info('Initializing server');
  // log.debug({ config }, 'Server configuration');

  const app = createApp(config, db);

  // Start listening for connections
  app.listen(config.port, callback);
  // log.info({ port: config.port }, 'Listening for connections');
};

module.exports = {
  init,
  createApp,
};

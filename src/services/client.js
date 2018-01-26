const handleError = (err, res, next) => {
  if (err.name === 'Custom') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const { message, value } = err.errors[0];
    // TODO - make this generic.
    if (message === 'name must be unique') {
      return res.status(400).json({ error: `Client name (${value}) is already in use.` });
    }

    if (message === 'id must be unique') {
      return res.status(400).json({ error: `Client id (${value}) is already in use.` });
    }
  }

  if (err.name === 'SequelizeValidationError') {
    const { type, path } = err.errors[0];

    if (type === 'notNull Violation') {
      return res.status(400).json({ error: `Client ${path} is required.` });
    }
  }

  return next(err);
};

const create = (req, res, next) => {
  const { Client } = req.db;

  Client.create(req.body)
    .then(client => res.json(client))
    .catch(err => handleError(err, res, next));
};

const update = (req, res, next) => {
  const { Client } = req.db;

  Client.findById(req.params.clientId)
    .then((client) => {
      if (!client) {
        const err = new Error(`Client id (${req.params.clientId}) does not exist.`);
        err.name = 'Custom';
        throw err;
      }
      if (client.archived) {
        const err = new Error('Cannot update archived client.');
        err.name = 'Custom';
        throw err;
      }
      return client.update(req.body);
    })
    .then(newClient => res.json(newClient))
    .catch(err => handleError(err, res, next));
};

const list = (req, res, next) => {
  const { Client } = req.db;
  console.log('Client', Client);


  let attributes;
  if (req.query.attributes) {
    attributes = req.query.attributes.split(',');
  }

  const where = {
    archived: req.query.archived || false,
  };

  if (req.query.search) {
    where.name = { [Op.like]: `%${req.query.search}%` };
  }

  Client.findAndCountAll({
    where,
    attributes: attributes || ['id', 'name'],
    limit: req.query.limit || 10,
    offset: req.query.offset || 0,
    order: ['name'],
  })
    .then(clients => res.json(clients))
    .catch(err => handleError(err, res, next));
};

const single = (req, res, next) => {
  const { Client } = req.db;
  // const { Client, Contact } = req.db;

  Client.findById(req.params.clientId, {
    // include: [{ model: Contact }],
  })
    .then((client) => {
      if (!client) {
        const err = new Error(`Client id (${req.params.clientId}) does not exist.`);
        err.name = 'Custom';
        throw err;
      }
      res.json(client);
    })
    .then(client => res.json(client))
    .catch(err => handleError(err, res, next));
};

module.exports = {
  create,
  list,
  update,
  single,
};

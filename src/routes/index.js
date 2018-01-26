const express = require('express');
const clientService = require('../services/client');

const router = express.Router();

router.post('/clients', clientService.create);
router.get('/clients', clientService.list);
router.post('/clients/:clientId', clientService.update);
router.get('/clients/:clientId', clientService.single);
//
// router.post('/clients/:clientId/contacts', clientService.createContact);
// router.post('/clients/:clientId/contacts/:contactId', clientService.updateContact);

module.exports = router;

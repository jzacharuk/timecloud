const async = require('async');
const { beforeEach, describe, it } = require('mocha');
const { expect } = require('chai');
const request = require('supertest');


const models = require('../src/models');
const appInitializer = require('../src/init/app');

const config = {
  username: 'postgres',
  password: '',
  database: 'timecloud',
  host: '127.0.0.1',
  options: {
    dialect: 'postgresql',
    logging: false,
  },
};

const db = models.init(config);

const app = appInitializer.createApp({}, db);

beforeEach((done) => {
  db.sequelize.query('TRUNCATE TABLE "Clients" RESTART IDENTITY').spread((results, metadata) => {
    done();
  // Results will be an empty array and metadata will contain the number of affected rows.
  });
  // db.Client.truncate().finally(() => { done(); });
});

describe('POST /clients', () => {
  beforeEach((done) => {
    // Create a client so that we can test duplicate id/name.
    const body = { id: 100, name: 'Existing Client' };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        done();
      });
  });

  it('creates a minimal client', (done) => {
    const body = { name: 'Ministry of Defense' };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.body.error).to.not.exist;
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(body);
        done();
      });
  });

  it('creates a full client', (done) => {
    const body = {
      name: 'Ministry of Defense',
      address: '123 1st Street',
      notes: 'Some notes go here',
    };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(body);
        done();
      });
  });

  it('requires a name', (done) => {
    const body = { };
    const expected = { error: 'Client name is required.' };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('prevents duplicate id', (done) => {
    const body = { id: 100, name: 'New Client' };
    const expected = { error: 'Client id (100) is already in use.' };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('prevents duplicate name', (done) => {
    const body = { name: 'Existing Client' };
    const expected = { error: 'Client name (Existing Client) is already in use.' };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('defaults archived to false', (done) => {
    const body = { name: 'Ministry of Defense' };
    const expected = { name: 'Ministry of Defense', archived: false };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('allows archived to be manually set', (done) => {
    const body = { name: 'Ministry of Defense', archived: true };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(body);
        done();
      });
  });

  it('defaults createdAt and updatedAt', (done) => {
    const body = { name: 'Ministry of Defense' };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        const { createdAt, updatedAt } = result.body;
        expect(createdAt).to.exist;
        expect(updatedAt).to.exist;
        expect(createdAt).to.equal(updatedAt);
        done();
      });
  });
});

describe('POST /clients/1', () => {
  beforeEach((done) => {
    async.parallel([
      (cb) => {
        const body = { id: 1, name: 'Minimal Client' };
        request(app)
          .post('/clients')
          .send(body)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, cb);
      },
      (cb) => {
        const body = {
          id: 2, name: 'Full Client', address: '123 1st St', notes: 'The notes'
        };
        request(app)
          .post('/clients')
          .send(body)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, cb);
      },
      (cb) => {
        const body = {
          id: 3, name: 'Archived Client', archived: true,
        };
        request(app)
          .post('/clients')
          .send(body)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, cb);
      },
    ], done);
  });

  it('prevents update to archived client', (done) => {
    const body = { notes: 'These are some new notes' };
    const expected = { error: 'Cannot update archived client.' };

    request(app)
      .post('/clients/3')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('prevents update of non-existant id', (done) => {
    const body = { notes: 'These are some new notes' };
    const expected = { error: 'Client id (42) does not exist.' };

    request(app)
      .post('/clients/42')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('updates optional fields from null', (done) => {
    const body = { address: '1000 5th Street', notes: 'These are some notes' };
    const expected = { id: 1, address: '1000 5th Street', notes: 'These are some notes' };

    request(app)
      .post('/clients/1')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('updates optional fields to null', (done) => {
    const body = { address: null, notes: null };
    const expected = { id: 2, address: null, notes: null };

    request(app)
      .post('/clients/2')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('ignores update of id', (done) => {
    const body = { id: 42 };

    request(app)
      .post('/clients/1')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include({ id: 1 });
        done();
      });
  });

  it('prevents update of name to duplicate', (done) => {
    const body = { name: 'Full Client' };
    const expected = { error: 'Client name (Full Client) is already in use.' };

    request(app)
      .post('/clients/1')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('prevents update of name to null', (done) => {
    const body = { name: null };
    const expected = { error: 'Client name is required.' };

    request(app)
      .post('/clients/1')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('updates updatedAt', (done) => {
    const body = { name: 'New Name' };

    request(app)
      .post('/clients/1')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(new Date(result.body.updatedAt)).to.be.above(new Date(result.body.createdAt));
        done();
      });
  });
});

describe('GET /clients/1', () => {
  beforeEach((done) => {
    const body = {
      id: 1, name: 'Minimal Client', address: '5000 10th Ave', notes: 'Notes of sorts', archived: true,
    };

    request(app)
      .post('/clients')
      .send(body)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        done();
      });
  });

  it('errors on non-existant id', (done) => {
    const expected = { error: 'Client id (42) does not exist.' };

    request(app)
      .get('/clients/42')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.include(expected);
        done();
      });
  });

  it('retrieves all fields', (done) => {
    const expected = {
      id: 1, name: 'Minimal Client', address: '5000 10th Ave', notes: 'Notes of sorts', archived: true,
    };

    request(app)
      .get('/clients/1')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.include(expected);
        done();
      });
  });
});


describe('GET /clients', () => {
  beforeEach((done) => {
    const clients = [
      { name: 'Client A', notes: 'Hello world' },
      { name: 'Client B' },
      { name: 'Client C' },
      { name: 'Client D' },
      { name: 'Client E' },
      { name: 'Client F', archived: true },
      { name: 'Client G' },
      { name: 'Client H' },
      { name: 'Client I' },
      { name: 'Client J', archived: true },
      { name: 'Client K' },
      { name: 'Client L' },
      { name: 'Client M' },
      { name: 'Client N' },
      { name: 'Client O' },
    ];

    async.mapSeries(
      clients,
      (client, cb) => {
        request(app)
          .post('/clients')
          .send(client)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, cb);
      },
      done
    );
  });

  it('defaults fields to name and id', (done) => {
    request(app)
      .get('/clients/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.rows[0]).to.deep.equal({ id: 1, name: 'Client A' });
        done();
      });
  });

  it('allow filter using attributes', (done) => {
    request(app)
      .get('/clients/?attributes=id,name,notes')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.rows[0]).to.deep.equal({ id: 1, name: 'Client A', notes: 'Hello world' });
        done();
      });
  });

  it('filters out archived clients by default', (done) => {
    request(app)
      .get('/clients/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(13);
        done();
      });
  });

  it('filters by name searching', (done) => {
    request(app)
      .get('/clients/?name=O')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(1);
        done();
      });
  });

  it('filters based on archived flag', (done) => {
    request(app)
      .get('/clients/?archived=true')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(2);
        done();
      });
  });

  it('defaults limit to 10', (done) => {
    request(app)
      .get('/clients/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(13);
        expect(result.body.rows.length).to.equal(10);
        done();
      });
  });

  it('filters based on limit parameter', (done) => {
    request(app)
      .get('/clients/?limit=2')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(13);
        expect(result.body.rows.length).to.equal(2);
        done();
      });
  });

  it('defaults offset to 0', (done) => {
    request(app)
      .get('/clients/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.rows[0].name).to.equal('Client A');
        done();
      });
  });

  it('filters based on offset parameter', (done) => {
    request(app)
      .get('/clients/?offset=2')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end((err, result) => {
        expect(result.statusCode).to.equal(200);
        expect(result.body.rows[0].name).to.equal('Client C');
        done();
      });
  });

  it('allows searching of name');
});

const request  = require('supertest');
const mongoose = require('mongoose');

const { Customer } = require('../../models/customer');
const { User }     = require('../../models/user');

jest.useFakeTimers();

describe('/api/customers', () => {
  beforeEach(() => { server = require('../../index'); });
  afterEach(async () => {
    await server.close();
    await Customer.deleteMany({});
  });

  describe('GET /', () => {
    let token;

    beforeEach(() => {
      token = new User().generateAuthToken();
    });

    it('Should return 401 if client is not logged in', async () => {
      const res = await request(server).get('/api/customers');

      expect(res.status).toEqual(401);
    });

    it('Should return 400 if token is invalid', async () => {
      token = 'a';

      const res = await request(server)
        .get('/api/customers')
        .set('x-auth-token', token);

      expect(res.status).toEqual(400);
    });

    it('Should return all the customers', async () => {
      await Customer.collection.insertMany([
        {
          name: '12345',
          phone: '12345',
          isGold: true
        },
        {
          name: '67890',
          phone: '67890',
          isGold: false
        }
      ]);

      const res = await request(server)
        .get('/api/customers/')
        .set('x-auth-token', token);

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body.some(c => c.name === '12345')).toBeTruthy();
      expect(res.body.some(c => c.name === '67890')).toBeTruthy();
    }); 
  });

  describe('GET /:id', () => {
    let token = new User().generateAuthToken();

    it('Should return a customer if valid id is provided', async () => {
      const customer = new Customer({
        name: '12345',
        phone: '12345',
      });
      await customer.save();

      const res = await request(server)
        .get(`/api/customers/${customer._id}`)
        .set('x-auth-token', token);

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('name', customer.name);
    });

    it('Should return 404 if invalid id is provided', async () => {
      const res = await request(server)
        .get('/api/customers/1')
        .set('x-auth-token', token);

      expect(res.status).toEqual(404);
    });

    it('Should return 404 if no customer with given id exists', async () => {
      let id = mongoose.Types.ObjectId();

      const res = await request(server)
        .get(`/api/customers/${id}`)
        .set('x-auth-token', token);

      expect(res.status).toEqual(404);
    });
  });

  describe('POST /', () => {
    let token;
    let name;
    let phone;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      name  = '12345';
      phone = '12345';
    });

    afterEach(async () => {
      await Customer.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .post('/api/customers/')
        .set('x-auth-token', token)
        .send({ name, phone });
    }

    it('Should return 401 if user is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toEqual(401);
    });

    it('Should return 400 if token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if name is less than 5 characters', async () => {
      name = '1234';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if name is more than 255 characters', async () => {
      name = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if phone is less than 5 characters', async () => {
      phone = '1234';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400  if phone is more than 50 characters', async () => {
      phone = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should save the customer if input is valid', async () => {
      await exec();

      const customerInDb = await Customer.findOne({ name });

      expect(customerInDb).not.toBeNull();
    });

    it('Should return the customer if input is valid', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', name);
      expect(res.body).toHaveProperty('phone', phone);
    });
  });

  describe('PUT /:id', () => {
    let token;
    let customer;
    let newName;
    let newPhone;
    let id;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      
      customer = new Customer({
        name: '12345',
        phone: '12345'
      });
      await customer.save();

      id = customer._id;

      newName  = '67890';
      newPhone = '67890';
    });

    afterEach(async () => {
      await Customer.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .put(`/api/customers/${id}`)
        .set('x-auth-token', token)
        .send({ name: newName, phone: newPhone});
    }

    it('Should return 401 if user is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toEqual(401);
    });

    it('Should return 400 if token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if invalid id is provided', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return 400 if no customer with the given id exists', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return 400 if newName is less than 5 characters', async () => {
      newName = '1234';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if name is more than 255 characters', async () => {
      newName = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if phone is less than 5 characters', async () => {
      newPhone = '1234';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400  if phone is more than 50 characters', async () => {
      newPhone = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should save the customer if input is valid', async () => {
      await exec();

      const customerInDb = await Customer.findOne({ name: newName });

      expect(customerInDb).not.toBeNull();
    });

    it('Should return the customer if input is valid', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('_id')
      expect(res.body).toHaveProperty('name', newName);
      expect(res.body).toHaveProperty('phone', newPhone);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let customer;
    let id;

    beforeEach(async () => {
      token = new User().generateAuthToken();

      customer = new Customer({
        name: '12345',
        phone: '12345'
      });
      await customer.save();

      id = customer._id;
    });

    afterEach(async () => {
      await Customer.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .delete(`/api/customers/${id}`)
        .set('x-auth-token', token)
        .send({});
    }

    it('Should return 401 if user is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toEqual(401);
    });

    it('Should return 400 if token is invalid', async () => {
      token = 'a';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return 404 if no customer with the given id exists', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should delete the customer', async () => {
      await exec();

      const deletedCustomer = await Customer.findById(id);

      expect(deletedCustomer).toBeNull();
    });

    it('Should return the customer', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('_id', id.toHexString());
      expect(res.body).toHaveProperty('name', customer.name);
      expect(res.body).toHaveProperty('phone', customer.phone);
    });
  });
});
const request  = require('supertest');
const mongoose = require('mongoose');

const { Rental } = require('../../models/rental');
const { User }   = require('../../models/user');

let server;
let customerId;
let movieId;
let rental;
let token;

describe('/api/returns', () => {
  beforeEach(async () => { 
    server = require('../../index'); 

    token = new User().generateAuthToken();
  
    customerId = mongoose.Types.ObjectId();
    movieId    = mongoose.Types.ObjectId();

    rental = new Rental({
      customer: {
        _id: customerId,
        name: '12345',
        phone: '12345'
      },
      movie: {
        _id: movieId,
        title: '123',
        dailyRentalRate: 2
      }
    });

    await rental.save();
  });

  afterEach(async () => { 
    await server.close();
    await Rental.deleteMany({});
  });

  const exec = () => {
    return request(server)
      .post('/api/returns')
      .set('x-auth-token', token)
      .send({ customerId, movieId });
  };

  it('Should return 401 if client is not logged in', async () => {
    token = '';

    const res = await exec();
    
    expect(res.status).toEqual(401);
  });

  it('Should return 400 if customerId is not provided', async () => {
    customerId = '';

    const res = await exec();

    expect(res.status).toEqual(400);
  });

  it('Should return 400 if movieId is not provided', async () => {
    movieId = '';
    
    const res = await exec();

    expect(res.status).toEqual(400);
  });

  it('Should return 404 if no rental found for this customer/movie', async () => {
    customerId = mongoose.Types.ObjectId();
    movieId = mongoose.Types.ObjectId();
    
    const res = await exec();

    expect(res.status).toEqual(404);
  });
});
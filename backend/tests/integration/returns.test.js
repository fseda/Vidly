const request  = require('supertest');
const mongoose = require('mongoose');
const moment   = require('moment');

const { Rental } = require('../../models/rental');
const { User }   = require('../../models/user');
const { Movie }  = require('../../models/movie');

let server;
let customerId;
let movieId;
let rental;
let movie;
let token;

describe('/api/returns', () => {
  beforeEach(async () => { 
    server = require('../../index'); 

    token = new User().generateAuthToken();
  
    customerId = mongoose.Types.ObjectId();
    movieId    = mongoose.Types.ObjectId();

    movie = new Movie({
      _id: movieId,
      title: '123',
      genreId: { name: '12345' },
      numberInStock: 1,
      dailyRentalRate: 2
    });
    await movie.save();

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
      },
    });
    await rental.save();
  });

  afterEach(async () => { 
    await server.close();
    await Rental.deleteMany({});
    await Movie.deleteMany({});
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

  it('Should return 404 if no rental found for the customer/movie', async () => {
    await Rental.deleteMany({});
    
    const res = await exec();

    expect(res.status).toEqual(404);
  });

  it('Should return 400 if return is already processed', async () => {
    rental.dateReturned = new Date();
    await rental.save();
    
    const res = await exec();

    expect(res.status).toEqual(400);
  });

  it('Should set the DateReturnes if input is valid', async () => {
    const res = await exec();

    const rentalInDb = await Rental.findById(rental.id);
    const diff = new Date() - rentalInDb.dateReturned;

    expect(diff).toBeLessThan(10 * 1000);
  });

  it('Should calculate the rental fee if input is valid', async () => {
    rental.dateOut = moment().add(-7, 'days').toDate();
    await rental.save();

    const res = await exec();

    const rentalInDb = await Rental.findById(rental.id);
    expect(rentalInDb.rentalFee).toEqual(14);
  });

  it('Should increment the stock of the movie', async () => {
    const res = await exec();

    const movieInDb = await Movie.findById(movie._id);
    expect(movieInDb.numberInStock).toEqual(movie.numberInStock + 1);
  });

  it('Should return 200 and the rental if return is sucessful', async () =>{
    const res = await exec();

    expect(res.status).toEqual(200);
    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining([
        'dateOut', 
        'dateReturned', 
        'rentalFee', 
        'customer', 
        'movie'
      ]));
  });
});
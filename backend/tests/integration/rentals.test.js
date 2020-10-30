const request  = require('supertest');
const mongoose = require('mongoose');

const { User }     = require('../../models/user');
const { Movie }    = require('../../models/movie');
const { Customer } = require('../../models/customer');
const { Rental }   = require('../../models/rental');

jest.useFakeTimers();

//#region Variables 
let server;
let token;
let id;
let rental;
let customerId;
let movieId;
let movie;
let customer;
//#endregion

describe('/api/rentals', () => {
  beforeEach(() => { 
    server = require('../../index'); 
  });
  afterEach(async () => { 
    await server.close();
    await Rental.deleteMany({});
  });

  describe('GET /', () => {
    token = new User().generateAuthToken();

    it('Should return all the rentals', async () => {
      await Rental.collection.insertMany([
        {
          customer: {
            name: 'abcde',
            isGold: true,
            phone: '12345'
          },
          movie: {
            title: '1234',
            dailyRentalRate: 2
          }
        },
        {
          customer: {
            name: 'edfgh',
            isGold: false,
            phone: '67890'
          },
          movie: {
            title: '12345',
            dailyRentalRate: 3
          }
        }
      ]);

      const res = await request(server)
        .get('/api/rentals/')
        .set('x-auth-token', token);

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body.some(r => r.customer.name === 'abcde')).toBeTruthy();
      expect(res.body.some(r => r.customer.name === 'edfgh')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    const exec = () => {
      return request(server)
        .get(`/api/rentals/${id}/`)
        .set('x-auth-token', token);
    }

    beforeEach(() => {
      token = new User().generateAuthToken();
    });

    it('Should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return 404 if no rental with the given id exists', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return a rental if valid id is provided', async () => {
      const rental = new Rental({
        customer: {
          name: 'abcde',
          isGold: true,
          phone: '12345'
        },
        movie: {
          title: '1234',
          dailyRentalRate: 2
        }
      });
      await rental.save();
      
      id = rental._id;

      const res = await exec();

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('customer._id', rental.customer._id.toHexString());
      expect(res.body).toHaveProperty('movie._id', rental.movie._id.toHexString());
    });  
  });

  describe('POST /', () => {
    beforeEach(async () => {
      token = new User().generateAuthToken();
      
      customerId = mongoose.Types.ObjectId();
      movieId    = mongoose.Types.ObjectId();

      movie = new Movie({
        _id: movieId,
        title: '123',
        genreId: { name: '12345' },
        numberInStock: 1,
        dailyRentalRate: 4
      });
      await movie.save();

      customer = new Customer({
        _id: customerId,
        name: '12345',
        phone: '12345',
        isGold: true
      });
      await customer.save();
    });
    
    afterEach(async () => {
      await Movie.deleteMany({});
      await Customer.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .post(`/api/rentals`)
        .set('x-auth-token', token)
        .send({ customerId, movieId });
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

    it('Should return 400 if customerId is not provided', async () => {
      customerId = '';

      const res = await exec();

      expect(res.status).toEqual(400)
    });

    it('Should return 400 if movieId is not provided', async () => {
      movieId = '';

      const res = await exec();

      expect(res.status).toEqual(400)
    });

    it('Should return 400 if no customer is found with the given id', async () => {
      customerId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if no movie is found with the given id', async () => {
      movieId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if there\'s no stock for this movie', async () => {
      movie.numberInStock = 0;
      await movie.save();

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should create a new rental', async () => {
      const res = await exec();

      const rental = await Rental.findById(res.body._id);

      expect(rental).not.toBeNull();
    });

    it('Should update the stock of the movie', async () => {
      await exec();

      const movieInDb = await Movie.findById(movie._id);
      expect(movieInDb.numberInStock).toEqual(movie.numberInStock - 1);
    });

    it('Should return the rental if sucessful', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'customer',
          'movie',
          'dateOut'
        ]));
    });
  });

  describe('DELETE /:id', () => {
    beforeEach(async () => {
      token = new User().generateAuthToken();

      rental = new Rental({
        customer: {
          _id: customerId,
          name: '12345',
          phone: '12345',
          isGold: true
        },
        movie: {
          _id: movieId,
          title: '123',
          dailyRentalRate: 5
        }
      });
      await rental.save();

      id = rental._id;
    });

    afterEach(async () => {
      await Rental.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .delete(`/api/rentals/${id}`)
        .set('x-auth-token', token)
        .send();
    }

    it('Should return 401 if client is not logged in', async () => {
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

    it('Should return 404 if no rental with the given id is found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should delete the rental', async () => {
      await exec();

      const deletedRental = await Rental.findById(id);
      expect(deletedRental).toBeNull();
    });

    it('Should return the deleted rental', async () => {
      const res = await exec();

      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
        'customer',
        'movie',
        'dateOut'
      ]));
    }); 
  });
});
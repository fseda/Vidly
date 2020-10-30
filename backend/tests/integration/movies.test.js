const request  = require('supertest');
const mongoose = require('mongoose');

const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');
const { User }  = require('../../models/user');
const e = require('express');

jest.useFakeTimers();

let server;

describe('/api/movies', () => {
  beforeEach(() => {
    server = require('../../index');
  });
  afterEach(async () => {
    await server.close();
    await Movie.deleteMany({});
    await Genre.deleteMany({});
  });

  describe('GET /', () => {
    it('Should return all the movies', async () => {
      await Movie.collection.insertMany([
        {
          title: '123',
          genre: { name: '12345' },
          numberInStock: 1,
          dailyRentalRate: 2
        },
        {
          title: '456',
          genre: { name: '67890' },
          numberInStock: 2,
          dailyRentalRate: 3
        }
      ]);

      const res = await request(server).get('/api/movies/');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body.some(m => m.title === '123')).toBeTruthy();
      expect(res.body.some(m => m.title === '456')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    let token = new User().generateAuthToken();

    it('Should return 404 if id is invalid', async () => {
      const movie = new Movie({
        title: '123',
        genre: { name: '12345' },
        numberInStock: 1,
        dailyRentalRate: 2
      });

      const res = await request(server).get(`/api/movies/${movie._id}`);

      expect(res.status).toEqual(404);
    });

    it('Should return 404 if no movie with the given id exists', async () => {
      let id = mongoose.Types.ObjectId();

      const res = await request(server).get(`/api/movies/${id}`);

      expect(res.status).toEqual(404);
    });

    it('Should return the movie if id is valid', async () => {
      const movie = new Movie({ 
        title: '123',
        genre: { name: '12345' },
        numberInStock: 1,
        dailyRentalRate: 2
      });
      await movie.save();

      const res = await request(server).get(`/api/movies/${movie._id}`);

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('title', movie.title);
      expect(res.body).toHaveProperty('genre.name', movie.genre.name);
    });
  });

  describe('POST /', () => {
    let token;
    let title;
    let numberInStock;
    let dailyRentalRate;
    let genreId;
    let genre;

    beforeEach(async () => {
      token = new User({ isAdmin: true }).generateAuthToken();

      genreId = mongoose.Types.ObjectId();

      title = '123';
      numberInStock = 1;
      dailyRentalRate = 2;

      genre = new Genre({
        _id: genreId,
        name: '12345'
      });
      await genre.save();
    });

    afterEach(async () => {
      await Genre.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .post('/api/movies/')
        .set('x-auth-token', token)
        .send({ 
          title, 
          genreId, 
          numberInStock,
          dailyRentalRate 
        });
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

    it('Should return 403 if user is not admin', async () => {
      token = new User({ isAdmin: false }).generateAuthToken();

      const res = await exec();

      expect(res.status).toEqual(403);
    });

    it('Should return 400 if title is less than 3 characters', async () => {
      title = '12';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if title is more than 255 characters', async () => {
      title = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if genreId is not provided', async () => {
      genreId = '';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if no genre with the given id exists', async () => {
      genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(400);
      expect(res.text).toEqual('Invalid genre.');
    });

    it('Should return 400 if numberInStock is not provided', async () => {
      const res = await request(server)
        .post('/api/movies/')
        .set('x-auth-token', token)
        .send({ title, genreId, dailyRentalRate });

      expect(res.text).toEqual('"numberInStock" is required')
      expect(res.status).toEqual(400);
    });

    it('Should return 400 if numberInStock is less than 0', async () => {
      numberInStock = -1;

      const res = await exec();

      expect(res.text).toEqual('"numberInStock" must be greater than or equal to 0');
      expect(res.status).toEqual(400);
    });

    it('Should return 400 dailyRentalRate is not provided', async () => {
      const res = await request(server)
        .post('/api/movies')
        .set('x-auth-token', token)
        .send({ title, genreId, numberInStock });

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if dailyRentalRate is less than 0', async () => {
      dailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if dailyRentalRate is more than 255', async () => {
      dailyRentalRate = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should save the movie if input is valid', async () => {
      await exec();

      const movieInDb = await Movie.findOne({ title });

      expect(movieInDb).not.toBeNull();
    });

    it('Should return the movie', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'title', 
          'genre', 
          'dailyRentalRate', 
          'numberInStock',
          'isAvailable' 
        ]));
    });
  });

  describe('PUT /', () => {
    let token;
    let newTitle;
    let newNumberInStock;
    let newDailyRentalRate;
    let genreId;
    let newGenre;
    let movie;
    let id;

    beforeEach(async () => {
      token = new User({ isAdmin: true }).generateAuthToken();

      genreId = mongoose.Types.ObjectId();

      newTitle = '456';
      newNumberInStock = 5;
      newDailyRentalRate = 4;

      newGenre = new Genre({
        _id: genreId,
        name: '67890'
      });
      await newGenre.save();

      movie = new Movie({
        title: '123',
        genre: { name: '12345' },
        numberInStock: 1,
        dailyRentalRate: 2
      });
      await movie.save();

      id = movie._id;
    });

    afterEach(async () => {
      await Genre.deleteMany({});
      await Movie.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .put(`/api/movies/${id}`)
        .set('x-auth-token', token)
        .send({ 
          title: newTitle, 
          genreId,
          numberInStock: newNumberInStock,
          dailyRentalRate: newDailyRentalRate,
        });
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

    it('Should return 403 if user is not admin', async () => {
      token = new User({ isAdmin: false }).generateAuthToken();

      const res = await exec();

      expect(res.status).toEqual(403);
    });

    it('Should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return 404 if no movie with the given id was found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    })

    it('Should return 400 if title is less than 3 characters', async () => {
      newTitle = '12';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if title is more than 255 characters', async () => {
      newTitle = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if genreId is not provided', async () => {
      genreId = '';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if no genre with the given id exists', async () => {
      genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(400);
      expect(res.text).toEqual('Invalid genre.');
    });

    it('Should return 400 if numberInStock is not provided', async () => {
      const res = await request(server)
        .post('/api/movies/')
        .set('x-auth-token', token)
        .send({ 
          title: newTitle, 
          genreId, 
          dailyRentalRate: newDailyRentalRate
        });

      expect(res.text).toEqual('"numberInStock" is required')
      expect(res.status).toEqual(400);
    });

    it('Should return 400 if numberInStock is less than 0', async () => {
      newNumberInStock = -1;

      const res = await exec();

      expect(res.text).toEqual('"numberInStock" must be greater than or equal to 0');
      expect(res.status).toEqual(400);
    });

    it('Should return 400 dailyRentalRate is not provided', async () => {
      const res = await request(server)
        .post('/api/movies')
        .set('x-auth-token', token)
        .send({ 
          title: newTitle, 
          genreId, 
          numberInStock: newNumberInStock
         });

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if dailyRentalRate is less than 0', async () => {
      newDailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return 400 if dailyRentalRate is more than 255', async () => {
      newDailyRentalRate = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should save the movie if input is valid', async () => {
      const res = await exec();

      const updatedMovieInDb = await Movie.findOne({ title: newTitle });

      expect(updatedMovieInDb).not.toBeNull();
    });

    it('Should return the movie', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'title', 
          'genre', 
          'dailyRentalRate', 
          'numberInStock',
          'isAvailable' 
        ]));
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let id;

    beforeEach(async () => {
      token = new User({ isAdmin: true }).generateAuthToken();

      movie = new Movie({
        title: '123',
        genre: { name: '12345' },
        numberInStock: 1,
        dailyRentalRate: 2
      });
      await movie.save();

      id = movie._id;
    });

    afterEach(async () => {
      await Movie.deleteMany({});
    });

    const exec = () => {
      return request(server)
        .delete(`/api/movies/${id}`)
        .set('x-auth-token', token)
        .send();
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

    it('Should return 403 if user is not admin', async () => {
      token = new User({ isAdmin: false }).generateAuthToken();
    
      const res = await exec();

      expect(res.status).toEqual(403);
    });

    it('Should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return 404 if no movie with the given id is found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should delete the movie', async () => {
      await exec();

      const deletedMovie = await Movie.findById(id);

      expect(deletedMovie).toBeNull();
    });

    it('Should return the deleted movie', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
        'title',
        'genre',
        'isAvailable',
        'numberInStock',
        'dailyRentalRate'
      ]));
    });
  });
});
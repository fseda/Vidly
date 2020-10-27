const request  = require('supertest');
const mongoose = require('mongoose');

const { Genre } = require('../../models/genre');
const { User }  = require('../../models/user');

let server;

describe('/api/genres', () => {
  beforeEach(() => { server = require('../../index'); });
  afterEach(async () => { 
    await server.close();
    await Genre.collection.deleteMany({});
  });

  describe('GET /', () => {
    it('Should return all genres', async () => {
      await Genre.collection.insertMany([
        { name: 'genre1' },
        { name: 'genre2' },
      ]);

      const res = await request(server).get('/api/genres/');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
      expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('Should return a genre if valid id is passed', async () => {
      const genre = new Genre({ name: 'genre1' });
      await genre.save();

      const res = await request(server).get(`/api/genres/${genre._id}`);

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('name', genre.name);
    });

    it('Should return a 404 error if a invalid id is passed', async () => {
      const res = await request(server).get(`/api/genres/1`); 
      
      expect(res.status).toEqual(404);
    });

    it('Should return a 404 error if no genre with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get(`/api/genres/${id}`); 
      
      expect(res.status).toEqual(404);
    });
  });

  describe('POST /', () => {
    let token;
    let name;

    const exec = () => {
      return request(server)
        .post('/api/genres')
        .set('x-auth-token', token)
        .send({ name });
    }

    beforeEach(() => {
      token = new User().generateAuthToken();
      name  = 'genre1';
    });

    it('Should return a 401 error if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toEqual(401);
    });
  
    it('Should return a 400 if genre is less than 5 characters', async () => {
      name = '1234';
  
      const res = await exec();
      
      expect(res.status).toEqual(400);
    });  

    it('Should return a 400 if genre is more than 50 characters', async () => {
      name = new Array(52).join('a');

      const res = await exec();
      
      expect(res.status).toEqual(400);
    });  

    it('Should return a 403 if genre already exists', async () => {
      const genre = new Genre({ name });
      await genre.save();

      const res = await exec();
      
      expect(res.status).toEqual(403);
    });  

    it('Should save the genre if it is valid', async () => {
      await exec();

      const genre = await Genre.find({ name });
      
      expect(genre).not.toBeNull();
    });  

    it('Should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', name);
      expect(res.status).toEqual(200);
    });  
  });

  describe('PUT /:id', () => {
    let token;
    let genre;
    let newName;
    let id;

    const exec = () => {
      return request(server)
        .put(`/api/genres/${id}`)
        .set('x-auth-token', token)
        .send({ name: newName });
    }

    beforeEach(async () => {
      genre = new Genre({ name: 'genre1' });
      await genre.save();

      token = new User().generateAuthToken();
      id = genre._id;
      newName = 'updateGenre';
    });

    it('Should return a 401 error if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toEqual(401);
    });

    it('Should return a 404 error if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return a 400 error if the new name is less than 5 characters', async () => {
      token = '1234';

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return a 400 error if the new name is more than 50 characters', async () => {
      token = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toEqual(400);
    });

    it('Should return a 403 error if the new name already exists', async () => {
      const genre = new Genre({ name: newName });
      await genre.save();
      
      const res = await exec();

      expect(res.status).toEqual(403);
    });    
  
    it('Should save the genre if it is valid', async () => {
      await exec();

      const genre = await Genre.findOne({ name: 'updateGenre' });

      expect(genre).not.toBeNull();
    });

    it('Should return a 404 error if no genre with the given id exists', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', newName);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let genre;
    let id;

    const exec = () => {
      return request(server)
        .delete(`/api/genres/${id}`)
        .set('x-auth-token', token)
        .send({ genre });
    }

    beforeEach(async () => {
      genre = new Genre({ name: 'genre1' });
      await genre.save();

      token = new User({ isAdmin: true }).generateAuthToken();
      id    = genre._id;
    });

    it('Should return a 401 error if the user is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toEqual(401);
    });

    it('Should return a 403 error if the user is not admin', async () => {
      token = new User({ isAdmin: false}).generateAuthToken();

      const res = await exec();

      expect(res.status).toEqual(403);
    });

    it('Should return a 404 error if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should return a 404 error if no genre with the given id exists', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toEqual(404);
    });

    it('Should delete the genre if input is valid', async () => {
      await exec();

      const genreInDb = await Genre.findById(id);

      expect(genreInDb).toBeNull();
    });

    it('Should return the removed genre', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id', genre._id.toHexString());
      expect(res.body).toHaveProperty('name', genre.name);
    });
  });

});

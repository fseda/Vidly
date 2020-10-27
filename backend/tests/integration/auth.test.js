const request  = require('supertest');

const { Genre } = require('../../models/genre');
const { User }  = require('../../models/user');

describe('auth middleware', () => {
  beforeEach(() => { server = require('../../index'); });
  afterEach(async () => { 
    await Genre.deleteMany({});
    await server.close(); 
  });

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
    name = 'genre1';
  });

  it('Should return a 401 if no token is provided', async () => {
    token = '';

    const res = await exec();

    expect(res.status).toEqual(401);
  });

  it('Should return a 400 if token is invalid', async () => {
    token = 'a';

    const res = await exec();

    expect(res.status).toEqual(400);
  });

  it('Should return a 200 if token is valid', async () => {
    const res = await exec();

    expect(res.status).toEqual(200);
  });
});


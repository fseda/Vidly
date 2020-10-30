//#region Imports 
const { Movie, validator } = require('../models/movie');
const { Genre }           = require('../models/genre');

const auth             = require('../middleware/auth');
const admin            = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const validate         = require('../middleware/validateReq');

require('express-async-errors');

const mongoose = require('mongoose');
const express  = require('express');
//#endregion

const router = express.Router();

// Get ALL movies
router.get('/', async (req, res) => {
  const movies = await Movie.find().sort('name');

  res.send(movies);
});

// Get specific movie
router.get('/:id', [validateObjectId], async (req, res) => {
  const movie = await Movie.findById(req.params.id)

  if (!movie) return res.status(404).send(`Could not DELETE\nThe movie with ID '${req.params.id}' was not found. (404)`);

  res.send(movie);
});

// Post new movie to DB | NOT DONE
router.post('/', [auth, admin, validate(validator)], async (req, res) => {
  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send('Invalid genre.');

  const movie = new Movie({
    title: req.body.title,
    genre: {
      _id: genre._id,
      name: genre.name
    },
    numberInStock: req.body.numberInStock,
    dailyRentalRate: req.body.dailyRentalRate
  });
  await movie.save();

  res.send(movie);
});

// Update existing movie
router.put('/:id', [auth, admin, validateObjectId, validate(validator)], async (req, res) => {
  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send('Invalid genre.');

  const movie = await Movie.findByIdAndUpdate(req.params.id, {
    title: req.body.title,
    genre: {
      _id: genre._id,
      name: genre.name
    },
    numberInStock: req.body.numberInStock,
    dailyRentalRate: req.body.dailyRentalRate,
    isAvailable: req.body.numberInStock != 0
  }, { new: true })

  if (!movie) return res.status(404).send(`Cannot PUT\nThe customer with ID '${req.params.id}' was not found. (404)`);

  res.send(movie);
});

// Delete existing movie from DB
router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id)

  if (!movie) return res.status(404).send(`Cannot DELETE\nThe movie with ID '${req.params.id}' was not found. (404)`);

  res.send(movie);
});

// Export routes
module.exports = router;

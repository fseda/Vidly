//#region Imports 
const { Genre, validate } = require('../models/genre');

const auth             = require('../middleware/auth');
const admin            = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

require('express-async-errors');

const mongoose = require('mongoose');
const express  = require('express');
//#endregion

const router = express.Router();

router.get('/', async (req, res) => {
  const genres = await Genre.find().sort('name');
  res.send(genres);
});

router.get('/:id', [validateObjectId], async (req, res) => {
  const genre = await Genre.findById(req.params.id);

  if (!genre) return res.status(404).send(`The genre with ID '${req.params.id}' was not found. (404)`);

  res.send(genre);
 });

router.post('/', [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let genre = await Genre.findOne({ name: req.body.name });
  if (genre) return res.status(403).send('Genre already exists.');

  genre = new Genre({ name: req.body.name });
  await genre.save();

  res.send(genre);
});

router.put('/:id', [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let genre = await Genre.findOne({ name: req.body.name });
  if (genre) return res.status(403).send('Genre already exists.');

  genre = await Genre.findByIdAndUpdate(req.params.id, {
      name: req.body.name
  }, { new: true });

  if (!genre) return res.status(404).send(`The genre with ID '${req.params.id}' was not found. (404)`);

  res.send(genre);
});

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
  let genre = await Genre.findByIdAndRemove(req.params.id)

  if (!genre) return res.status(404).send(`The genre with ID '${req.params.id}' was not found. (404)`);

  res.send(genre);
});


module.exports = router;
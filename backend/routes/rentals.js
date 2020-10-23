//#region Imports 
const { Rental, validate } = require('../models/rental');
const { Movie }            = require('../models/movie');
const { Customer }         = require('../models/customer');

const auth = require('../middleware/auth');

require('express-async-errors');

const mongoose = require('mongoose');
const Fawn     = require('fawn');
const express  = require('express');
//#endregion

const router   = express.Router();

Fawn.init(mongoose);

// Get ALL rentals
router.get('/', [auth], async (req, res) => {
  const rentals = await Rental.find().sort('-dateOut');
  
  res.send(rentals);
});

// Get specific rental
router.get('/:id', [auth], async (req, res) => {
  const rental = await Rental.findById(req.params.id)
    .catch(err => console.log('Could not perform operation...\n', err));

  if (!rental) return res.status(404).send(`The rental with ID ${req.params.id} was not found. (404)`);

  console.log(rental);

  res.send(rental)
});

// Post new rental
router.post('/', [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send('Invalid customer.');

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send('Invalid movie.');

  if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock.');

  let rental = new Rental({
    customer: {
      _id: customer._id,
      name: customer.name,
      isGold: customer.isGold,
      phone: customer.phone
  },
  movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate
    },
    rentalFee: movie.dailyRentalRate * 0.5
  });
  try {
    new Fawn.Task()
      .save('rentals', rental)
      .update('movies', { _id: movie._id }, {
          $inc: { numberInStock: -1 }
      })
      .run();

      res.send(rental);
  } 
  catch(ex) {
    res.status(500).send('Something failed');
  }
    
});

// Update rental
router.put('/:id', [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send('Invalid customer.');

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send('Invalid movie.');

  const rental = await Rental.findByIdAndUpdate(req.params.id, {
      customer: {
          _id: customer._id,
          name: customer.name,
          isGold: customer.isGold,
          phone: customer.phone
      },
      movie: {
          _id: movie._id,
          title: movie.title,
          dailyRentalRate: movie.dailyRentalRate
      },
      dateReturned: '2020-10-10T16:28:08.068Z',
      rentalFee: movie.dailyRentalRate * 0.5
  }, { new: true })
    .catch(err => console.log('Could not perform operation...\n', err));

  if (!rental) return res.status(404).send(`The rental with ID ${req.params.id} was not found. (404)`);

  console.log(rental);

  res.send(rental);
});

// Delete Rental
router.delete('/:id', [auth], async (req, res) => {
  const rental = await Rental.findByIdAndDelete(req.params.id)
    .catch(err => console.log('Could not perform operation...\n', err));

  if (!rental) return res.status(404).send(`Cannot DELETE\nThe rental with ID '${req.params.id}' was not found. (404)`);

  console.log(rental);

  res.send(rental);
});

module.exports = router;
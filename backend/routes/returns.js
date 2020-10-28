//#region 
const { Rental }   = require('../models/rental');
const { Movie }    = require('../models/movie');

const validator = require('../models/return');

const auth             = require('../middleware/auth');
const admin            = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const validate         = require('../middleware/validateReq');   

require('express-async-errors');

const mongoose = require('mongoose');
const express  = require('express');
//#endregion

const router = express.Router();

router.post('/', [auth, validate(validator)], async (req, res) => {
  const customerId = req.body.customerId;
  const movieId    = req.body.movieId;

  const rental = await Rental.lookup(customerId, movieId);

  if (!rental) return res.status(404).send('Rental not found.');

  if (rental.dateReturned) return res.status(400).send('Return already processed.');

  rental.return();
  await rental.save();

  await Movie.update({ _id: movieId } , {
    $inc: { numberInStock: 1 }
  });

  return res.send(rental);
}); 

module.exports = router;
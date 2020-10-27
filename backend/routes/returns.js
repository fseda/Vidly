//#region 
const { Rental }   = require('../models/rental');
const { Customer } = require('../models/customer');
const { Movie }    = require('../models/movie');

const auth                  = require('../middleware/auth');
const admin                 = require('../middleware/admin');
const validateObjectId      = require('../middleware/validateObjectId');

require('express-async-errors');

const mongoose = require('mongoose');
const express  = require('express');
//#endregion

const router = express.Router();

router.post('/', [auth], async (req, res) => {
  if (!req.body.customerId) return res.status(400).send('customerId not provided');
  if (!req.body.movieId) return res.status(400).send('movieId not provided');

  res.status(401).send('Unauthorized');
}); 

module.exports = router;
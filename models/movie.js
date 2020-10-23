
const { genreSchema } = require('./genre');
const Joi      = require('joi');
const mongoose = require('mongoose');

const Movie = mongoose.model('Movie', new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 255
  },
  genre: {
    type: [genreSchema],
    required: true
  },
  numberInStock: {
    type: Number,
    required: true,
    min: 0,
    max: 255,
    get: v => Math.round(v),
    set: v => Math.round(v)
  },
  isAvailable: {
    type: Boolean,
    default: function() { return this.numberInStock != 0 }
  },
  dailyRentalRate: {
    type: Number,
    required: true,
    min: 0,
    max: 255
  }
}));

function validateMovie(movie) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(255).required(),
    genreId: Joi.objectId().required(),
    numberInStock: Joi.number().min(0).max(255).required(),
    dailyRentalRate: Joi.number().min(0).max(255).required()
  });

  return schema.validate(movie);
}

exports.Movie = Movie;
exports.validate = validateMovie;

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
    const schema = {
        title: Joi.string().min(3).max(255).required(),
        genreId: Joi.objectId().required(),
        // genres: Joi.array().min(1).max(50).required(),
        numberInStock: Joi.number().min(0).max(255).required(),
        dailyRentalRate: Joi.number().min(0).max(255).required()
    };

    return Joi.validate(movie, schema);
}

exports.Movie = Movie;
exports.validate = validateMovie;
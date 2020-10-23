const winston  = require('winston');
const mongoose = require('mongoose');

module.exports = function () {
  mongoose.set('useFindAndModify', false);
  mongoose.set('useUnifiedTopology', true);
  mongoose.connect('mongodb://localhost/vidly', { useNewUrlParser: true})
    .then(() => winston.info('Connected to MongoDB...', 'Vidly App'));
}
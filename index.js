const Joi       = require('joi');
Joi.objectId    = require('joi-objectid')(Joi);
const mongoose  = require('mongoose');
const express   = require('express');
const app       = express();

// Import routes
const genres    = require('./routes/genres'); 
const customers = require('./routes/customers'); 
const movies    = require('./routes/movies');
const rentals   = require('./routes/rentals');


mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);

// Connect to DB
const mongo = mongoose.connect('mongodb://localhost/vidly', { useNewUrlParser: true})
    .then(() => console.log('Connected to MongoDB...', 'Vidly App'))
    .catch(err => console.log('Could not connect to MongoDB...', err));

app.use(express.json());

// Use routes
app.use('/api/customers', customers);
app.use('/api/genres', genres);
app.use('/api/movies', movies);
app.use('/api/rentals', rentals);


// PORT 
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Listening on port ${port}...`));

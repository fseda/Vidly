//#region Imports 
const { User, validateUser } = require('../models/user');

const auth     = require('../middleware/auth');
const validate = require('../middleware/validateReq')

require('express-async-errors');

const _        = require('lodash');
const bcrypt   = require('bcrypt');
const mongoose = require('mongoose');
const express  = require('express');
//#endregion

const router = express.Router();

// Get the current user
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.send(user);
});

// Post new user to DB
router.post('/', [validate(validateUser)], async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send('User already exists.');

  user = new User(_.pick(req.body, ['name', 'email', 'password', 'isAdmin']));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken();
  
  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});

// Export routes
module.exports = router;

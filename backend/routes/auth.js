//#region Imports 
const { User } = require('../models/user');

require('express-async-errors');

const Joi      = require('joi');
const _        = require('lodash');
const bcrypt   = require('bcrypt');
const mongoose = require('mongoose');
const express  = require('express');

const validate = require('../middleware/validateReq');
//#endregion

const router = express.Router();

// Post new user to DB
router.post('/', validate(validator), async (req, res) => {

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('Invalid email or password.');

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid email or password.');

  const token = user.generateAuthToken();

  res.send(token);
});

function validator(req) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(req);
}

// Export routes
module.exports = router;

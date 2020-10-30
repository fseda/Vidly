//#region Imports 
const { Customer, validator } = require('../models/customer');

const auth             = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const validate         = require('../middleware/validateReq');

require('express-async-errors');

const _        = require('lodash');
const mongoose = require('mongoose');
const express  = require('express');
//#endregion

const router = express.Router();

// Get ALL customers
router.get('/', [auth], async (req, res) => {
  const customers = await Customer.find().sort('-isGold name');

  res.send(customers);
});

// Get especific customer
router.get('/:id', [auth, validateObjectId], async (req, res) => {
  const customer = await Customer.findById(req.params.id)

  if (!customer) return res.status(404).send(`Cannot GET\nThe customer with ID '${req.params.id}' was not found. (404)`);

  res.send(customer);
});

// Post new customer to DB
router.post('/', [auth, validate(validator)], async (req, res) => {
  let isGold;
  if (req.body.isGold === true) {
    isGold = req.body.isGold;
  } else {
    isGold = false;
  }

  let customer = new Customer({
    name: req.body.name,
    isGold: isGold,
    phone: req.body.phone
  });
  await customer.save();

  res.send(customer);
});

// Update existing customer
router.put('/:id', [auth, validateObjectId, validate(validator)], async (req, res) => {
  let isGold;
  if (req.body.isGold === (/^true$/i || /^false$/i)) {
    isGold = req.body.isGold;
  } else {
    isGold = false;
  }

  const customer = await Customer.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
    isGold: req.body.isGold,
    phone: req.body.phone
  }, { new: true });

  if (!customer) return res.status(404).send(`Cannot PUT\nThe customer with ID '${req.params.id}' was not found. (404)`);
  
  res.send(customer);
});

// Delete existing customer
router.delete('/:id', [auth, validateObjectId], async (req, res) => {
  let customer = await Customer.findByIdAndDelete(req.params.id)
    .catch(err => console.log('Could not perform operation...\n', err));

  if (!customer) return res.status(404).send(`Cannot DELETE\nThe customer with ID '${req.params.id}' was not found. (404)`);

  res.send(customer);
});

// Export routes
module.exports = router;

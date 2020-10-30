
const Joi      = require('joi');
const mongoose = require('mongoose');

// Defined customer Schema
const Customer = mongoose.model('Customer', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 255
  },
  isGold: {
    type: Boolean,
    required: true,
    default: true
  },
  phone: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50
  }
}));

// Joi data validation
function validateCustomer(customer) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(255).required(),
    isGold: Joi.bool(),
    phone: Joi.string().min(5).max(50).required()
  });

  return schema.validate(customer);
}

exports.Customer = Customer;
exports.validator = validateCustomer;

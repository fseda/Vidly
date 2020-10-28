//#region Imports 
const Joi      = require('joi');
const PassComp = require('joi-password-complexity');
const mongoose = require('mongoose');
const config   = require('config');
const jwt      = require('jsonwebtoken');
//#endregion

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 8,
    maxlength: 1024,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Export jwtPrivate key: export vidly_jwtPrivateKey=<KEY>
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ 
    _id:     this._id, 
    isAdmin: this.isAdmin 
  } /** <- Payload */, config.get('jwtPrivateKey'));
  return token;
}

const User = mongoose.model('User', userSchema);

const complexityOptions = {
  min: 8,
  max: 255,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  requirementCount: 1,
}
const label = 'Password';

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: PassComp(complexityOptions, label),
    isAdmin: Joi.bool()
  });

  return schema.validate(user);
}

exports.complexityOptions = complexityOptions;
exports.label             = label;
exports.User              = User;
exports.validateUser      = validateUser;
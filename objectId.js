const mongoose = require('mongoose');

const id = new mongoose.Types.ObjectId();
console.log(id.getTimestamp());
console.log(id);

const isValid = mongoose.Types.ObjectId.isValid('5f90769ff1c260b41fca3e03');
console.log(isValid);
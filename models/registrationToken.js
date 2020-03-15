const mongoose = require('mongoose');

const registrationToken = new mongoose.Schema({
  userId: String,
  dateAdded:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('registrationToken',registrationToken);
const mongoose = require('mongoose');

const forgotPassword = new mongoose.Schema({
  email: String,
  dateRequest: {
    type: Date,
    default: Date.now
  },
  isRecoverSuccessfull:{
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('forgotPassword',forgotPassword);
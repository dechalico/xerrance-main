const mongoose = require('mongoose');

const notSendEmail = new mongoose.Schema({
  //_id = userId, not auto generated, manual inserted
  token: String,
  dateCreated:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('notSendEmail',notSendEmail);
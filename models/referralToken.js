const mongoose = require('mongoose');

const referralToken = new mongoose.Schema({
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy:{
    type: String,
    default: null,
  },
  dateCreated:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('referralToken',referralToken);
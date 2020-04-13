const mongoose = require('mongoose');

// mining history
const mining = new mongoose.Schema({
  dateCreated:{
    type: Date,
    default: Date.now
  },
  miningIncome: {
    type: Number,
    default: 0
  },
  rank: String,
  power: String,
  grossIncome: {
    type: Number,
    default: 0
  }
});

module.exports=  mongoose.model('mining',mining);
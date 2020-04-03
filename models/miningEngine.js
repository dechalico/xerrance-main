const mongoose = require('mongoose');

// minings field array of if refer to mining.js
const miningEngine = new mongoose.Schema({
  minings:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'mining'
    }
  ]
});

module.exports = mongoose.model('miningEngine',miningEngine);
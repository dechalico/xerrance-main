const mongoose = require('mongoose');

// mining engine, store of all mines history
const miningEngine = new mongoose.Schema({
  mining:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'mining'
    }
  ],
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('miningEngine',miningEngine);
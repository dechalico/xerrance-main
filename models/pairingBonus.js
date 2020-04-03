const mongoose = require('mongoose');

const pairingBonus = new mongoose.Schema({
  newbie: {
    level1: {
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    }
  },
  teamLeader:{
    level1:{
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    },
    level2: {
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    },
    level3:{
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    }
  },
  director:{
    level1:{
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    },
    level2: {
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    },
    level3:{
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    }
  },
  president:{
    level1: {
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    }
  },
  seniorPresident: {
    level1: {
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    }
  },
  millionaireClub: {
    level1: {
      pairsBegin: Number,
      pairsEnd: Number,
      bonus: Number
    }
  }
});

module.exports = mongoose.model('pairingBonus',pairingBonus);
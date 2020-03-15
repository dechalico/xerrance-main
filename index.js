const server = require('./lib/server');
// const test = require('./test');

const index = {};

index.init = () => {
  server.init();
  // test.init();
  //test.clear();
};

index.init();

module.exports = index;
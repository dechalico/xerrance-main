const server = require('./lib/server');

const index = {};

index.init = () => {
  server.init();
};

index.init();

module.exports = index;
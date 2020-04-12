// declare dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongoStore = require('connect-mongo')(session);
const passport = require('passport');
const path = require('path');
const env = require('dotenv').config();
const lib = require('../lib/helpers');

// models declaration
const Member = require('../models/member');

// routes declaration
const routeIndex = require('../routes/index');
const routeDashboard = require('../routes/dashboard');
//const routeBuyCode = require('../routes/buyCode');
//const routeTest = require('../routes/test');
const routeTest = require('../routes/generated');

const server = {};

server.app = express();

server._setup = () => {
  // mongoose configurations
  mongoose.connect(process.env.DB_DEVELOPMENT_CONNECTION,
    {useNewUrlParser: true, useUnifiedTopology: true},(err) => {
      if(!err){
        console.log("Database Connected");
        server._appConfiguration();
      } else {
        console.log(err);
      }
    });
  mongoose.set('useCreateIndex',true);
  mongoose.set('useFindAndModify', false);
};

server._appConfiguration = () => {
  // express configurations
  server.app.use(express.static(path.join(__dirname,"../public")));
  server.app.use(bodyParser.urlencoded({extended: true}));
  server.app.set("view engine","ejs");

  // configuring session
  const sess = {
    secret: 'the secret of blockchain',
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({mongooseConnection: mongoose.connection, touchAfter: 24 * 3600}),
    cookie: {}
  };
  if(process.env.ENV.toLowerCase() === 'production'){
    server.app.set('trust proxy',1);
    sess.cookie.secure = true;
  }
  server.app.use(session(sess));

  // auth configuration
  server.app.use(passport.initialize());
  server.app.use(passport.session());
  server.app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals._host = process.env.HOST;
    next();
  });

  // configuring passport
  passport.use(Member.createStrategy());
  passport.serializeUser(Member.serializeUser());
  passport.deserializeUser(Member.deserializeUser());

  // using routes
  server.app.use(routeIndex);
  //server.app.use(routeBuyCode);
  server.app.use(routeTest);
  server.app.use(routeDashboard);
  server.app.get('*',(req,res) => {
    res.render('notFound',{host: process.env.HOST});
  });

  // starting the server to listen
  server.app.listen(process.env.PORT,(err) => {
    if(!err){
      console.log('Server running at port:',process.env.PORT);
    } else {
      console.log(err);
    }
  });
};

server.init = () => {
  server._setup();
  // get emediately the convertion
  //lib.convertion();
  
  // get the convertion and run every 3 hrs and 30 mins
  setInterval(() => lib.convertion(),1000 * 60 * 60 * 3.5)
};

module.exports = server;
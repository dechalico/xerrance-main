// declare dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongoStore = require('connect-mongo')(session);
const passport = require('passport');
const path = require('path');
const env = require('dotenv').config();

// models declaration
const User = require('../models/users');

// routes declaration
const routeIndex = require('../routes/index');
const routeDashboard = require('../routes/dashboard');

const server = {};

server.app = express();

server._setup = () => {
  // mongoose configurations
  const connectionString = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + 
    process.env.DB_HOST + ":" + process.env.DB_PORT + "/" + process.env.DB_NAME;
  mongoose.connect(process.env.CONNECTION_STRING,
    {useNewUrlParser: true, useUnifiedTopology: true},(err) => {
      if(!err){
        console.log("Database Connected");
        server._appConfiguration();
      } else {
        console.log(err);
      }
    });
  mongoose.set('useCreateIndex',true);
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
    next();
  });


  // configuring passport
  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  // using routes
  server.app.use(routeIndex);
  server.app.use(routeDashboard);
  server.app.get('*',(req,res) => {
    res.render('pageNotFound');
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
};

module.exports = server;
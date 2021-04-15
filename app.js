var createError = require('http-errors');
const mongoose = require('mongoose')
const fileUpload = require('express-fileupload');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors')
const passport = require('passport')
const scc = require('./config/config-service')

var indexRouter = require('./routes/index');

var app = express();

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
app.use(passport.initialize())
require('./config/passport')(passport)
app.use(fileUpload({
  createParentPath: true
}));

// Initialize configuration
scc.setConfig('https://scc.hecklawert.es/backend-dev.json').then(() => {
  // Bring in the Database Config
  const db = require('./config/keys').getMongoUri()
  mongoose.connect(db, {
    useNewUrlParser: true,
    authSource: "admin",
    useUnifiedTopology: true
  }).then(() => {
    console.log(`Database connected succesfully ${db}`)
  }).catch(err => {
    console.log(`Unable to connect with the database ${err}`)
  })
})

// Router
app.options('*', cors())
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send('Unable to find the requested resource!');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

});



module.exports = app;

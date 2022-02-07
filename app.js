var dotenv = require('dotenv');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

dotenv.config();


// Import routers

var currentRouter = require('./routes/current');
var powerRouter = require('./routes/power');
var reactorRouter = require('./routes/reactor');
var voltageRouter = require('./routes/voltage');
var reportsRouter = require('./routes/reports');
var equipmentRouter = require('./routes/equipment');
var tapRouter = require('./routes/tap');
var signupRouter = require('./routes/signup');
var signinRouter = require('./routes/signin');
var mxRouter = require('./routes/mx');


var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Functional routes
app.use('/reactor', reactorRouter);
app.use('/current', currentRouter);
app.use('/power', powerRouter);
app.use('/voltage', voltageRouter);
app.use('/reports', reportsRouter);
app.use('/equipment', equipmentRouter);
app.use('/tap', tapRouter);
app.use('/signin', signinRouter);
app.use('/signup', signupRouter);
app.use('/mx', mxRouter);

module.exports = app;

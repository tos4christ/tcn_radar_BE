var dotenv = require('dotenv');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

dotenv.config();


// Import routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var currentRouter = require('./routes/current');
var feedersRouter = require('./routes/feeders');
var hqRouter = require('./routes/hq');
var powerRouter = require('./routes/power');
var regionsRouter = require('./routes/regions');
var stationsRouter = require('./routes/stations');
var subregionsRouter = require('./routes/subregions');
var transformersRouter = require('./routes/transformers');
var voltageRouter = require('./routes/voltage');
var reportsRouter = require('./routes/reports');


var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Functional routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/current', currentRouter);
app.use('/feeders', feedersRouter);
app.use('/hq', hqRouter);
app.use('/power', powerRouter);
app.use('/regions', regionsRouter);
app.use('/stations', stationsRouter);
app.use('/subregions', subregionsRouter);
app.use('/transformers', transformersRouter);
app.use('/voltage', voltageRouter);
app.use('/reports', reportsRouter);



module.exports = app;

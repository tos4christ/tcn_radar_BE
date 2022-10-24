var dotenv = require('dotenv');
var cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mssqlServer = require('./database/nsongdb');
// var os = require('node:os');
// os.setPriority(process.pid, os.constants.priority.PRIORITY_HIGHEST);

dotenv.config();

// Add methods to accepts wide range of requests for the API

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
var sllRouter = require('./routes/station_line_load');
var linesRouter = require('./routes/lines');
var changePasswordRouter = require('./routes/changePassword');

var app = express();
var http_app = express();

// Redirect unsecured http requests to the secured https redirect
http_app.use(function(req, res, next) {
  if (req.secure){
    return next();
  }
  res.redirect("https://" + req.headers.host + req.url);
});

http_app.listen(80, "172.16.200.35");

app.use(cors());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'build')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Private-Network', true);
    res.header('Access-Control-Allow-Local-Network', true);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
      res.send(200);
    } else {
      next();
    }
  });



// Function to serve static react resources
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"))
// })

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
app.use('/sll', sllRouter);
app.use('/lines', linesRouter);
app.use('/changepassword', changePasswordRouter);


// app.get('/.well-known/pki-validation/F7E918FEFBA46C9E95A10FC7F19D183C.txt', (req, res) => {
//   res.sendFile(path.join(__dirname, "ssl", "F7E918FEFBA46C9E95A10FC7F19D183C.txt"))
// })


// Function to serve static react resources
app.get('/*', (req, res) => {
  // console.log(__dirname, 'the name of this directory')
  res.sendFile(path.join(__dirname, "build", "index.html"))
})

// Handle 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

  
// error handler
app.use(function(err, req, res, next) {
// set locals, only providing error in development
res.locals.message = err.message;
res.locals.error = req.app.get('env') === 'development' ? err : {};

// send the error
// res.status(err.status || 500);
res.send({error: err});
});

module.exports = app;

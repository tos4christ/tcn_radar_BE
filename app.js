var dotenv = require('dotenv');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mqtt = require("mqtt");

dotenv.config();

// Testing the MQTT service
const host = 'mqtt://127.0.0.1';
const options = {
    clientId: '',
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clean: true
}
const client = mqtt.connect(host, options);
client.on('connect', () => {
    client.subscribe('afam6ts/tv', (err) => {
        if(err) {
            console.log('this is the error', err);
        }
    })
});
client.on('message', (topic, message) => {
    console.log(message.toString(), 'then the topic', topic);
}); 

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
app.use('/sll', sllRouter);

module.exports = app;

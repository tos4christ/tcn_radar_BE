var dotenv = require('dotenv');
var cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var mqtt = require("mqtt");
// var db = require("./database/db");
// var linesModel = require("./models/lines");

dotenv.config();

// Testing the MQTT service
// const host = 'mqtt://127.0.0.1';
// const options = {
//     clientId: '',
//     username: process.env.MQTT_USER,
//     password: process.env.MQTT_PASS,
//     clean: true
// }
// const client = mqtt.connect(host, options);
// client.on('connect', () => {
//     client.subscribe(
//         [
//             'afam6ts/tv', 'gereguGs/pv', 'odukpanits/tv', 
//             'omotoso2ts/tv', 'riversIppPs/pr', 'sapelets/pv',
//             'omotoso11ts/pv', 'omotoso12ts/pv', 'delta3gs/pv',
//             'phmains/tv', 'lokojats/tv',
//             'ikotekpene/tv', 'gwagwaladats/tv', 'gereguGs/tv',
//             'ekimts/tv', 'eketts/tv', 'alaojinippts/tv'
//         ],
//      (err) => {
//         if(err) {
//             console.log('this is the error', err);
//         }
//     })
// });
// client.on('message', (topic, message) => {
//     // console.log(topic, 'the topic')
//     // line model data => date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant
//     let data;
//     // console.log(message.toString())
//     // try block needed here.
//     try {
//         data = JSON.parse(message.toString());     
//         const station = data.id;
//         const time = data.t ? data.t : new Date().toLocaleTimeString("en-GB").split(' ')[0];
//         const { lines, units } = data;
//         var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
//         const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
//         const hour = time.split(':')[0];
//         const minute = time.split(':')[1]
//         const seconds = time.split(':')[2]
//         const level = 330;
//         const dateTemp = date.split('-');
//         const epoch_time = new Date(Number(dateTemp[0]), Number(dateTemp[1]-1), Number(dateTemp[2]), Number(hour)+1, Number(minute), Number(seconds));
//         // console.log(epoch_time.getTime(), epoch_time, 'the epoch')
//         let kv, mw, mvar, amp, equipment_id, line_name, variant;
//         // loop over the lines or units array
//         const equip = lines ? lines : units ? units : undefined
//         equip.forEach(line => {
//             equipment_id = line.id;
//             line_name = line.id;
//             variant = line.td ? 'transmission' : line.gd ? 'generation' : undefined;
//             if (variant === 'transmission') {
//                 kv = line.td.V ? line.td.V : 0.00;
//                 mw = line.td.mw ? line.td.mw : 0.00;
//                 amp = line.td.A ? line.td.A : 0.00;
//                 mvar = line.td.mvar ? line.td.mvar : 0.00;
//             } else if (variant === 'generation') {
//                 kv = line.gd.V ? line.gd.V : 0.00;
//                 mw = line.gd.mw ? line.gd.mw : 0.00;
//                 amp = line.gd.A ? line.gd.A : 0.00;
//                 mvar = line.gd.mvar ? line.gd.mvar : 0.00;
//             } else if (variant === undefined) {
//                 return;
//             }
//             db.query(linesModel.create, [date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, epoch_time.getTime()])
//                 .then( response => {
//                     // console.log(response.rows)
//                 })
//                 .catch(err => console.log(err))
//         })   
//     // client.end()
//     } catch(err) {
//         console.error(err)
//     }
// });

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

var app = express();

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
res.status(err.status || 500);
res.send({error: err});
});

module.exports = app;

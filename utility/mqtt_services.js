var mqtt = require("mqtt");
var db = require("../database/db");
var linesModel = require("../models/lines");

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
    client.subscribe(
        [
            'afam6ts/tv', 'gereguGs/pv', 'odukpanits/tv', 
            'omotoso2ts/tv', 'riversIppPs/pr', 'sapelets/pv',
            'omotoso11ts/pv', 'omotoso12ts/pv', 'delta3gs/pv',
            'phmains/tv', 'lokojats/tv',
            'ikotekpene/tv', 'gwagwaladats/tv', 'gereguGs/tv',
            'ekimts/tv', 'eketts/tv', 'alaojinippts/tv'
        ],
     (err) => {
        if(err) {
            console.log('this is the error', err);
        }
    })
});
client.on('message', (topic, message) => {
    // line model data => date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant
    const data = JSON.parse(message.toString());
    const station = data.id;
    const time = data.t ? data.t : new Date().toLocaleTimeString('en-GB').split(' ')[0];
    const { lines, units } = data;
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const hour = time.split(':')[0];
    const minute = time.split(':')[1]
    const seconds = time.split(':')[2]
    const level = 330;
    let kv, mw, mvar, amp, equipment_id, line_name, variant;
    // loop over the lines or units array
    const equip = lines ? lines : units ? units : undefined
    equip.forEach(line => {
        equipment_id = line.id;
        line_name = line.id;
        variant = line.td ? 'transmission' : line.gd ? 'generation' : undefined;
        if (variant === 'transmission') {
            kv = line.td.V;
            mw = line.td.mw;
            amp = line.td.A;
            mvar = line.td.mvar;
        } else if (variant === 'generation') {
            kv = line.gd.V;
            mw = line.gd.mw;
            amp = line.gd.A;
            mvar = line.gd.mvar;
        } else if (variant === undefined) {
            return;
        }
        db.query(linesModel.create, [date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant])
            .then( response => {
                // console.log(response.rows)
            })
            .catch(err => console.log(err))
    })   
    // client.end()
}); 

module.exports = client;

var dateFormatter = require('../utility/dateFormatter');
var timeConverter = require('../utility/timeConverter');
var stations = require('../database/instructedStations');
var io = require('../database/sockets').getIO();

console.log(io, "  the io object");
const gridInstructions = {};

gridInstructions.updateGridTable = (req, res) => {
  const { instructedLoad, stationIds } = req.body;
  const instructionTime = new Date();

  console.log(instructedLoad, "  the instructed Load");
  console.log(stationIds, "  the station Ids");

  // Update selected stations
  stationIds.forEach(id => {
    const station = stations.find(s => s.id === id);
    if (station) {
      station.lastInstructionTime = instructionTime;
      station.currentTimer = '00:00:00';
      station.instructedLoad = instructedLoad;
    }
  });

  console.log(`New instruction for stations ${stationIds.join(', ')}: ${instructedLoad} MW`);

  // Broadcast to all connected GridTable clients
//   io.emit('station_update', stations);

  res.status(200).json({ 
    message: 'Instruction broadcasted',
    updatedStations: stationIds
  });
};

gridInstructions.getStations = (req, res) => {
  // Send the current state of stations
  res.status(200).json(stations);
}

// Handle GridTable connections
// try {
//     return;
//     io.on('connection', (socket) => {
//     console.log('New GridTable client connected');
    
//     // Send initial data to new client
//     socket.emit('initial_data', stations);
    
//     // Timer update handler
//     const timerInterval = setInterval(() => {
//         stations.forEach(station => {
//         if (station.lastInstructionTime) {
//             const diff = new Date() - new Date(station.lastInstructionTime);
//             const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
//             const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
//             const seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
//             station.currentTimer = `${hours}:${minutes}:${seconds}`;
//         }
//         });
//         socket.emit('timer_update', stations);
//     }, 1000);

//     socket.on('disconnect', () => {
//         console.log('GridTable client disconnected');
//         clearInterval(timerInterval);
//     });
//     });
// }
// catch(err)  {
//     console.error("Error in GridTable connection handler:", err)
// };



module.exports =  gridInstructions;

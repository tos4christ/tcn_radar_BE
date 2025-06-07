const { Server } = require('socket.io');

let io;

module.exports = {
    init: (server) => {
        io = new Server(server);
        io.on('connection', (socket) => {
            console.log('Client connected to global Socket.IO instance');
        });
        return io;
    },
    getIO: () => {
        if (!io) return console.log("Socket.IO has not been initialized!");
        return io;
    }
};
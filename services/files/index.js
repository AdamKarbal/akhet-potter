const http = require('http');
const fileQuery = require('./logic.js');
const { Server } = require('socket.io');

const server = http.createServer(function (request, response) {
  if(request.url.startsWith('/socket.io/')){
    return;
  }
  console.log(`Received query for a file: ${request.url}`);
  fileQuery.manage(request, response);
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
})

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

io.on('connection', (socket) => {
  console.log(`Received connection: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Disconnected ${socket.id}`);
  })
});

server.listen(8001, () => {
  console.log(`Front server demarré (port 8001)`);
});

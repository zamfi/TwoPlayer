const fs = require('fs');
const mime = require('mime');
const url = require('url');
const util = require('util');
const WebSocketServer = require('websocket').server;


/******************
 *                *
 * The Web Server *
 *                *
 ******************/

// what web port to listen to? Common values for development systems
// are 8000, 8080, 5000, 3000, etc. Round numbers greater than 1024.
const PORT = 8000;

// create the server module
let server = require('http').createServer(async (req, res) => {
  console.log("Got request!", req.method, req.url);
  
  // get the file path out of the URL, stripping any "query string"
  let path = url.parse(req.url, true).pathname
  
  // then, based on the file path:
  if (path == '/' || path == '/index.html' || path == '/client.js' || path == '/library.js'
      || path.startsWith('/public/')) {
    // if it's one of these known files above, then...
    
    // remove any path elements that go "up" in the file hierarchy
    let safePath = path.split('/').filter(e => ! e.startsWith('.')).join('/');
    
    // also. requests without a file path should be served the index.html file.
    if (safePath === '/') {
      safePath = '/index.html';
    }
    
    // try to get the requested file.
    try {
      let fullPath = '.' + safePath;
      if ((await util.promisify(fs.stat)(fullPath)).isFile()) {
        // if it's a valid file, then serve it! The mime library uses the
        // file extension to figure out the "mimetype" of the file.
        res.writeHead(200, {'Content-Type': mime.getType(safePath)});
        
        // create a "read stream" and "pipe" (connect) it to the response.
        // this sends all the data from the file to the client.
        fs.createReadStream(fullPath).pipe(res);
      } else {
        // if it's not a valid file, return a "404 not found" error.
        console.log("unknown request", path);
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end("Couldn't find your URL...");
      }
    } catch (err) {
      // if there's an error reading the file, return a 
      // "500 internal server error" error
      console.log("Error reading static file?", err);
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end("Failed to load something...try again later?");
    }
  } else {
    // if it's not one of the known files above, then return a
    // "404 not found" error.
    console.log("unknown request", path);
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end("Couldn't find your URL...");
  }
});
// tell the module to listen on the port we chose.
server.listen(PORT);



/************************
 *                      *
 * The Websocket Server *
 *                      *
 ************************/

// run the websocket server off the main web server
let wsServer = new WebSocketServer({
  httpServer: server
});

let waitingPool = [];
let connections = {};

// when there's a new websocket coming in...
wsServer.on('request', request => {
  // accept the connection
  let connection = request.accept(null, request.origin);
  
  let url = request.httpRequest.url;
  let roomId = url.substr(1);
  
  console.log("c ->", roomId);
  
  if (! roomId) {
    if (waitingPool.length == 0) {
      roomId = [
        Math.random(), 
        Math.random(), 
        Math.random(), 
        Math.random(), 
        Math.random()
      ].map(n => "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890"[Math.floor(n*62)]).join('')
      console.log("waiting for someone to join", roomId);
      waitingPool.push(roomId);
    } else {
      roomId = waitingPool.shift();
      console.log("joining waiting room", roomId);
    }
  }
  if (! connections[roomId]) {
    connections[roomId] = new Set([connection])
  } else {
    connections[roomId].add(connection)
  }
  console.log("now ->", roomId);
      
  connection.roomId = roomId;

  connection.send(JSON.stringify({
    from: "system",
    key: "room",
    room: roomId
  }));

  // when a message comes in on that connection
  connection.on('message', message => {
    // ignore it if it's not text
    if (message.type !== 'utf8') {
      return;
    }
    
    // get the text out if it is text.
    let messageString = message.utf8Data;
    console.log("message", messageString, "->", connection.roomId);

    // send it to everyone else in the room
    connections[connection.roomId].forEach(c => {
      if (c != connection) {
        c.send(JSON.stringify({from: 'broadcast', data: messageString}));
      }
    })
  });
  
  // when this connection closes, remove it from the set of all connections.
  connection.on('close', connection => {
    if (connections[connection.roomId]) {
      connections[connection.roomId].delete(connection)
    }
  });
});

// all ready! print the port we're listening on to make connecting easier.
console.log("Listening on port", PORT);
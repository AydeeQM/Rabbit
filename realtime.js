module.exports = function(server, sessionMiddleware){
  const io = require('socket.io')(server);
  const redis = require('redis');
  const client = redis.createClient();

  client.subscribe('images');

  io.use(function(socket, next){
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  client.on('message', function(channel, message){
    // console.log(`Recibimos un mensaje del canal: ${channel}`);
    // console.log(message);
    if(channel ==="images"){
      io.emit("new image", message);
    }
  });

  io.sockets.on('connection', function(socket){
    console.log(socket.request.session.user_id);
  })
}

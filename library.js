(function() {
  let socket = null;
  
  let tp = window.TwoPlayer = {
    status: 'disconnected',
    id: new URLSearchParams(window.location.search).get("roomId") || null,
    send: function(data) {
      if (socket) {
        socket.send(data)
      }
    }
  };

  function init() {
    socket = new WebSocket(`ws://${window.location.host}/${tp.id || ''}`);
    socket.addEventListener('close', () => {
      setTimeout(init, 1000+2000*random());
    });
  
    // when there's a message from the server, use the handleMessage function
    // to handle it.
    socket.addEventListener('message', message => {
      let data = JSON.parse(message.data);
      if (data.from == "broadcast") {
        if (tp.ondata) {
          tp.ondata(data.data);
        }
      } else if (data.from == "system") {
        if (tp.onsystem) {
          tp.onsystem(data);
        }
      }
    });   
  }

  window.addEventListener('load', init);  
})();


window.twoplayer.onsystem = function(data) {
  if (data.key == "room") {
    document.getElementById('roomId').innerHTML = `<a href="${'/?roomId='+data.room}">${data.room}</a>`;
    window.twoplayer.send("hello!");
  }
}

window.twoplayer.ondata = function(message) {
  alert(message);
}
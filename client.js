// window.TwoPlayer.onsystem = function(data) {
//   if (data.key == "room") {
//     document.getElementById('roomId').innerHTML = `<a href="${'/?roomId='+data.room}">${data.room}</a>`;
//     window.TwoPlayer.send("hello!");
//   }
// }
//
// window.TwoPlayer.ondata = function(message) {
//   alert(message);
// }


let whoAmI = 'x'

function setup() {
  createCanvas(400, 400);
  TwoPlayer.onsystem = function(data) {
    if (data.key == "room") {
      TwoPlayer.send("x");
      document.getElementById('link').innerHTML = `<a href="${'/?roomId='+data.room}">${data.room}</a>`;
    }
  }

  TwoPlayer.ondata = function(message) {
    if (message == 'x') {
      whoAmI = 'o';
      next = 'x'
      TwoPlayer.send("o");
      document.getElementById('message').innerText = "Connected!"
    } else if (message == 'o') {
      whoAmI = 'x';
      next = 'x'
      document.getElementById('message').innerText = "Connected!"
    } else {
      let data = JSON.parse(message);
      next = data.next;
      ttt = data.ttt;
    }
  }
}

var ttt = [[0,0,0],[0,0,0],[0,0,0]];

function draw() {
  background(220);
  for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 3; c++) {
      rect(r*width/3, c*height/3, width/3, height/3);
      push();
      translate(width/6 + r*width/3,
                 height/6 + c*height/3);
      if (ttt[r][c] == 'x') {
        line(-width/7,-height/7,width/7,height/7);
        line(-width/7,height/7,width/7,-height/7);
      } else if (ttt[r][c] == 'o') {
        ellipse(0,0,width/3.5,height/3.5);
      }
      pop();
    }
  }

  textAlign(CENTER, BOTTOM)
  if (next == whoAmI) {
    text("YOUR TURN, "+next.toLocaleUpperCase(), width/2, height-10);
  } else {
    text("WAITING FOR "+next.toLocaleUpperCase(), width/2, height-10);
  }
}

var next = '?';
function mousePressed() {
  if (next == whoAmI) {
    let r = floor(mouseX/(width/3));
    let c = floor(mouseY/(height/3));
    if (ttt[r][c] != 0) {
      return;
    }
    ttt[r][c] = next;
    next = next == 'x' ? 'o' : 'x';
    TwoPlayer.send(JSON.stringify({
      next: next,
      ttt: ttt
    }));
    console.log(ttt);
  }
}

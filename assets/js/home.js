window.onload = init;

function init() {
  if (!createjs) throw new Error("No CreateJS!");

  var sizeCanvas = function() {
    document.getElementById("canvas").setAttribute("width", window.innerWidth);
  }
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  var stage = new createjs.Stage("canvas");
  var dots = new createjs.Container();

  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener('tick', stage);

  for (var i = 0; i < stage.canvas.height * 2; i += 60) {
    var rc = new RowCircles(stage).displayObject;
    dots.addChild(rc);
    rc.x = (i / 60) % 2 == 0 ? 0 : 30;
    rc.y = (i / 60) * 60;
  }

  dots.x = -stage.canvas.width/2; dots.y = -stage.canvas.height/2;

  stage.addChild(dots);

  createjs.Tween.get(dots, { loop:true, bounce:true }).to({x:0, y:0}, 1000);
}

function RowCircles(stage) {
  this.displayObject = new createjs.Container();
  for (var i = 0; i < stage.canvas.width * 2; i += 60) {
    var c = new createjs.Shape();
    c.graphics.beginFill('red').drawCircle(0,0,20);
    this.displayObject.addChild(c);
    c.x = (i / 60) * 60;
  }
}
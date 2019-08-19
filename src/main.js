var loop = require('./loop');
var rand = require('./rand');
var key = require('./key');
var particlesEmitter = require('./particlesEmitter');

var canvas = document.createElement('canvas');
canvas.width = 480;
canvas.height = 640;
canvas.style.backgroundColor = '#8462AD';
document.body.appendChild(canvas);

var ctx = canvas.getContext('2d');

// demo entity
var cat = {
  x: rand.int(canvas.width),
  y: rand.int(canvas.height),
  width: 25,
  height: 25,
  speed: 150,
  color: '#fff'
};

// game loop
loop.start(function (dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particlesEmitter.emit({
    ctx: ctx,
    canvas: canvas,
    maxSize: 10,
    sizeVariation: 0.8,
    gravity: 0,
    density: 50,
    vx: {min:-2, max:2},
    vy: {min:0, max:5},
    maxLife: 10
  });

  particlesEmitter.emit({
    ctx: ctx,
    canvas: canvas,
    particleSize: 5,
    startingX: 20,
    startingY: 20
  });

  // update cat
  if (key.isDown(key.LEFT)) {
    cat.x = cat.x - (cat.speed * dt);
  }
  if (key.isDown(key.RIGHT)) {
    cat.x = cat.x + (cat.speed * dt);
  }
  if (key.isDown(key.UP)) {
    cat.y = cat.y - (cat.speed * dt);
  }
  if (key.isDown(key.DOWN)) {
    cat.y = cat.y + (cat.speed * dt);
  }

  // check bounds collisions
  if (cat.x < 0) {
    cat.x = canvas.width;
  } else if (cat.x > canvas.width) {
    cat.x = 0;
  }
  if (cat.y < 0) {
    cat.y = canvas.height;
  } else if (cat.y > canvas.height) {
    cat.y = 0;
  }

  // draw cat
  ctx.fillStyle = cat.color;
  ctx.fillRect(cat.x, cat.y, cat.width, cat.height);

  console.log('game update fn %s', dt);
});

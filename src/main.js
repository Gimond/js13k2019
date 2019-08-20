var loop = require('./loop');
var rand = require('./rand');
var key = require('./key');

const screenMaxSpeed = 200;
const white = '#fff';
const black = '#000';
const orange = '#ff9800';
const purple = '#8462AD';
const darkPurple = '#7a59a3';
const darkerPurple = '#593d7b';

const minObstacleSpace = 100;
const maxObstacleSpace = 300;

var canvas = document.createElement('canvas');
canvas.width = 480;
canvas.height = 640;
canvas.style.backgroundColor = purple;
document.body.appendChild(canvas);

var ctx = canvas.getContext('2d');

var state = 'title';
var screenY = 0;
var screenVelocity = 0; // 0 to 1
var screenSpeed = 0;
var timeElapsed = 0;
var timeFlowing = false;
var destruction = 0; // 0 to 100, 100 meaning taking control of the rocket
var obstacles = [];
var particles = [];

// player
var player = {
    color: white
};

// game loop
loop.start(function (dt) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (timeFlowing) {
        timeElapsed+=dt;
    }

    switch (state) {
        case "title":
            timeFlowing = false;
            screenY = 0;
            screenVelocity = 0;
            player.sprite = 'rocket';
            player.speedx = 0;
            player.speedy = 0;
            player.x = 240;
            player.y = 420;
            player.width = 24;
            player.height = 50;
            updatePlayer(dt);

            if (key.isDown(key.SPACE)) {
                state = "liftoff";
            }

            drawTitle();
            drawPlayer();
            drawGround();
            break;
        case "liftoff":
            timeFlowing = true;
            // screenY
            if (screenVelocity < 1) {
                screenVelocity = screenVelocity + dt / 4;
            }
            if (screenSpeed < screenMaxSpeed) {
                screenSpeed = screenVelocity * screenMaxSpeed;
            } else {
                // mash keys to take control
                state = "taking_control";
            }
            screenY = screenY + screenSpeed * dt;
            
            updatePlayer(dt);
            
            particlesEmitter({
                maxSize: 8,
                sizeVariation: 0.5,
                sizeChangeOnTime: 1.01,
                gravity: 0,
                density: 30,
                angle: {min:80, max:100},
                maxLife: Math.random()*10+40,
                velocity: 150 * dt,
                startingX: player.x+player.width/2,
                startingY: player.y+player.height-10,
                color: orange
            });

            if (screenY < 640) {
                particlesEmitter({
                    maxSize: 8,
                    sizeVariation: 0.5,
                    sizeChangeOnTime: 1.01,
                    gravity: 0,
                    density: 50,
                    angle: {min:-15, max:195},
                    maxLife: Math.random()*10+40,
                    velocity: 150 * dt,
                    startingX: player.x+player.width/2,
                    startingY: screenY + 470 + screenY / 3,
                    color: orange
                });
                drawTitle();
            }
    
            drawParticles();
            drawPlayer();
            drawGround();
            // particlesEmitter({
            //     ctx: ctx,
            //     canvas: canvas,
            //     particleSize: 5,
            //     angle: {min:0, max:360},
            //     startingX: 20,
            //     startingY: 20,
            //     maxLife: 10,
            // });
            break;
        case "taking_control":
            player.speedx = 150;
            player.speedy = 75;

            screenY = screenY + screenSpeed * dt;
            
            updatePlayer(dt);
            
            particlesEmitter({
                maxSize: 8,
                sizeVariation: 0.5,
                sizeChangeOnTime: 1.01,
                gravity: 0,
                density: 30,
                angle: {min:80, max:100},
                maxLife: Math.random()*10+40,
                velocity: 150 * dt,
                startingX: player.x+player.width/2,
                startingY: player.y+player.height-10,
                color: orange
            });
            drawParticles();
            drawPlayer();
            break;
        case "explode":
            break;
        case "falling":
            player.speedx = 150;
            player.speedy = 75;
            break;
        case "fallen":
            timeFlowing = false;
            break;
    }
    drawUi();
});

function updatePlayer(dt) {
    // update player
    player.rotate = 0;
    if (player.speedx != 0) {
        if (key.isDown(key.LEFT)) {
            player.x = player.x - (player.speedx * dt);
            player.rotate = -15;
        }
        if (key.isDown(key.RIGHT)) {
            player.x = player.x + (player.speedx * dt);
            player.rotate = 15;
        }
    }
    if (key.isDown(key.UP)) {
        player.y = player.y - (player.speedy * dt);
    }
    if (key.isDown(key.DOWN)) {
        player.y = player.y + (player.speedy * dt);
    }

    // check bounds collisions
    if (player.x < 5) {
        player.x = 5;
    } else if (player.x > canvas.width-player.width-5) {
        player.x = canvas.width-player.width-5;
    }
    if (player.y < 100) {
        player.y = 100;
    } else if (player.y > canvas.height-player.height-35) {
        player.y = canvas.height-player.height-35;
    }
}

function drawPlayer() {
    ctx.save();
    ctx.beginPath();

    ctx.translate(player.x+player.width/2, player.y+player.height/2);
    ctx.rotate(player.rotate * Math.PI / 180);
    ctx.fillStyle = player.color;

    if (player.sprite == "rocket") {
        // body
        drawCircle(0, -player.height/2, player.width/4, white);
        ctx.fillRect(-player.width/4, -player.height/2, player.width/2, player.height - 3);
        // booster left
        drawCircle(-player.width/3, 0, player.width/8, white);
        ctx.fillRect(-player.width/2, 0, player.width/4, player.height/2);
        // booster right
        drawCircle(player.width/3, 0, player.width/8, white);
        ctx.fillRect(player.width/4, 0, player.width/4, player.height/2);
    }
    
    ctx.restore();
}

function drawTitle() {
    // text
    canvas.style.letterSpacing = '-7px';
    ctx.fillStyle = darkPurple;
    ctx.font = 'bold 88px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("JOHNSON'S", canvas.width / 2 - 2, screenY + 300);
    ctx.font = 'bold 240px sans-serif';
    ctx.fillText("CAT", canvas.width / 2 - 7, screenY + 485);
}

function drawGround() {
    ctx.fillStyle = darkerPurple;
    ctx.fillRect(0, screenY + 470, 480, 170);
    ctx.fillRect(225, screenY + 425, 10, 45);
}

function drawUi() {
    ctx.fillStyle = black;
    ctx.fillRect(0, canvas.height - 30, 480, 30);

    canvas.style.letterSpacing = '0px';
    ctx.fillStyle = white;
    ctx.font = 'bold 20px sans-serif';

    ctx.textAlign = 'right';
    ctx.fillText(Math.floor(screenY) + ' m', canvas.width - 10, canvas.height - 8);

    ctx.textAlign = 'left';
    ctx.fillText(Math.floor(timeElapsed) + ' s', 10, canvas.height - 8);
}

function drawParticles() {
    for (var index in particles) {
        particles[index].x += particles[index].vx;
        particles[index].y += particles[index].vy;

        // Adjust for gravity
        particles[index].vy += particles[index].gravity;

        // Age the particle
        particles[index].life++;

        particles[index].size = particles[index].size*particles[index].sizeChangeOnTime;

        // Create the shapes
        drawCircle(particles[index].x, particles[index].y, particles[index].size, particles[index].color);

        // If Particle is old, it goes in the chamber for renewal
        if (particles[index].life >= particles[index].maxLife) {
            delete particles[index];
        }
    }
}

function drawCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function easeInCubic(t) {
    return t * t * t;
}

function particlesEmitter(settings) {
    var settings_default = {
        density: 20,
        maxSize: 10,
        sizeVariation: 0.3,
        sizeChangeOnTime: 1,
        gravity: 0.5,
        maxLife: 10,
        velocity: 5,
        angle: {min: 0, max: 360}
    };
    // merge settings with default
    this.settings = Object.assign(settings_default, settings);
    if (this.emit) {
        this.emit();
    }

    this.emit = function() {
        // Draw the particles
        for (var i = 0; i < this.settings.density; i++) {
            if (Math.random() > 0.97) {
                // Introducing a random chance of creating a particle
                // corresponding to an chance of 1 per second,
                // per "density" value
                var angle = this.toRadians(this.settings.angle.min + Math.random() * (this.settings.angle.max - this.settings.angle.min));
                var particleSettings = {
                    // Establish starting positions and velocities
                    size: this.settings.maxSize - Math.random() * (this.settings.maxSize * this.settings.sizeVariation),
                    x: this.settings.startingX,
                    y: this.settings.startingY,
                    vx: this.settings.velocity * Math.cos(angle),
                    vy: this.settings.velocity * Math.sin(angle),
                    life: 0,
                };
                particles.push(Object.assign(this.settings, particleSettings));
            }
        }
    };

    this.toRadians = function(angle) {
        return angle * (Math.PI / 180);
    }
}

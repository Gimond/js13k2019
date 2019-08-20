var loop = require('./loop');
var rand = require('./rand');
var key = require('./key');

const screenMaxSpeed = 200;
const white = '#fff';
const black = '#000';
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
var obstacles = [];

// demo entity
var rocket = {
    x: 252,
    y: 560,
    width: 24,
    height: 50,
    color: white
};
var cat = {
    x: rand.int(canvas.width),
    y: rand.int(canvas.height),
    width: 50,
    height: 50,
    color: white
};
var player = {};

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
            player = rocket;
            player.speedx = 0;
            player.speedy = 0;
            drawTitle(screenY);
            if (key.isDown(key.SPACE)) {
                state = "liftoff";
            }
            break;
        case "liftoff":
            timeFlowing = true;
            // screenY
            if (screenVelocity < 1) {
                screenVelocity = screenVelocity + dt / 10;
            }
            if (screenSpeed < screenMaxSpeed) {
                screenSpeed = screenVelocity * screenMaxSpeed;
            }
            screenY = screenY + screenSpeed * dt;
            if (screenY <= 640) {
                drawTitle(screenY);
            }
            player.speedx = 150;
            player.speedy = 75;
            particlesEmitter({
                ctx: ctx,
                canvas: canvas,
                maxSize: 10,
                sizeVariation: 0.8,
                gravity: 0,
                density: 50,
                angle: {min:80, max:110},
                maxLife: 10,
                startingX: player.x+player.width/2,
                startingY: player.y+player.height-10
            });
            particlesEmitter({
                ctx: ctx,
                canvas: canvas,
                particleSize: 5,
                angle: {min:0, max:360},
                startingX: 20,
                startingY: 20,
                maxLife: 10,
            });
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

    // update player
    if (key.isDown(key.LEFT)) {
        player.x = player.x - (player.speedx * dt);
    }
    if (key.isDown(key.RIGHT)) {
        player.x = player.x + (player.speedx * dt);
    }
    if (key.isDown(key.UP)) {
        player.y = player.y - (player.speedy * dt);
    }
    if (key.isDown(key.DOWN)) {
        player.y = player.y + (player.speedy * dt);
    }

    // check bounds collisions
    if (player.x < 0) {
        player.x = canvas.width;
    } else if (player.x > canvas.width) {
        player.x = 0;
    }
    if (player.y < 0) {
        player.y = canvas.height;
    } else if (player.y > canvas.height) {
        player.y = 0;
    }

    // draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
});

function drawTitle(y) {
    // text
    canvas.style.letterSpacing = '-7px';
    ctx.fillStyle = darkPurple;
    ctx.font = 'bold 88px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("JOHNSON'S", canvas.width / 2 - 2, y + 440);
    ctx.font = 'bold 240px sans-serif';
    ctx.fillText("CAT", canvas.width / 2 - 7, y + 625);

    // ground
    ctx.fillStyle = darkerPurple;
    ctx.fillRect(0, y + 610, canvas.width, 30);
}

function drawUi() {
    ctx.fillStyle = darkerPurple;
    ctx.fillRect(canvas.width - 100, canvas.height - 30, 100, 30);

    canvas.style.letterSpacing = '0px';
    ctx.fillStyle = white;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.floor(screenY) + ' m', canvas.width - 10, canvas.height - 8);
}

function easeInCubic(t) {
    return t * t * t;
}

function particlesEmitter(settings) {
    if (this.particles) {
        this.emit();
    } else {
        this.particles = [];
        var settings_default = {
            density: 20,
            maxSize: 10,
            sizeVariation: 0.3,
            startingX: settings.canvas.width / 2,
            startingY: settings.canvas.height / 4,
            gravity: 0.5,
            maxLife: 50,
            velocity: 5,
            angle: {min: 45, max: 135}
        };
        // merge settings with default
        this.settings = Object.assign(settings_default, settings);
    }

    this.emit = function() {
        // Draw the particles
        for (var i = 0; i < this.settings.density; i++) {
            if (Math.random() > 0.97) {
                // Introducing a random chance of creating a particle
                // corresponding to an chance of 1 per second,
                // per "density" value
                var angle = this.toRadians(this.settings.angle.min + Math.random() * (this.settings.angle.max - this.settings.angle.min));
                this.particles.push({
                    // Establish starting positions and velocities
                    size: this.settings.maxSize - Math.random() * (this.settings.maxSize * this.settings.sizeVariation),
                    x: this.settings.startingX,
                    y: this.settings.startingY,

                    vx: this.settings.velocity * Math.cos(angle),
                    vy: this.settings.velocity * Math.sin(angle),

                    // vx = Math.random() * (this.settings.vx.max - this.settings.vx.min) + this.settings.vx.min;
                    // vy = Math.random() * (this.settings.vy.max - this.settings.vy.min) + this.settings.vy.min;

                    life: 0,
                    maxLife: Math.random() * this.settings.maxLife / 2 + this.settings.maxLife / 2,
                });
            }
        }

        for (var j in this.particles) {
            this.drawParticle(j);
        }
    };

    this.drawParticle = function(index) {
        this.particles[index].x += this.particles[index].vx;
        this.particles[index].y += this.particles[index].vy;

        // Adjust for gravity
        this.particles[index].vy += this.settings.gravity;

        // Age the particle
        this.particles[index].life++;

        // If Particle is old, it goes in the chamber for renewal
        if (this.particles[index].life >= this.particles[index].maxLife) {
            delete particles[this.particles[index].id];
        }

        // Create the shapes
        this.settings.ctx.beginPath();
        this.settings.ctx.fillStyle = "#ffffff";
        // Draws a circle of radius 20 at the coordinates 100,100 on the this.settings.canvas
        this.settings.ctx.arc(this.particles[index].x, this.particles[index].y, this.particles[index].size, 0, Math.PI * 2, true);
        this.settings.ctx.closePath();
        this.settings.ctx.fill();
    };

    this.toRadians = function(angle) {
        return angle * (Math.PI / 180);
    }
}

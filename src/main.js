var loop = require('./loop');
var rand = require('./rand');
var key = require('./key');

const screenMaxSpeed = 200;
const white = '#fff';
const black = '#000';
const orange = '#ff9800';
const lightPurple = '#a285c6';
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
var particles = [];
var rocket = {
    possession: 0, // 0 to 100, 100 meaning taking control of the rocket
    health: 3
};
var waveAmplitudeModifier;
var waveAmplitude = 2;
var clouds = [
    {x: 50, y: 0, w: 100, h: 100},
    {x: 200, y: 40, w: 250, h: 100},
    {x: 100, y: 140, w: 200, h: 100},
];

// player
var player = {
    color: white
};

// game loop
loop.start(function (dt) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (timeFlowing) {
        timeElapsed += dt;
    }
    drawClouds();

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
            drawGround(dt);
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
                sizeRange: {min: 3, max: 10},
                gravity: 0,
                density: 30,
                angle: {min: 80, max: 100},
                maxLife: rand.range(20, 30),
                velocity: 150 * dt,
                startingX: player.x + player.width / 2,
                startingY: player.y + player.height - 10,
                color: orange
            });

            if (screenY < 640) {
                particlesEmitter({
                    sizeRange: {min: 3, max: 10},
                    gravity: 0,
                    density: 80,
                    angle: {min: -15, max: 195},
                    maxLife: rand.range(20, 30),
                    velocity: 150 * dt,
                    startingX: player.x + player.width / 2,
                    startingY: screenY + 470 + screenY / 3,
                    color: orange
                });
                drawTitle();
            }

            drawParticles();
            drawPlayer();

            if (screenY < 640) {
                drawGround(dt);
            }
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
            rocket.show_health = true;

            screenY = screenY + screenSpeed * dt;

            updatePlayer(dt);

            particlesEmitter({
                sizeRange: {min: 3, max: 10},
                gravity: 0,
                density: 30,
                angle: {min: 80, max: 100},
                maxLife: rand.range(40, 50),
                velocity: 150 * dt,
                startingX: player.x + player.width / 2,
                startingY: player.y + player.height - 10,
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
    } else if (player.x > canvas.width - player.width - 5) {
        player.x = canvas.width - player.width - 5;
    }
    if (player.y < 100) {
        player.y = 100;
    } else if (player.y > canvas.height - player.height - 35) {
        player.y = canvas.height - player.height - 35;
    }
}

function drawPlayer() {
    ctx.save();
    ctx.beginPath();

    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.rotate * Math.PI / 180);
    ctx.fillStyle = player.color;

    switch (player.sprite) {
        case "rocket":
            // body
            drawCircle(0, -player.height / 2, player.width / 4, white);
            ctx.fillRect(-player.width / 4, -player.height / 2, player.width / 2, player.height - 3);
            // booster left
            drawCircle(-player.width / 3, 0, player.width / 8, white);
            ctx.fillRect(-player.width / 2, 0, player.width / 4, player.height / 2);
            // booster right
            drawCircle(player.width / 3, 0, player.width / 8, white);
            ctx.fillRect(player.width / 4, 0, player.width / 4, player.height / 2);
            // window
            drawCircle(0, -player.height / 2.5, player.width / 8, purple);
            break;
        case "cat":
            ctx.fillRect(0, 0, player.width / 2, player.height - 3);
            break;
    }

    ctx.restore();
}

function drawTitle() {
    // text
    canvas.style.letterSpacing = '-7px';
    ctx.fillStyle = darkPurple;
    ctx.font = 'bold 88px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("JOHNSON'S", canvas.width / 2 - 2, screenY + 305);
    ctx.font = 'bold 240px sans-serif';
    ctx.fillText("CAT", canvas.width / 2 - 7, screenY + 500);
}

function drawGround(dt) {
    ctx.fillStyle = darkerPurple;
    // ground
    ctx.beginPath();
    ctx.moveTo(0, screenY + 440);
    ctx.lineTo(100, screenY + 440);
    ctx.lineTo(130, screenY + 470);
    ctx.lineTo(340, screenY + 470);
    ctx.lineTo(380, screenY + 490);
    // sea
    if (waveAmplitude >= 2) {
        waveAmplitudeModifier = -dt * 5;
    }
    if (waveAmplitude <= -2) {
        waveAmplitudeModifier = dt * 5;
    }
    waveAmplitude = waveAmplitude + waveAmplitudeModifier;
    drawWave({x: 380, y: screenY + 490}, {x: 480, y: screenY + 490}, 8, waveAmplitude, 4);
    ctx.lineTo(480, screenY + 640);
    ctx.lineTo(0, screenY + 640);
    ctx.fill();
    // rocket support
    ctx.fillRect(225, screenY + 425, 10, 45);
    // base
    var base = {x: 15, y: screenY + 405, w: 60, h: 40};
    ctx.fillRect(base.x, base.y, base.w, base.h);
    ctx.fillStyle = darkPurple;
    ctx.fillRect(base.x + 5, base.y + 5, 5, 5);
    ctx.fillRect(base.x + 15, base.y + 5, 5, 5); 
    ctx.fillRect(base.x + 35, base.y + 5, 5, 5);
    ctx.fillRect(base.x + 15, base.y + 15, 5, 5);
    ctx.fillRect(base.x + 15, base.y + 15, 5, 5);
    ctx.fillRect(base.x + 50, base.y + 15, 5, 5);
    ctx.fillRect(base.x + 5, base.y + 25, 5, 5);
}

function drawUi() {
    // background
    ctx.fillStyle = black;
    ctx.fillRect(0, canvas.height - 30, 480, 30);

    // text style
    canvas.style.letterSpacing = '0px';
    ctx.fillStyle = white;
    ctx.font = 'bold 20px sans-serif';

    // altitude
    ctx.textAlign = 'right';
    ctx.fillText(Math.floor(screenY) + ' m', canvas.width - 10, canvas.height - 8);

    // time
    ctx.textAlign = 'left';
    ctx.fillText(Math.floor(timeElapsed) + ' s', 10, canvas.height - 8);

    // rocket health
    // drawHeart();
    drawStar(240, 600, 20, 1);
}

function drawParticles() {
    for (var index in particles) {
        particles[index].x += particles[index].vx;
        particles[index].y += particles[index].vy;

        // Adjust for gravity
        particles[index].vy += particles[index].gravity;

        // Age the particle
        particles[index].life++;

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

function drawHeart(x, y) {
    ctx.beginPath();
    ctx.moveTo(75, 40);
    // 130,120
    ctx.bezierCurveTo(75, 37, 70, 25, 50, 25);
    ctx.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
    ctx.bezierCurveTo(20, 80, 40, 102, 75, 120);
    ctx.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
    ctx.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
    ctx.bezierCurveTo(85, 25, 75, 37, 75, 40);
    ctx.fill();
}

function drawClouds() {
    for (var index in clouds) {
        // ctx.fillStyle = black;
        // ctx.fillRect(clouds[index].x, clouds[index].y, clouds[index].w, clouds[index].h);
        ctx.save();
        ctx.beginPath();

        ctx.translate(clouds[index].x, screenY + clouds[index].y);

        if (!clouds[index].hasOwnProperty('circles')) {
            clouds[index].circles = [];
            var circlesNb = Math.ceil(clouds[index].w / 40)+1;
            var cloudRadius;
            var cloudX = 0;
            var centerFactor = 0;
            for (var i = 1; i <= circlesNb; i++) {
                centerFactor = Math.abs(1-(Math.abs(clouds[index].w/2 - cloudX)/(clouds[index].w/2)));
                console.log(centerFactor);
                cloudRadius = rand.range(10,15)+30*centerFactor;
                clouds[index].circles.push({
                    x: cloudX + cloudRadius,
                    y: clouds[index].h - cloudRadius,
                    radius: cloudRadius
                });
                cloudX = cloudX + cloudRadius*1.5;
            }
            console.log("---");
        }
        for (var ic in clouds[index].circles) {
            drawCircle(clouds[index].circles[ic].x, clouds[index].circles[ic].y, clouds[index].circles[ic].radius, lightPurple);
        }
        var lastCircleRadius = clouds[index].circles[clouds[index].circles.length-1].radius;
        ctx.moveTo(-40, clouds[index].h);
        ctx.lineTo(clouds[index].w / 2, clouds[index].h / 1.5);
        ctx.lineTo(clouds[index].w+lastCircleRadius*2+40, clouds[index].h);
        ctx.fill();

        ctx.restore();
    }
}

function drawStar(x, y, radius, alpha) {
    var k = 11,
        ra,
        r_point = radius * 2, // r_point is the radius to the external point,
        omega;
    ctx.beginPath();
    ctx.moveTo(x + (r_point * Math.sin(alpha * k)), y + (r_point * Math.cos(alpha * k)));
    for (; k != 0; k--) {
        ra = k % 2 == 1 ? r_point : radius;
        omega = alpha * k; //omega is the angle of the current point
        //cx and cy are the center point of the star.
        ctx.lineTo(x + (ra * Math.sin(omega)), y + (ra * Math.cos(omega)));
    }
    ctx.closePath();
}

function drawWave(from, to, frequency, amplitude, step, negative) {
    var cx = 0, cy = 0,
        fx = from.x, fy = from.y,
        tx = to.x, ty = to.y,
        i = 0, waveOffsetLength = 0,

        ang = Math.atan2(ty - fy, tx - fx),
        distance = Math.sqrt((fx - tx) * (fx - tx) + (fy - ty) * (fy - ty)),
        a = amplitude * (!negative ? 1 : -1),
        f = Math.PI * frequency;

    for (i; i <= distance; i += step) {
        waveOffsetLength = Math.sin((i / distance) * f) * a;
        cx = from.x + Math.cos(ang) * i + Math.cos(ang - Math.PI / 2) * waveOffsetLength;
        cy = from.y + Math.sin(ang) * i + Math.sin(ang - Math.PI / 2) * waveOffsetLength;
        i > 0 ? ctx.lineTo(cx, cy) : ctx.lineTo(cx, cy);
    }
}

function particlesEmitter(settings) {
    var settings_default = {
        density: 20,
        sizeRange: {min: 3, max: 10},
        gravity: 0.5,
        maxLife: 10,
        velocity: 5,
        angle: {min: 0, max: 360}
    };
    // merge settings with default
    this.settings = Object.assign(settings_default, settings);

    for (var i = 0; i < this.settings.density; i++) {
        if (rand.float() > 0.97) {
            // Introducing a random chance of creating a particle
            // corresponding to an chance of 1 per second,
            // per "density" value
            var angle = toRadians(rand.range(this.settings.angle.min, this.settings.angle.max));
            var particleSettings = {
                // Establish starting positions and velocities
                size: rand.range(this.settings.sizeRange.min, this.settings.sizeRange.max),
                x: this.settings.startingX,
                y: this.settings.startingY,
                vx: this.settings.velocity * Math.cos(angle),
                vy: this.settings.velocity * Math.sin(angle),
                life: 0,
            };
            particles.push(Object.assign(this.settings, particleSettings));
        }
    }
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

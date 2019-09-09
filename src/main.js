var loop = require('./loop');
var rand = require('./rand');
var key = require('./key');
var TinyMusic = require('./TinyMusic.min');
var jsfxr = require('./jsfxr');

const screenMaxSpeed = 200;
const screenMaxSpeedFalling = 400;
const white = '#fff';
const black = '#000';
const orange = '#ff9800';
const lightPurple = '#a285c6';
const purple = '#8462AD';
const darkPurple = '#7a59a3';
const darkerPurple = '#593d7b';
const deepPurple = '#442866';

const minObstacleSpace = 100;
const maxObstacleSpace = 300;
const minCloudSpace = 100;
const maxCloudSpace = 300;

const sfx = {
    'liftoff': [3, 0.18, 1, 0.73, 0.87, 0.0906, , , , 0.36, , -0.4493, 0.7532, , , , 0.3196, -0.038, 1, , , , , 0.5],
    'explosion1': [3, , 0.2339, 0.3721, 0.488, 0.0617, , , , , , , , , , , , , 1, , , , , 0.5],
    'explosion2': [3, , 0.2482, 0.2742, 0.4265, 0.2327, , 0.0663, , , , , , , , , -0.2529, -0.0528, 1, , , , , 0.5],
};

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
var screenShake = 0;
var screenShakeDamper = 0;
var timeElapsed = 0;
var timeFlowing = false;
var waveAmplitudeModifier;
var waveAmplitude = 2;
var drag = 1;
var keySpaceDown = false;
var starrySky = [];
var zoom = 1;
generateStarrySky();

// player
var player = {
    pos: {x: 0, y: 0},
    accel: {x: 0, y: 0},
    target: {x: 0, y: 0},
    sprite: 'rocket',
    rotate: 0,
    drag: 0.93
};
var obstacles = [];
var obstaclesTypes = {
    kite: {
        width: 10,
        height: 10,
        speedRange: {min: 2, max: 5}
    },
    bird: {
        width: 10,
        height: 10,
        speedRange: {min: 15, max: 20}
    },
    plane: {
        width: 30,
        height: 15,
        speedRange: {min: 15, max: 20}
    },
    satellite: {
        width: 60,
        height: 15,
        speedRange: {min: 5, max: 10}
    }
};
var particles = [];
var rocket = {
    possession: 0, // 0 to 100, 100 meaning taking control of the rocket
    showPossession: false,
    health: 3,
    showHealth: false
};
var clouds = [];
var explosions = [];
var particlesSettings = {
    rocket: {
        sizeRange: {min: 3, max: 8},
        gravity: 0,
        density: 50,
        angle: {min: 80, max: 100},
        maxLifeRange: {min: 10, max: 30},
        velocity: 150,
        color: orange,
        front: true
    },
    rocket_smoke: {
        sizeRange: {min: 4, max: 12},
        gravity: 0,
        density: 30,
        angle: {min: 80, max: 100},
        maxLifeRange: {min: 30, max: 40},
        velocity: 150,
        color: white
    },
    ground_smoke: {
        sizeRange: {min: 3, max: 10},
        gravity: 0,
        density: 80,
        angle: {min: -15, max: 195},
        maxLifeRange: {min: 20, max: 30},
        velocity: 150,
        color: white
    }
};


var fxPlayer = new Audio();

// fxPlayer.src = jsfxr(sfx.liftoff);
// fxPlayer.play();
// fxPlayer.src = jsfxr(sfx.explosion1);
// fxPlayer.play();

// sounds
var ac = new AudioContext();
// playMusic();

// game loop
loop.start(function (dt) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, deepPurple);
    gradient.addColorStop(1, purple);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, -10000, 480, 640);

    ac.resume();

    if (timeFlowing) {
        timeElapsed += dt;
    }
    if (key.isDown(key.ESC)) {
        state = "title";
    }

    if (screenY < 5000) {
        addClouds();
    }
    updateClouds(dt);
    updateObstacles(dt);

    ctx.save();
    if (screenShake < 0) {
        screenShake = 0;
    }
    if (screenShake > 0) {
        // get random acceleration on the interval [-strength, strength)
        var randx = Math.random() * 2 * screenShake - screenShake;
        var randy = Math.random() * 2 * screenShake - screenShake;
        // add in the shaking acceleration
        ctx.translate(randx, randy);

        // reduce strength
        screenShake -= screenShakeDamper * dt;
    }

    drawStarrySky();
    drawClouds();
    drawObstacles();

    switch (state) {
        case "title":
            timeElapsed = 0;
            timeFlowing = false;
            screenSpeed = 0;
            screenVelocity = 0;

            player = {
                pos: {x: 240, y: 420},
                accel: {x: 0, y: 0},
                target: {x: 0, y: 0},
                sprite: 'rocket',
                rotate: 0,
                drag: 0.93,
                width: 24,
                height: 50
            };
            player.target = player.pos;
            updatePlayer(dt);

            if (key.isDown(key.SPACE)) {
                screenShake = 4;
                screenShakeDamper = 1;
                state = "liftoff";

                addExplosion(240, 320, { 
                    sizeRange: {min: 3, max: 5},
                    gravity: 1,
                    velocity: 150,
                    color: white
                });
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
                rocket.showPossession = true;
                rocket.possession -= 0.5;
                // mash keys to take control
                if (key.isDown(key.SPACE) && keySpaceDown !== key.isDown(key.SPACE)) {
                    rocket.possession += 8;
                    screenShake = 3;
                    screenShakeDamper = 10;
                }
                keySpaceDown = key.isDown(key.SPACE);
                if (rocket.possession <= 0) {
                    rocket.possession = 0;
                }
                if (rocket.possession >= 100) {
                    state = "taking_control";
                }

                // @todo : comment
                state = "taking_control";
            }
            screenY = screenY + screenSpeed * dt;

            updatePlayer(dt);

            particlesEmitter(player.pos.x + player.width / 2, player.pos.y + player.height - 10, particlesSettings.rocket, dt);
            particlesEmitter(player.pos.x + player.width / 2, player.pos.y + player.height - 10, particlesSettings.rocket_smoke, dt);

            if (screenY < 640) {
                particlesEmitter(240 + player.width / 2, screenY + 470 + screenY / 3, particlesSettings.ground_smoke, dt);
                drawTitle();
            }

            drawParticles();
            drawPlayer();

            if (screenY < 640) {
                drawGround(dt);
            }
            break;
        case "taking_control":
            player.accel.x = 150;
            player.accel.y = 75;
            rocket.showPossession = false;
            rocket.showHealth = true;

            addObstacles();
            detectCollisions(dt);
            updatePlayer(dt);
            screenY = screenY + screenSpeed * dt;

            if (rocket.health <= 0) {
                screenSpeed = 500;
                screenVelocity = 0;
                state = "falling";
            }

            particlesEmitter(player.pos.x + player.width / 2, player.pos.y + player.height - 10, particlesSettings.rocket, dt);
            particlesEmitter(player.pos.x + player.width / 2, player.pos.y + player.height - 10, particlesSettings.rocket_smoke, dt);
            drawParticles();
            drawPlayer();
            break;
        case "falling":
            player.accel.x = 150;
            player.accel.y = 0;
            player.sprite = 'cat';
            player.width = 40;
            player.height = 25;
            rocket.showHealth = false;

            addObstacles();
            detectCollisions();
            updatePlayer(dt);
            screenY = screenY + screenSpeed * dt;

            if (screenVelocity < 1) {
                screenVelocity = screenVelocity + dt / 4;
            }
            if (screenSpeed > -screenMaxSpeedFalling) {
                screenSpeed = screenSpeed - 400 * dt;
            } else {
                screenSpeed = -screenMaxSpeedFalling;
            }

            if (screenY <= 0) {
                screenY = 0;
                state = "fallen";
            }

            if (screenY <= 640) {
                drawFarm(dt);
            }
            drawParticles();
            drawPlayer();

            break;
        case "fallen":
            drawFarm(dt);
            timeFlowing = false;
            break;
    }

    ctx.restore();
    drawUi();
});

function detectCollisions(dt) {
    ctx.fillStyle = "#ff0000";

    for (var index in obstacles) {
        var ob = obstacles[index];

        // ctx.fillRect(player.pos.x, player.pos.y, player.width, player.height);
        // ctx.fillRect(ob.x - ob.width/2, ob.y - ob.height/2 + screenY, ob.width, ob.height);
 
        if (player.pos.x + player.width >= ob.x - ob.width/2 &&
            player.pos.x <= ob.x + ob.width/2 &&
            player.pos.y + player.height >= ob.y - ob.height/2 + screenY &&
            player.pos.y <= ob.y + ob.height/2 + screenY
        ) {
            handleCollision(index, dt);
        }
    }
}

function handleCollision(index, dt) {
    // shake
    screenShake = 3;
    screenShakeDamper = 10;

    // remove obstacle
    obstacles.splice(index, 1);

    // add explosion
    addExplosion(obstacles[index].x, obstacles[index].y + screenY, {
        sizeRange: {min: 3, max: 5},
        gravity: 1,
        velocity: 150,
        color: white
    });

    if (state == "falling") {
        // bounce
        screenSpeed = 400;
        screenVelocity = 0;
    } else {
        // slow rocket a bit
        screenSpeed = screenSpeed*0.9;

        rocket.health--;
    }
}

function generateStarrySky() {
    caseh = 640 / 10;
    casew = 480 / 5;

    for (i = 0; i < 10; i++) {
        for (j = 0; j < 5; j++) {
            starrySky.push({
                x: rand.range(j * casew, j * casew + casew),
                y: rand.range(i * caseh, i * caseh + caseh),
                radius: rand.range(1, 3)
            });
        }
    }
}

function addClouds() {
    var nextY = 100;
    if (screenSpeed >= 0) {
        if (clouds.length) {
            nextY = clouds.slice(-1)[0].y - rand.range(minCloudSpace, maxCloudSpace);
        }
        if (nextY + screenY > -200) {
            clouds.push(
                {x: rand.range(-150, 480), y: nextY, w: rand.range(70, 200), h: rand.range(80, 120)}
            );
        }
    } else {
        if (clouds.length) {
            nextY = clouds[0].y + rand.range(minCloudSpace, maxCloudSpace);
        } else {
            nextY = -100;
        }

        if (nextY + screenY > -300 && nextY > 300) {
            clouds.unshift(
                {x: rand.range(-150, 480), y: nextY, w: rand.range(70, 200), h: rand.range(80, 120)}
            );
        }
    }
}

function updateClouds(dt) {
    for (var index in clouds) {
        clouds[index].x += 5 * dt;

        if (clouds[index].x > 520 || screenY > Math.abs(clouds[index].y) + 640 || screenY < Math.abs(clouds[index].y) - 640) {
            clouds.splice(index, 1);
        }
        // console.log(clouds.length);
    }
}

function addObstacles() {
    var nextY = 100;

    var keys = Object.keys(obstaclesTypes);
    var typeKey = keys[keys.length * Math.random() << 0];
    var type = obstaclesTypes[typeKey];
    var ox = rand.range(-type.width, 480);
    var vx = rand.range(type.speedRange.min, type.speedRange.max);
    if (ox > 240) {
        vx = -vx;
    }
    var newObstacle = {x: ox, y: nextY, width: type.width, height: type.height, vx: vx, type: typeKey};

    if (screenSpeed >= 0) {
        if (obstacles.length) {
            nextY = obstacles.slice(-1)[0].y - rand.range(minObstacleSpace, maxObstacleSpace);
        }
        if (nextY + screenY > -200) {
            newObstacle.y = nextY;
            obstacles.push(newObstacle);
        }
    } else {
        nextY = obstacles[0].y + rand.range(minObstacleSpace, maxObstacleSpace);

        if (nextY + screenY > 0) {
            newObstacle.y = nextY;
            obstacles.unshift(newObstacle);
        }
    }
}

function updateObstacles(dt) {
    for (var index in obstacles) {
        obstacles[index].x += obstacles[index].vx * dt;

        if (obstacles[index].x > obstacles[index].width + 480 || screenY > Math.abs(obstacles[index].y) + 1200 || screenY < Math.abs(obstacles[index].y) - 1200) {
            obstacles.splice(index, 1);
        }
        // if (obstacles[index].x > obstacles[index].width + 480 || screenY > Math.abs(obstacles[index].y) + 640 || screenY < Math.abs(obstacles[index].y) - 640) {
        //     obstacles.splice(index, 1);
        // }
    }
}

function updatePlayer(dt) {
    // update player
    player.rotate = 0;
    if (player.accel.x != 0) {
        if (key.isDown(key.LEFT)) {
            player.target.x = player.pos.x - (player.accel.x * dt);
            player.rotate = -15;
        }
        if (key.isDown(key.RIGHT)) {
            player.target.x = player.pos.x + (player.accel.x * dt);
            player.rotate = 15;
        }
    }
    if (key.isDown(key.UP)) {
        player.target.y = player.pos.y - (player.accel.y * dt);
    }
    if (key.isDown(key.DOWN)) {
        player.target.y = player.pos.y + (player.accel.y * dt);
    }

    // check bounds collisions
    if (player.target.x < 5) {
        player.target.x = 5;
    } else if (player.target.x > canvas.width - player.width - 5) {
        player.target.x = canvas.width - player.width - 5;
    }
    if (player.target.y < 100) {
        player.target.y = 100;
    } else if (player.target.y > canvas.height - player.height - 35) {
        player.target.y = canvas.height - player.height - 35;
    }

    player.pos.x = player.pos.x + ((player.target.x - player.pos.x) * player.drag);
    player.pos.y = player.pos.y + ((player.target.y - player.pos.y) * player.drag);
}

function drawPlayer() {
    ctx.save();
    ctx.beginPath();

    ctx.translate(player.pos.x + player.width / 2, player.pos.y + player.height / 2);
    ctx.rotate(player.rotate * Math.PI / 180);
    ctx.fillStyle = white;

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
            ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
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
    ctx.moveTo(-10, screenY + 440);
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
    drawWave({x: 380, y: screenY + 490}, {x: 490, y: screenY + 490}, 8, waveAmplitude, 4);
    ctx.lineTo(490, screenY + 640);
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

function drawFarm(dt) {
    ctx.fillStyle = darkerPurple;
    // sea
    if (waveAmplitude >= 2) {
        waveAmplitudeModifier = -dt * 5;
    }
    if (waveAmplitude <= -2) {
        waveAmplitudeModifier = dt * 5;
    }
    waveAmplitude = waveAmplitude + waveAmplitudeModifier;
    ctx.beginPath();
    ctx.moveTo(0, screenY + 490);
    drawWave({x: 0, y: screenY + 490}, {x: 150, y: screenY + 490}, 8, waveAmplitude, 4);
    // ground
    ctx.lineTo(160, screenY + 480);
    ctx.lineTo(480, screenY + 480);
    ctx.lineTo(480, screenY + 640);
    ctx.lineTo(0, screenY + 640);
    ctx.fill();
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

    // rocket possession
    if (rocket.showPossession) {
        ctx.fillStyle = white;
        ctx.fillRect(188, 616, 104, 18);
        ctx.fillStyle = deepPurple;
        ctx.fillRect(190, 618, 100, 14);
        ctx.fillStyle = white;
        ctx.fillRect(190, 618, rocket.possession, 14);
    }

    // rocket.possession

    // rocket health
    if (rocket.showHealth) {
        drawHeart(200, 615, 20, 20, white);
        drawHeart(230, 615, 20, 20, deepPurple);
        drawHeart(260, 615, 20, 20, deepPurple);
        if (rocket.health > 1) {
            drawHeart(230, 615, 20, 20, white);
        }
        if (rocket.health > 2) {
            drawHeart(260, 615, 20, 20, white);
        }
    }
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
            particles.splice(index, 1);
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

function drawHeart(x, y, w, h, color) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.fillStyle = color;

    ctx.moveTo(w / 2, h / 5);
    ctx.bezierCurveTo(w / 2, h / 5.88, w / 2.2, h / 20, w / 3.67, h / 20);
    ctx.bezierCurveTo(0, h / 20, 0, h / 2.35, 0, h / 2.35);
    ctx.bezierCurveTo(0, h / 1.67, w / 5.5, h / 1.22, w / 2, h);
    ctx.bezierCurveTo(w / 1.22, h / 1.22, w, h / 1.67, w, h / 2.35);
    ctx.bezierCurveTo(w, h / 2.35, w, h / 20, w / 1.38, h / 20);
    ctx.bezierCurveTo(w / 1.69, h / 20, w / 2, h / 5.88, w / 2, h / 5);

    ctx.fill();
    ctx.restore();
}

function drawClouds() {
    for (var index in clouds) {
        ctx.save();
        ctx.beginPath();

        ctx.translate(clouds[index].x, screenY + clouds[index].y);

        if (!clouds[index].hasOwnProperty('circles')) {
            clouds[index].circles = [];
            var circlesNb = Math.ceil(clouds[index].w / 40) + 1;
            var cloudRadius;
            var cloudX = 0;
            var centerFactor = 0;
            for (var i = 1; i <= circlesNb; i++) {
                centerFactor = Math.abs(1 - (Math.abs(clouds[index].w / 2 - cloudX) / (clouds[index].w / 2)));
                cloudRadius = rand.range(10, 15) + 30 * centerFactor;
                clouds[index].circles.push({
                    x: cloudX + cloudRadius,
                    y: clouds[index].h - cloudRadius,
                    radius: cloudRadius
                });
                cloudX = cloudX + cloudRadius * 1.5;
            }
        }
        for (var ic in clouds[index].circles) {
            drawCircle(clouds[index].circles[ic].x, clouds[index].circles[ic].y, clouds[index].circles[ic].radius, lightPurple);
        }
        var lastCircleRadius = clouds[index].circles[clouds[index].circles.length - 1].radius;
        ctx.moveTo(-40, clouds[index].h);
        ctx.lineTo(clouds[index].w / 2, clouds[index].h / 1.5);
        ctx.lineTo(clouds[index].w + lastCircleRadius * 2 + 40, clouds[index].h);
        ctx.fill();

        ctx.restore();
    }
}

function drawObstacles() {
    for (var index in obstacles) {
        ctx.save();
        ctx.beginPath();

        ctx.translate(obstacles[index].x, screenY + obstacles[index].y);
        if (obstacles[index].vx < 0) {
            ctx.scale(-1, 1);
        }

        // collision box
        ctx.fillStyle = black;
        ctx.fillRect(-obstacles[index].width / 2, -obstacles[index].height / 2, obstacles[index].width, obstacles[index].height);

        ctx.fillStyle = white;

        switch (obstacles[index].type) {
            case 'kite':
                ctx.moveTo(-obstacles[index].width/2, -obstacles[index].height/2);
                ctx.lineTo(obstacles[index].width/2-10, -obstacles[index].height/2+10);
                ctx.lineTo(obstacles[index].width/2, obstacles[index].height/2);
                ctx.lineTo(-obstacles[index].width/2+10, obstacles[index].height/2-10);
                ctx.fill();
                break;
            case 'bird':

                break;
            case 'plane':

                break;
            case 'satellite':

                break;
            case 'meteor':

                break;
        }

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
    // ctx.closePath();
    ctx.fill();
}

function drawStarrySky() {
    ctx.save();
    var opacity = (screenY - 1000) / 8000;
    if (opacity < 0) {
        opacity = 0;
    }
    if (opacity > 1) {
        opacity = 1;
    }
    ctx.globalAlpha = opacity;
    for (i in starrySky) {
        drawCircle(starrySky[i].x, starrySky[i].y, starrySky[i].radius, white);
    }
    ctx.restore();
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

function particlesEmitter(x, y, settings, dt) {
    var settings_default = {
        startingX: x,
        startingY: y,
        density: 20,
        sizeRange: {min: 3, max: 10},
        gravity: 0.5,
        maxLifeRange: {min: 10, max: 20},
        velocity: 5,
        angle: {min: 0, max: 360}
    };
    // merge settings with default
    settings = Object.assign(settings_default, settings);

    for (var i = 0; i < settings.density; i++) {
        if (rand.float() > 0.97) {
            // Introducing a random chance of creating a particle
            // corresponding to an chance of 1 per second,
            // per "density" value
            var angle = toRadians(rand.range(settings.angle.min, settings.angle.max));
            var particleSettings = {
                // Establish starting positions and velocities
                size: rand.range(settings.sizeRange.min, settings.sizeRange.max),
                x: settings.startingX,
                y: settings.startingY,
                vx: settings.velocity * dt * Math.cos(angle),
                vy: settings.velocity * dt * Math.sin(angle),
                maxLife: rand.range(settings.maxLifeRange.min, settings.maxLifeRange.max),
                life: 0,
            };
            if (settings.front) {
                particles.push(Object.assign(settings, particleSettings));
            } else {
                particles.unshift(Object.assign(settings, particleSettings));
            }
        }
    }
}

function addExplosion(x, y, settings, dt) {
    var settings_default = {
        startingX: x,
        startingY: y,
        sizeRange: {min: 3, max: 10},
        gravity: 0.5,
        maxLifeRange: {min: 10, max: 20},
        velocity: 5,
        color: white
    };
    // merge settings with default
    settings = Object.assign(settings_default, settings);

    var angle = 0;
    while (angle < 360) {
        var particleSettings = {
            size: rand.range(settings.sizeRange.min, settings.sizeRange.max),
            x: settings.startingX,
            y: settings.startingY,
            vx: settings.velocity * dt * Math.cos(toRadians(angle)),
            vy: settings.velocity * dt * Math.sin(toRadians(angle)),
            maxLife: rand.range(settings.maxLifeRange.min, settings.maxLifeRange.max),
            life: 0,
        };
        particles.push(Object.assign(settings, particleSettings));

        angle+= rand.range(15, 30);
    }
    console.log(particles);
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function playMusic() {
    // set the playback tempo (120 beats per minute)
    var tempo = 132;
// create some notes ('<Note Name> <Beat Length>')
// q = quarter note, h = half note (more on that later)
// create a new sequence
    var sequence = new TinyMusic.Sequence(ac, tempo, [
        'D3 q',
        'A3 q',
        'D3 q',
        'B3 q',
    ]);
    var sequence2 = new TinyMusic.Sequence(ac, tempo, [
        '- q',
        'E3 q',
        'A3 q',
        'G3 q',
    ]);
// disable looping
    sequence.loop = false;
    sequence2.loop = false;
    sequence.staccato = 0.55;
    sequence2.staccato = 0.55;
// play it
    sequence.play();
    sequence2.play();
}
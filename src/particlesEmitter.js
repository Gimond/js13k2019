particlesEmitter = {};
var particles = {},
    particleIndex = 0;

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function Particle(settings) {
    // Establish starting positions and velocities
    this.size = settings.maxSize - Math.random() * (settings.maxSize * settings.sizeVariation);
    this.x = settings.startingX;
    this.y = settings.startingY;

    var angle = toRadians(settings.angle.min + Math.random() * (settings.angle.max - settings.angle.min));
    this.vx = settings.velocity*Math.cos(angle);
    this.vy = settings.velocity*Math.sin(angle);

    // this.vx = Math.random() * (settings.vx.max - settings.vx.min) + settings.vx.min;
    // this.vy = Math.random() * (settings.vy.max - settings.vy.min) + settings.vy.min;

    // Add new particle to the index
    // Object used as it's simpler to manage that an array
    particleIndex++;
    particles[particleIndex] = this;
    this.id = particleIndex;
    this.life = 0;
    this.maxLife = Math.random() * settings.maxLife/2 + settings.maxLife/2;
}

// Some prototype methods for the particle's "draw" function
Particle.prototype.draw = function (settings) {
    this.x += this.vx;
    this.y += this.vy;

    // Adjust for gravity
    this.vy += settings.gravity;

    // Age the particle
    this.life++;

    // If Particle is old, it goes in the chamber for renewal
    if (this.life >= this.maxLife) {
        delete particles[this.id];
    }

    // Create the shapes
    settings.ctx.beginPath();
    settings.ctx.fillStyle = "#ffffff";
    // Draws a circle of radius 20 at the coordinates 100,100 on the settings.canvas
    settings.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
    settings.ctx.closePath();
    settings.ctx.fill();
};

exports.emit = function(settings) {
    settings_default = {
        density: 20,
        maxSize: 10,
        sizeVariation: 0.3,
        startingX: settings.canvas.width / 2,
        startingY: settings.canvas.height / 4,
        gravity: 0.5,
        maxLife: 50,
        velocity: 5,
        angle: {min:45, max:135}
    };
    // merge settings with default
    settings = Object.assign(settings_default, settings);
    // Draw the particles
    for (var i = 0; i < settings.density; i++) {
        if (Math.random() > 0.97) {
            // Introducing a random chance of creating a particle
            // corresponding to an chance of 1 per second,
            // per "density" value
            new Particle(settings);
        }
    }

    for (var i in particles) {
        particles[i].draw(settings);
    }
};
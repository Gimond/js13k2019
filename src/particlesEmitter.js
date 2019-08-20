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

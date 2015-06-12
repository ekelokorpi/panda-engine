/**
    @module particle
**/
game.module(
    'engine.particle'
)
.require(
    'engine.renderer.sprite'
)
.body(function() {

/**
    Particle emitter.
    @class Emitter
**/
game.createClass('Emitter', {
    /**
        Acceleration angle in radians.
        @property {Number} accelAngle
        @default Math.PI / 2
    **/
    accelAngle: Math.PI / 2,
    /**
        @property {Number} accelAngleVar
        @default 0
    **/
    accelAngleVar: 0,
    /**
        Acceleration speed.
        @property {Number} accelSpeed
        @default 0
    **/
    accelSpeed: 0,
    /**
        @property {Number} accelSpeedVar
        @default 0
    **/
    accelSpeedVar: 0,
    /**
        Is emitter active.
        @property {Boolean} active
        @default true
    **/
    active: true,
    /**
        Emit angle in radians.
        @property {Number} angle
        @default 0
    **/
    angle: 0,
    /**
        Variance of emit angle in radians.
        @property {Number} angleVar
        @default 0
    **/
    angleVar: 0,
    /**
        @property {Function} callback
    **/
    callback: null,
    /**
        Container for particle sprites.
        @property {Container} container
    **/
    container: null,
    /**
        How many particles to emit.
        @property {Number} count
        @default 1
    **/
    count: 1,
    /**
        Emitter duration in ms (0 is forever).
        @property {Number} duration
        @default 0
    **/
    duration: 0,
    /**
        @property {Number} durationTimer
        @default 0
    **/
    durationTimer: 0,
    /**
        End alpha for particle.
        @property {Number} endAlpha
        @default 0
    **/
    endAlpha: 1,
    /**
        @property {Number} endScale
        @default 1
    **/
    endScale: 1,
    /**
        @property {Number} endScaleVar
        @default 0
    **/
    endScaleVar: 0,
    /**
        Particle's life in ms (0 is forever).
        @property {Number} life
        @default 2000
    **/
    life: 2000,
    /**
        Particle's life variance.
        @property {Number} lifeVar
        @default 0
    **/
    lifeVar: 0,
    /**
        List of particles.
        @property {Array} particles
    **/
    particles: [],
    /**
        Emitter position.
        @property {Vector} position
    **/
    position: null,
    /**
        Emitter position variance.
        @property {Vector} positionVar
    **/
    positionVar: null,
    /**
        How often to emit new particles (ms).
        @property {Number} rate
        @default 100
    **/
    rate: 100,
    /**
        @property {Number} rateTimer
        @default 0
    **/
    rateTimer: 0,
    /**
        Particle's sprite rotation speed.
        @property {Number} rotate
        @default 0
    **/
    rotate: 0,
    /**
        Variance for particle's sprite rotation speed.
        @property {Number} rotateVar
        @default 0
    **/
    rotateVar: 0,
    /**
        Particle's initial speed.
        @property {Number} speed
        @default 100
    **/
    speed: 100,
    /**
        Variance for particle's initial speed.
        @property {Number} speedVar
        @default 0
    **/
    speedVar: 0,
    /**
        Starting alpha for particle.
        @property {Number} startAlpha
        @default 1
    **/
    startAlpha: 1,
    /**
        Starting scale for particle.
        @property {Number} startScale
        @default 1
    **/
    startScale: 1,
    /**
        @property {Number} startScaleVar
        @default 0
    **/
    startScaleVar: 0,
    /**
        Target position for particles.
        @property {Vector} target
    **/
    target: null,
    /**
        Target positions force.
        @property {Number} targetForce
        @default 0
    **/
    targetForce: 0,
    /**
        List of textures.
        @property {Array} textures
    **/
    textures: [],
    /**
        @property {Vector} velocityLimit
        @default 0,0
    **/
    velocityLimit: null,
    /**
        Particle's velocity rotation speed.
        @property {Number} velRotate
        @default 0
    **/
    velRotate: 0,
    /**
        Variance for particle's velocity rotation speed.
        @property {Number} velRotateVar
        @default 0
    **/
    velRotateVar: 0,

    staticInit: function() {
        game.pool.create(game.Emitter.poolName);
        this.position = new game.Vector();
        this.positionVar = new game.Vector();
        this.velocityLimit = new game.Vector();
        this.target = new game.Vector();
    },

    /**
        Add particle to emitter.
        @method addParticle
    **/
    addParticle: function() {
        var particle = game.pool.get(game.Emitter.poolName);
        if (!particle) particle = new game.Particle();

        particle.setTexture(this.textures.random());
        particle.rotation = 0;
        particle.alpha = this.startAlpha;
        particle.position.x = this.position.x + this.getVariance(this.positionVar.x);
        particle.position.y = this.position.y + this.getVariance(this.positionVar.y);
        particle.anchorCenter();

        var angleVar = this.getVariance(this.angleVar);
        var angle = this.angle + angleVar;
        var speed = this.speed + this.getVariance(this.speedVar);

        particle.setVelocity(angle, speed);

        if (this.angleVar !== this.accelAngleVar) angleVar = this.getVariance(this.accelAngleVar);
        angle = this.accelAngle + angleVar;
        speed = this.accelSpeed + this.getVariance(this.accelSpeedVar);

        particle.setAccel(angle, speed);

        particle.life = this.life + this.getVariance(this.lifeVar);
        particle.rotateAmount = this.rotate + this.getVariance(this.rotateVar);
        particle.velRotate = this.velRotate + this.getVariance(this.velRotateVar);

        if (this.startAlpha !== this.endAlpha) {
            particle.deltaAlpha = this.endAlpha - this.startAlpha;
            particle.deltaAlpha /= particle.life / 1000;
        }
        else particle.deltaAlpha = 0;

        var startScale = this.startScale + this.getVariance(this.startScaleVar);
        if (this.startScale !== this.endScale) {
            particle.deltaScale = (this.endScale + this.getVariance(this.endScaleVar)) - startScale;
            particle.deltaScale /= particle.life / 1000;
        }
        else particle.deltaScale = 0;
        particle.scale.set(startScale);

        if (this.container) this.container.addChild(particle);

        this.particles.push(particle);
    },

    /**
        Add emitter to container.
        @method addTo
        @param {Container} container
        @chainable
    **/
    addTo: function(container) {
        this.container = container;
        return this;
    },

    /**
        Emit particles.
        @method emit
        @param {Number} [count]
    **/
    emit: function(count) {
        count = count || this.count;
        for (var i = 0; i < count; i++) {
            this.addParticle();
        }
    },

    /**
        Get value with variance.
        Example: if you have value 100 with variance of 50, you will get value between 50 to 150.
        @method getVariance
        @param {Number} value
        @return {Number}
    **/
    getVariance: function(value) {
        return (Math.random() * value) * (Math.random() > 0.5 ? -1 : 1);
    },

    /**
        @method onComplete
        @param {Function} callback
    **/
    onComplete: function(callback) {
        this.callback = callback;
    },

    /**
        Remove emitter from scene.
        @method remove
    **/
    remove: function() {
        this._remove = true;
    },

    /**
        Remove particle from emitter.
        @method removeParticle
        @param {Particle} particle
    **/
    removeParticle: function(particle) {
        particle.remove();
        game.pool.put(game.Emitter.poolName, particle);
        this.particles.erase(particle);
    },

    /**
        Reset emitter timer.
        @method reset
    **/
    reset: function() {
        this.durationTimer = 0;
        this.active = true;
    },

    /**
        Update particle.
        @method updateParticle
        @param {Particle} particle
    **/
    updateParticle: function(particle) {
        if (particle.life > 0) {
            particle.life -= game.delta * 1000;
            if (particle.life <= 0) return this.removeParticle(particle);
        }

        if (this.targetForce > 0) {
            particle.accel.set(this.target.x - particle.position.x, this.target.y - particle.position.y);
            var len = Math.sqrt(particle.accel.x * particle.accel.x + particle.accel.y * particle.accel.y);
            particle.accel.x /= len || 1;
            particle.accel.y /= len || 1;
            particle.accel.x *= this.targetForce;
            particle.accel.y *= this.targetForce;
        }

        particle.velocity.x += particle.accel.x * game.delta;
        particle.velocity.y += particle.accel.y * game.delta;
        
        if (this.velocityLimit.x > 0) {
            if (particle.velocity.x > this.velocityLimit.x) particle.velocity.x = this.velocityLimit.x;
            if (particle.velocity.x < -this.velocityLimit.x) particle.velocity.x = -this.velocityLimit.x;
        }
        if (this.velocityLimit.y > 0) {
            if (particle.velocity.y > this.velocityLimit.y) particle.velocity.y = this.velocityLimit.y;
            if (particle.velocity.y < -this.velocityLimit.y) particle.velocity.y = -this.velocityLimit.y;
        }

        if (particle.velRotate) {
            var c = Math.cos(particle.velRotate * game.delta);
            var s = Math.sin(particle.velRotate * game.delta);
            var x = particle.velocity.x * c - particle.velocity.y * s;
            var y = particle.velocity.y * c + particle.velocity.x * s;
            particle.velocity.set(x, y);
        }
        
        particle.position.x += particle.velocity.x * game.delta;
        particle.position.y += particle.velocity.y * game.delta;

        if (particle.deltaAlpha) particle.alpha = Math.max(0, particle.alpha + particle.deltaAlpha * game.delta);
        if (particle.deltaScale) particle.scale.add(particle.deltaScale * game.delta);

        particle.rotation += particle.rotateAmount * game.delta;
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (this._remove) {
            for (var i = this.particles.length - 1; i >= 0; i--) {
                this.removeParticle(this.particles[i]);
            }
            return;
        }

        this.durationTimer += game.delta * 1000;
        if (this.duration > 0) {
            this.active = this.durationTimer < this.duration;
            if (!this.active && this.particles.length === 0 && typeof this.callback === 'function') {
                this.callback();
                this.callback = null;
            }
        }

        if (this.rate && this.active) {
            this.rateTimer += game.delta * 1000;
            if (this.rateTimer >= this.rate) {
                this.rateTimer = 0;
                this.emit();
            }
        }

        for (var i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i]);
        }
    }
});

game.addAttributes('Emitter', {
    /**
        @attribute {String} poolName
        @default emitter
    **/
    poolName: 'emitter'
});

/**
    @class Particle
    @extend Sprite
**/
game.createClass('Particle', 'Sprite', {
    /**
        @property {Vector} accel
    **/
    accel: null,
    /**
        @property {Number} deltaScale
        @default 0
    **/
    deltaScale: 0,
    /**
        @property {Number} deltaAlpha
        @default 0
    **/
    deltaAlpha: 0,
    /**
        @property {Number} life
        @default 0
    **/
    life: 0,
    /**
        @property {Number} rotateAmount
        @default 0
    **/
    rotateAmount: 0,
    /**
        @property {Vector} velocity
    **/
    velocity: null,
    /**
        @property {Number} velRotate
        @default 0
    **/
    velRotate: 0,

    staticInit: function(texture) {
        this.super(texture);
        this.velocity = new game.Vector();
        this.accel = new game.Vector();
    },

    /**
        @method setVelocity
        @param {Number} angle
        @param {Number} speed
    **/
    setVelocity: function(angle, speed) {
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
    },

    /**
        @method setAccel
        @param {Number} angle
        @param {Number} speed
    **/
    setAccel: function(angle, speed) {
        this.accel.x = Math.cos(angle) * speed;
        this.accel.y = Math.sin(angle) * speed;
    }
});

});

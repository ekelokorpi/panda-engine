/**
    @module particle
    @namespace game
**/
game.module(
    'engine.particle'
)
.body(function() {
'use strict';

/**
    @class Particle
    @extends game.Class
**/
game.createClass('Particle', {
    /**
        @property {game.Point} position
    **/
    position: null,
    /**
        @property {game.Point} velocity
    **/
    velocity: null,
    /**
        @property {game.Sprite} sprite
    **/
    sprite: null,
    /**
        @property {game.Point} accel
    **/
    accel: null,

    init: function() {
        this.position = new game.Point();
        this.velocity = new game.Point();
        this.accel = new game.Point();
    },

    /**
        @method setVelocity
        @param {Number} angle
        @param {Number} speed
    **/
    setVeloctity: function(angle, speed) {
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

/**
    Particle emitter.
    @class Emitter
    @extends game.Class
    @constructor
    @param {Object} [settings]
**/
game.createClass('Emitter', {
    /**
        Pool name for particles.
        @property {String} poolName
        @default emitter
    **/
    poolName: 'emitter',
    /**
        @property {Array} particles
    **/
    particles: [],
    /**
        List of texture paths.
        @property {Array} textures
    **/
    textures: [],
    /**
        Container for particle sprites.
        @property {game.Container} container
    **/
    container: null,
    /**
        @property {game.Point} position
    **/
    position: null,
    /**
        @property {game.Point} positionVar
    **/
    positionVar: null,
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
        Emitter duration in ms (0 is forever).
        @property {Number} duration
        @default 0
    **/
    duration: 0,
    durationTimer: 0,
    /**
        How often to emit new particles in ms.
        @property {Number} rate
        @default 100
    **/
    rate: 100,
    rateTimer: 0,
    /**
        Emit count of particles.
        @property {Number} count
        @default 10
    **/
    count: 10,
    /**
        Is emitter active.
        @property {Boolean} active
        @default true
    **/
    active: true,
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
        Starting alpha for particle.
        @property {Number} startAlpha
        @default 1
    **/
    startAlpha: 1,
    /**
        End alpha for particle.
        @property {Number} endAlpha
        @default 0
    **/
    endAlpha: 1,
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
        Target position for particles.
        @property {game.Point} target
    **/
    target: null,
    /**
        Target positions force.
        @property {Number} targetForce
        @default 0
    **/
    targetForce: 0,
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
        Settings to apply on particle sprite.
        @property {Object} spriteSettings
    **/
    spriteSettings: {
        anchor: { x: 0.5, y: 0.5 },
    },
    /**
        @property {game.Point} velocityLimit
        @default 0
    **/
    velocityLimit: null,
    callback: null,

    init: function(settings) {
        game.pool.create(this.poolName);
        this.position = new game.Point();
        this.positionVar = new game.Point();
        this.velocityLimit = new game.Point();
        this.target = new game.Point();

        game.merge(this, settings);
    },

    onComplete: function(callback) {
        this.callback = callback;
    },

    /**
        Reset emitter values to defaults.
        @method reset
        @param {Boolean} resetVec Reset vector values.
    **/
    reset: function(resetVec) {
        for (var name in this) {
            if (typeof this[name] === 'number') {
                this[name] = game.Emitter.prototype[name];
            }
            if (this[name] instanceof game.Point && resetVec) {
                this[name].set(0, 0);
            }
        }
    },

    /**
        Get value with variance.
        Example: if you have value 100 with variance of 50, you will get value between 50 to 150.
        @method getVariance
        @return {Number}
    **/
    getVariance: function(value) {
        return (Math.random() * value) * (Math.random() > 0.5 ? -1 : 1);
    },

    /**
        Add particle to emitter.
        @method addParticle
    **/
    addParticle: function() {
        var particle = game.pool.get(this.poolName);
        if (!particle) particle = new game.Particle();

        particle.position.x = this.position.x + this.getVariance(this.positionVar.x);
        particle.position.y = this.position.y + this.getVariance(this.positionVar.y);

        var angleVar = this.getVariance(this.angleVar);
        var angle = this.angle + angleVar;
        var speed = this.speed + this.getVariance(this.speedVar);

        particle.setVeloctity(angle, speed);

        if (this.angleVar !== this.accelAngleVar) angleVar = this.getVariance(this.accelAngleVar);

        angle = this.accelAngle + angleVar;
        speed = this.accelSpeed + this.getVariance(this.accelSpeedVar);

        particle.setAccel(angle, speed);

        particle.life = this.life + this.getVariance(this.lifeVar);

        if (!particle.sprite) {
            particle.sprite = new game.Sprite(this.textures.random(), particle.position.x, particle.position.y, this.spriteSettings);
        }
        else {
            particle.sprite.setTexture(this.textures.random());
            particle.sprite.position.x = particle.position.x;
            particle.sprite.position.y = particle.position.y;
            particle.sprite.rotation = 0;
        }

        particle.rotate = this.rotate + this.getVariance(this.rotateVar);
        particle.velRotate = this.velRotate + this.getVariance(this.velRotateVar);

        if (this.startAlpha !== this.endAlpha) {
            particle.deltaAlpha = this.endAlpha - this.startAlpha;
            particle.deltaAlpha /= particle.life / 1000;
        }
        else particle.deltaAlpha = 0;

        particle.sprite.alpha = this.startAlpha;

        var startScale = this.startScale + this.getVariance(this.startScaleVar);
        if (this.startScale !== this.endScale) {
            particle.deltaScale = (this.endScale + this.getVariance(this.endScaleVar)) - startScale;
            particle.deltaScale /= particle.life / 1000;
        }
        else particle.deltaScale = 0;
        particle.sprite.scale.x = particle.sprite.scale.y = startScale;

        if (this.container) this.container.addChild(particle.sprite);

        this.particles.push(particle);
    },

    /**
        Update particle.
        @method updateParticle
    **/
    updateParticle: function(particle) {
        if (particle.life > 0) {
            particle.life -= game.system.delta * 1000;
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

        particle.velocity.x += particle.accel.x * game.system.delta;
        particle.velocity.y += particle.accel.y * game.system.delta;
        
        if (this.velocityLimit.x > 0 || this.velocityLimit.y > 0) {
            particle.velocity.x = particle.velocity.x.limit(-this.velocityLimit.x, this.velocityLimit.x);
            particle.velocity.y = particle.velocity.y.limit(-this.velocityLimit.y, this.velocityLimit.y);
        }

        if (particle.velRotate) {
            var c = Math.cos(particle.velRotate * game.system.delta);
            var s = Math.sin(particle.velRotate * game.system.delta);
            
            var x = particle.velocity.x * c - particle.velocity.y * s;
            var y = particle.velocity.y * c + particle.velocity.x * s;
            
            particle.velocity.set(x, y);
        }
        
        particle.position.x += particle.velocity.x * game.scale * game.system.delta;
        particle.position.y += particle.velocity.y * game.scale * game.system.delta;

        if (particle.deltaAlpha) particle.sprite.alpha = Math.max(0, particle.sprite.alpha + particle.deltaAlpha * game.system.delta);
        if (particle.deltaScale) particle.sprite.scale.x = particle.sprite.scale.y += particle.deltaScale * game.system.delta;
        particle.sprite.rotation += particle.rotate * game.system.delta;
        particle.sprite.position.x = particle.position.x;
        particle.sprite.position.y = particle.position.y;
    },

    /**
        Remove particle from emitter.
        @method removeParticle
    **/
    removeParticle: function(particle) {
        if (particle.sprite.parent) particle.sprite.parent.removeChild(particle.sprite);
        game.pool.put(this.poolName, particle);
        this.particles.erase(particle);
    },

    /**
        Emit particles to emitter.
        @method emit
        @param {Number} count
    **/
    emit: function(count) {
        count = count || 1;
        for (var i = 0; i < count; i++) {
            this.addParticle();
        }
    },

    /**
        Update particles.
        @method update
    **/
    update: function() {
        if (this._remove) {
            for (var i = this.particles.length - 1; i >= 0; i--) {
                this.removeParticle(this.particles[i]);
            }
            return;
        }

        this.durationTimer += game.system.delta * 1000;
        if (this.duration > 0) {
            this.active = this.durationTimer < this.duration;
            if (!this.active && this.particles.length === 0 && typeof this.callback === 'function') {
                this.callback();
                this.callback = null;
            }
        }

        if (this.rate && this.active) {
            this.rateTimer += game.system.delta * 1000;
            if (this.rateTimer >= this.rate) {
                this.rateTimer = 0;
                this.emit(this.count);
            }
        }

        for (var i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i]);
        }
    },

    /**
        Remove emitter from scene.
        @method remove
    **/
    remove: function() {
        this._remove = true;
    },

    /**
        Add emitter to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        this.container = container;
    }
});

});

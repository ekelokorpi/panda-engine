/**
    Particle engine.

    @module particle
    @namespace game
**/
game.module(
    'engine.particle',
    '1.0.0'
)
.require(
    'engine.physics'
)
.body(function() {

/**
    @class Particle
    @extends game.Class
**/
game.Particle = game.Class.extend({
    /**
        @property {game.Vector} position
    **/
    position: null,
    /**
        @property {game.Vector} velocity
    **/
    velocity: null,
    /**
        @property {game.Sprite} sprite
    **/
    sprite: null,

    init: function() {
        this.position = new game.Vector();
        this.velocity = new game.Vector();
    },

    /**
        @method setVelocity
        @param {Number} angle
        @param {Number} speed
    **/
    setVeloctity: function(angle, speed) {
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = -Math.sin(angle) * speed;
    }
});

/**
    Particle emitter. Uses pool named `emitter`.

    __Example__

        var emitter = new game.Emitter();
        emitter.container = game.scene.stage;
        emitter.textures.push('media/particle.png');
        emitter.position.x = game.system.width / 2;
        emitter.position.y = game.system.height / 2;

    @class Emitter
    @extends game.Class
    @constructor
    @param {Object} [settings]
**/
game.Emitter = game.Class.extend({
    /**
        @property {Array} particles
    **/
    particles: [],
    /**
        @property {game.Vector} gravity
    **/
    gravity: null,
    /**
        @property {game.Vector} position
    **/
    position: null,
    /**
        @property {game.Vector} positionVar
    **/
    positionVar: null,
    /**
        @property {Number} angle
    **/
    angle: 0,
    /**
        @property {Number} angle
    **/
    angleVar: Math.PI,
    /**
        @property {Number} speed
    **/
    speed: 200,
    /**
        @property {Number} speedVar
    **/
    speedVar: 0,
    /**
        Particle's life in seconds.
        @property {Number} life
    **/
    life: 3,
    /**
        Particle's life variance.
        @property {Number} lifeVar
    **/
    lifeVar: 0,
    /**
        Emitter duration in seconds. 0 = forever
        @property {Number} duration
    **/
    duration: 0,
    elapsed: 0, // timer for duration
    /**
        Emitter rate.
        @property {Number} rate
    **/
    rate: 0.1,
    counter: 0, // timer for rate
    /**
        Emit count.
        @property {Number} count
    **/
    count: 10, // how many particles to emit
    /**
        @property {Boolean} active
    **/
    active: true,
    /**
        Particle's velocity rotation speed.
        @property {Number} velRotate
    **/
    velRotate: 0,
    /**
        @property {Number} velRotateVar
    **/
    velRotateVar: 0,
    /**
        Particle's sprite rotation speed.
        @property {Number} rotate
    **/
    rotate: 0,
    /**
        @property {Number} rotateVar
    **/
    rotateVar: 0,
    /**
        @property {Number} startAlpha
    **/
    startAlpha: 1,
    /**
        @property {Number} endAlpha
    **/
    endAlpha: 1,
    /**
        @property {Number} startScale
    **/
    startScale: 1,
    /**
        @property {Number} startScaleVar
    **/
    startScaleVar: 0,
    /**
        @property {Number} endScale
    **/
    endScale: 0.5,
    /**
        @property {Number} endScaleVar
    **/
    endScaleVar: 0,
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
    target: null,

    init: function(settings) {
        game.pool.create('emitter');
        this.gravity = new game.Vector();
        this.position = new game.Vector();
        this.positionVar = new game.Vector();
        this.target = new game.Vector(400, game.system.height / 2);

        game.merge(this, settings);
    },

    getVariance: function(value) {
        return (Math.random() * value) * (Math.random() > 0.5 ? -1 : 1);
    },

    addParticle: function() {
        var particle = game.pool.get('emitter');
        if(!particle) particle = new game.Particle();

        particle.position.x = this.position.x + this.getVariance(this.positionVar.x);
        particle.position.y = this.position.y + this.getVariance(this.positionVar.y);

        var angle = this.angle + this.getVariance(this.angleVar);
        var speed = this.speed + this.getVariance(this.speedVar);

        particle.setVeloctity(angle, speed);

        particle.life = Math.max(0, this.life + this.getVariance(this.lifeVar));

        if(!particle.sprite) {
            particle.sprite = new game.Sprite(particle.position.x, particle.position.y, this.textures.random(), {
                anchor: {x: 0.5, y: 0.5}
            });
        } else {
            particle.sprite.setTexture(game.TextureCache[this.textures.random()]);
        }

        particle.rotate = this.rotate + this.getVariance(this.rotateVar);
        particle.velRotate = this.velRotate + this.getVariance(this.velRotateVar);

        particle.deltaAlpha = this.endAlpha - this.startAlpha;
        particle.deltaAlpha /= particle.life;
        particle.sprite.alpha = this.startAlpha;

        var startScale = this.startScale + this.getVariance(this.startScaleVar);
        particle.deltaScale = (this.endScale + this.getVariance(this.endScaleVar)) - startScale;
        particle.deltaScale /= particle.life;
        particle.sprite.scale.x = particle.sprite.scale.y = startScale;

        if(this.container) this.container.addChild(particle.sprite);

        this.particles.push(particle);
    },

    updateParticle: function(particle) {
        if(particle.life > 0) {
            // friction
            // particle.velocity.multiplyAdd(particle.velocity.clone().rotate(Math.PI), game.system.delta);
            // particle.velocity.multiply(1 - (game.system.delta));

            particle.velocity.rotate(particle.velRotate * game.system.delta);
            particle.velocity.multiplyAdd(this.gravity, game.system.delta);

            particle.position.multiplyAdd(particle.velocity, game.scale * game.system.delta);

            particle.life -= game.system.delta;

            particle.sprite.alpha = Math.max(0, particle.sprite.alpha + particle.deltaAlpha * game.system.delta);
            particle.sprite.scale.x = particle.sprite.scale.y += particle.deltaScale * game.system.delta;

            particle.sprite.rotation += particle.rotate * game.system.delta;

            particle.sprite.position.x = particle.position.x;
            particle.sprite.position.y = particle.position.y;
        } else {
            if(particle.sprite.parent) particle.sprite.parent.removeChild(particle.sprite);
            game.pool.put('emitter' + this.id, particle);
            this.particles.erase(particle);
        }
    },

    emit: function(count) {
        count = count || 1;
        for (var i = 0; i < count; i++) {
            this.addParticle();
        }
    },

    update: function() {
        this.elapsed += game.system.delta;
        if(this.duration > 0) this.active = this.elapsed < this.duration;

        if(this.rate && this.active) {
            this.counter += game.system.delta;
            if(this.counter >= this.rate) {
                this.counter = 0;
                this.emit(this.count);
            }
        }

        for (var i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i]);
        }
    }
});

});
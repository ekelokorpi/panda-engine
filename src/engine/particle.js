/**
    @module particle
**/
game.module(
    'engine.particle'
)
.require(
    'engine.renderer.sprite',
    'engine.renderer.fastcontainer'
)
.body(function() {

/**
    Particle emitter, that emits particles using Particle class.
    @class Particles
    @extends FastContainer
    @constructor
    @param {String|Array} textures Name of texture or array of texture names.
    @param {Object} [options]
**/
game.createClass('Particles', 'FastContainer', {
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
        End alpha for particle.
        @property {Number} alphaEnd
        @default 0
    **/
    alphaEnd: 0,
    /**
        Starting alpha for particle.
        @property {Number} alphaStart
        @default 1
    **/
    alphaStart: 1,
    /**
        Emit angle in radians (0 is right).
        @property {Number} angle
        @default 0
    **/
    angle: 0,
    /**
        Variance of emit angle in radians.
        @property {Number} angleVar
        @default Math.PI
    **/
    angleVar: Math.PI,
    /**
        How many particles to emit.
        @property {Number} emitCount
        @default 1
    **/
    emitCount: 1,
    /**
        How long to emit particles in milliseconds (0 is forever).
        @property {Number} emitDuration
        @default 0
    **/
    emitDuration: 0,
    /**
        How often to emit particles in milliseconds.
        @property {Number} emitRate
        @default 100
    **/
    emitRate: 100,
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
        @property {Function} onComplete
    **/
    onComplete: null,
    /**
        List of particles.
        @property {Array} particles
    **/
    particles: [],
    /**
        Particle start position.
        @property {Vector} startPos
    **/
    startPos: null,
    /**
        Particle start position variance.
        @property {Vector} startPosVar
    **/
    startPosVar: null,
    /**
        @property {Boolean} randomTexture
    **/
    randomTexture: true,
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
        @property {Number} scaleEnd
        @default 1
    **/
    scaleEnd: 1,
    /**
        @property {Number} scaleEndVar
        @default 0
    **/
    scaleEndVar: 0,
    /**
        Starting scale for particle.
        @property {Number} scaleStart
        @default 1
    **/
    scaleStart: 1,
    /**
        @property {Number} scaleStartVar
        @default 0
    **/
    scaleStartVar: 0,
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
        Update target position to all particles every frame. If this is false and you change target, it will affect only particles created after the change.
        @property {Boolean} targetUpdate
        @default true
    **/
    targetUpdate: true,
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
    /**
        @property {Number} _currentTexture
        @private
    **/
    _currentTexture: 0,
    /**
        @property {Number} _durationTimer
        @private
    **/
    _durationTimer: 0,
    /**
        @property {Boolean} _onCompleteCalled
        @private
    **/
    _onCompleteCalled: false,
    /**
        @property {String} poolName
        @private
    **/
    _poolName: null,
    /**
        @property {Number} _rateTimer
        @private
    **/
    _rateTimer: 0,

    staticInit: function(textures, options) {
        this.super();
        if (textures) {
            if (typeof textures === 'string') this.textures.push(textures);
            else this.textures = textures;
        }
        this._poolName = game.Particles.poolName;
        this.startPos = new game.Vector();
        this.startPosVar = new game.Vector();
        this.target = new game.Vector();
        this.velocityLimit = new game.Vector();
        game.pool.create(this._poolName);
        game.merge(this, options);
    },

    /**
        Emit particles.
        @method emit
        @param {Number} [count]
    **/
    emit: function(count) {
        count = count || this.emitCount;
        for (var i = 0; i < count; i++) {
            this._addParticle();
        }
    },

    remove: function() {
        this.super();
        this._remove = true;
    },

    /**
        Reset emitter timer.
        @method reset
    **/
    reset: function() {
        this._rateTimer = 0;
        this._durationTimer = 0;
        this.active = true;
        this._onCompleteCalled = false;
    },

    updateTransform: function() {
        if (this._remove) {
            for (var i = this.children.length - 1; i >= 0; i--) {
                this._removeParticle(this.children[i]);
            }
            return;
        }

        this._durationTimer += game.delta * 1000;
        if (this.emitDuration > 0) {
            this.active = this._durationTimer < this.emitDuration;
            if (!this.active && this.children.length === 0 && typeof this.onComplete === 'function' && !this._onCompleteCalled) {
                this.onComplete();
                this._onCompleteCalled = true;
            }
        }

        if (this.emitRate && this.active) {
            this._rateTimer += game.delta * 1000;
            if (this._rateTimer >= 0) {
                this._rateTimer = -this.emitRate;
                this.emit();
            }
        }

        for (var i = this.children.length - 1; i >= 0; i--) {
            this.children[i]._update();
        }

        this.super();
    },

    /**
        @method _addParticle
        @private
    **/
    _addParticle: function() {
        if (!this.randomTexture) {
            var texture = this.textures.random();
        }
        else {
            var texture = this.textures[this._currentTexture];
            this._currentTexture++;
            if (this._currentTexture >= this.textures.length) this._currentTexture = 0;
        }
        if (!texture) return;

        var particle = game.pool.get(this._poolName);

        if (!particle) particle = new game.Particle(texture);
        else particle.setTexture(texture);

        particle.emitter = this;
        particle.rotation = 0;
        particle.alpha = this.alphaStart;
        particle.position.x = this.startPos.x + this._getVar(this.startPosVar.x);
        particle.position.y = this.startPos.y + this._getVar(this.startPosVar.y);
        particle.anchorCenter();

        var angleVar = this._getVar(this.angleVar);
        var angle = this.angle + angleVar;
        var speed = this.speed + this._getVar(this.speedVar);

        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;

        if (this.angleVar !== this.accelAngleVar) angleVar = this._getVar(this.accelAngleVar);
        angle = this.accelAngle + angleVar;
        speed = this.accelSpeed + this._getVar(this.accelSpeedVar);

        particle.accel.x = Math.cos(angle) * speed;
        particle.accel.y = Math.sin(angle) * speed;

        particle.life = this.life + this._getVar(this.lifeVar);
        particle.rotateAmount = this.rotate + this._getVar(this.rotateVar);
        particle.velRotate = this.velRotate + this._getVar(this.velRotateVar);

        if (this.alphaStart !== this.alphaEnd) {
            particle.deltaAlpha = this.alphaEnd - this.alphaStart;
            particle.deltaAlpha /= particle.life / 1000;
        }
        else particle.deltaAlpha = 0;

        var scaleStart = this.scaleStart + this._getVar(this.scaleStartVar);
        if (this.scaleStart !== this.scaleEnd) {
            particle.deltaScale = (this.scaleEnd + this._getVar(this.scaleEndVar)) - scaleStart;
            particle.deltaScale /= particle.life / 1000;
        }
        else particle.deltaScale = 0;
        particle.scale.set(scaleStart);

        particle.target.copy(this.target);

        this.addChild(particle);
    },

    /**
        @method _getVar
        @param {Number} value
        @return {Number}
        @private
    **/
    _getVar: function(value) {
        return (Math.random() * value) * (Math.random() > 0.5 ? -1 : 1);
    },

    /**
        Remove particle from emitter.
        @method _removeParticle
        @param {Particle} particle
        @private
    **/
    _removeParticle: function(particle) {
        particle.remove();
        game.pool.put(this._poolName, particle);
    }
});

game.addAttributes('Particles', {
    /**
        @attribute {String} poolName
        @default particle
    **/
    poolName: 'particle'
});

/**
    Particle sprite, that is emitted from Particles class.
    @class Particle
    @extends Sprite
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
        Particle's emitter.
        @property {Emitter} emitter
    **/
    emitter: null,
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
        @property {Vector} target
    **/
    target: null,
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
        this.accel = new game.Vector();
        this.target = new game.Vector();
        this.velocity = new game.Vector();
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (!this.emitter) return;
        
        if (this.life > 0) {
            this.life -= game.delta * 1000;
            if (this.life <= 0) return this.emitter._removeParticle(this);
        }

        if (this.emitter.targetForce > 0) {
            var target = this.emitter.targetUpdate ? this.emitter.target : this.target;
            this.accel.set(target.x - this.position.x, target.y - this.position.y);
            var len = Math.sqrt(this.accel.x * this.accel.x + this.accel.y * this.accel.y);
            this.accel.x /= len || 1;
            this.accel.y /= len || 1;
            this.accel.x *= this.emitter.targetForce;
            this.accel.y *= this.emitter.targetForce;
        }

        this.velocity.x += this.accel.x * game.delta;
        this.velocity.y += this.accel.y * game.delta;
        
        if (this.emitter.velocityLimit.x > 0) {
            if (this.velocity.x > this.emitter.velocityLimit.x) this.velocity.x = this.emitter.velocityLimit.x;
            if (this.velocity.x < -this.emitter.velocityLimit.x) this.velocity.x = -this.emitter.velocityLimit.x;
        }

        if (this.emitter.velocityLimit.y > 0) {
            if (this.velocity.y > this.emitter.velocityLimit.y) this.velocity.y = this.emitter.velocityLimit.y;
            if (this.velocity.y < -this.emitter.velocityLimit.y) this.velocity.y = -this.emitter.velocityLimit.y;
        }

        if (this.velRotate) {
            var c = Math.cos(this.velRotate * game.delta);
            var s = Math.sin(this.velRotate * game.delta);
            var x = this.velocity.x * c - this.velocity.y * s;
            var y = this.velocity.y * c + this.velocity.x * s;
            this.velocity.x = x;
            this.velocity.y = y;
        }
        
        this.position.x += this.velocity.x * game.delta;
        this.position.y += this.velocity.y * game.delta;

        if (this.deltaAlpha) {
            this.alpha = Math.max(0, this.alpha + this.deltaAlpha * game.delta);
        }
        
        if (this.deltaScale) {
            this.scale.x += this.deltaScale * game.delta;
            this.scale.y += this.deltaScale * game.delta;
        }

        if (this.rotateAmount) {
            this.rotation += this.rotateAmount * game.delta;
        }
    }
});

});

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
    Particle emitter.
    @class Emitter
    @extends FastContainer
**/
game.createClass('Emitter', 'FastContainer', {
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
        @property {Function} onComplete
    **/
    onComplete: null,
    /**
        @property {Boolean} onCompleteCalled
        @default false
    **/
    onCompleteCalled: false,
    /**
        List of particles.
        @property {Array} particles
    **/
    particles: [],
    /**
        Pool name for particles.
        @property {String} poolName
    **/
    poolName: null,
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
        @property {Boolean} updateTarget
    **/
    updateTarget: true,
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
        this.super();
        this.poolName = game.Emitter.poolName;
        this.startPos = new game.Vector();
        this.startPosVar = new game.Vector();
        this.target = new game.Vector();
        this.velocityLimit = new game.Vector();
        game.pool.create(this.poolName);
    },

    /**
        Add particle to emitter.
        @method addParticle
    **/
    addParticle: function() {
        var texture = this.textures.random();
        if (!texture) return;

        var particle = game.pool.get(this.poolName);

        if (!particle) particle = new game.Particle(texture);
        else particle.setTexture(texture);

        particle.emitter = this;
        particle.rotation = 0;
        particle.alpha = this.startAlpha;
        particle.position.x = this.startPos.x + this.getVariance(this.startPosVar.x);
        particle.position.y = this.startPos.y + this.getVariance(this.startPosVar.y);
        particle.anchor.x = particle.texture.width / 2;
        particle.anchor.y = particle.texture.height / 2;

        var angleVar = this.getVariance(this.angleVar);
        var angle = this.angle + angleVar;
        var speed = this.speed + this.getVariance(this.speedVar);

        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;

        if (this.angleVar !== this.accelAngleVar) angleVar = this.getVariance(this.accelAngleVar);
        angle = this.accelAngle + angleVar;
        speed = this.accelSpeed + this.getVariance(this.accelSpeedVar);

        particle.accel.x = Math.cos(angle) * speed;
        particle.accel.y = Math.sin(angle) * speed;

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

        particle.target.copy(this.target);

        this.addChild(particle);
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
        Remove particle from emitter.
        @method removeParticle
        @param {Particle} particle
    **/
    removeParticle: function(particle) {
        particle.remove();
        game.pool.put(this.poolName, particle);
    },

    /**
        Reset emitter timer.
        @method reset
    **/
    reset: function() {
        this.durationTimer = 0;
        this.active = true;
        this.onCompleteCalled = false;
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (this._remove) {
            for (var i = this.children.length - 1; i >= 0; i--) {
                this.removeParticle(this.children[i]);
            }
            return;
        }

        this.durationTimer += game.delta * 1000;
        if (this.duration > 0) {
            this.active = this.durationTimer < this.duration;
            if (!this.active && this.children.length === 0 && typeof this.onComplete === 'function' && !this.onCompleteCalled) {
                this.onComplete();
                this.onCompleteCalled = true;
            }
        }

        if (this.rate && this.active) {
            this.rateTimer += game.delta * 1000;
            if (this.rateTimer >= this.rate) {
                this.rateTimer = 0;
                this.emit();
            }
        }

        for (var i = this.children.length - 1; i >= 0; i--) {
            this.children[i]._update();
        }
    }
});

game.addAttributes('Emitter', {
    /**
        @attribute {String} poolName
        @default particle
    **/
    poolName: 'particle'
});

/**
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

    _update: function() {
        if (!this.emitter) return;
        
        if (this.life > 0) {
            this.life -= game.delta * 1000;
            if (this.life <= 0) return this.emitter.removeParticle(this);
        }

        if (this.emitter.targetForce > 0) {
            var target = this.emitter.updateTarget ? this.emitter.target : this.target;
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

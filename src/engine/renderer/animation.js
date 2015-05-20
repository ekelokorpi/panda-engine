/**
    @module renderer.animation
**/
game.module(
    'engine.renderer.animation'
)
.require(
    'engine.renderer.sprite'
)
.body(function() {

/**
    @class Animation
    @extends Sprite
    @constructor
    @param {Array|String} textures List of textures or name of JSON file
**/
game.createClass('Animation', 'Sprite', {
    /**
        List of animations.
        @property {Object} anims
    **/
    anims: {},
    /**
        Current active animation.
        @property {String} currentAnim
        @default default
    **/
    currentAnim: 'default',
    /**
        Current frame index.
        @property {Number} currentFrame
        @default 0
    **/
    currentFrame: 0,
    /**
        Is animation playing.
        @property {Boolean} playing
        @default false
    **/
    playing: false,
    /**
        List of textures.
        @property {Array} textures
    **/
    textures: null,
    /**
        @property {Number} _frameTime
        @private
    **/
    _frameTime: 0,

    staticInit: function(textures) {
        this.textures = this.textures || textures;

        if (typeof this.textures === 'string' && this.textures.indexOf('json') !== -1) {
            var json = game.getJSON(this.textures);
            this.textures = [];
            for (var name in json.frames) {
                this.textures.push(name);
            }
        }

        var newTextures = [];
        for (var i = 0; i < this.textures.length; i++) {
            var texture = this.textures[i];
            if (!texture instanceof game.Texture) texture = game.Texture.fromAsset(texture);
            newTextures.push(texture);
        }
        this.textures = newTextures;

        this.addAnim('default');

        this.super(this.textures[0]);
    },

    /**
        Add new animation.
        @method addAnim
        @param {String} name
        @param {Array} [frames]
        @param {Object} [props]
        @chainable
    **/
    addAnim: function(name, frames, props) {
        if (!frames) {
            var frames = [];
            for (var i = 0; i < this.textures.length; i++) {
                frames.push(i);
            }
        }
        var anim = new game.AnimationData(frames, props);
        this.anims[name] = anim;
        return this;
    },

    /**
        Play animation.
        @method play
        @param {String} name Name of animation
        @param {Number} [frame] Frame index
        @chainable
    **/
    play: function(name, frame) {
        name = name || this.currentAnim;
        var anim = this.anims[name];
        if (!anim) return;
        this.playing = true;
        this.currentAnim = name;
        if (typeof frame !== 'number' && anim.reverse) {
            frame = anim.frames.length - 1;
        }
        this.gotoFrame(frame || 0);
        return this;
    },

    /**
        Stop animation.
        @method stop
        @param {Number} [frame] Frame index
        @chainable
    **/
    stop: function(frame) {
        this.playing = false;
        if (typeof frame === 'number') this.gotoFrame(frame);
        return this;
    },

    /**
        Jump to specific frame.
        @method gotoFrame
        @param {Number} frame
        @chainable
    **/
    gotoFrame: function(frame) {
        var anim = this.anims[this.currentAnim];
        if (!anim) return;
        this.currentFrame = frame;
        this._frameTime = 0;
        this.setTexture(this.textures[anim.frames[frame]]);
        return this;
    },

    /**
        @method updateAnimation
    **/
    updateAnimation: function() {
        var anim = this.anims[this.currentAnim];

        if (this.playing) this._frameTime += anim.speed * game.system.delta;

        if (this._frameTime >= 1) {
            this._frameTime = 0;

            if (anim.random && anim.frames.length > 1) {
                var nextFrame = this.currentFrame;
                while (nextFrame === this.currentFrame) {
                    var nextFrame = Math.round(Math.random(0, anim.frames.length - 1));
                }

                this.currentFrame = nextFrame;
                this.setTexture(this.textures[anim.frames[nextFrame]]);
                return;
            }

            var nextFrame = this.currentFrame + (anim.reverse ? -1 : 1);

            if (nextFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                    this.setTexture(this.textures[anim.frames[0]]);
                }
                else {
                    this.playing = false;
                    if (anim.onComplete) anim.onComplete();
                }
            }
            else if (nextFrame < 0) {
                if (anim.loop) {
                    this.currentFrame = anim.frames.length - 1;
                    this.setTexture(this.textures[anim.frames.last()]);
                }
                else {
                    this.playing = false;
                    if (anim.onComplete) anim.onComplete();
                }
            }
            else {
                this.currentFrame = nextFrame;
                this.setTexture(this.textures[anim.frames[nextFrame]]);
            }
        }
    },

    updateTransform: function() {
        if (this.currentAnim) this.updateAnimation();
        this.super();
    }
});

game.addAttributes('Animation', {
    /**
        Create animation from frames starting with name.
        @method fromFrames
        @static
        @param {String} name
        @return {Animation}
    **/
    fromFrames: function(name) {
        var textures = [];
        for (var i in game.Texture.cache) {
            if (i.indexOf(name) === 0) textures.push(game.Texture.cache[i]);
        }
        if (textures.length > 0) return new game.Animation(textures);
    }
});

/**
    @class AnimationData
    @constructor
    @param {Array} frames
    @param {Object} [props]
**/
game.createClass('AnimationData', {
    /**
        Is animation looping.
        @property {Boolean} loop
        @default true
    **/
    loop: true,
    /**
        Function that is called, when animation is completed.
        @property {Function} onComplete
    **/
    onComplete: null,
    /**
        Play animation in random order.
        @property {Boolean} random
        @default false
    **/
    random: false,
    /**
        Play animation in reverse.
        @property {Boolean} reverse
        @default false
    **/
    reverse: false,
    /**
        Speed of animation (frames per second).
        @property {Number} speed
        @default 10
    **/
    speed: 10,
    /**
        Animation frame order.
        @property {Array} frames
    **/
    frames: null,

    staticInit: function(frames, props) {
        this.frames = frames;
        game.merge(this, props);
    }
});

});

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
    @param {Array|String} textures Array of textures or name of atlas file
**/
game.createClass('Animation', 'Sprite', {
    /**
        List of animations.
        @property {Object} anims
    **/
    anims: {},
    /**
        Current active animation.
        @property {Animation} currentAnim
    **/
    currentAnim: null,
    /**
        Current frame index.
        @property {Number} currentFrame
        @default 0
    **/
    currentFrame: 0,
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
        Is animation playing.
        @property {Boolean} playing
        @default false
    **/
    playing: false,
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
        Animation speed (frames per second).
        @property {Number} speed
        @default 10
    **/
    speed: 10,
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
        this.currentAnim = this;
        this.textures = this.textures || textures;

        if (typeof this.textures === 'string' && this.textures.indexOf('atlas') !== -1) {
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

        this.super(this.textures[0]);
    },

    /**
        Add new animation.
        @method addAnim
        @param {String} name
        @param {Array} frames
        @param {Object} [props]
        @chainable
    **/
    addAnim: function(name, frames, props) {
        if (!name || !frames) return;

        var textures = [];
        for (var i = 0; i < frames.length; i++) {
            textures[i] = this.textures[frames[i]];
        }

        var anim = new game.Animation(textures);
        anim.loop = this.loop;
        anim.random = this.random;
        anim.reverse = this.reverse;
        anim.speed = this.speed;
        game.merge(anim, props);

        this.anims[name] = anim;
        return this;
    },

    /**
        Jump to specific frame.
        @method gotoFrame
        @param {Number} frame Frame index
        @chainable
    **/
    gotoFrame: function(frame) {
        if (!this.currentAnim.textures) throw 'No textures found for animation';
        if (!this.currentAnim.textures[frame]) return;
        this.currentFrame = frame;
        this._frameTime = 0;
        this.setTexture(this.currentAnim.textures[frame]);
        return this;
    },

    /**
        Play animation.
        @method play
        @param {String|Number} [name] Name of animation or frame index
        @param {Number} [frame] Frame index
        @chainable
    **/
    play: function(name, frame) {
        this.playing = true;
        this.currentAnim = this.anims[name] || this;
        
        if (typeof name === 'number') frame = name;
        if (typeof frame !== 'number' && this.reverse) {
            frame = this.textures.length - 1;
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
        @method updateAnimation
    **/
    updateAnimation: function() {
        if (!this.currentAnim.textures) throw 'No textures found for animation';
        this._frameTime += this.currentAnim.speed * game.delta;

        if (this._frameTime >= 1) {
            this._frameTime = 0;

            if (this.currentAnim.random && this.currentAnim.textures.length > 1) {
                var nextFrame = this.currentFrame;
                while (nextFrame === this.currentFrame) {
                    nextFrame = Math.round(Math.random(0, this.currentAnim.textures.length - 1));
                }

                this.currentFrame = nextFrame;
                this.setTexture(this.currentAnim.textures[nextFrame]);
                return;
            }

            var nextFrame = this.currentFrame + (this.currentAnim.reverse ? -1 : 1);

            if (nextFrame >= this.currentAnim.textures.length) {
                if (this.currentAnim.loop) {
                    this.currentFrame = 0;
                    this.setTexture(this.currentAnim.textures[0]);
                }
                else {
                    this.playing = false;
                    if (this.onComplete) this.onComplete();
                }
            }
            else if (nextFrame < 0) {
                if (this.currentAnim.loop) {
                    this.currentFrame = this.currentAnim.textures.length - 1;
                    this.setTexture(this.currentAnim.textures.last());
                }
                else {
                    this.playing = false;
                    if (this.onComplete) this.onComplete();
                }
            }
            else {
                this.currentFrame = nextFrame;
                this.setTexture(this.currentAnim.textures[nextFrame]);
            }
        }
    },

    updateTransform: function() {
        if (this.playing) this.updateAnimation();
        this.super();
    }
});

game.addAttributes('Animation', {
    /**
        Create animation from textures starting with name.
        @method fromTextures
        @static
        @param {String} name
        @return {Animation}
    **/
    fromTextures: function(name) {
        var textures = [];
        for (var texture in game.Texture.cache) {
            if (texture.indexOf(name) !== -1) {
                textures.push(texture);
            }
        }
        if (textures.length === 0) {
            for (var texture in game.BaseTexture.cache) {
                if (texture.indexOf(name) !== -1) {
                    textures.push(texture);
                }
            }
        }
        textures.sort();
        if (textures.length > 0) return new game.Animation(textures);
    }
});

});

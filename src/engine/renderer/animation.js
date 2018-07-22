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
    Animation that is generated from multiple textures. Animation can also contain multiple animations created with addAnim method.
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
        this.textures = this.textures || textures;
        if (!this.textures || this.textures.length === 0) throw 'Unable to create animation without textures';

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
        @param {String} name Name of animation.
        @param {Array|Number|String} frames List of invidual frame indexes or start frame index or name that each frame starts with.
        @param {Number|Object} [frameCount] Number of frames or animation properties.
        @param {Object} [props] Animation properties.
        @chainable
    **/
    addAnim: function(name, frames, frameCount, props) {
        if (!name || typeof frames === undefined) return;

        if (typeof frameCount === 'object') props = frameCount;

        var textures = [];
        if (typeof frames === 'string') {
            for (var i = 0; i < this.textures.length; i++) {
                var texture = this.textures[i];
                if (texture.indexOf(frames) === 0) textures.push(texture);
            }
            if (textures.length === 0) throw 'No textures found starting with ' + frames;
        }
        else if (frames.length) {
            for (var i = 0; i < frames.length; i++) {
                textures[i] = this.textures[frames[i]];
            }
        }
        else if (typeof frames === 'number' && typeof frameCount === 'number') {
            for (var i = 0; i < frameCount; i++) {
                textures[i] = this.textures[frames + i];
            }
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
        @param {String|Number} name Name of animation or frame index
        @param {Number} frame Frame index
        @chainable
    **/
    gotoFrame: function(name, frame) {
        if (typeof name === 'string') this.currentAnim = this.anims[name] || this;
        if (typeof name === 'number') frame = name;
        
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
        @param {String|Number} [name] Name of animation or frame index
        @param {Number} [frame] Frame index
        @chainable
    **/
    stop: function(name, frame) {
        this.playing = false;
        this.currentAnim = this.anims[name] || this;
        
        if (typeof name === 'number') frame = name;
        if (typeof frame === 'number') this.gotoFrame(frame);
        return this;
    },

    updateTransform: function() {
        if (this.playing) this._updateAnimation();
        this.super();
    },

    /**
        @method _updateAnimation
        @private
    **/
    _updateAnimation: function() {
        if (game.scene.paused && game.scene._pausedAnims.indexOf(this) !== -1) return;
        var anim = this.currentAnim;
        if (!anim.textures) throw 'No textures found for animation';
        this._frameTime += anim.speed * game.delta;

        if (this._frameTime >= 1) {
            this._frameTime = this._frameTime % 1;

            if (anim.random && anim.textures.length > 1) {
                var nextFrame = this.currentFrame;
                while (nextFrame === this.currentFrame) {
                    nextFrame = Math.round(Math.random(0, anim.textures.length - 1));
                }

                this.currentFrame = nextFrame;
                this.setTexture(anim.textures[nextFrame]);
                return;
            }

            var nextFrame = this.currentFrame + (anim.reverse ? -1 : 1);

            if (nextFrame >= anim.textures.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                    this.setTexture(anim.textures[0]);
                }
                else {
                    this.playing = false;
                    if (anim.onComplete) anim.onComplete();
                }
            }
            else if (nextFrame < 0) {
                if (anim.loop) {
                    this.currentFrame = anim.textures.length - 1;
                    this.setTexture(anim.textures.last());
                }
                else {
                    this.playing = false;
                    if (anim.onComplete) anim.onComplete();
                }
            }
            else {
                this.currentFrame = nextFrame;
                this.setTexture(anim.textures[nextFrame]);
            }
        }
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
        if (textures.length > 0) {
            textures.sort(game.compare);
            return new game.Animation(textures);
        }
        else {
            throw 'No textures found for ' + name;
        }
    }
});

});

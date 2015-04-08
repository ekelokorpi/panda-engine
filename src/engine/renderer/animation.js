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
'use strict';

/**
    @class Animation
    @extends Sprite
    @constructor
    @param {Array} textures
**/
game.createClass('Animation', 'Sprite', {
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
        Speed of animation (frames per second).
        @property {Number} speed
        @default 60
    **/
    speed: 60,
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
        textures = this.textures;
        
        if (!textures) {
            if (typeof arguments[0] === 'object') textures = arguments[0];
            else textures = Array.prototype.slice.call(arguments);
        }

        var newTextures = [];
        for (var i = 0; i < textures.length; i++) {
            var texture = textures[i];
            if (!texture instanceof game.Texture) texture = game.Texture.fromAsset(texture);
            newTextures.push(texture);
        }
        this.textures = newTextures;

        this.super(this.textures[0]);
    },

    /**
        Play animation and jump to specific frame.
        @method gotoAndPlay
        @chainable
        @param {Number} frame
    **/
    gotoAndPlay: function(frame) {
        this.play();
        this.currentFrame = frame;
        this.setTexture(this.textures[frame]);
        return this;
    },

    /**
        Stop animation and jump to specific frame.
        @method gotoAndStop
        @chainable
        @param {Number} frame
    **/
    gotoAndStop: function(frame) {
        this.stop();
        this.currentFrame = frame;
        this.setTexture(this.textures[frame]);
        return this;
    },

    /**
        Play animation.
        @method play
        @chainable
    **/
    play: function() {
        this.playing = true;
        return this;
    },

    /**
        Stop animation.
        @method stop
        @chainable
    **/
    stop: function() {
        this.playing = false;
        this._frameTime = 0;
        return this;
    },

    /**
        Update current frame.
        @method updateTransform
    **/
    updateTransform: function() {
        if (this.playing) this._frameTime += this.speed * game.system.delta;

        if (this._frameTime >= 1) {
            this._frameTime = 0;

            if (this.random && this.textures.length > 1) {
                var nextFrame = this.currentFrame;
                while (nextFrame === this.currentFrame) {
                    var nextFrame = Math.round(Math.random(0, this.textures.length - 1));    
                }

                this.currentFrame = nextFrame;
                this.setTexture(this.textures[nextFrame]);
                return this.super();
            }

            var nextFrame = this.currentFrame + (this.reverse ? -1 : 1);

            if (nextFrame >= this.textures.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                    this.setTexture(this.textures[0]);
                }
                else {
                    this.playing = false;
                    if (this.onComplete) this.onComplete();
                }
            }
            else if (nextFrame < 0) {
                if (this.loop) {
                    this.currentFrame = this.textures.length - 1;
                    this.setTexture(this.textures.last());
                }
                else {
                    this.playing = false;
                    if (this.onComplete) this.onComplete();
                }
            }
            else {
                this.currentFrame = nextFrame;
                this.setTexture(this.textures[nextFrame]);
            }
        }

        this.super();
    }
});

});

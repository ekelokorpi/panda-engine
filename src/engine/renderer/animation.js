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
        Speed of animation (frames per second).
        @property {Number} speed
        @default 60
    **/
    speed: 60,
    /**
        @property {Array} textures
    **/
    textures: null,
    /**
        Is animation playing.
        @property {Boolean} playing
        @default false
    **/
    playing: false,
    /**
        Is animation looping.
        @property {Boolean} loop
        @default true
    **/
    loop: true,
    /**
        @property {Number} currentFrame
        @default 0
    **/
    currentFrame: 0,

    staticInit: function(textures) {
        textures = this.textures;
        
        if (!textures) {
            if (arguments[0].length) textures = arguments[0];
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

    destroy: function() {
        this.remove();
        for (var i = this.textures.length - 1; i >= 0; i--) {
            var texture = this.textures[i];
            for (var o in game.Texture.cache) {
                if (game.Texture.cache[o] === texture) {
                    delete game.Texture.cache[o];
                    delete game.BaseTexture.cache[o];
                }
            }
        }
        this.textures.length = 0;
    },

    play: function() {
        this.playing = true;
        return this;
    },

    stop: function() {
        this.playing = false;
        return this;
    },

    gotoAndPlay: function(frame) {
        this.play();
        this.currentFrame = frame;
        return this;
    },

    gotoAndStop: function(frame) {
        this.stop();
        this.currentFrame = frame;
        this.setTexture(this.textures[frame]);
        return this;
    },

    updateTransform: function() {
        if (this.playing) {
            this.currentFrame += this.speed * game.system.delta;
            var round = (this.currentFrame + 0.5) | 0;
            this.currentFrame = this.currentFrame % this.textures.length;
            if (this.loop || round < this.textures.length) {
                this.setTexture(this.textures[round % this.textures.length]);
            }
            else if (round >= this.textures.length) {
                this.gotoAndStop(this.textures.length - 1);
                if (this.onComplete) this.onComplete();
            }
        }
        this.super();
    }
});

});

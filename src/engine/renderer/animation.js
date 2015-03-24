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
    animationSpeed: 60,
    textures: [],
    playing: false,
    loop: true,
    currentFrame: 0,

    staticInit: function(textures) {
        textures = this.textures || Array.prototype.slice.call(arguments);
        var newTextures = [];
        for (var i = 0; i < textures.length; i++) {
            var texture = game.Texture.fromAsset(textures[i]);
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
            this.currentFrame += this.animationSpeed * game.system.delta;
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

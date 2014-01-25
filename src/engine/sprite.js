/**
    @module sprite
    @namespace game
**/
game.module(
    'engine.sprite',
    '1.0.0'
)
.require(
    'engine.renderer'
)
.body(function() { 'use strict';

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Sprite%E2%84%A2.html
    @class Sprite
    @extends game.Class
    @constructor
    @param {Number} x
    @param {Number} y
    @param {Object} [settings]
**/
game.Sprite = game.Class.extend({
    /**
        @property {String} image
    **/
    image: null,

    staticInit: function(x, y, settings) {
        settings = settings || {};
        var sprite = game.Sprite.fromFrame(settings.image || this.image);
        sprite.position.x = this.x || x;
        sprite.position.y = this.y || y;

        // merge from class
        for(var i in this) {
            if(i !== 'staticInit' && i !== 'constructor') {
                if(typeof(this[i]) === 'function') sprite[i] = this[i].bind(sprite);
                else sprite[i] = this[i];
            }
        }

        game.merge(sprite, settings);

        sprite.tap = sprite.click;
        sprite.touchstart = sprite.mousedown;
        sprite.mouseupoutside = sprite.touchend = sprite.touchendoutside = sprite.mouseup;
        sprite.touchmove = sprite.mousemove;

        return sprite;
    },

    /**
        @method remove
    **/
    remove: function() {
        if(this.parent) this.parent.removeChild(this);
        game.scene.sprites.erase(this);
    },

    click: function() {},
    mousedown: function() {},
    mouseup: function() {},
    mousemove: function() {}
});

game.Sprite.fromImage = PIXI.Sprite.fromImage;
game.Sprite.fromFrame = PIXI.Sprite.fromFrame;

});
/**
    @module sprite
    @namespace game
**/
game.module(
    'engine.sprite'
)
.require(
    'engine.renderer'
)
.body(function() {

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Sprite%E2%84%A2.html

    __Example__

        var sprite = new game.Sprite(100, 200, 'media/logo.png');
        game.scene.stage.addChild(sprite);
    @class Sprite
    @extends PIXI.Sprite
    @constructor
    @param {Number} x
    @param {Number} y
    @param {String} path
    @param {Object} [settings]
**/
game.Sprite = PIXI.Sprite.extend({
    init: function(x, y, path, settings) {
        var texture = path instanceof PIXI.Texture ? path : PIXI.Texture.fromFrame(this.path || path);
        this.super(texture);
        game.merge(this, settings);

        this.position.x = x;
        this.position.y = y;

        // auto bind touch events for mobile
        if(game.ua.mobile && !this.tap && this.click) this.tap = this.click;
        if(game.ua.mobile && !this.touchmove && this.mousemove) this.touchmove = this.mousemove;
        if(game.ua.mobile && !this.touchstart && this.mousedown) this.touchstart = this.mousedown;
        if(game.ua.mobile && !this.touchend && this.mouseup) this.touchend = this.mouseup;
        if(game.ua.mobile && !this.touchendoutside && this.mouseupoutside) this.touchendoutside = this.mouseupoutside;
    },

    /**
        Remove sprite from it's parent.
        @method remove
    **/
    remove: function() {
        if(this.parent) this.parent.removeChild(this);
    }
});

/**
    Sprite container.
    @class Container
**/
game.Container = PIXI.DisplayObjectContainer.extend({
    remove: function() {
        if(this.parent) this.parent.removeChild(this);
    },

    addChild: function(obj) {
        this.super(obj);
        if(game.debugDraw && obj.interactive) game.debugDraw.addSprite(obj);
    }
});

game.Texture = PIXI.Texture.extend();
game.Texture.fromImage = PIXI.Texture.fromImage;
game.Texture.fromCanvas = PIXI.Texture.fromCanvas;

game.TilingSprite = PIXI.TilingSprite.extend({
    speed: {x: 0, y: 0},

    init: function(x, y, path, width, height, settings) {
        var texture = path instanceof PIXI.Texture ? path : PIXI.Texture.fromFrame(this.path || path);
        this.super(texture, width || texture.width, height || texture.height);
        game.merge(this, settings);

        this.position.x = x;
        this.position.y = y;
    },

    update: function() {
        this.tilePosition.x += this.speed.x * game.system.delta;
        this.tilePosition.y += this.speed.y * game.system.delta;
    }
});

});
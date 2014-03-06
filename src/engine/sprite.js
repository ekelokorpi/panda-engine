/**
    Game graphics.

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
        if(typeof(x) !== 'number') path = x;
        path = game.assets[path] || path;
        var texture = path instanceof PIXI.Texture ? path : PIXI.Texture.fromFrame(this.path || path);
        this._super(texture);
        game.merge(this, settings);

        if(typeof(x) === 'number') this.position.x = x;
        if(typeof(y) === 'number') this.position.y = y;

        // auto bind touch events for mobile
        if(game.device.mobile && !this.tap && this.click) this.tap = this.click;
        if(game.device.mobile && !this.touchmove && this.mousemove) this.touchmove = this.mousemove;
        if(game.device.mobile && !this.touchstart && this.mousedown) this.touchstart = this.mousedown;
        if(game.device.mobile && !this.touchend && this.mouseup) this.touchend = this.mouseup;
        if(game.device.mobile && !this.touchendoutside && this.mouseupoutside) this.touchendoutside = this.mouseupoutside;
    },

    setTexture: function(id) {
        if(typeof(id) === 'string') {
            id = game.assets[id] || id;
            id = game.Texture.fromFrame(id);
        }
        this._super(id);
    },

    /**
        Remove sprite from it's parent.
        @method remove
    **/
    remove: function() {
        if(this.parent) this.parent.removeChild(this);
    },

    addChild: function(obj) {
        this._super(obj);
        if(game.debugDraw && obj.interactive) game.debugDraw.addSprite(obj);
    }
});

/**
    Sprite container.
    @class Container
**/
game.Container = PIXI.DisplayObjectContainer.extend({
    /**
        Remove object from container.
        @method remove
    **/
    remove: function() {
        if(this.parent) this.parent.removeChild(this);
    },

    /**
        Add object to container.
        @method addChild
    **/
    addChild: function(obj) {
        this._super(obj);
        if(game.debugDraw && obj.interactive) game.debugDraw.addSprite(obj);
    }
});

game.Texture = PIXI.Texture.extend();
game.Texture.fromImage = function(id, crossorigin) {
    id = game.assets[id] || id;
    return PIXI.Texture.fromImage(id, crossorigin);
};
game.Texture.fromCanvas = PIXI.Texture.fromCanvas;
game.Texture.fromFrame = PIXI.Texture.fromFrame;

game.TilingSprite = PIXI.TilingSprite.extend({
    speed: {x: 0, y: 0},

    init: function(x, y, path, width, height, settings) {
        var texture = path instanceof PIXI.Texture ? path : PIXI.Texture.fromFrame(this.path || path);
        this._super(texture, width || texture.width, height || texture.height);
        game.merge(this, settings);

        this.position.x = x;
        this.position.y = y;
    },

    update: function() {
        this.tilePosition.x += this.speed.x * game.system.delta;
        this.tilePosition.y += this.speed.y * game.system.delta;
    }
});

game.Animation = PIXI.MovieClip.extend({
    init: function() {
        var frames = Array.prototype.slice.call(arguments);

        var textures = [];
        for (var i = 0; i < frames.length; i++) {
            textures.push(game.Texture.fromImage(frames[i]));
        }

        this._super(textures);
    }
});

});
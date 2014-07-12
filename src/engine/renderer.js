game.module(
    'engine.renderer'
)
.require(
    'engine.pixi'
)
.body(function() {
'use strict';

PIXI.extend = function(prop) {
    var name;
    var proto = this.prototype;
    var base = this.prototype.base || this;

    function Class() {
        var name;
        if (this.init) this.init.apply(this, arguments);
        else this.base.apply(this, arguments);

        for (name in proto) {
            if (typeof proto[name] !== 'function' && !this[name]) this[name] = game.copy(proto[name]);
        }
        for (name in prop) {
            if (typeof prop[name] !== 'function' && !this[name]) this[name] = game.copy(prop[name]);
        }
    }

    Class.prototype = Object.create(base.prototype);

    var makeFn = function(name, fn) {
        var from = proto[name];
        if (name === 'init' && !from) from = base;
        return function() {
            var tmp = this._super;
            this._super = from;
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
        };
    };

    for (name in proto) {
        if (typeof proto[name] === 'function') {
            Class.prototype[name] = makeFn(name, proto[name]);
        }
        else {
            Class.prototype[name] = proto[name];
        }
    }

    for (name in prop) {
        if (typeof prop[name] === 'function') {
            Class.prototype[name] = makeFn(name, prop[name]);
        }
        else {
            Class.prototype[name] = prop[name];
        }
    }

    Class.prototype.constructor = Class;
    Class.prototype.base = base;
    
    Class.extend = PIXI.extend;

    return Class;
};

for (var i in PIXI) {
    if (PIXI[i].prototype instanceof Object) {
        PIXI[i].extend = PIXI.extend;
    }
}

game.AssetLoader = PIXI.AssetLoader;
game.Text = PIXI.Text;
game.MovieClip = PIXI.MovieClip;
game.FlashClip = PIXI.FlashClip;
game.BitmapText = PIXI.BitmapText;
game.Graphics = PIXI.Graphics;
game.HitRectangle = PIXI.Rectangle;
game.HitCircle = PIXI.Circle;
game.HitEllipse = PIXI.Ellipse;
game.HitPolygon = PIXI.Polygon;
game.TextureCache = PIXI.TextureCache;
game.RenderTexture = PIXI.RenderTexture;
game.Point = PIXI.Point;
game.CanvasRenderer = PIXI.CanvasRenderer;
game.autoDetectRenderer = PIXI.autoDetectRenderer;
game.Stage = PIXI.Stage;
game.blendModes = PIXI.blendModes;

});

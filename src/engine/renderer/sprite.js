/**
    @module renderer.sprite
**/
game.module(
	'engine.renderer.sprite'
)
.require(
	'engine.renderer.container'
)
.body(function() {
'use strict';

/**
    @class Sprite
    @extends Container
    @constructor
    @param {Texture|String} texture
**/
game.createClass('Sprite', 'Container', {
    init: function(texture) {
        this.super();
        this.anchor = new game.Vector();
        this.setTexture(texture);
    },

    setTexture: function(texture) {
        this.texture = texture instanceof game.Texture ? texture : game.Texture.fromAsset(texture);
        this.width = this.texture.width;
        this.height = this.texture.height;
        return this;
    },

    destroy: function() {
        this.remove();
        for (var i in game.Texture.cache) {
            if (game.Texture.cache[i] === this.texture) {
                delete this.texture;
                delete game.Texture.cache[i];
                delete game.BaseTexture.cache[i];
            }
        }
    },

    _updateBounds: function() {
        if (!this._transformChanged) return this._worldBounds;

        var width = this.texture.width;
        var height = this.texture.height;

        var w0 = width;
        var w1 = 0;
        var h0 = height;
        var h1 = 0;
        var wt = this._worldTransform;
        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx;
        var ty = wt.ty;

        var minX;
        var maxX;
        var minY;
        var maxY;

        if (b === 0 && c === 0) {
            if (a < 0) a *= -1;
            if (d < 0) d *= -1;
            minX = a * w1 + tx;
            maxX = a * w0 + tx;
            minY = d * h1 + ty;
            maxY = d * h0 + ty;
        }
        else {
            var x1 = a * w1 + c * h1 + tx;
            var y1 = d * h1 + b * w1 + ty;

            var x2 = a * w0 + c * h1 + tx;
            var y2 = d * h1 + b * w0 + ty;

            var x3 = a * w0 + c * h0 + tx;
            var y3 = d * h0 + b * w0 + ty;

            var x4 =  a * w1 + c * h0 + tx;
            var y4 =  d * h0 + b * w1 + ty;

            minX = x1;
            minX = x2 < minX ? x2 : minX;
            minX = x3 < minX ? x3 : minX;
            minX = x4 < minX ? x4 : minX;

            minY = y1;
            minY = y2 < minY ? y2 : minY;
            minY = y3 < minY ? y3 : minY;
            minY = y4 < minY ? y4 : minY;

            maxX = x1;
            maxX = x2 > maxX ? x2 : maxX;
            maxX = x3 > maxX ? x3 : maxX;
            maxX = x4 > maxX ? x4 : maxX;

            maxY = y1;
            maxY = y2 > maxY ? y2 : maxY;
            maxY = y3 > maxY ? y3 : maxY;
            maxY = y4 > maxY ? y4 : maxY;
        }

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var childBounds = child._updateBounds();

            w0 = childBounds.x;
            w1 = childBounds.x + childBounds.width;
            h0 = childBounds.y;
            h1 = childBounds.y + childBounds.height;

            minX = (minX < w0) ? minX : w0;
            minY = (minY < h0) ? minY : h0;
            maxX = (maxX > w1) ? maxX : w1;
            maxY = (maxY > h1) ? maxY : h1;
        }

        var bounds = this._worldBounds;
        bounds.x = minX;
        bounds.y = minY;
        bounds.width = maxX - minX;
        bounds.height = maxY - minY;
        return bounds;
    },

    _render: function(context) {
        context.globalAlpha = this._worldAlpha;

        var tx = this._worldTransform.tx;
        var ty = this._worldTransform.ty;
        
        if (game.Renderer.roundPixels) {
            tx = tx | 0;
            ty = ty | 0;
        }

        context.setTransform(
            this._worldTransform.a,
            this._worldTransform.b,
            this._worldTransform.c,
            this._worldTransform.d,
            this._worldTransform.tx,
            this._worldTransform.ty);

        context.drawImage(
            this.texture.baseTexture.source,
            this.texture.position.x,
            this.texture.position.y,
            this.texture.width,
            this.texture.height,
            0,
            0,
            this.texture.width,
            this.texture.height);

        this.super(context);
    }
});

});

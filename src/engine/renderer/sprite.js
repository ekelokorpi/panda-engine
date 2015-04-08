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
    staticInit: function(texture) {
        this.super();
        this.setTexture(this.texture || texture);
    },

    /**
        @method setTexture
        @param {Texture|String} texture
    **/
    setTexture: function(texture) {
        this.texture = texture instanceof game.Texture ? texture : game.Texture.fromAsset(texture);
        return this;
    },

    /**
        @method _getBounds
        @private
    **/
    _getBounds: function() {
        if (this._worldTransform.tx === null) this.updateParentTransform();

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

            var x4 = a * w1 + c * h0 + tx;
            var y4 = d * h0 + b * w1 + ty;

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
            var childBounds = child._getBounds();

            w0 = childBounds.x;
            w1 = childBounds.x + childBounds.width;
            h0 = childBounds.y;
            h1 = childBounds.y + childBounds.height;

            minX = (minX < w0) ? minX : w0;
            minY = (minY < h0) ? minY : h0;
            maxX = (maxX > w1) ? maxX : w1;
            maxY = (maxY > h1) ? maxY : h1;
        }

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this._worldBounds.width = maxX - minX;
        this._worldBounds.height = maxY - minY;
        return this._worldBounds;
    },

    /**
        @method _render
        @private
        @param {CanvasRenderingContext2D} context
    **/
    _render: function(context) {
        if (!this.texture.width && this.texture.baseTexture.width) {
            this.texture.width = this.texture.baseTexture.width;
        }
        if (!this.texture.height && this.texture.baseTexture.height) {
            this.texture.height = this.texture.baseTexture.height;
        }
        if (!this.texture.width || !this.texture.height) return;

        if (game.renderer.webGL) this._renderWebGL();
        else this._renderCanvas(context);

        this.super(context);
    },

    /**
        @method _renderWebGL
        @private
    **/
    _renderWebGL: function() {
        game.renderer.spriteBatch.render(this);
    },

    /**
        @method _renderCanvas
        @private
        @param {CanvasRenderingContext2D} context
    **/
    _renderCanvas: function(context) {
        if (!this.texture.baseTexture.loaded) return;

        context.globalAlpha = this._worldAlpha;

        var t = this.texture;
        var wt = this._worldTransform;
        var tx = wt.tx;
        var ty = wt.ty;
        
        if (game.Renderer.roundPixels) {
            tx = tx | 0;
            ty = ty | 0;
        }

        context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);
        context.drawImage(t.baseTexture.source, t.position.x, t.position.y, t.width, t.height, 0, 0, t.width, t.height);
    }
});

game.defineProperties('Sprite', {
    /**
        @property {Number} width
    **/
    width: {
        get: function() {
            return this.scale.x * this.texture.width;
        }
    },
    /**
        @property {Number} height
    **/
    height: {
        get: function() {
            return this.scale.y * this.texture.height;
        }
    }
});

});

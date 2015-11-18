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

/**
    @class Sprite
    @extends Container
    @constructor
    @param {Texture|String} texture
**/
game.createClass('Sprite', 'Container', {
    /**
        @property {Number} blendMode
        @default 0
    **/
    blendMode: 0,
    /**
        @property {Texture} texture
    **/
    texture: null,

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
    },

    _getBounds: function() {
        if (this._cachedSprite) {
            this._worldBounds.x = this._worldTransform.tx + this._cachedSprite.position.x;
            this._worldBounds.y = this._worldTransform.ty + this._cachedSprite.position.y;
            this._worldBounds.width = this._cachedSprite.texture.width * this._worldTransform.a;
            this._worldBounds.height = this._cachedSprite.texture.height * this._worldTransform.d;
            return this._worldBounds;
        }

        var width = this.texture.width;
        var height = this.texture.height;
        var wt = this._worldTransform;
        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx;
        var ty = wt.ty;
        var x2 = a * width + tx;
        var y2 = b * width + ty;
        var x3 = a * width + c * height + tx;
        var y3 = d * height + b * width + ty;
        var x4 = c * height + tx;
        var y4 = d * height + ty;

        var minX = Math.min(tx, x2, x3, x4);
        var minY = Math.min(ty, y2, y3, y4);
        var maxX = Math.max(tx, x2, x3, x4);
        var maxY = Math.max(ty, y2, y3, y4);

        for (var i = 0; i < this.children.length; i++) {
            var childBounds = this.children[i]._getBounds();
            var childMinX = childBounds.x;
            var childMaxX = childMinX + childBounds.width;
            var childMinY = childBounds.y;
            var childMaxY = childMinY + childBounds.height;
            minX = Math.min(minX, childMinX);
            minY = Math.min(minY, childMinY);
            maxX = Math.max(maxX, childMaxX);
            maxY = Math.max(maxY, childMaxY);
        }

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this._worldBounds.width = maxX - minX;
        this._worldBounds.height = maxY - minY;
        return this._worldBounds;
    },

    /**
        @method _renderCanvas
        @param {CanvasRenderingContext2D} context
        @param {Matrix} [transform]
        @param {Rectangle} [rect]
        @param {Rectangle} [offset]
        @private
    **/
    _renderCanvas: function(context, transform, rect, offset) {
        if (!this.texture) return true;
        if (!this.texture.baseTexture.loaded) return true;

        if (!this.texture.width && this.texture.baseTexture.width) {
            this.texture.width = this.texture.baseTexture.width;
        }
        if (!this.texture.height && this.texture.baseTexture.height) {
            this.texture.height = this.texture.baseTexture.height;
        }
        
        if (!this.texture.width || !this.texture.height) return true;
        
        context.globalCompositeOperation = game.Sprite.blendModes[this.blendMode];
        context.globalAlpha = this._worldAlpha;

        var t = this.texture;
        var wt = transform || this._worldTransform;
        var tx = wt.tx;
        var ty = wt.ty;
        
        if (game.Renderer.roundPixels) {
            tx = tx | 0;
            ty = ty | 0;
        }

        tx *= game.scale;
        ty *= game.scale;

        var x = t.position.x * game.scale;
        var y = t.position.y * game.scale;
        var width = t.width * game.scale;
        var height = t.height * game.scale;

        if (rect) {
            x = rect.x;
            y = rect.y;
            width = rect.width;
            height = rect.height;
        }

        if (offset) {
            tx += offset.x;
            ty += offset.y;
        }

        context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);
        context.drawImage(t.baseTexture.source, x, y, width, height, 0, 0, width, height);
    }
});

game.addAttributes('Sprite', {
    /**
        List of supported blend modes.
        @attribute {Array} blendModes
    **/
    blendModes: [
        'source-over',
        'source-in',
        'source-out',
        'source-atop',
        'destination-over',
        'destination-in',
        'destination-out',
        'destination-atop',
        'lighter',
        'copy',
        'xor',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity'
    ]
})

game.defineProperties('Sprite', {
    width: {
        get: function() {
            return this.scale.x * this.texture.width;
        },

        set: function(value) {
            this.scale.x = value / this.texture.width;
        }
    },

    height: {
        get: function() {
            return this.scale.y * this.texture.height;
        },

        set: function(value) {
            this.scale.y = value / this.texture.height;
        }
    }
});

});

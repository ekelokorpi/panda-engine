/**
    @module renderer.tilingsprite
**/
game.module(
    'engine.renderer.tilingsprite'
)
.require(
    'engine.renderer.sprite'
)
.body(function() {

/**
    @class TilingSprite
    @extends Container
    @constructor
    @param {Texture|String} texture
    @param {Number} [width]
    @param {Number} [height]
**/
game.createClass('TilingSprite', 'Container', {
    /**
        @property {Texture} texture
    **/
    texture: null,
    /**
        @property {Vector} tilePosition
    **/
    tilePosition: null,
    /**
        @property {Vector} _pos
        @private
    **/
    _pos: [],
    /**
        @property {Vector} _rect
        @private
    **/
    _rect: [],
    /**
        @property {Array} _sprites
        @private
    **/
    _sprites: [],
    _updateSprites: false,

    staticInit: function(texture, width, height) {
        this.super();
        this.tilePosition = new game.Vector();
        this._pos = new game.Vector();
        this._rect = new game.Vector();

        this.texture = this.texture || texture;
        this.texture = this.texture instanceof game.Texture ? this.texture : game.Texture.fromAsset(this.texture);

        this._width = width || this.texture.width;
        this._height = height || this.texture.height;
        
        this._generateSprites();
    },

    updateTransform: function() {
        this.super();
        if (this._updateSprites) {
            this._generateSprites();
            this._updateSprites = false;
        }
    },

    _generateSprites: function() {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        var tx = Math.ceil(this.width / this.texture.width);
        var ty = Math.ceil(this.height / this.texture.height);

        var width = tx * this.texture.width;
        var height = ty * this.texture.height;

        canvas.width = width * game.scale;
        canvas.height = height * game.scale;

        this._pos.set(0);

        var sprite = new game.Sprite(this.texture);
        for (var y = 0; y < ty; y++) {
            for (var x = 0; x < tx; x++) {
                this._pos.x = x * sprite.width;
                this._pos.y = y * sprite.height;
                sprite._renderCanvas(context, null, null, this._pos);
            }
        }

        var texture = game.Texture.fromCanvas(canvas);
        this.tw = texture.width;
        this.th = texture.height;

        this._sprites.length = 0;
        for (var i = 0; i < 4; i++) {
            var sprite = new game.Sprite(texture);
            sprite.parent = this;
            this._sprites.push(sprite);
        }
    },

    _getBounds: function() {
        var minX = this._worldTransform.tx;
        var minY = this._worldTransform.ty;
        var maxX = minX + this.width;
        var maxY = minY + this.height;

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var childBounds = child._getBounds();
            var childMaxX = childBounds.x + childBounds.width;
            var childMaxY = childBounds.y + childBounds.height;
            if (childBounds.x < minX) minX = childBounds.x;
            if (childBounds.y < minY) minY = childBounds.y;
            if (childMaxX > maxX) maxX = childMaxX;
            if (childMaxY > maxY) maxY = childMaxY;
        }

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this._worldBounds.width = maxX - minX;
        this._worldBounds.height = maxY - minY;
        return this._worldBounds;
    },

    _renderCanvas: function(context) {
        var scaleX = this._worldTransform.a / this._cosCache;
        var scaleY = this._worldTransform.d / this._cosCache;
        var tw = this.tw * game.scale;
        var th = this.th * game.scale;
        var width = this.width / scaleX * game.scale;
        var height = this.height / scaleY * game.scale;
        var tileX = this.tilePosition.x * game.scale;
        var tileY = this.tilePosition.y * game.scale;

        var x = tileX % tw;
        var y = tileY % th;
        if (x > 0) x -= tw;
        if (y > 0) y -= th;

        for (var i = 0; i < this._sprites.length; i++) {
            if (y >= height) break;

            this._rect.x = 0;
            this._rect.y = 0;
            this._rect.width = tw;
            this._rect.height = th;
            this._pos.x = ~~(x * scaleX);
            this._pos.y = ~~(y * scaleY);

            if (x + tw > width) {
                this._rect.width = width - x;
            }

            if (y + th > height) {
                this._rect.height = height - y;
            }

            if (x < 0) {
                this._rect.x = -x;
                this._pos.x = 0;
            }

            if (y < 0) {
                this._rect.y = -y;
                this._pos.y = 0;
            }

            if (this._rect.width > width) {
                this._rect.width = width;
            }

            if (this._rect.height > height) {
                this._rect.height = height;
            }

            this._sprites[i]._renderCanvas(context, this._worldTransform, this._rect, this._pos);

            x += tw;
            if (x >= width) {
                x = tileX % tw;
                if (x > 0) x -= tw;
                y += th;
            }
        }
    }
});

game.defineProperties('TilingSprite', {
    width: {
        get: function() {
            var scaleX = this._worldTransform.a / this._cosCache;
            return this._width * scaleX;
        },

        set: function(value) {
            if (this._width !== value) this._updateSprites = true;
            this._width = value;
        }
    },

    height: {
        get: function() {
            var scaleY = this._worldTransform.d / this._cosCache;
            return this._height * scaleY;
        },

        set: function(value) {
            if (this._height !== value) this._updateSprites = true;
            this._height = value;
        }
    }
});

});

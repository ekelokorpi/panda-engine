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
    @param {Number} width
    @param {Number} height
**/
game.createClass('TilingSprite', 'Container', {
    /**
        @property {Sprite} sprite
    **/
    sprite: null,
    /**
        @property {Vector} tilePosition
    **/
    tilePosition: null,

    staticInit: function(texture, width, height) {
        this.super();
        this.tilePosition = new game.Vector();

        this.texture = this.texture || texture;
        var texture = this.texture instanceof game.Texture ? this.texture : game.Texture.fromAsset(this.texture);

        this.width = width || texture.width;
        this.height = height || texture.height;
        
        this.sprite = new game.Sprite(texture);

        this._pos = new game.Rectangle();
        this._rect = new game.Rectangle();
    },

    _generateTexture: function() {
        // TODO make one big texture, and use 4 of them (faster)
    },

    _renderChildren: function(context) {
        var x = -(this.tilePosition.x % this.sprite.texture.width);
        var y = -(this.tilePosition.y % this.sprite.texture.height);

        while (x < this.width && y < this.height) {
            this._rect.x = 0;
            this._rect.y = 0;
            this._rect.width = this.sprite.texture.width;
            this._rect.height = this.sprite.texture.height;

            this._pos.x = x;
            this._pos.y = y;

            if (this._pos.x < 0) {
                this._rect.x = -this._pos.x;
                this._rect.width += this._pos.x;
                this._pos.x = 0;
            }
            if (this._pos.y < 0) {
                this._rect.y = -this._pos.y;
                this._rect.height += this._pos.y;
                this._pos.y = 0;
            }
            if (x + this._rect.width > this.width) {
                this._rect.width -= (x + this._rect.width) - this.width;
            }
            if (y + this._rect.height > this.height) {
                this._rect.height -= (y + this._rect.height) - this.height;
            }

            this.sprite._renderCanvas(context, this._worldTransform, this._rect, this._pos);

            x += this.sprite.texture.width;
            if (x > this.width) {
                x = -(this.tilePosition.x % this.sprite.texture.width);
                y += this.sprite.texture.height;
            }
        }
    },

    update: function() {
        this.tilePosition.add(50 * game.delta);
    }
});

game.defineProperties('TilingSprite', {
    width: {
        get: function() {
            return this._width;
        },

        set: function(value) {
            this._width = value;
        }
    },

    height: {
        get: function() {
            return this._height;
        },

        set: function(value) {
            this._height = value;
        }
    }
});

});

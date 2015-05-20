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
        @property {Vector} tilePosition
    **/
    tilePosition: null,

    staticInit: function(texture, width, height) {
        this.super();
        this.tilePosition = new game.Vector();

        this.texture = this.texture || texture;
        var texture = this.texture instanceof game.Texture ? this.texture : game.Texture.fromAsset(this.texture);

        var sx = Math.ceil(width / texture.width);
        var sy = Math.ceil(height / texture.height);
        
        for (var x = 0; x < sx; x++) {
            for (var y = 0; y < sy; y++) {
                var sprite = new game.Sprite(texture);
                sprite.position.x = x * sprite.width;
                sprite.position.y = y * sprite.width;
                sprite.addTo(this);
            }
        }
    },

    _renderChildren: function(context) {
        var rect = new game.Rectangle(20, 20, 0, 0);

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child._renderCanvas(context);
        }
    },
});

});

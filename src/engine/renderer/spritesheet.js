/**
    @module renderer.spritesheet
**/
game.module(
    'engine.renderer.spritesheet'
)
.require(
    'engine.renderer.sprite'
)
.body(function() {

/**
    Sprite which contains multiple textures from sprite sheet with fixed frame size.
    @class SpriteSheet
    @extends Sprite
    @constructor
    @param {String} id Asset id
    @param {Number} width Sprite frame width
    @param {Number} height Sprite frame height
**/
game.createClass('SpriteSheet', 'Sprite', {
    /**
        Width of frame.
        @property {Number} frameWidth
    **/
    frameWidth: 0,
    /**
        Height of frame.
        @property {Number} frameHeight
    **/
    frameHeight: 0,
    /**
        List of textures.
        @property {Array} textures
    **/
    textures: [],

    staticInit: function(id, frameWidth, frameHeight) {
        this.frameWidth = this.frameWidth || frameWidth;
        this.frameHeight = this.frameHeight || frameHeight;
        if (!this.frameHeight) this.frameHeight = this.frameWidth;
        var baseTexture = game.BaseTexture.cache[game.paths[id]];
        if (!baseTexture) throw 'No texture found for ' + id;
        var sx = Math.floor(baseTexture.width / this.frameWidth);
        var sy = Math.floor(baseTexture.height / this.frameHeight);
        this.frames = sx * sy;

        for (var i = 0; i < this.frames; i++) {
            var x = (i % sx) * this.frameWidth;
            var y = Math.floor(i / sx) * this.frameHeight;
            var texture = new game.Texture(baseTexture, x, y, this.frameWidth, this.frameHeight);
            this.textures.push(texture);
        }

        this.super(this.textures[0]);
    },

    /**
        Set texture to specific frame.
        @method frame
        @param {Number} index Frame index
    **/
    frame: function(index) {
        if (!this.textures[index]) return;
        this.texture = this.textures[index];
        return this;
    }
});

game.addAttributes('SpriteSheet', {
    /**
        Create animation from spritesheet.
        @method anim
        @static
        @param {String} id Asset id
        @param {Number} width Sprite frame width
        @param {Number} height Sprite frame height
        @param {Number|Array} frames List or number of frames
        @param {Number} [startIndex] The index to begin with, default to 0
        @param {Boolean} [onlyTextures] Return only textures in array
        @return {Animation|Array}
    **/
    anim: function(id, frameWidth, frameHeight, frames, startIndex, onlyTextures) {
        var sprite = new game.SpriteSheet(id, frameWidth, frameHeight);

        startIndex = startIndex || 0;
        frames = frames || sprite.textures.length;
        var textures = [];
        if (frames.length > 0) {
            for (var i = 0; i < frames.length; i++) {
                textures.push(sprite.textures[startIndex + frames[i]]);
            }
        }
        else {
            for (var i = 0; i < frames; i++) {
                textures.push(sprite.textures[startIndex + i]);
            }
        }
        if (onlyTextures) return textures;
        return new game.Animation(textures);
    }
});

});

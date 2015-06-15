/**
    @module renderer.spritesheet
**/
game.module(
    'engine.renderer.spritesheet'
)
.body(function() {

/**
    @class SpriteSheet
    @constructor
    @param {String} id Asset ID
    @param {Number} width Sprite frame width
    @param {Number} height Sprite frame height
**/
game.createClass('SpriteSheet', {
    /**
        Number of frames.
        @property {Number} frames
    **/
    frames: 0,
    /**
        Height of frame.
        @property {Number} height
    **/
    height: 0,
    /**
        Asset id of texture to use as spritesheet.
        @property {String} texture
    **/
    texture: null,
    /**
        List of textures.
        @property {Array} textures
    **/
    textures: [],
    /**
        Width of frame.
        @property {Number} width
    **/
    width: 0,
    /**
        @property {Number} _sx
        @private
    **/
    _sx: 0,
    /**
        @property {Number} _sy
        @private
    **/
    _sy: 0,

    staticInit: function(id, width, height) {
        this.width = this.width || width;
        this.height = this.height || height;
        var baseTexture = game.BaseTexture.cache[game.paths[this.texture || id]];
        this._sx = Math.floor(baseTexture.width / this.width);
        this._sy = Math.floor(baseTexture.height / this.height);
        this.frames = this._sx * this._sy;

        for (var i = 0; i < this.frames; i++) {
            var x = (i % this._sx) * this.width;
            var y = Math.floor(i / this._sx) * this.height;
            var texture = new game.Texture(baseTexture, x, y, this.width, this.height);
            this.textures.push(texture);
        }
    },

    /**
        Create sprite from specific frame.
        @method frame
        @param {Number} index Frame index
        @return {Sprite}
    **/
    frame: function(index) {
        index = index.limit(0, this.frames - 1);
        return new game.Sprite(this.textures[index]);
    },

    /**
        Create animation from spritesheet.
        @method anim
        @param {Number|Array} frames List or number of frames
        @param {Number} [startIndex] The index to begin with, default to 0
        @param {Boolean} [onlyTextures] Return only textures
        @return {Animation|Array}
    **/
    anim: function(frames, startIndex, onlyTextures) {
        startIndex = startIndex || 0;
        frames = frames || this.frames;
        var textures = [];
        if (frames.length > 0) {
            for (var i = 0; i < frames.length; i++) {
                textures.push(this.textures[startIndex + frames[i]]);
            }
        }
        else {
            for (var i = 0; i < frames; i++) {
                textures.push(this.textures[startIndex + i]);
            }
        }
        if (onlyTextures) return textures;
        return new game.Animation(textures);
    }
});

});

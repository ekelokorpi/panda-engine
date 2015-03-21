/**
    @module renderer.text
**/
game.module(
	'engine.renderer.text'
)
.require(
	'engine.renderer.sprite'
)
.body(function() {
'use strict';

/**
    @class Text
    @extends Sprite
**/
game.createClass('Text', 'Sprite', {
    /**
        @property {String} text
    **/
    text: '',
    /**
        @property {Object} style
    **/
    style: null,
    /**
        @property {Font} font
    **/
    font: null,

    staticInit: function(text, style) {
        this.setStyle(style);
        this.super(text);
    },

    setText: function(text) {
        this.setTexture(text);
        return this;
    },

    setStyle: function(style) {
        this.style = style;
        this.style.font = this.style.font.replace(/\s+/g, '_');
        this.font = game.Font.cache[this.style.font];
        if (!this.font) throw 'Font not found';
        return this;
    },

    setTexture: function(text) {
        this.text = text;

        var width = 0;
        var height = 0;
        var id = this.style.font + '_';
        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);
            id += charCode;
            if (charCode === 32) {
                this.width += this.font.spaceWidth;
                continue;
            }
            var charObj = this.font.chars[charCode];
            if (!charObj) continue;
            var texture = charObj.texture;
            width += charObj.xadvance + charObj.xoffset;
            height = Math.max(height, texture.height);
        }

        this.texture = game.Texture.cache[id];
        if (!this.texture) this._generateTexture(id, width, height);
    },

    _generateTexture: function(id, width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        var xPos = 0;
        var yPos = 0;
        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);
            if (charCode === 32) {
                xPos += this.font.spaceWidth;
                continue;
            }
            var charObj = this.font.chars[charCode];
            if (!charObj) continue;
            var texture = charObj.texture;
            context.drawImage(
                texture.baseTexture.source,
                texture.position.x,
                texture.position.y,
                texture.width,
                texture.height,
                xPos + charObj.xoffset,
                height - texture.height,
                texture.width,
                texture.height);

            xPos += charObj.xadvance + charObj.xoffset;
        }
        canvas._id = id;
        this.texture = game.Texture.fromCanvas(canvas);
    }
});

/**
    @class Font
**/
game.createClass('Font', {
    chars: {},
    spaceWidth: 0,
    baseTexture: null,

    init: function(data) {
        var image = data.getElementsByTagName('page')[0].getAttribute('file');
        this.baseTexture = game.BaseTexture.fromImage(game._getFilePath(image));

        var info = data.getElementsByTagName('info')[0];
        var face = info.getAttribute('face');
        var chars = data.getElementsByTagName('char');
        for (var i = 0; i < chars.length; i++) {
            var xadvance = parseInt(chars[i].getAttribute('xadvance'));
            var xoffset = parseInt(chars[i].getAttribute('xoffset'));
            var id = parseInt(chars[i].getAttribute('id'));
            if (id === 32) {
                this.spaceWidth = xadvance;
                continue;
            }
            var x = parseInt(chars[i].getAttribute('x'));
            var y = parseInt(chars[i].getAttribute('y'));
            var width = parseInt(chars[i].getAttribute('width'));
            var height = parseInt(chars[i].getAttribute('height'));
            var texture = new game.Texture(this.baseTexture, x, y, width, height);
            
            this.chars[id] = {
                texture: texture,
                xadvance: xadvance,
                xoffset: xoffset
            };
        }
    }
});

game.addAttributes('Font', {
    fromData: function(data) {
        var info = data.getElementsByTagName('info')[0];
        var face = info.getAttribute('face');
        var font = game.Font.cache[face];

        if (!font) {
            font = new game.Font(data);
            game.Font.cache[face] = font;
        }

        return font;
    },

    clearCache: function() {
        for (var i in this.cache) {
            delete this.cache[i];
        }
    },

    cache: {}
});

});

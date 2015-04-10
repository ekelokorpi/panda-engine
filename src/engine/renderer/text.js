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
    @constructor
    @param {String} text
    @param {String} font
    @param {Object} [props]
**/
game.createClass('Text', 'Sprite', {
    /**
        @property {Font} font
    **/
    font: null,
    /**
        @property {String} fontName
    **/
    fontName: null,
    /**
        @property {String} text
    **/
    text: null,
    /**
        @property {Number} wrap
    **/
    wrap: 0,
    align: 'left',

    staticInit: function(text, props) {
        this.text = this.text || text;
        game.merge(this, props);
        if (this.fontName) this.setFont(this.fontName);
        this.super();
    },

    setFont: function(font) {
        this.fontName = font;
        this.font = game.Font.cache[font];
        if (!this.font) throw 'Font ' + font + ' not found';
        if (this.text) this.setText(this.text);
        return this;
    },

    setText: function(text) {
        this.text = text;
        this.updateText();
        return this;
    },

    updateText: function() {
        if (!this.font) return;

        var textWrap = this.wrap;
        var id = this.fontName + '_';

        // Calculate word widths
        var wordWidths = [];
        var curWidth = 0;
        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);
            id += charCode;

            // Space
            if (charCode === 32) {
                if (curWidth > 0) {
                    wordWidths.push(curWidth);
                    curWidth = 0;
                }
                wordWidths.push(this.font.spaceWidth);
                continue;
            }

            var charObj = this.font.chars[charCode];
            if (!charObj) continue;

            curWidth += charObj.xadvance + charObj.xoffset;
        }
        if (curWidth > 0) wordWidths.push(curWidth);
        
        // Calculate lines
        var lines = [];
        var curLineWidth = 0;
        var curLineWordCount = 0;
        var maxLineWidth = 0;
        for (var i = 0; i < wordWidths.length; i++) {
            if (curLineWidth > maxLineWidth) maxLineWidth = curLineWidth;
            curLineWordCount++;
            curLineWidth += wordWidths[i];

            if (curLineWidth > textWrap && textWrap > 0) {
                lines.push(curLineWordCount - 1);

                curLineWidth = wordWidths[i];
                curLineWordCount = 1;
            }
        }
        if (curLineWidth > 0) lines.push(curLineWidth);
        if (curLineWidth > maxLineWidth) maxLineWidth = curLineWidth;
        if (lines.length === 0) lines.push(wordWidths.length);
        this.lines = lines;

        var width = maxLineWidth;
        var height = lines.length * this.font.lineHeight;

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

        var curLine = 0;
        var curWord = 1;
        var curChars = 0;
        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);
            if (charCode === 32) curWord++;

            if (curWord > this.lines[curLine]) {
                curLine++;
                curWord = 1;
                if (xPos > 0) yPos += this.font.lineHeight;
                xPos = 0;
            }

            if (charCode === 32) {
                if (xPos > 0) xPos += this.font.spaceWidth;
                curWord++;
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
                yPos + charObj.yoffset,
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
    lineHeight: 0,

    init: function(data) {
        var image = data.getElementsByTagName('page')[0].getAttribute('file');
        this.baseTexture = game.BaseTexture.fromImage(game._getFilePath(image));

        var info = data.getElementsByTagName('info')[0];
        var common = data.getElementsByTagName('common')[0];
        var face = info.getAttribute('face');
        this.lineHeight = parseInt(common.getAttribute('lineHeight'));
        var chars = data.getElementsByTagName('char');
        for (var i = 0; i < chars.length; i++) {
            var xadvance = parseInt(chars[i].getAttribute('xadvance'));
            var xoffset = parseInt(chars[i].getAttribute('xoffset'));
            var yoffset = parseInt(chars[i].getAttribute('yoffset'));
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
                xoffset: xoffset,
                yoffset: yoffset
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

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

        var SPACE = 0;
        var WORD = 1;

        // Generate id
        var id = this.fontName + '_';
        for (var i = 0; i < this.text.length; i++) {
            id += this.text.charCodeAt(i);
        }
        id += this.align;
        this.texture = game.Texture.cache[id];
        if (this.texture) return;

        // New text
        var textWrap = this.wrap;
        var lines = [ { words: [], width: 0 } ];
        var curLine = 0;
        var curWordWidth = 0;

        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);

            // Space
            if (charCode === 32 || charCode === 10) {
                if (curWordWidth > 0) {
                    // Word before space or line break
                    var lineWidth = lines[curLine].width + curWordWidth;
                    if (lineWidth > textWrap) {
                        // Insert new line
                        curLine++;
                        lines.push({ words: [], width: 0 });
                    }

                    // Insert new word
                    lines[curLine].words.push({
                        width: curWordWidth,
                        type: WORD
                    });
                    lines[curLine].width += curWordWidth;
                }
            }

            if (charCode === 32) {
                // Insert space
                lines[curLine].words.push({
                    width: this.font.spaceWidth,
                    type: SPACE
                });
                lines[curLine].width += this.font.spaceWidth;
                curWordWidth = 0;
                continue;
            }

            if (charCode === 10) {
                // Insert line break
                curLine++;
                lines.push({ words: [], width: 0 });
                curWordWidth = 0;
                continue;
            }

            var charObj = this.font.chars[charCode];
            if (!charObj) continue;

            curWordWidth += charObj.xadvance + charObj.xoffset;
        }

        // Add last word
        if (curWordWidth > 0) {
            var lineWidth = lines[curLine].width + curWordWidth;
            if (lineWidth > textWrap) {
                // New line
                curLine++;
                lines.push({ words: [], width: 0 });
            }

            lines[curLine].words.push({
                width: curWordWidth,
                type: WORD
            });
            lines[curLine].width += curWordWidth;
        }

        // Calculate line widths without spaces at end of lines
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            for (var o = line.words.length - 1; o >= 0; o--) {
                if (line.words[o].type === SPACE) {
                    line.width -= this.font.spaceWidth;
                }
                else break;
            }
        }

        // Calculate max line width
        var maxLineWidth = 0;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].width > maxLineWidth) maxLineWidth = lines[i].width;
        }

        var width = maxLineWidth;
        var height = lines.length * this.font.lineHeight;

        this.lines = lines;
        this._generateTexture(id, width, height);
        return;







        console.log(lines);
        console.log(lines.length);


        var textWrap = this.wrap;
        var id = this.fontName + '_';

        // Calculate word widths
        var wordWidths = [];
        var curWidth = 0;
        var wordTypes = [];
        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);
            id += charCode;

            // Space
            if (charCode === 32 || charCode === 10) {
                if (curWidth > 0) {
                    wordWidths.push(curWidth);
                    wordTypes.push(1);
                    curWidth = 0;
                }
                if (charCode === 32) {
                    wordWidths.push(this.font.spaceWidth);
                    wordTypes.push(0);
                }
                else {
                    wordWidths.push(0);
                    wordTypes.push(-1);
                }
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
        var lineWidhts = [];
        var totalLines = 0;
        for (var i = 0; i < wordWidths.length; i++) {
            if (curLineWidth > maxLineWidth) maxLineWidth = curLineWidth;
            curLineWordCount++;
            curLineWidth += wordWidths[i];

            if (wordWidths[i] === 0 && textWrap > 0) {
                lines.push(curLineWordCount - 1);
                lines.push(0);
                
                lineWidhts.push(curLineWidth);
                lineWidhts.push(0);
                totalLines++;

                curLineWidth = 0;
                curLineWordCount = 0;
                continue;
            }

            if (curLineWidth > textWrap && textWrap > 0) {
                lines.push(curLineWordCount - 1);
                lineWidhts.push(curLineWidth - wordWidths[i]);
                totalLines++;

                curLineWidth = wordWidths[i];
                curLineWordCount = 1;
            }
        }
        if (curLineWidth > 0) {
            lines.push(curLineWordCount);
            lineWidhts.push(curLineWidth);
            totalLines++;
        }
        if (curLineWidth > maxLineWidth) maxLineWidth = curLineWidth;
        if (lines.length === 0) {
            lines.push(wordWidths.length);
            lineWidhts.push(0);
            totalLines++;
        }
        // Line word counts
        this.lines = lines;
        // Line pixel widths
        this.lineWidhts = lineWidhts;

        console.log(totalLines);
        var width = maxLineWidth;
        console.log(width);
        var height = totalLines * this.font.lineHeight;

        this.texture = game.Texture.cache[id];
        if (!this.texture) this._generateTexture(id, width, height);
    },

    _generateTexture: function(id, width, height) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        
        var xPos = 0;
        var yPos = 0;
        var curLine = 0;
        var curWord = 0;

        if (this.align === 'center') xPos = width / 2 - this.lines[0].width / 2;
        if (this.align === 'right') xPos = width - this.lines[0].width;

        for (var i = 0; i < this.text.length; i++) {
            var line = this.lines[curLine];
            if (!line) break;

            if (!line.words[curWord]) {
                var charCode = this.text.charCodeAt(i);
                // Line break
                curLine++;
                curWord = 0;

                if (xPos > 0) yPos += this.font.lineHeight;
                xPos = 0;

                if (this.align === 'center') xPos = width / 2 - this.lines[curLine].width / 2;
                if (this.align === 'right') xPos = width - this.lines[curLine].width;
            }

            var charCode = this.text.charCodeAt(i);

            if (charCode === 32) {
                // Only add space if not beginning of line
                if (xPos > 0) {
                    xPos += this.font.spaceWidth;
                    curWord++;
                }

                // Change word after space
                curWord++;
                continue;
            }

            if (charCode === 10) {
                // Line break
                yPos += this.font.lineHeight;
                xPos = 0;
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

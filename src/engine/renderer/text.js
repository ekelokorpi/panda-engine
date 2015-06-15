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

/**
    @class Text
    @extends Container
    @constructor
    @param {String} text
    @param {Object} [props]
**/
game.createClass('Text', 'Container', {
    /**
        @property {String} align
    **/
    align: 'left',
    /**
        @property {String} font
    **/
    font: null,
    /**
        @property {Font} fontClass
    **/
    fontClass: null,
    /**
        @property {String} text
    **/
    text: null,
    /**
        @property {Number} wrap
    **/
    wrap: 0,
    /**
        @property {Object} _lines
        @private
    **/
    _lines: null,

    staticInit: function(text, props) {
        this.super();
        this.text = this.text || text.toString();
        game.merge(this, props);
        this.font = this.font || game.Text.defaultFont;
        if (this.font) this.setFont(this.font);
    },

    /**
        Set new font for text.
        @method setFont
        @param {String} fontName
        @chainable
    **/
    setFont: function(fontName) {
        this.font = fontName;
        this.fontClass = game.Font.cache[fontName];
        if (!this.fontClass) throw 'Font ' + fontName + ' not found';
        if (this.text) this.setText(this.text);
        return this;
    },

    /**
        Set new text.
        @method setText
        @param {String} text
        @chainable
    **/
    setText: function(text) {
        this.text = text.toString();
        this.updateText();
        return this;
    },

    /**
        Update text texture.
        @method updateText
    **/
    updateText: function() {
        if (!this.fontClass) return;
        
        this.removeAll();

        var SPACE = 0;
        var WORD = 1;
        var lines = [{ words: [], width: 0 }];
        var curLine = 0;
        var curWordWidth = 0;

        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);

            // Space
            if (charCode === 32 || charCode === 10) {
                if (curWordWidth > 0) {
                    // Word before space or line break
                    var lineWidth = lines[curLine].width + curWordWidth;
                    if (lineWidth > this.wrap && this.wrap > 0 && lines[curLine].words.length > 0) {
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
                    width: this.fontClass.spaceWidth,
                    type: SPACE
                });
                lines[curLine].width += this.fontClass.spaceWidth;
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

            var charObj = this.fontClass.chars[charCode];
            if (!charObj) continue;

            curWordWidth += charObj.xadvance + charObj.xoffset;
        }

        // Add last word
        if (curWordWidth > 0) {
            var lineWidth = lines[curLine].width + curWordWidth;
            if (lineWidth > this.wrap && this.wrap > 0 && lines[curLine].words.length > 0) {
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

        var width = 0;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.width > width) width = line.width;
            for (var o = line.words.length - 1; o >= 0; o--) {
                if (line.words[o].type === SPACE) {
                    line.width -= this.fontClass.spaceWidth;
                }
                else break;
            }
        }

        this._lines = lines;
        this._generateText(width);
    },

    /**
        @method _generateText
        @param {Number} width
        @private
    **/
    _generateText: function(width) {
        var x = 0;
        var y = 0;
        var curLine = 0;
        var curWord = 0;

        if (this.align === 'center') x = width / 2 - this._lines[0].width / 2;
        if (this.align === 'right') x = width - this._lines[0].width;

        for (var i = 0; i < this.text.length; i++) {
            var line = this._lines[curLine];

            // End of line
            if (!line.words[curWord]) {
                curLine++;
                curWord = 0;

                if (x > 0) y += this.fontClass.lineHeight;
                x = 0;

                if (this.align === 'center') x = width / 2 - this._lines[curLine].width / 2;
                if (this.align === 'right') x = width - this._lines[curLine].width;
            }

            var charCode = this.text.charCodeAt(i);

            // Space
            if (charCode === 32) {
                // Only add space if not beginning of line
                if (x > 0) {
                    x += this.fontClass.spaceWidth;
                    curWord++;
                }
                curWord++;
            }

            // Line break
            if (charCode === 10) {
                y += this.fontClass.lineHeight;
                x = 0;
                curWord++;
            }

            var charObj = this.fontClass.chars[charCode];
            if (!charObj) continue;

            var texture = charObj.texture;

            var sprite = new game.Sprite(texture);
            sprite.position.x = (x + charObj.xoffset) / game.scale;
            sprite.position.y = (y + charObj.yoffset) / game.scale;
            this.addChild(sprite);

            x += charObj.xadvance + charObj.xoffset;
        }
    }
});

game.addAttributes('Text', {
    /**
        Default font for text.
        @attribute {String} defaultFont
    **/
    defaultFont: null
});

/**
    @class Font
    @constructor
    @param {Object} data
**/
game.createClass('Font', {
    /**
        @property {BaseTexture} baseTexture
    **/
    baseTexture: null,
    /**
        @property {Object} chars
    **/
    chars: {},
    /**
        @property {Number} lineHeight
    **/
    lineHeight: 0,
    /**
        @property {Number} spaceWidth
    **/
    spaceWidth: 0,

    staticInit: function(data) {
        var image = data.getElementsByTagName('page')[0].getAttribute('file');
        var info = data.getElementsByTagName('info')[0];
        var common = data.getElementsByTagName('common')[0];
        var face = info.getAttribute('face');
        var chars = data.getElementsByTagName('char');

        this.baseTexture = game.BaseTexture.fromImage(game._getFilePath(image));
        this.lineHeight = parseInt(common.getAttribute('lineHeight'));
        
        for (var i = 0; i < chars.length; i++) {
            var xadvance = parseInt(chars[i].getAttribute('xadvance'));
            var id = parseInt(chars[i].getAttribute('id'));
            if (id === 32) {
                this.spaceWidth = xadvance;
                continue;
            }
            var xoffset = parseInt(chars[i].getAttribute('xoffset'));
            var yoffset = parseInt(chars[i].getAttribute('yoffset'));
            var x = parseInt(chars[i].getAttribute('x')) / game.scale;
            var y = parseInt(chars[i].getAttribute('y')) / game.scale;
            var width = parseInt(chars[i].getAttribute('width')) / game.scale;
            var height = parseInt(chars[i].getAttribute('height')) / game.scale;
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
    /**
        @attribute {Object} cache
    **/
    cache: {},

    /**
        @method fromData
        @static
        @param {Object} data
    **/
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

    /**
        @method clearCache
        @static
    **/
    clearCache: function() {
        for (var i in this.cache) {
            delete this.cache[i];
        }
    }
});

});

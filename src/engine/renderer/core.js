/**
    @module renderer.core
**/
game.module(
    'engine.renderer.core'
)
.require(
    'engine.renderer.animation',
    'engine.renderer.container',
    'engine.renderer.graphics',
    'engine.renderer.sprite',
    'engine.renderer.spritesheet',
    'engine.renderer.text',
    'engine.renderer.texture',
    'engine.renderer.tilingsprite',
    'engine.renderer.webgl'
)
.body(function() {

/**
    @class Renderer
**/
game.createClass('Renderer', {
    /**
        @property {HTMLCanvasElement} canvas
    **/
    canvas: null,
    /**
        @property {CanvasRenderingContext2D|WebGLRenderingContext} context
    **/
    context: null,
    /**
        Is renderer using WebGL.
        @property {Boolean} webGL
    **/
    webGL: false,
    /**
        @property {Vector} _offset
        @private
    **/
    _offset: null,
    /**
        @property {Vector} _projection
        @private
    **/
    _projection: null,
    /**
        @property {WebGLShaderManager} _shaderManager
        @private
    **/
    _shaderManager: null,
    /**
        @property {String} _smoothProperty
        @private
    **/
    _smoothProperty: null,
    /**
        @property {WebGLSpriteBatch} _spriteBatch
        @private
    **/
    _spriteBatch: null,
    /**
        @property {Object} _webGLClearColor
        @private
    **/
    _webGLClearColor: {
        r: 0,
        g: 0,
        b: 0
    },

    init: function() {
        this.canvas = document.getElementById(game.System.canvasId);

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = game.System.canvasId;
            document.body.style.margin = 0;
            document.body.appendChild(this.canvas);
            this._show();
        }

        var webGLSupported = false;
        try {
            var canvas = document.createElement('canvas');
            webGLSupported = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        }
        catch (e) {
        }

        if (webGLSupported && game.Renderer.webGL) {
            this.webGL = true;
            this.context = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            var gl = this.context;
            gl.id = 0;
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFunc(1, 771);

            this._projection = new game.Vector();
            this._offset = new game.Vector();
            this._shaderManager = new game.WebGLShaderManager();
            this._spriteBatch = new game.WebGLSpriteBatch();
            this._shaderManager.setContext(gl);
            this._spriteBatch.setContext(gl);
        }
        else {
            this.context = this.canvas.getContext('2d');

            if ('imageSmoothingEnabled' in this.context) this._smoothProperty = 'imageSmoothingEnabled';
            else if ('webkitImageSmoothingEnabled' in this.context) this._smoothProperty = 'webkitImageSmoothingEnabled';
            else if ('mozImageSmoothingEnabled' in this.context) this._smoothProperty = 'mozImageSmoothingEnabled';
            else if ('oImageSmoothingEnabled' in this.context) this._smoothProperty = 'oImageSmoothingEnabled';
            else if ('msImageSmoothingEnabled' in this.context) this._smoothProperty = 'msImageSmoothingEnabled';
        }
        
        this._resize(game.system.canvasWidth, game.system.canvasHeight);
    },

    /**
        Clear canvas.
        @method _clear
        @private
    **/
    _clear: function() {
        if (this.webGL) {
            var color = this._webGLClearColor;
            if (game.scene.backgroundColor) {
                if (!game.scene._backgroundColorRgb) {
                    game.scene._backgroundColorRgb = this._hexToRgb(game.scene.backgroundColor);
                }
                color = game.scene._backgroundColorRgb;
            }
            this.context.clearColor(color.r, color.g, color.b, 1);
            this.context.clear(this.context.COLOR_BUFFER_BIT);
        }
        else {
            if (game.scene.backgroundColor) {
                this.context.fillStyle = game.scene.backgroundColor;
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            else {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    },

    /**
        @method _hexToRgb
        @param {String} hex
        @private
    **/
    _hexToRgb: function(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
        Hide canvas.
        @method _hide
        @private
    **/
    _hide: function() {
        this.canvas.style.display = 'none';
    },

    /**
        Set canvas position with CSS.
        @method _position
        @param {Number} x
        @param {Number} y
        @private
    **/
    _position: function(x, y) {
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = x + 'px';
        this.canvas.style.top = y + 'px';
    },

    /**
        Render container to canvas.
        @method _render
        @param {Container} container
        @private
    **/
    _render: function(container) {
        if (this.webGL) {
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
            this._projection.x = this.canvas.width / 2;
            this._projection.y = -this.canvas.height / 2;
        }
        else {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.globalAlpha = 1;
        }
        
        if (game.Renderer.clearBeforeRender) this._clear();
        container.updateTransform();

        if (this._spriteBatch) this._spriteBatch.begin(this);

        container._render(this.context);

        if (this._spriteBatch) this._spriteBatch.end();
    },

    /**
        Resize canvas.
        @method _resize
        @param {Number} width
        @param {Number} height
        @private
    **/
    _resize: function(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (this._smoothProperty) this.context[this._smoothProperty] = (game.Renderer.scaleMode === 'linear');
    },

    /**
        Show canvas.
        @method _show
        @private
    **/
    _show: function() {
        this.canvas.style.display = 'block';
    },

    /**
        Set canvas size with CSS.
        @method _size
        @param {Number} width
        @param {Number} height
        @private
    **/
    _size: function(width, height) {
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    },

    /**
        @method _updateTexture
        @param {Texture} texture
        @private
    **/
    _updateTexture: function(texture) {
        if (!texture.loaded) return;

        var gl = this.context;

        if (!texture._glTextures[gl.id]) texture._glTextures[gl.id] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture._premultipliedAlpha);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, game.Renderer.scaleMode === 'linear' ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, game.Renderer.scaleMode === 'linear' ? gl.LINEAR : gl.NEAREST);

        if (!texture._powerOf2) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }

        texture._dirty[gl.id] = false;

        return texture._glTextures[gl.id];
    }
});

game.addAttributes('Renderer', {
    /**
        Clear canvas before rendering.
        @attribute {Boolean} clearBeforeRender
        @default true
    **/
    clearBeforeRender: true,
    /**
        Use round positions.
        @attribute {Boolean} roundPixels
        @default false
    **/
    roundPixels: false,
    /**
        Use WebGL rendering.
        @attribute {Boolean} webGL
        @default false
    **/
    webGL: false,
    /**
        Renderer scaling mode.
        @attribute {String} scaleMode
        @default linear
    **/
    scaleMode: 'linear'
});

});

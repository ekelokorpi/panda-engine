/**
    @module renderer.core
**/
game.module(
    'engine.renderer.core'
)
.require(
    'engine.renderer.animation',
    'engine.renderer.container',
    'engine.renderer.geom.shapes',
    'engine.renderer.geom.vector',
    'engine.renderer.graphics',
    'engine.renderer.sprite',
    'engine.renderer.spritesheet',
    'engine.renderer.text',
    'engine.renderer.texture',
    'engine.renderer.tilingsprite',
    'engine.renderer.webgl.shader',
    'engine.renderer.webgl.shadermanager',
    'engine.renderer.webgl.spritebatch'
)
.body(function() {
'use strict';

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

            this.projection = new game.Vector();
            this.offset = new game.Vector();
            this.shaderManager = new game.WebGLShaderManager();
            this.spriteBatch = new game.WebGLSpriteBatch();
            this.shaderManager.setContext(gl);
            this.spriteBatch.setContext(gl);
        }
        else {
            this.context = this.canvas.getContext('2d');

            if ('imageSmoothingEnabled' in this.context)
                this.smoothProperty = 'imageSmoothingEnabled';
            else if ('webkitImageSmoothingEnabled' in this.context)
                this.smoothProperty = 'webkitImageSmoothingEnabled';
            else if ('mozImageSmoothingEnabled' in this.context)
                this.smoothProperty = 'mozImageSmoothingEnabled';
            else if ('oImageSmoothingEnabled' in this.context)
                this.smoothProperty = 'oImageSmoothingEnabled';
            else if ('msImageSmoothingEnabled' in this.context)
                this.smoothProperty = 'msImageSmoothingEnabled';
        }
        
        this._resize(game.system.width, game.system.height);
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
        if (!this.webGL) this.context[this.smoothProperty] = (game.Renderer.scaleMode === 'linear');
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
        Show canvas.
        @method _show
        @private
    **/
    _show: function() {
        this.canvas.style.display = 'block';
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
        Clear canvas.
        @method _clear
        @private
    **/
    _clear: function() {
        if (!game.Renderer.clearBeforeRender) return;

        if (this.webGL) {
            var gl = this.context;
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }

        if (game.Renderer.backgroundColor) {
            this.context.fillStyle = game.Renderer.backgroundColor;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        else {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    /**
        Render container to canvas.
        @method _render
        @param {Container} container
        @private
    **/
    _render: function(container) {
        if (this.webGL) {
            var gl = this.context;
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.drawCount = 0;
            this.projection.x = this.canvas.width / 2;
            this.projection.y = -this.canvas.height / 2;
        }
        else {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.globalAlpha = 1;
        }
        
        this._clear();
        container.updateTransform();

        if (this.webGL) this.spriteBatch.begin(this);

        container._render(this.context);

        if (this.webGL) this.spriteBatch.end();
    },

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
        @attribute {Boolean} clearBeforeRender
        @default true
    **/
    clearBeforeRender: true,
    /**
        @attribute {String} backgroundColor
        @default #000000
    **/
    backgroundColor: '#000000',
    /**
        @attribute {Boolean} roundPixels
        @default false
    **/
    roundPixels: false,
    /**
        @attribute {Boolean} webGL
        @default false
    **/
    webGL: false,
    /**
        @attribute {String} scaleMode
        @default linear
    **/
    scaleMode: 'linear'
});

/**
    @class Matrix
**/
game.createClass('Matrix', {
    /**
        @property {Number} a
    **/
    a: 1,
    /**
        @property {Number} b
    **/
    b: 0,
    /**
        @property {Number} c
    **/
    c: 0,
    /**
        @property {Number} d
    **/
    d: 1,
    /**
        @property {Number} tx
    **/
    tx: null,
    /**
        @property {Number} ty
    **/
    ty: null,

    /**
        Reset transform to default.
        @method reset
        @chainable
    **/
    reset: function() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;

        return this;
    }
});

});

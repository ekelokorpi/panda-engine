/**
    @module renderer.core
**/
game.module(
	'engine.renderer.core'
)
.require(
	'engine.renderer.animation',
	'engine.renderer.text',
	'engine.renderer.container',
	'engine.renderer.graphics',
	'engine.renderer.sprite',
    'engine.renderer.texture'
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
        @property {CanvasRenderingContext2D} context
    **/
    context: null,

    init: function() {
        this.canvas = document.getElementById(game.System.canvasId);

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = game.System.canvasId;
            document.body.style.margin = 0;
            document.body.appendChild(this.canvas);
            this._show();
        }

        this._resize(game.System.width, game.System.height);
        this.context = this.canvas.getContext('2d');
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
        @method _show
        @private
    **/
    _show: function() {
        this.canvas.style.display = 'block';
    },

    /**
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
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.globalAlpha = 1;
        this._clear();
        container.updateTransform();
        container._render(this.context);
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
    roundPixels: false
});

});

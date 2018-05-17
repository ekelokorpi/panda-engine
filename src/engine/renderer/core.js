/**
    @module renderer.core
**/
game.module(
    'engine.renderer.core'
)
.require(
    'engine.renderer.animation',
    'engine.renderer.container',
    'engine.renderer.fastcontainer',
    'engine.renderer.graphics',
    'engine.renderer.sprite',
    'engine.renderer.spritesheet',
    'engine.renderer.text',
    'engine.renderer.texture',
    'engine.renderer.tilingsprite'
)
.body(function() {

/**
    Canvas renderer. Instance automatically created at `game.renderer`
    @class Renderer
    @constructor
    @param {Number} width
    @param {Number} height
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
    /**
        @property {String} _smoothProperty
        @private
    **/
    _smoothProperty: null,

    init: function(width, height) {
        if (!game.device.cocoonCanvasPlus) {
            this.canvas = document.getElementById(game.System.canvasId);
        }

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = game.System.canvasId;
            this.canvas.style.display = 'block';
            this.canvas.style.outline = 'none';
            if (game.Renderer.scaleMode === 'nearest') this.canvas.style.imageRendering = 'pixelated';
            this.canvas.tabIndex = 1;
            document.body.appendChild(this.canvas);
            if (!game.System.center) document.body.style.margin = 0;
        }

        game._normalizeVendorAttribute(this.canvas, 'requestFullScreen');

        this._initContext();

        if ('imageSmoothingEnabled' in this.context) this._smoothProperty = 'imageSmoothingEnabled';
        else if ('webkitImageSmoothingEnabled' in this.context) this._smoothProperty = 'webkitImageSmoothingEnabled';
        else if ('mozImageSmoothingEnabled' in this.context) this._smoothProperty = 'mozImageSmoothingEnabled';
        else if ('oImageSmoothingEnabled' in this.context) this._smoothProperty = 'oImageSmoothingEnabled';
        else if ('msImageSmoothingEnabled' in this.context) this._smoothProperty = 'msImageSmoothingEnabled';
        
        this._resize(width, height);
    },

    /**
        Clear canvas.
        @method _clear
        @private
    **/
    _clear: function() {
        if (game.scene.backgroundColor) {
            this.context.fillStyle = game.scene.backgroundColor;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        else {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
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
        @method _initContext
        @private
    **/
    _initContext: function() {
        this.context = this.canvas.getContext('2d');
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
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.globalAlpha = 1;
        this.context.globalCompositeOperation = 'source-over';
        if (game.Renderer.clearBeforeRender) this._clear();
        container._updateChildTransform();
        container._render(this.context);
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
    }
});

game.addAttributes('Renderer', {
    /**
        Clear canvas on start of every frame.
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
        Set scaleMode to nearest to disable smoothing (great for scaled pixel art).
        @attribute {String} scaleMode
        @default linear
    **/
    scaleMode: 'linear'
});

game.createClass('Matrix', {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: 0,
    ty: 0,
    
    reset: function() {
        var proto = this.constructor.prototype;
        this.a = proto.a;
        this.b = proto.b;
        this.c = proto.c;
        this.d = proto.d;
        this.tx = proto.tx;
        this.ty = proto.ty;
        return this;
    }
});

game.addAttributes('Matrix', {
    empty: new game.Matrix()
});

});

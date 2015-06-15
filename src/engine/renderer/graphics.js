/**
    @module renderer.graphics
**/
game.module(
    'engine.renderer.graphics'
)
.require(
    'engine.renderer.container'
)
.body(function() {

/**
    @class Graphics
    @extends Container
**/
game.createClass('Graphics', 'Container', {
    /**
        @property {String} fillColor
        @default #fff
    **/
    fillColor: '#fff',
    /**
        @property {Number} fillAlpha
        @default 1
    **/
    fillAlpha: 1,
    /**
        @property {Number} lineAlpha
        @default 1
    **/
    lineAlpha: 1,
    /**
        @property {String} lineColor
        @default #fff
    **/
    lineColor: '#fff',
    /**
        @property {Number} lineWidth
        @default 0
    **/
    lineWidth: 0,
    /**
        @property {Array} shapes
    **/
    shapes: [],

    /**
        @method beginFill
        @param {String} [color]
        @param {Number} [alpha]
        @chainable
    **/
    beginFill: function(color, alpha) {
        this.fillColor = color || this.fillColor;
        this.fillAlpha = alpha || this.fillAlpha;
        return this;
    },

    /**
        @method clear
        @chainable
    **/
    clear: function() {
        this.shapes.length = 0;
        return this;
    },

    /**
        @method drawCircle
        @param {Number} x
        @param {Number} y
        @param {Number} radius
        @chainable
    **/
    drawCircle: function(x, y, radius) {
        radius *= game.scale;
        var shape = new game.Circle(radius, x, y);
        this._drawShape(shape);
        return this;
    },

    /**
        @method drawRect
        @param {Number} x
        @param {Number} y
        @param {Number} width
        @param {Number} height
        @chainable
    **/
    drawRect: function(x, y, width, height) {
        height = height || width;
        width *= game.scale;
        height *= game.scale;
        var shape = new game.Rectangle(width, height, x, y);
        this._drawShape(shape);
        return this;
    },

    /**
        @method lineStyle
        @param {Number} [width]
        @param {String} [color]
        @param {Number} [alpha]
        @chainable
    **/
    lineStyle: function(width, color, alpha) {
        this.lineWidth = width || this.lineWidth;
        this.lineColor = color || this.lineColor;
        this.lineAlpha = alpha || this.lineAlpha;
        return this;
    },

    /**
        @method _drawShape
        @param {Rectangle|Circle} shape
        @private
    **/
    _drawShape: function(shape) {
        var data = new game.GraphicsData(this.lineWidth, this.lineColor, this.lineAlpha, this.fillColor, this.fillAlpha, shape);
        this.shapes.push(data);
    },

    _getBounds: function() {
        if (this._worldTransform.tx === null) this._updateParentTransform();

        var wt = this._worldTransform;
        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx;
        var ty = wt.ty;
        var width = 0;
        var height = 0;

        for (var i = 0; i < this.shapes.length; i++) {
            var data = this.shapes[i];
            var maxX = data.shape.x;
            var maxY = data.shape.y;

            if (data.shape.radius) {
                maxX += data.shape.radius / game.scale;
                maxY += data.shape.radius / game.scale;
            }
            else {
                maxX += data.shape.width / game.scale;
                maxY += data.shape.height / game.scale;
            }

            width = Math.max(width, maxX);
            height = Math.max(height, maxY);
        }

        var x2 = a * width + tx;
        var y2 = b * width + ty;
        var x3 = a * width + c * height + tx;
        var y3 = d * height + b * width + ty;
        var x4 = c * height + tx;
        var y4 = d * height + ty;

        var minX = Math.min(tx, x2, x3, x4);
        var minY = Math.min(ty, y2, y3, y4);
        var maxX = Math.max(tx, x2, x3, x4);
        var maxY = Math.max(ty, y2, y3, y4);

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this._worldBounds.width = maxX - minX;
        this._worldBounds.height = maxY - minY;
        return this._worldBounds;
    },

    _renderCanvas: function(context) {
        var wt = this._worldTransform;
        var tx = wt.tx * game.scale;
        var ty = wt.ty * game.scale;

        context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);

        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i]._render(context, this._worldAlpha);
        }
    }
});

/**
    @class GraphicsData
    @constructor
    @param {Number} lineWidth
    @param {String} lineColor
    @param {Number} lineAlpha
    @param {String} fillColor
    @param {Number} fillAlpha
    @param {Rectangle|Circle} shape
**/
game.createClass('GraphicsData', {
    /**
        @property {Number} fillAlpha
    **/
    fillAlpha: 1,
    /**
        @property {String} fillColor
    **/
    fillColor: '',
    /**
        @property {Number} lineAlpha
    **/
    lineAlpha: 0,
    /**
        @property {String} lineColor
    **/
    lineColor: '',
    /**
        @property {Number} lineWidth
    **/
    lineWidth: 0,
    /**
        @property {Rectangle|Circle} shape
    **/
    shape: null,

    staticInit: function(lineWidth, lineColor, lineAlpha, fillColor, fillAlpha, shape) {
        this.lineWidth = lineWidth;
        this.lineColor = lineColor;
        this.lineAlpha = lineAlpha;
        this.fillColor = fillColor;
        this.fillAlpha = fillAlpha;
        this.shape = shape;
    },

    /**
        @method _render
        @param {CanvasRenderingContext2D} context
        @param {Number} alpha
        @private
    **/
    _render: function(context, alpha) {
        context.globalAlpha = this.fillAlpha * alpha;
        context.fillStyle = this.fillColor;
        context.strokeStyle = this.lineColor;
        context.lineWidth = this.lineWidth * game.scale;
        context.beginPath();

        var x = this.shape.x * game.scale;
        var y = this.shape.y * game.scale;

        if (this.shape.width) {
            context.rect(x, y, this.shape.width, this.shape.height);
        }
        else if (this.shape.radius) {
            context.arc(x, y, this.shape.radius, 0, Math.PI * 2);
        }

        if (this.fillColor && this.fillAlpha) context.fill();
        if (this.lineWidth) context.stroke();
    }
});

});

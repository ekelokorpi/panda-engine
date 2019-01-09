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
        @property {String} blendMode
        @default source-over
    **/
    blendMode: 'source-over',
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
        @method drawArc
        @param {Number} x
        @param {Number} y
        @param {Number} radius
        @param {Number} startAngle
        @param {Number} endAngle
        @chainable
    **/
    drawArc: function(x, y, radius, startAngle, endAngle) {
        radius *= game.scale;
        var shape = new game.Arc(radius, x, y, startAngle, endAngle);
        this._drawShape(shape);
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
        Draw bezier curve.
        @method drawCurve
        @param {Curve|Number} sx
        @param {Number} sy
        @param {Number} ex
        @param {Number} ey
        @param {Number} h1x
        @param {Number} h1y
        @param {Number} h2x
        @param {Number} h2y
        @chainable
    **/
    drawCurve: function(sx, sy, ex, ey, h1x, h1y, h2x, h2y) {
        this.lineWidth = this.lineWidth || 1;
        var shape = typeof sx === 'number' ? new game.Curve(sx, sy, ex, ey, h1x, h1y, h2x, h2y) : sx;
        this._drawShape(shape, true);
        return this;
    },
    
    /**
        @method drawLine
        @param {Number} sx Start x
        @param {Number} sy Start y
        @param {Number} tx End x
        @param {Number} ty End y
        @chainable
    **/
    drawLine: function(sx, sy, tx, ty) {
        if (!tx && !ty) {
            tx = sx;
            ty = sy;
            sx = 0;
            sy = 0;
        }
        this.lineWidth = this.lineWidth || 1;
        tx *= game.scale;
        ty *= game.scale;
        var shape = new game.Rectangle(tx, ty, sx, sy);
        this._drawShape(shape, true);
        return this;
    },
    
    /**
        @method drawPolygon
        @param {Array} points List of points.
        @param {Boolean} [close] Close the polygon.
        @chainable
    **/
    drawPolygon: function(points, close) {
        var poly = new game.Polygon(points);
        if (close) poly.close();
        this._drawShape(poly);
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
        this.lineWidth = width || this.lineWidth;
        this.lineColor = color || this.lineColor;
        this.lineAlpha = alpha || this.lineAlpha;
        return this;
    },

    /**
        @method _drawShape
        @param {Rectangle|Circle} shape
        @private
    **/
    _drawShape: function(shape, isLine) {
        var data = new game.GraphicsShape(this.lineWidth, this.lineColor, this.lineAlpha, this.fillColor, this.fillAlpha, shape, isLine);
        this.shapes.push(data);
    },

    _getBounds: function() {
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
            var sx = data.shape.x;
            var sy = data.shape.y;

            if (data.shape.radius) {
                sx += data.shape.radius / game.scale;
                sy += data.shape.radius / game.scale;
            }
            else {
                sx += data.shape.width / game.scale;
                sy += data.shape.height / game.scale;
            }

            width = Math.max(width, sx);
            height = Math.max(height, sy);
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

        context.globalCompositeOperation = this.blendMode;
        context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);

        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i]._render(context, this._worldAlpha);
        }
    },

    /**
        @method _renderMask
        @param {CanvasRenderingContext2D} context
        @param {Matrix} transform
        @private
    **/
    _renderMask: function(context, transform) {
        var wt = transform;
        var tx = wt.tx * game.scale;
        var ty = wt.ty * game.scale;

        context.save();
        context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);
        context.beginPath();
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i]._renderShape(context);
        }
        context.closePath();
        context.clip();
    }
});

/**
    @class GraphicsShape
    @constructor
    @param {Number} lineWidth
    @param {String} lineColor
    @param {Number} lineAlpha
    @param {String} fillColor
    @param {Number} fillAlpha
    @param {Rectangle|Circle} shape
**/
game.createClass('GraphicsShape', {
    /**
        @property {Number} fillAlpha
    **/
    fillAlpha: 1,
    /**
        @property {String} fillColor
    **/
    fillColor: '',
    /**
        @property {Boolean} isLine
    **/
    isLine: false,
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
        @property {Arc|Circle|Rectangle} shape
    **/
    shape: null,

    staticInit: function(lineWidth, lineColor, lineAlpha, fillColor, fillAlpha, shape, isLine) {
        this.lineWidth = lineWidth;
        this.lineColor = lineColor;
        this.lineAlpha = lineAlpha;
        this.fillColor = fillColor;
        this.fillAlpha = fillAlpha;
        this.shape = shape;
        this.isLine = isLine || this.isLine;
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

        this._renderShape(context);

        if (this.fillColor && this.fillAlpha && !this.isLine) context.fill();
        if (this.lineWidth) {
            context.globalAlpha = this.lineAlpha * alpha;
            context.stroke();
        }
    },

    /**
        @method _renderShape
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _renderShape: function(context) {
        var shape = this.shape;
        var x = shape.x * game.scale;
        var y = shape.y * game.scale;
        
        if (this.isLine && shape.start) {
            context.moveTo(shape.start.x * game.scale, shape.start.y * game.scale);
            context.bezierCurveTo﻿(
                shape.handle1.x * game.scale,
                shape.handle1.y * game.scale,
                shape.handle2.x * game.scale,
                shape.handle2.y * game.scale,
                shape.end.x * game.scale,
                shape.end.y * game.scale
            );
        }
        else if (this.isLine) {
            context.moveTo(x, y);
            context.lineTo(shape.width, shape.height);
        }
        else if (shape.width) {
            context.rect(x, y, shape.width, shape.height);
        }
        else if (shape.radius) {
            if (typeof shape.startAngle === 'number' && typeof shape.endAngle === 'number') {
                context.moveTo(x, y);
                context.arc(x, y, shape.radius, shape.startAngle, shape.endAngle);
                context.closePath();
            }
            else {
                context.arc(x, y, shape.radius, 0, Math.PI * 2);
            }
        }
        else if (shape.points) {
            context.moveTo(0, 0);
            for (var i = 0; i < shape.points.length; i++) {
                var point = shape.points[i];
                var x = point.x;
                var y = point.y;
                if (x === undefined && point.length === undefined) {
                    x = point;
                    y = shape.points[i + 1];
                    i++;
                }
                else if (x === undefined) {
                    context.bezierCurveTo﻿(point[0], point[1], point[2], point[3], point[4], point[5]);
                    continue;
                }
                context.lineTo(x * game.scale, y * game.scale);
            }
        }
    }
});

});

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
'use strict';

/**
    @class Graphics
    @extends Container
**/
game.createClass('Graphics', 'Container', {
    data: [],

    beginFill: function(color, alpha) {
        this.fillColor = color;
        this.fillAlpha = alpha || 1;
        return this;
    },

    lineStyle: function(width, color, alpha) {
        this.lineWidth = width;
        this.lineColor = color;
        this.lineAlpha = alpha || 1;
        return this;
    },

    clear: function() {
        this.data.length = 0;
        return this;
    },

    drawRect: function(x, y, width, height) {
        var shape = new game.Rectangle(width, height, x, y);
        this._drawShape(shape);
        return this;
    },

    _drawShape: function(shape) {
        var data = new game.GraphicsData(this.lineWidth, this.lineColor, this.lineAlpha, this.fillColor, this.fillAlpha, shape);
        this.data.push(data);
    },

    _render: function(context) {
        if (game.renderer.webGL) {
            this.super(context);
            return;
        }
        
        context.setTransform(
            this._worldTransform.a,
            this._worldTransform.b,
            this._worldTransform.c,
            this._worldTransform.d,
            this._worldTransform.tx,
            this._worldTransform.ty);

        for (var i = 0; i < this.data.length; i++) {
            this.data[i]._render(context, this._worldAlpha);
        }
        
        this.super(context);
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
    @param {Rectangle} shape
**/
game.createClass('GraphicsData', {
    init: function(lineWidth, lineColor, lineAlpha, fillColor, fillAlpha, shape) {
        this.lineWidth = lineWidth;
        this.lineColor = lineColor;
        this.lineAlpha = lineAlpha;
     
        this.fillColor = fillColor;
        this.fillAlpha = fillAlpha;
     
        this.shape = shape;
    },

    _render: function(context, alpha) {
        context.globalAlpha = this.fillAlpha * alpha;
        context.fillStyle = this.fillColor;
        if (this.shape instanceof game.Rectangle) {
            context.fillRect(this.shape.x, this.shape.y, this.shape.width, this.shape.height);
        }
    }
});

});

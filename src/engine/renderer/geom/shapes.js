/**
    @module renderer.geom.shapes
**/
game.module(
	'engine.renderer.geom.shapes'
)
.body(function() {
'use strict';

/**
    @class Rectangle
    @constructor
    @param {Number} width
    @param {Number} [height]
    @param {Number} [x]
    @param {Number} [y]
**/
game.createClass('Rectangle', {
    /**
        @property {Number} x
        @default 0
    **/
    x: 0,
    /**
        @property {Number} y
        @default 0
    **/
    y: 0,
    /**
        Width of rectangle.
        @property {Number} width
        @default 0
    **/
    width: 0,
    /**
        Height of rectangle.
        @property {Number} height
        @default 0
    **/
    height: 0,

    init: function(width, height, x, y) {
        this.width = width || this.width;
        this.height = typeof height === 'number' ? height : this.width;
        this.x = x || this.x;
        this.y = y || this.y;
    }
});

/**
    @class Circle
    @constructor
    @param {Number} radius
**/
game.createClass('Circle', {
    /**
        Radius of circle.
        @property {Number} radius
        @default 0
    **/
    radius: 0,

    init: function(radius) {
        this.radius = radius;
    }
});

});

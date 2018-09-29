/**
    @module geometry
**/
game.module(
    'engine.geometry'
)
.body(function() {

/**
    @class Arc
    @constructor
    @param {Number} radius
    @param {Number} x
    @param {Number} y
    @param {Number} startAngle
    @param {Number} endAngle
**/
game.createClass('Arc', {
    /**
        @property {Number} endAngle
        @default 0
    **/
    endAngle: 0,
    /**
        Radius of arc.
        @property {Number} radius
        @default 0
    **/
    radius: 0,
    /**
        @property {Number} startAngle
        @default 0
    **/
    startAngle: 0,
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

    staticInit: function(radius, x, y, startAngle, endAngle) {
        this.startAngle = startAngle || this.startAngle;
        this.endAngle = endAngle || this.endAngle;
        this.radius = radius || this.radius;
        this.x = x || this.x;
        this.y = y || this.y;
    }
});

/**
    @class Circle
    @constructor
    @param {Number} radius
    @param {Number} x
    @param {Number} y
**/
game.createClass('Circle', {
    /**
        Radius of circle.
        @property {Number} radius
        @default 0
    **/
    radius: 0,
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

    staticInit: function(radius, x, y) {
        this.radius = radius || this.radius;
        this.x = x || this.x;
        this.y = y || this.y;
    }
});

/**
    @class Polygon
    @constructor
    @param {Array} points
**/
game.createClass('Polygon', {
    /**
        List of points in polygon. Can be list of numbers or vectors.
        @property {Array} points
    **/
    points: [],

    staticInit: function(points) {
        if (!points) return;
        for (var i = 0; i < points.length; i++) {
            if (points[i] instanceof game.Vector) {
                this.points.push(points[i]);
            }
            else if (typeof points[i] === 'number') {
                this.points.push(new game.Vector(points[i], points[i + 1]));
                i++;
            }
            else {
                // Bezier curve
                this.points.push(points[i]);
            }
        }
    },
    
    /**
        Close polygon.
        @method close
    **/
    close: function() {
        if (this.points[0] !== this.points[this.points.length - 1]) {
            this.points.push(this.points[0]);
        }
    }
});

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
        @property {Number} height
        @default 0
    **/
    height: 0,
    /**
        @property {Number} width
        @default 0
    **/
    width: 0,
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

    staticInit: function(width, height, x, y) {
        this.set(width, height, x, y);
    },

    /**
        @method set
        @param {Number} width
        @param {Number} height
        @param {Number} x
        @param {Number} y
    **/
    set: function(width, height, x, y) {
        this.width = typeof width === 'number' ? width : this.width;
        this.height = typeof height === 'number' ? height : this.width;
        this.x = typeof x === 'number' ? x : this.x;
        this.y = typeof y === 'number' ? y : this.y;
    },
    
    /**
        Swap width and height values.
        @method swap
    **/
    swap: function() {
        var height = this.height;
        this.height = this.width;
        this.width = height;
    }
});

/**
    Basic vector class with two values.
    @class Vector
    @constructor
    @param {Number} [x]
    @param {Number} [y]
**/
game.createClass('Vector', {
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

    staticInit: function(x, y) {
        this.set(x, y);
    },

    /**
        Add to vector values.
        @method add
        @param {Number|Vector} x
        @param {Number} [y]
        @chainable
    **/
    add: function(x, y) {
        this.x += x instanceof game.Vector ? x.x : x;
        this.y += x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Get vector angle or angle between two vectors.
        @method angle
        @param {Vector} [vector]
        @return {Number}
    **/
    angle: function(vector) {
        if (vector instanceof game.Vector) {
            return Math.atan2(vector.y - this.y, vector.x - this.x);
        }
        else {
            return Math.atan2(this.y, this.x);
        }
    },

    /**
        Get angle between two vectors from origin.
        @method angleFromOrigin
        @param {Vector} vector
        @return {Number}
    **/
    angleFromOrigin: function(vector) {
        return Math.atan2(vector.y, vector.x) - Math.atan2(this.y, this.x);
    },

    /**
        Clone vector.
        @method clone
        @return {Vector}
    **/
    clone: function() {
        return new this.constructor(this.x, this.y);
    },

    /**
        Is values same with another vector.
        @method compare
        @param {Vector} vector
        @return {Boolean}
    **/
    compare: function(vector) {
        return (this.x === vector.x && this.y === vector.y);
    },

    /**
        Copy values from another vector.
        @method copy
        @param {Vector} vector
        @chainable
    **/
    copy: function(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    },

    /**
        Get distance between two points.
        @method distance
        @param {Number|Vector} x
        @param {Number} [y]
        @chainable
    **/
    distance: function(x, y) {
        var x1 = x instanceof game.Vector ? x.x : x;
        var y1 = x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        x1 = x1 - this.x;
        y1 = y1 - this.y;
        return Math.sqrt(x1 * x1 + y1 * y1);
    },

    /**
        Divide vector values.
        @method divide
        @param {Number|Vector} x
        @param {Number} [y]
        @chainable
    **/
    divide: function(x, y) {
        this.x /= x instanceof game.Vector ? x.x : x;
        this.y /= x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Get dot of vector.
        @method dot
        @param {Vector} [vector]
        @return {Number}
    **/
    dot: function(vector) {
        if (vector instanceof game.Vector) return this.x * vector.x + this.y * vector.y;
        else return this.x * this.x + this.y * this.y;
    },

    /**
        Get normalized dot of vector.
        @method dotNormalized
        @param {Vector} [vector]
        @return {Number}
    **/
    dotNormalized: function(vector) {
        var len1 = this.length();
        var x1 = this.x / len1;
        var y1 = this.y / len1;

        if (vector instanceof game.Vector) {
            var len2 = vector.length();
            var x2 = vector.x / len2;
            var y2 = vector.y / len2;
            return x1 * x2 + y1 * y2;
        }
        else return x1 * x1 + y1 * y1;
    },

    /**
        Get length of vector.
        @method length
        @return {Number}
    **/
    length: function() {
        return Math.sqrt(this.dot());
    },

    /**
        Limit vector values.
        @method limit
        @param {Vector} vector
        @chainable
    **/
    limit: function(vector) {
        this.x = this.x.limit(-vector.x, vector.x);
        this.y = this.y.limit(-vector.y, vector.y);
        return this;
    },

    /**
        Change values based on distance and angle.
        @method move
        @param {Number} distance
        @param {Vector|Number} angle
    **/
    move: function(distance, angle) {
        if (angle instanceof game.Vector) angle = this.angle(angle);
        this.x += distance * Math.cos(angle);
        this.y += distance * Math.sin(angle);
    },

    /**
        Multiply vector values.
        @method multiply
        @param {Number|Vector} x
        @param {Number} [y]
        @chainable
    **/
    multiply: function(x, y) {
        this.x *= x instanceof game.Vector ? x.x : x;
        this.y *= x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Multiply and add vector values.
        @method multiplyAdd
        @param {Number|Vector} x
        @param {Number} [y]
        @chainable
    **/
    multiplyAdd: function(x, y) {
        this.x += x instanceof game.Vector ? x.x * y : x * y;
        this.y += x instanceof game.Vector ? x.y * y : x * y;
        return this;
    },

    /**
        Normalize vector.
        @method normalize
        @chainable
    **/
    normalize: function() {
        var len = this.length();
        this.x /= len || 1;
        this.y /= len || 1;
        return this;
    },

    /**
        Rotate vector in radians.
        @method rotate
        @param {Number} angle
        @chainable
    **/
    rotate: function(angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var x = this.x * c - this.y * s;
        var y = this.y * c + this.x * s;
        this.x = x;
        this.y = y;
        return this;
    },

    /**
        Round vector values.
        @method round
        @param {Number} [precision]
        @chainable
    **/
    round: function(precision) {
        this.x = this.x.round(precision);
        this.y = this.y.round(precision);
        return this;
    },

    /**
        Set vector values.
        @method set
        @param {Number} x
        @param {Number} [y]
        @chainable
    **/
    set: function(x, y) {
        this.x = typeof x === 'number' ? x : this.x;
        this.y = typeof y === 'number' ? y : this.x;
        return this;
    },

    /**
        Subtract from vector values.
        @method subtract
        @param {Number|Vector} x
        @param {Number} [y]
        @chainable
    **/
    subtract: function(x, y) {
        this.x -= x instanceof game.Vector ? x.x : x;
        this.y -= x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Swap vector values with another vector.
        @method swap
        @param {Vector} target
    **/
    swap: function(target) {
        var x = this.x;
        var y = this.y;
        this.copy(target);
        target.set(x, y);
    }
});

});

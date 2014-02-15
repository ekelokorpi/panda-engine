/**
    Physics engine.

    @module physics
    @namespace game
**/
game.module(
	'engine.physics'
)
.body(function() { 'use strict';

/**
    Physics world.
    @class World
    @extends game.Class
    @constructor
    @param {Number} x Velocity x
    @param {Number} y Velocity y
**/
game.World = game.Class.extend({
    /**
        @property {Vector} gravity
    **/
    gravity: null,
    /**
        @property {CollisionSolver} solver
    **/
    solver: null,
    /**
        @property {Array} bodies
    **/
    bodies: [],
    /**
        @property {Array} collisionGroups
    **/
    collisionGroups: [],

    init: function(x, y) {
        this.gravity = new game.Vector();
        this.gravity.x = typeof(x) === 'number' ? x : 0;
        this.gravity.y = typeof(y) === 'number' ? y : 980;
        this.solver = new game.CollisionSolver();
    },

    /**
        Add body to world.
        @method addBody
        @param {Body} body
    **/
    addBody: function(body) {
        body.world = this;
        this.bodies.push(body);
        if(typeof(body.collisionGroup) === 'number') {
            this.collisionGroups[body.collisionGroup] = this.collisionGroups[body.collisionGroup] || [];
            this.collisionGroups[body.collisionGroup].push(body);
        }
        if(game.debugDraw && body.shape) game.debugDraw.addBody(body);
    },

    /**
        @method removeBody
        @param {Body} body
    **/
    removeBody: function(body) {
        if(!body.world) return;
        body.world = null;
        this.removeBodyCollision(body);
        this.bodies.erase(body);
    },

    /**
        Remove body from it's collision group.
        @method removeBodyCollision
        @param {Body} body
    **/
    removeBodyCollision: function(body) {
        this.collisionGroups[body.collisionGroup].erase(body);
    },

    /**
        Remove collision group from world.
        @method removeCollisionGroup
        @param {Number} i
    **/
    removeCollisionGroup: function(i) {
        this.collisionGroups.erase(this.collisionGroups[i]);
    },

    /**
        @method collide
        @param {Body} a
    **/
    collide: function(a) {
        if(!this.collisionGroups[a.collideAgainst]) return;

        var i, b;
        for (i = this.collisionGroups[a.collideAgainst].length - 1; i >= 0; i--) {
            b = this.collisionGroups[a.collideAgainst][i];
            if(a !== b) this.solver.solve(a, b);
        }
    },

    /**
        @method update
    **/
    update: function() {
        var i, j;
        for (i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].update();
        }
        for (i = this.collisionGroups.length - 1; i >= 0; i--) {
            if(this.collisionGroups[i]) {
                for (j = this.collisionGroups[i].length - 1; j >= 0; j--) {
                    if(typeof(this.collisionGroups[i][j].collideAgainst) === 'number') this.collide(this.collisionGroups[i][j]);
                }
            }
        }
    }
});

/**
    Physics collision solver.
    @class CollisionSolver
    @extends game.Class
**/
game.CollisionSolver = game.Class.extend({
    /**
        Solve collision a versus b.
        @method solve
        @param {Body} a
        @param {Body} b
    **/
    solve: function(a, b) {
        if(this.hitTest(a, b)) this.hitResponse(a, b);
    },

    /**
        @method hitTest
        @param {Body} a
        @param {Body} b
        @return {Boolean}
    **/
    hitTest: function(a, b) {
        if(a.shape instanceof game.Rectangle && b.shape instanceof game.Rectangle) {
            return !(
                a.position.y + a.shape.height / 2 <= b.position.y - b.shape.height / 2 ||
                a.position.y - a.shape.height / 2 >= b.position.y + b.shape.height / 2 ||
                a.position.x - a.shape.width / 2 >= b.position.x + b.shape.width / 2 ||
                a.position.x + a.shape.width / 2 <= b.position.x - b.shape.width / 2
            );
        }
        if(a.shape instanceof game.Circle && b.shape instanceof game.Circle) {
            return (a.shape.radius + b.shape.radius > a.position.distance(b.position));
        }
        if(
            a.shape instanceof game.Rectangle && b.shape instanceof game.Circle ||
            a.shape instanceof game.Circle && b.shape instanceof game.Rectangle
        ) {
            var rect = a.shape instanceof game.Rectangle ? a : b;
            var circle = a.shape instanceof game.Circle ? a : b;

            var x = Math.max(rect.position.x - rect.shape.width / 2, Math.min(rect.position.x + rect.shape.width / 2, circle.position.x));
            var y = Math.max(rect.position.y - rect.shape.height / 2, Math.min(rect.position.y + rect.shape.height / 2, circle.position.y));

            var dist = Math.pow(circle.position.x - x, 2) + Math.pow(circle.position.y - y, 2);
            return dist < (circle.shape.radius * circle.shape.radius);
        }
        if(a.shape instanceof game.Line && b.shape instanceof game.Line) {
            var a1x = a.position.x - Math.sin(a.shape.rotation) * (a.shape.length / 2);
            var a1y = a.position.y - Math.cos(a.shape.rotation) * (a.shape.length / 2);
            var a2x = a.position.x + Math.sin(a.shape.rotation) * (a.shape.length / 2);
            var a2y = a.position.y + Math.cos(a.shape.rotation) * (a.shape.length / 2);
            var b1x = b.position.x - Math.sin(b.shape.rotation) * (b.shape.length / 2);
            var b1y = b.position.y - Math.cos(b.shape.rotation) * (b.shape.length / 2);
            var b2x = b.position.x + Math.sin(b.shape.rotation) * (b.shape.length / 2);
            var b2y = b.position.y + Math.cos(b.shape.rotation) * (b.shape.length / 2);

            var ub = (b2y - b1y) * (a2x - a1x) - (b2x - b1x) * (a2y - a1y);

            if(ub !== 0) {
                var uat = (b2x - b1x) * (a1y - b1y) - (b2y - b1y) * (a1x - b1x);
                var ubt = (a2x - a1x) * (a1y - b1y) - (a2y - a1y) * (a1x - b1x);
                var ua = uat / ub;
                ub = ubt / ub;

                if(ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) return true;
            }
            return false;
        }
        if(
            a.shape instanceof game.Line && b.shape instanceof game.Circle ||
            a.shape instanceof game.Circle && b.shape instanceof game.Line
        ) {
            var line = a.shape instanceof game.Line ? a : b;
            var circle = a.shape instanceof game.Circle ? a : b;

            var a1x = line.position.x - Math.sin(line.shape.rotation - line.rotation) * (line.shape.length / 2);
            var a1y = line.position.y - Math.cos(line.shape.rotation - line.rotation) * (line.shape.length / 2);
            var a2x = line.position.x + Math.sin(line.shape.rotation - line.rotation) * (line.shape.length / 2);
            var a2y = line.position.y + Math.cos(line.shape.rotation - line.rotation) * (line.shape.length / 2);

            var dx = a2x - a1x;
            var dy = a2y - a1y;

            var cx = circle.position.x;
            var cy = circle.position.y;

            var px = cx - a1x;
            var py = cy - a1y;

            var t = (dx * px + dy * py) / (line.shape.length * line.shape.length);

            if(t < 0) {
                var d = Math.sqrt(px * px + py * py);
                if(d < circle.shape.radius) return true;
            }
            else if(t > 1) {
                var d = this.distance(cx, cy, a2x, a2y);
                if(d < circle.shape.radius) return true;
            }
            else {
                var d = this.distance(px, py, dx * t, dy * t);
                if(d < circle.shape.radius) return true;
            }
            return false;
        }
        return false;
    },

    /**
        @method hitResponse
        @param {Body} a
        @param {Body} b
        @return {Boolean}
    **/
    hitResponse: function(a, b) {
        if(a.shape instanceof game.Rectangle && b.shape instanceof game.Rectangle) {
            // TODO can this be optimized?
            if(a.last.y + a.shape.height / 2 <= b.last.y - b.shape.height / 2) {
                if(a.collide(b)) {
                    a.position.y = b.position.y - b.shape.height / 2 - a.shape.height / 2;
                }
            }
            else if(a.last.y - a.shape.height / 2 >= b.last.y + b.shape.height / 2) {
                if(a.collide(b)) {
                    a.position.y = b.position.y + b.shape.height / 2 + a.shape.height / 2;
                }
            }
            else if(a.last.x + a.shape.width /2 <= b.last.x - b.shape.width / 2) {
                if(a.collide(b)) {
                    a.position.x = b.position.x - b.shape.width / 2 - a.shape.width / 2;
                }
            }
            else if(a.last.x - a.shape.width /2 >= b.last.x + b.shape.width / 2) {
                if(a.collide(b)) {
                    a.position.x = b.position.x + b.shape.width / 2 + a.shape.width / 2;
                }
            }
        }
        else if(a.shape instanceof game.Circle && b.shape instanceof game.Circle) {
            if(a.collide(b)) {
                var angle = b.position.angle(a.position);
                var dist = a.shape.radius + b.shape.radius;

                a.position.x = b.position.x + Math.cos(angle) * dist;
                a.position.y = b.position.y + Math.sin(angle) * dist;
            }
        }
        else if(a.shape instanceof game.Rectangle && b.shape instanceof game.Circle) {
            if(a.collide(b)) {
                // TODO                
                return;
            }
        }
        else if(a.shape instanceof game.Circle && b.shape instanceof game.Rectangle) {
            if(a.collide(b)) {
                // TODO                
                return;
            }
        }
        else if(a.shape instanceof game.Line && b.shape instanceof game.Line) {
            if(a.collide(b)) {
                // TODO                
                return;
            }
        }
        else if(a.shape instanceof game.Circle && b.shape instanceof game.Line) {
            if(a.collide(b)) {
                // TODO                
                return;
            }
        }
        else if(a.shape instanceof game.Line && b.shape instanceof game.Circle) {
            if(a.collide(b)) {
                // TODO
                return;
            }
        }
    }
});

/**
    Physics body.
    @class Body
    @extends game.Class
    @constructor
    @param {Object} [settings]
**/
game.Body = game.Class.extend({
    /**
        @property {World} world
    **/
    world: null,
    /**
        @property {Shape} shape
    **/
    shape: null,
    /**
        @property {Vector} position
    **/
    position: null,
    /**
        @property {Vector} last
    **/
    last: null,
    /**
        @property {Vector} velocity
    **/
    velocity: null,
    /**
        @property {Vector} velocityLimit
    **/
    velocityLimit: null,
    /**
        @property {Number} mass
        @default 0
    **/
    mass: 0,
    /**
        @property {Number} collisionGroup
        @default 0
    **/
    collisionGroup: 0,
    /**
        @property {Number} collideAgainst
        @default null
    **/
    collideAgainst: null,
    /**
        @property {Number} rotation
        @default 0
    **/
    rotation: 0,

    init: function(settings) {
        this.position = new game.Vector();
        this.velocity = new game.Vector();
        this.velocityLimit = new game.Vector(500, 500);
        this.last = new game.Vector();

        game.merge(this, settings);
    },

    /**
        Add shape to body.
        @method addShape
        @param {Shape} shape
    **/
    addShape: function(shape) {
        this.shape = shape;
    },

    /**
        Callback for collision.
        @method collide
        @return {Boolean} Return true, to call hit response.
    **/
    collide: function() {
        return true;
    },

    /**
        @method update
    **/
    update: function() {
        this.last.copy(this.position);

        if(this.mass > 0) {
            this.velocity.x += this.world.gravity.x * this.mass * game.system.delta;
            this.velocity.y += this.world.gravity.y * this.mass * game.system.delta;
            this.velocity.limit(this.velocityLimit);
        }

        this.position.multiplyAdd(this.velocity, game.scale * game.system.delta);
    }
});

/**
    @class Rectangle
    @extends game.Class
    @constructor
    @param {Number} width
    @param {Number} height
**/
game.Rectangle = game.Class.extend({
    /**
        @property {Number} width
        @default 50
    **/
    width: 50,
    /**
        @property {Number} height
        @default 50
    **/
    height: 50,

    init: function(width, height) {
        this.width = width || this.width * game.scale;
        this.height = height || this.height * game.scale;
    }
});

/**
    @class Circle
    @extends game.Class
    @constructor
    @param {Number} radius
**/
game.Circle = game.Class.extend({
    /**
        @property {Number} radius
        @default 50
    **/
    radius: 50,

    init: function(radius) {
        this.radius = radius || this.radius * game.scale;
    }
});

/**
    @class Line
    @extends game.Class
    @constructor
    @param {Number} length
    @param {Number} rotation
**/
game.Line = game.Class.extend({
    /**
        @property {Number} length
        @default 50
    **/
    length: 50,
    /**
        @property {Number} rotation
        @default 0
    **/
    rotation: 0,

    init: function(length, rotation) {
        this.length = length || this.length * game.scale;
        this.rotation = rotation || this.rotation;
    }
});

/**
    @class Vector
    @extends game.Class
    @constructor
    @param {Number} x
    @param {Number} y
**/
game.Vector = game.Class.extend({
    value: null,

    init: function(x, y) {
        this.value = new Float32Array(2);
        this.x = x || 0;
        this.y = y || 0;
    },

    /**
        @method set
        @param {Number} x
        @param {Number} y
        @return {game.Vector}
    **/
    set: function(x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    /**
        @method clone
        @return {game.Vector}
    **/
    clone: function() {
        return new game.Vector(this.x, this.y);
    },

    /**
        @method copy
        @param {Vector} v
        @return {game.Vector}
    **/
    copy: function(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    },

    /**
        @method add
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    add: function(x, y) {
        this.x += x instanceof game.Vector ? x.x : x;
        this.y += x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    /**
        @method subtract
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    subtract: function(x, y) {
        this.x -= x instanceof game.Vector ? x.x : x;
        this.y -= x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    /**
        @method multiply
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    multiply: function(x, y) {
        this.x *= x instanceof game.Vector ? x.x : x;
        this.y *= x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    /**
        @method multiplyAdd
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    multiplyAdd: function(x, y) {
        this.x += x instanceof game.Vector ? x.x * y : x * y;
        this.y += x instanceof game.Vector ? x.y * y : x * y;
        return this;
    },

    /**
        @method divide
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    divide: function(x, y) {
        this.x /= x instanceof game.Vector ? x.x : x;
        this.y /= x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    /**
        @method distance
        @param {Vector} vector
        @return {Number}
    **/
    distance: function(vector) {
        var x = vector.x - this.x;
        var y = vector.y - this.y;
        return Math.sqrt(x * x + y * y);
    },

    /**
        @method length
        @return {Number}
    **/
    length: function() {
        return Math.sqrt(this.dot());
    },

    /**
        @method dot
        @param {Vector} [vector]
        @return {Number}
    **/
    dot: function(vector) {
        if(vector instanceof game.Vector) return this.x * vector.x + this.y * vector.y;
        else return this.x * this.x + this.y * this.y;
    },

    /**
        @method dotNormalized
        @param {Vector} [vector]
        @return {Number}
    **/
    dotNormalized: function(vector) {
        var len1 = this.length();
        var x1 = this.x / len1;
        var y1 = this.y / len1;

        if(vector instanceof game.Vector) {
            var len2 = vector.length();
            var x2 = vector.x / len2;
            var y2 = vector.y / len2;
            return x1 * x2 + y1 * y2;
        } else return x1 * x1 + y1 * y1;
    },

    /**
        @method rotate
        @param {Number} angle
        @return {game.Vector}
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
        @method normalize
        @return {game.Vector}
    **/
    normalize: function() {
        var len = this.length();
        this.x /= len || 1;
        this.y /= len || 1;
        return this;
    },

    /**
        @method limit
        @param {Vector} vector
        @return {game.Vector}
    **/
    limit: function(vector) {
        this.x = this.x.limit(-vector.x, vector.x);
        this.y = this.y.limit(-vector.y, vector.y);
        return this;
    },

    /**
        @method angle
        @param {Vector} vector
        @return {Number}
    **/
    angle: function(vector) {
        return Math.atan2(vector.y - this.y, vector.x - this.x);
    },

    /**
        @method round
        @return {game.Vector}
    **/
    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
});

/**
    @property {Number} x
**/
Object.defineProperty(game.Vector.prototype, 'x', {
    get: function() {
        return this.value[0];
    },
    set: function(value) {
        this.value[0] = value;
    }
});

/**
    @property {Number} y
**/
Object.defineProperty(game.Vector.prototype, 'y', {
    get: function() {
        return this.value[1];
    },
    set: function(value) {
        this.value[1] = value;
    }
});

});
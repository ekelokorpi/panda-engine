/**
    @module physics
    @namespace game
**/
game.module(
    'engine.physics'
)
.body(function() {
'use strict';

/**
    Physics world.
    @class World
    @extends game.Class
    @constructor
    @param {Number} x Gravity x
    @param {Number} y Gravity y
**/
game.World = game.Class.extend({
    /**
        Gravity of physics world.
        @property {game.Vector} gravity
        @default 0,980
    **/
    gravity: null,
    /**
        @property {game.CollisionSolver} solver
    **/
    solver: null,
    /**
        List of bodies in world.
        @property {Array} bodies
    **/
    bodies: [],
    /**
        List of collision groups.
        @property {Array} collisionGroups
    **/
    collisionGroups: [],

    init: function(x, y) {
        this.gravity = new game.Vector();
        this.gravity.x = typeof x === 'number' ? x : 0;
        this.gravity.y = typeof y === 'number' ? y : 980;
        this.solver = new game.CollisionSolver();
    },

    /**
        Add body to world.
        @method addBody
        @param {game.Body} body
    **/
    addBody: function(body) {
        body.world = this;
        this.bodies.push(body);
        if (typeof body.collisionGroup === 'number') this.addBodyCollision(body, body.collisionGroup);
        if (game.debugDraw && body.shape) game.debugDraw.addBody(body);
    },

    /**
        Remove body from world.
        @method removeBody
        @param {game.Body} body
    **/
    removeBody: function(body) {
        if (!body.world) return;
        body.world = null;
        body._remove = true;
    },

    /**
        Remove body from it's collision group.
        @method removeBodyCollision
        @param {game.Body} body
    **/
    removeBodyCollision: function(body) {
        this.collisionGroups[body.collisionGroup].erase(body);
    },

    /**
        Add body to collision group.
        @method addBodyCollision
        @param {game.Body} body
        @param {Number} group
    **/
    addBodyCollision: function(body, group) {
        body.collisionGroup = group;
        this.collisionGroups[body.collisionGroup] = this.collisionGroups[body.collisionGroup] || [];
        this.collisionGroups[body.collisionGroup].push(body);
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
        Collide body against it's `collideAgainst` group.
        @method collide
        @param {game.Body} body
    **/
    collide: function(body) {
        if (!this.collisionGroups[body.collideAgainst]) return;

        var i, b;
        for (i = this.collisionGroups[body.collideAgainst].length - 1; i >= 0; i--) {
            if (!this.collisionGroups[body.collideAgainst]) break;
            b = this.collisionGroups[body.collideAgainst][i];
            if (body !== b) this.solver.solve(body, b);
        }
    },

    /**
        Update bodies.
        @method update
    **/
    update: function() {
        var i, j;
        for (i = this.bodies.length - 1; i >= 0; i--) {
            if (this.bodies[i]._remove) {
                if (typeof this.bodies[i].collisionGroup === 'number') this.removeBodyCollision(this.bodies[i]);
                this.bodies.splice(i, 1);
            }
            else {
                this.bodies[i].update();
            }
        }
        for (i = this.collisionGroups.length - 1; i >= 0; i--) {
            if (this.collisionGroups[i]) {
                for (j = this.collisionGroups[i].length - 1; j >= 0; j--) {
                    if (this.collisionGroups[i][j] && typeof this.collisionGroups[i][j].collideAgainst === 'number') this.collide(this.collisionGroups[i][j]);
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
        @param {game.Body} a
        @param {game.Body} b
    **/
    solve: function(a, b) {
        if (this.hitTest(a, b)) {
            if (this.hitResponse(a, b)) {
                a.afterCollide(b);
            }
        }
    },

    /**
        Hit test a versus b.
        @method hitTest
        @param {game.Body} a
        @param {game.Body} b
        @return {Boolean} return true, if bodies hit.
    **/
    hitTest: function(a, b) {
        if (a.shape instanceof game.Rectangle && b.shape instanceof game.Rectangle) {
            return !(
                a.position.y + a.shape.height / 2 <= b.position.y - b.shape.height / 2 ||
                a.position.y - a.shape.height / 2 >= b.position.y + b.shape.height / 2 ||
                a.position.x - a.shape.width / 2 >= b.position.x + b.shape.width / 2 ||
                a.position.x + a.shape.width / 2 <= b.position.x - b.shape.width / 2
            );
        }
        if (a.shape instanceof game.Circle && b.shape instanceof game.Circle) {
            return (a.shape.radius + b.shape.radius > a.position.distance(b.position));
        }
        if (
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
        if (a.shape instanceof game.Line && b.shape instanceof game.Line) {
            var sinA = Math.sin(a.shape.rotation);
            var cosA = Math.cos(a.shape.rotation);
            var sinB = Math.sin(b.shape.rotation);
            var cosB = Math.cos(b.shape.rotation);
            var a1x = a.position.x - sinA * (a.shape.length / 2);
            var a1y = a.position.y - cosA * (a.shape.length / 2);
            var a2x = a.position.x + sinA * (a.shape.length / 2);
            var a2y = a.position.y + cosA * (a.shape.length / 2);
            var b1x = b.position.x - sinB * (b.shape.length / 2);
            var b1y = b.position.y - cosB * (b.shape.length / 2);
            var b2x = b.position.x + sinB * (b.shape.length / 2);
            var b2y = b.position.y + cosB * (b.shape.length / 2);

            var ub = (b2y - b1y) * (a2x - a1x) - (b2x - b1x) * (a2y - a1y);

            if (ub !== 0) {
                var uat = (b2x - b1x) * (a1y - b1y) - (b2y - b1y) * (a1x - b1x);
                var ubt = (a2x - a1x) * (a1y - b1y) - (a2y - a1y) * (a1x - b1x);
                var ua = uat / ub;
                ub = ubt / ub;

                if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) return true;
            }
            return false;
        }
        if (
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

            if (t < 0) {
                var d = Math.sqrt(px * px + py * py);
                if (d < circle.shape.radius) return true;
            }
            else if (t > 1) {
                var d = this.distance(cx, cy, a2x, a2y);
                if (d < circle.shape.radius) return true;
            }
            else {
                var d = this.distance(px, py, dx * t, dy * t);
                if (d < circle.shape.radius) return true;
            }
            return false;
        }
        return false;
    },

    /**
        Hit response a versus b.
        @method hitResponse
        @param {game.Body} a
        @param {game.Body} b
        @return {Boolean}
    **/
    hitResponse: function(a, b) {
        if (a.shape instanceof game.Rectangle && b.shape instanceof game.Rectangle) {
            if (a.last.y + a.shape.height / 2 <= b.last.y - b.shape.height / 2) {
                if (a.collide(b, 'UP')) {
                    a.position.y = b.position.y - b.shape.height / 2 - a.shape.height / 2;
                    return true;
                }
            }
            else if (a.last.y - a.shape.height / 2 >= b.last.y + b.shape.height / 2) {
                if (a.collide(b, 'DOWN')) {
                    a.position.y = b.position.y + b.shape.height / 2 + a.shape.height / 2;
                    return true;
                }
            }
            else if (a.last.x + a.shape.width / 2 <= b.last.x - b.shape.width / 2) {
                if (a.collide(b, 'LEFT')) {
                    a.position.x = b.position.x - b.shape.width / 2 - a.shape.width / 2;
                    return true;
                }
            }
            else if (a.last.x - a.shape.width / 2 >= b.last.x + b.shape.width / 2) {
                if (a.collide(b, 'RIGHT')) {
                    a.position.x = b.position.x + b.shape.width / 2 + a.shape.width / 2;
                    return true;
                }
            }
        }
        else if (a.shape instanceof game.Circle && b.shape instanceof game.Circle) {
            var angle = b.position.angle(a.position);
            if (a.collide(b, angle)) {
                var dist = a.shape.radius + b.shape.radius;

                a.position.x = b.position.x + Math.cos(angle) * dist;
                a.position.y = b.position.y + Math.sin(angle) * dist;
                return true;
            }
        }
        else if (a.shape instanceof game.Rectangle && b.shape instanceof game.Circle) {
            if (a.collide(b)) {
                // TODO
                return;
            }
        }
        else if (a.shape instanceof game.Circle && b.shape instanceof game.Rectangle) {
            if (a.collide(b)) {
                // TODO
                return;
            }
        }
        else if (a.shape instanceof game.Line && b.shape instanceof game.Line) {
            if (a.collide(b)) {
                // TODO
                return;
            }
        }
        else if (a.shape instanceof game.Circle && b.shape instanceof game.Line) {
            if (a.collide(b)) {
                // TODO
                return;
            }
        }
        else if (a.shape instanceof game.Line && b.shape instanceof game.Circle) {
            if (a.collide(b)) {
                // TODO
                return;
            }
        }
        return false;
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
        Body's physic world.
        @property {game.World} world
    **/
    world: null,
    /**
        Body's shape.
        @property {game.Shape} shape
    **/
    shape: null,
    /**
        Position of body.
        @property {game.Vector} position
    **/
    position: null,
    /**
        Last position of body.
        @property {game.Vector} last
    **/
    last: null,
    /**
        Body's velocity.
        @property {game.Vector} velocity
    **/
    velocity: null,
    /**
        Body's maximum velocity.
        @property {game.Vector} velocityLimit
        @default 500,500
    **/
    velocityLimit: null,
    /**
        Body's mass.
        @property {Number} mass
        @default 0
    **/
    mass: 0,
    /**
        Body's collision group.
        @property {Number} collisionGroup
        @default null
    **/
    collisionGroup: null,
    /**
        Group number that body collides against.
        @property {Number} collideAgainst
        @default null
    **/
    collideAgainst: null,
    /**
        Rotation of body.
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
        @param {game.Shape} shape
    **/
    addShape: function(shape) {
        this.shape = shape;
    },

    /**
        This is called, when body collides with another body.
        @method collide
        @param {game.Body} bodyB body that it collided with.
        @return {Boolean} Return true, to apply hit response.
    **/
    collide: function() {
        return true;
    },

    /**
        This is called after hit response.
        @method afterCollide
        @param {game.Body} bodyB body that it collided with.
    **/
    afterCollide: function() {
    },

    /**
        Set new collision group for body.
        @method setCollisionGroup
        @param {Number} group
    **/
    setCollisionGroup: function(group) {
        if (!this.world) return;
        if (typeof this.collisionGroup === 'number') this.world.removeBodyCollision(this, this.collisionGroup);
        this.world.addBodyCollision(this, group);
    },

    /**
        Set collision group that body will collide against.
        @method setCollideAgainst
        @param {Number} group
    **/
    setCollideAgainst: function(group) {
        this.collideAgainst = group;
    },

    /**
        @method update
    **/
    update: function() {
        this.last.copy(this.position);

        if (this.mass > 0) {
            this.velocity.x += this.world.gravity.x * this.mass * game.system.delta;
            this.velocity.y += this.world.gravity.y * this.mass * game.system.delta;
            this.velocity.limit(this.velocityLimit);
        }

        this.position.multiplyAdd(this.velocity, game.scale * game.system.delta);
    }
});

/**
    Rectangle shape for physic body.
    @class Rectangle
    @extends game.Class
    @constructor
    @param {Number} width
    @param {Number} height
**/
game.Rectangle = game.Class.extend({
    /**
        Width of rectangle.
        @property {Number} width
        @default 50
    **/
    width: 50,
    /**
        Height of rectangle.
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
    Circle shape for physic body.
    @class Circle
    @extends game.Class
    @constructor
    @param {Number} radius
**/
game.Circle = game.Class.extend({
    /**
        Radius of circle.
        @property {Number} radius
        @default 50
    **/
    radius: 50,

    init: function(radius) {
        this.radius = radius || this.radius * game.scale;
    }
});

/**
    Line shape for physic body.
    @class Line
    @extends game.Class
    @constructor
    @param {Number} length
    @param {Number} rotation
**/
game.Line = game.Class.extend({
    /**
        Length of line.
        @property {Number} length
        @default 50
    **/
    length: 50,
    /**
        Rotation of line.
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
    Vector class.
    @class Vector
    @extends game.Class
    @constructor
    @param {Number} [x]
    @param {Number} [y]
**/
game.Vector = game.Class.extend({
    x: 0,
    y: 0,

    init: function(x, y) {
        if (typeof x === 'number') this.x = x;
        if (typeof y === 'number') this.y = y;
    },

    /**
        Set vector values.
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
        Clone vector.
        @method clone
        @return {game.Vector}
    **/
    clone: function() {
        return new game.Vector(this.x, this.y);
    },

    /**
        Copy values from another vector.
        @method copy
        @param {game.Vector} v
        @return {game.Vector}
    **/
    copy: function(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    },

    /**
        Add to vector values.
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
        Subtract from vector values.
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
        Multiply vector values.
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
        Multiply and add vector values.
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
        Divide vector values.
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
        Get distance of two vectors.
        @method distance
        @param {game.Vector} vector
        @return {Number}
    **/
    distance: function(vector) {
        var x = vector.x - this.x;
        var y = vector.y - this.y;
        return Math.sqrt(x * x + y * y);
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
        Get dot of vector.
        @method dot
        @param {game.Vector} [vector]
        @return {Number}
    **/
    dot: function(vector) {
        if (vector instanceof game.Vector) return this.x * vector.x + this.y * vector.y;
        else return this.x * this.x + this.y * this.y;
    },

    /**
        Get normalized dot of vector.
        @method dotNormalized
        @param {game.Vector} [vector]
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
        Rotate vector in radians.
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
        Normalize vector.
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
        Limit vector values.
        @method limit
        @param {game.Vector} vector
        @return {game.Vector}
    **/
    limit: function(vector) {
        this.x = this.x.limit(-vector.x, vector.x);
        this.y = this.y.limit(-vector.y, vector.y);
        return this;
    },

    /**
        Get angle between two vectors.
        @method angle
        @param {game.Vector} vector
        @return {Number}
    **/
    angle: function(vector) {
        return Math.atan2(vector.y - this.y, vector.x - this.x);
    },

    /**
        Get angle between two vectors from origin.
        @method angleFromOrigin
        @param {game.Vector} vector
        @return {Number}
    **/
    angleFromOrigin: function(vector) {
        return Math.atan2(vector.y, vector.x) - Math.atan2(this.y, this.x);
    },

    /**
        Round vector values.
        @method round
        @return {game.Vector}
    **/
    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
});

});

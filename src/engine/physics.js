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
game.createClass('World', {
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
        @property {Object} collisionGroups
    **/
    collisionGroups: {},

    init: function(x, y) {
        x = typeof x === 'number' ? x : 0;
        y = typeof y === 'number' ? y : 980;
        this.gravity = new game.Vector(x, y);
        this.solver = new game.CollisionSolver();
    },

    /**
        Add body to world.
        @method addBody
        @param {game.Body} body
    **/
    addBody: function(body) {
        body.world = this;
        body._remove = false;
        this.bodies.push(body);
        this.addBodyCollision(body);
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
        Add body to collision group.
        @method addBodyCollision
        @param {game.Body} body
    **/
    addBodyCollision: function(body) {
        if (typeof body.collisionGroup !== 'number') return;
        this.collisionGroups[body.collisionGroup] = this.collisionGroups[body.collisionGroup] || [];
        if (this.collisionGroups[body.collisionGroup].indexOf(body) !== -1) return;
        this.collisionGroups[body.collisionGroup].push(body);
    },

    /**
        Remove body from collision group.
        @method removeBodyCollision
        @param {game.Body} body
    **/
    removeBodyCollision: function(body) {
        if (typeof body.collisionGroup !== 'number') return;
        if (!this.collisionGroups[body.collisionGroup]) return;
        if (this.collisionGroups[body.collisionGroup].indexOf(body) === -1) return;
        this.collisionGroups[body.collisionGroup].erase(body);
    },

    /**
        Collide body against it's `collideAgainst` groups.
        @method collide
        @param {game.Body} body
    **/
    collide: function(body) {
        var g, i, b, group;

        for (g = 0; g < body.collideAgainst.length; g++) {
            body._collides.length = 0;
            group = this.collisionGroups[body.collideAgainst[g]];
            
            if (!group) continue;

            for (i = group.length - 1; i >= 0; i--) {
                if (!group) break;
                b = group[i];
                if (body !== b) {
                    if (this.solver.hitTest(body, b)) {
                        body._collides.push(b);
                    }
                }
            }
            for (i = body._collides.length - 1; i >= 0; i--) {
                if (this.solver.hitResponse(body, body._collides[i])) {
                    body.afterCollide(body._collides[i]);
                }
            }
        }
    },

    /**
        Update physics world.
        @method update
    **/
    update: function() {
        var i, j;
        for (i = this.bodies.length - 1; i >= 0; i--) {
            if (this.bodies[i]._remove) {
                this.removeBodyCollision(this.bodies[i]);
                this.bodies.splice(i, 1);
            }
            else {
                this.bodies[i].update();
            }
        }
        for (i in this.collisionGroups) {
            // Remove empty collision group
            if (this.collisionGroups[i].length === 0) {
                delete this.collisionGroups[i];
                continue;
            }
            for (j = this.collisionGroups[i].length - 1; j >= 0; j--) {
                if (this.collisionGroups[i][j] && this.collisionGroups[i][j].collideAgainst.length > 0) {
                    this.collide(this.collisionGroups[i][j]);
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
game.createClass('CollisionSolver', {
    /**
        Hit test a versus b.
        @method hitTest
        @param {game.Body} a
        @param {game.Body} b
        @return {Boolean} return true, if bodies hit.
    **/
    hitTest: function(a, b) {
        if (a.shape.width && b.shape.width) {
            return !(
                a.position.y + a.shape.height / 2 <= b.position.y - b.shape.height / 2 ||
                a.position.y - a.shape.height / 2 >= b.position.y + b.shape.height / 2 ||
                a.position.x - a.shape.width / 2 >= b.position.x + b.shape.width / 2 ||
                a.position.x + a.shape.width / 2 <= b.position.x - b.shape.width / 2
            );
        }
        if (a.shape.radius && b.shape.radius) {
            return (a.shape.radius + b.shape.radius > a.position.distance(b.position));
        }
        if (a.shape.width && b.shape.radius || a.shape.radius && b.shape.width) {
            var rect = a.shape.width ? a : b;
            var circle = a.shape.radius ? a : b;

            var x = Math.max(rect.position.x - rect.shape.width / 2, Math.min(rect.position.x + rect.shape.width / 2, circle.position.x));
            var y = Math.max(rect.position.y - rect.shape.height / 2, Math.min(rect.position.y + rect.shape.height / 2, circle.position.y));

            var dist = Math.pow(circle.position.x - x, 2) + Math.pow(circle.position.y - y, 2);
            return dist < (circle.shape.radius * circle.shape.radius);
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
        if (a.shape.width && b.shape.width) {
            if (a.last.y + a.shape.height / 2 <= b.last.y - b.shape.height / 2) {
                if (a.collide(b, 'DOWN')) {
                    a.position.y = b.position.y - b.shape.height / 2 - a.shape.height / 2;
                    return true;
                }
            }
            else if (a.last.y - a.shape.height / 2 >= b.last.y + b.shape.height / 2) {
                if (a.collide(b, 'UP')) {
                    a.position.y = b.position.y + b.shape.height / 2 + a.shape.height / 2;
                    return true;
                }
            }
            else if (a.last.x + a.shape.width / 2 <= b.last.x - b.shape.width / 2) {
                if (a.collide(b, 'RIGHT')) {
                    a.position.x = b.position.x - b.shape.width / 2 - a.shape.width / 2;
                    return true;
                }
            }
            else if (a.last.x - a.shape.width / 2 >= b.last.x + b.shape.width / 2) {
                if (a.collide(b, 'LEFT')) {
                    a.position.x = b.position.x + b.shape.width / 2 + a.shape.width / 2;
                    return true;
                }
            }
            else {
                // Inside
                if (a.collide(b)) return true;
            }
        }
        else if (a.shape.radius && b.shape.radius) {
            var angle = b.position.angle(a.position);
            if (a.collide(b, angle)) {
                var dist = a.shape.radius + b.shape.radius;
                a.position.x = b.position.x + Math.cos(angle) * dist;
                a.position.y = b.position.y + Math.sin(angle) * dist;
                return true;
            }
        }
    }
});

/**
    Physics body.
    @class Body
    @extends game.Class
    @constructor
    @param {Object} [properties]
**/
game.createClass('Body', {
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
        @default 0,0
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
        Group numbers that body collides against.
        @property {Array} collideAgainst
        @default []
    **/
    collideAgainst: [],
    /**
        Body's force.
        @property {game.Vector} force
        @default 0,0
    **/
    force: null,
    /**
        Body's damping. Should be number between 0 and 1.
        @property {Number} damping
        @default 0
    **/
    damping: 0,
    _collides: [],

    init: function(properties) {
        this.position = new game.Vector();
        this.velocity = new game.Vector();
        this.velocityLimit = new game.Vector();
        this.last = new game.Vector();
        this.force = new game.Vector();

        game.merge(this, properties);
    },

    /**
        Add shape to body.
        @method addShape
        @param {game.Shape} shape
    **/
    addShape: function(shape) {
        this.shape = shape;
        return this;
    },

    /**
        This is called, when body collides with another body.
        @method collide
        @param {game.Body} body body that it collided with.
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
        if (this.world && typeof this.collisionGroup === 'number') this.world.removeBodyCollision(this);
        this.collisionGroup = group;        
        if (this.world) this.world.addBodyCollision(this);
    },

    /**
        Set body's collideAgainst groups.
        @method setCollideAgainst
        @param {Number} groups
    **/
    setCollideAgainst: function() {
        this.collideAgainst.length = 0;
        for (var i = 0; i < arguments.length; i++) {
            this.collideAgainst.push(arguments[i]);
        }
    },

    /**
        Add body to world.
        @method addTo
        @param {game.World} world
    **/
    addTo: function(world) {
        if (this.world) return;
        world.addBody(this);
        return this;
    },

    /**
        Remove body from it's world.
        @method remove
    **/
    remove: function() {
        if (this.world) this.world.removeBody(this);
    },

    /**
        Remove collision from body.
        @method removeCollision
    **/
    removeCollision: function() {
        if (this.world) this.world.removeBodyCollision(this);
    },

    /**
        @method update
    **/
    update: function() {
        this.last.copy(this.position);

        if (this.mass !== 0) this.velocity.multiplyAdd(this.world.gravity, this.mass * game.system.delta);
        this.velocity.multiplyAdd(this.force, game.system.delta);
        if (this.damping > 0 && this.damping < 1) this.velocity.multiply(Math.pow(1 - this.damping, game.system.delta));

        if (this.velocityLimit.x > 0) this.velocity.x = this.velocity.x.limit(-this.velocityLimit.x, this.velocityLimit.x);
        if (this.velocityLimit.y > 0) this.velocity.y = this.velocity.y.limit(-this.velocityLimit.y, this.velocityLimit.y);

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
game.createClass('Rectangle', {
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
game.createClass('Circle', {
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
    Vector class.
    @class Vector
    @extends game.Class
    @constructor
    @param {Number} [x]
    @param {Number} [y]
**/
game.createClass('Vector', {
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

/**
    @module physics
**/
game.module(
    'engine.physics'
)
.body(function() {

/**
    Physics world.
    @class World
    @constructor
    @param {Number} x Gravity x
    @param {Number} y Gravity y
**/
game.createClass('World', {
    /**
        Gravity of physics world.
        @property {Vector} gravity
        @default 0,980
    **/
    gravity: null,
    /**
        List of bodies in world.
        @property {Array} bodies
    **/
    bodies: [],
    /**
        @property {Object} _collisionGroups
        @private
    **/
    _collisionGroups: {},
    /**
        @property {CollisionSolver} _solver
        @private
    **/
    _solver: null,

    init: function(x, y) {
        x = typeof x === 'number' ? x : 0;
        y = typeof y === 'number' ? y : 980;
        this.gravity = new game.Vector(x, y);
        this._solver = new game.CollisionSolver();
    },

    /**
        Add body to world.
        @method addBody
        @param {Body} body
    **/
    addBody: function(body) {
        body.world = this;
        body._remove = false;
        this.bodies.push(body);
        this._addBodyCollision(body);
    },

    /**
        Remove body from world.
        @method removeBody
        @param {Body} body
    **/
    removeBody: function(body) {
        if (!body.world) return;
        body.world = null;
        body._remove = true;
    },

    /**
        @method _addBodyCollision
        @param {Body} body
        @private
    **/
    _addBodyCollision: function(body) {
        if (typeof body.collisionGroup !== 'number') return;
        this._collisionGroups[body.collisionGroup] = this._collisionGroups[body.collisionGroup] || [];
        if (this._collisionGroups[body.collisionGroup].indexOf(body) !== -1) return;
        this._collisionGroups[body.collisionGroup].push(body);
    },

    /**
        @method _removeBodyCollision
        @param {Body} body
        @private
    **/
    _removeBodyCollision: function(body) {
        if (typeof body.collisionGroup !== 'number') return;
        if (!this._collisionGroups[body.collisionGroup]) return;
        if (this._collisionGroups[body.collisionGroup].indexOf(body) === -1) return;
        this._collisionGroups[body.collisionGroup].erase(body);
    },

    /**
        @method _collide
        @param {Body} body
        @private
    **/
    _collide: function(body) {
        var g, i, b, group;

        for (g = 0; g < body.collideAgainst.length; g++) {
            body._collides.length = 0;
            group = this._collisionGroups[body.collideAgainst[g]];
            
            if (!group) continue;

            for (i = group.length - 1; i >= 0; i--) {
                if (!group) break;
                b = group[i];
                if (body !== b) {
                    if (this._solver.hitTest(body, b)) {
                        body._collides.push(b);
                    }
                }
            }
            for (i = body._collides.length - 1; i >= 0; i--) {
                if (this._solver.hitResponse(body, body._collides[i])) {
                    body.afterCollide(body._collides[i]);
                }
            }
        }
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        var i, j;
        for (i = this.bodies.length - 1; i >= 0; i--) {
            if (this.bodies[i]._remove) {
                this._removeBodyCollision(this.bodies[i]);
                this.bodies.splice(i, 1);
            }
            else {
                this.bodies[i]._update();
            }
        }
        for (i in this._collisionGroups) {
            if (this._collisionGroups[i].length === 0) {
                delete this._collisionGroups[i];
                continue;
            }
            for (j = this._collisionGroups[i].length - 1; j >= 0; j--) {
                if (this._collisionGroups[i][j] && this._collisionGroups[i][j].collideAgainst.length > 0) {
                    this._collide(this._collisionGroups[i][j]);
                }
            }
        }
    }
});

/**
    @class CollisionSolver
**/
game.createClass('CollisionSolver', {
    /**
        Hit test a versus b.
        @method hitTest
        @param {Body} a
        @param {Body} b
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
        @param {Body} a
        @param {Body} b
        @return {Boolean} Returns true, if body is moved.
    **/
    hitResponse: function(a, b) {
        if (a.shape.width && b.shape.width) {
            if (a._last.y + a.shape.height / 2 <= b._last.y - b.shape.height / 2) {
                if (a.collide(b, 'DOWN')) {
                    a.position.y = b.position.y - b.shape.height / 2 - a.shape.height / 2;
                    return true;
                }
            }
            else if (a._last.y - a.shape.height / 2 >= b._last.y + b.shape.height / 2) {
                if (a.collide(b, 'UP')) {
                    a.position.y = b.position.y + b.shape.height / 2 + a.shape.height / 2;
                    return true;
                }
            }
            else if (a._last.x + a.shape.width / 2 <= b._last.x - b.shape.width / 2) {
                if (a.collide(b, 'RIGHT')) {
                    a.position.x = b.position.x - b.shape.width / 2 - a.shape.width / 2;
                    return true;
                }
            }
            else if (a._last.x - a.shape.width / 2 >= b._last.x + b.shape.width / 2) {
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
        else {
            if (a.collide(b)) return true;
        }
        return false;
    }
});

/**
    Physics body.
    @class Body
    @constructor
    @param {Object} [properties]
**/
game.createClass('Body', {
    /**
        Body's physic world.
        @property {World} world
    **/
    world: null,
    /**
        Body's shape.
        @property {Rectangle|Circle} shape
    **/
    shape: null,
    /**
        Position of body.
        @property {Vector} position
    **/
    position: null,
    /**
        Body's velocity.
        @property {Vector} velocity
    **/
    velocity: null,
    /**
        Body's maximum velocity.
        @property {Vector} velocityLimit
        @default 980,980
    **/
    velocityLimit: null,
    /**
        Body's mass.
        @property {Number} mass
        @default 1
    **/
    mass: 1,
    /**
        Body's collision group.
        @property {Number} collisionGroup
        @default 0
    **/
    collisionGroup: 0,
    /**
        Group numbers that body collides against.
        @property {Array} collideAgainst
        @default []
    **/
    collideAgainst: [],
    /**
        Body's force.
        @property {Vector} force
        @default 0,0
    **/
    force: null,
    /**
        Body's damping. Should be number between 0 and 1.
        @property {Number} damping
        @default 0
    **/
    damping: 0,
    /**
        @property {Vector} _last
        @private
    **/
    _last: null,
    /**
        @property {Array} _collides
        @private
    **/
    _collides: [],

    init: function(properties) {
        this.force = new game.Vector();
        this.position = new game.Vector();
        this.velocity = new game.Vector();
        this.velocityLimit = new game.Vector(980, 980);
        this._last = new game.Vector();
        game.merge(this, properties);
    },

    /**
        Add shape to body.
        @method addShape
        @param {Rectangle|Circle} shape
        @chainable
    **/
    addShape: function(shape) {
        this.shape = shape;
        return this;
    },

    /**
        This is called, when body collides with another body.
        @method collide
        @param {Body} body body that it collided with.
        @return {Boolean} Return true, to apply hit response.
    **/
    collide: function() {
        return true;
    },

    /**
        This is called after hit response.
        @method afterCollide
        @param {Body} body body that it collided with.
    **/
    afterCollide: function() {
    },

    /**
        Set new collision group for body.
        @method setCollisionGroup
        @param {Number} group
        @chainable
    **/
    setCollisionGroup: function(group) {
        if (this.world && typeof this.collisionGroup === 'number') this.world._removeBodyCollision(this);
        this.collisionGroup = group;
        if (this.world) this.world._addBodyCollision(this);
        return this;
    },

    /**
        Set body's collideAgainst groups.
        @method setCollideAgainst
        @param {Number} groups
        @chainable
    **/
    setCollideAgainst: function() {
        this.collideAgainst.length = 0;
        for (var i = 0; i < arguments.length; i++) {
            this.collideAgainst.push(arguments[i]);
        }
        return this;
    },

    /**
        Add body to world.
        @method addTo
        @param {World} world
        @chainable
    **/
    addTo: function(world) {
        if (this.world) return;
        world.addBody(this);
        return this;
    },

    /**
        Remove body from it's world.
        @method remove
        @chainable
    **/
    remove: function() {
        if (this.world) this.world.removeBody(this);
        return this;
    },

    /**
        Remove collision from body.
        @method removeCollision
        @chainable
    **/
    removeCollision: function() {
        if (this.world) this.world._removeBodyCollision(this);
        return this;
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        this._last.copy(this.position);

        if (this.mass !== 0) this.velocity.multiplyAdd(this.world.gravity, this.mass * game.delta);
        this.velocity.multiplyAdd(this.force, game.delta);
        if (this.damping > 0 && this.damping < 1) this.velocity.multiply(Math.pow(1 - this.damping, game.delta));

        if (this.velocityLimit.x > 0) {
            if (this.velocity.x > this.velocityLimit.x) this.velocity.x = this.velocityLimit.x;
            if (this.velocity.x < -this.velocityLimit.x) this.velocity.x = -this.velocityLimit.x;
        }
        if (this.velocityLimit.y > 0) {
            if (this.velocity.y > this.velocityLimit.y) this.velocity.y = this.velocityLimit.y;
            if (this.velocity.y < -this.velocityLimit.y) this.velocity.y = -this.velocityLimit.y;
        }

        this.position.multiplyAdd(this.velocity, game.delta);
    }
});

});

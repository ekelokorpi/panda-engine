game.module(
	'engine.physics',
    '1.0.0'
)
.body(function() { 'use strict';

game.World = game.Class.extend({
    gravity: null,
    solver: null,
    bodies: [],
    collisionGroups: [],

    init: function(x, y) {
        this.gravity = new game.Vector();
        this.gravity.x = typeof(x) === 'number' ? x : 0;
        this.gravity.y = typeof(y) === 'number' ? y : -980;
        this.solver = new game.CollisionSolver();
    },

    addBody: function(body) {
        body.world = this;
        this.bodies.push(body);
        if(typeof(body.collisionGroup) === 'number') {
            this.collisionGroups[body.collisionGroup] = this.collisionGroups[body.collisionGroup] || [];
            this.collisionGroups[body.collisionGroup].push(body);
        }
    },

    removeBody: function(body) {
        this.removeBodyCollision(body);
        this.bodies.erase(body);
    },

    removeBodyCollision: function(body) {
        this.collisionGroups[body.collisionGroup].erase(body);
    },

    removeCollisionGroup: function(i) {
        this.collisionGroups.erase(this.collisionGroups[i]);
    },

    collide: function(a) {
        if(!this.collisionGroups[a.collideAgainst]) return;

        var i, b;
        for (i = this.collisionGroups[a.collideAgainst].length - 1; i >= 0; i--) {
            b = this.collisionGroups[a.collideAgainst][i];
            if(a !== b) this.solver.solve(a, b);
        }
    },

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

game.CollisionSolver = game.Class.extend({
    hitTestData: [],

    solve: function(a, b) {
        this.hitTestData.length = 0;
        if(!this.hitTest(a, b)) return;
        if(!this.hitResponse(a, b)) return;
    },

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
            return (a.shape.radius + b.shape.radius > this.distance(a.position.x, a.position.y, b.position.x, b.position.y));
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
                if(d < circle.shape.radius) {
                    this.hitTestData[0] = a1x;
                    this.hitTestData[1] = a1y;
                    this.hitTestData[2] = d;
                    this.hitTestData[3] = px / d;
                    this.hitTestData[4] = py / d;
                    return true;
                }
            }
            else if(t > 1) {
                var d = this.distance(cx, cy, a2x, a2y);
                if(d < circle.shape.radius) {
                    this.hitTestData[0] = a2x;
                    this.hitTestData[1] = a2y;
                    this.hitTestData[2] = d;
                    this.hitTestData[3] = (cx - a2x) / d;
                    this.hitTestData[4] = (cy - a2y) / d;
                    return true;
                }
            }
            else {
                var d = this.distance(px, py, dx * t, dy * t);
                if(d < circle.shape.radius) {
                    this.hitTestData[0] = a1x + dx * t;
                    this.hitTestData[1] = a1y + dy * t;
                    this.hitTestData[2] = d;
                    this.hitTestData[3] = (px - dx * t) / d;
                    this.hitTestData[4] = (py - dy * t) / d;
                    return true;
                }
            }
            return false;
        }
        return false;
    },

    hitResponse: function(a, b) {
        if(a.shape instanceof game.Rectangle && b.shape instanceof game.Rectangle) {
            // 0 = up, 1 = down, 2 = left, 3 = right
            if(a.last.y + a.shape.height / 2 <= b.last.y - b.shape.height / 2) {
                if(a.collide(b, 0)) {
                    a.position.y = b.position.y - b.shape.height / 2 - a.shape.height / 2;
                }
            }
            if(a.last.y - a.shape.height / 2 >= b.last.y + b.shape.height / 2) {
                if(a.collide(b, 1)) {
                    a.position.y = b.position.y + b.shape.height / 2 + a.shape.height / 2;
                }
            }
            if(a.last.x + a.shape.width /2 <= b.last.x - b.shape.width / 2) {
                if(a.collide(b, 2)) {
                    a.position.x = b.position.x - b.shape.width / 2 - a.shape.width / 2;
                }
            }
            if(a.last.x - a.shape.width /2 >= b.last.x + b.shape.width / 2) {
                if(a.collide(b, 3)) {
                    a.position.x = b.position.x + b.shape.width / 2 + a.shape.width / 2;
                }
            }
        }
        if(a.shape instanceof game.Circle && b.shape instanceof game.Circle) {
            if(a.collide(b)) {
                var angle = Math.atan2(a.position.x - b.position.x, a.position.y - b.position.y);
                var dist = a.shape.radius + b.shape.radius;

                var aSpeed = Math.sqrt(Math.pow(a.velocity.x, 2) + Math.pow(a.velocity.y, 2));
                var bSpeed = Math.sqrt(Math.pow(b.velocity.x, 2) + Math.pow(b.velocity.y, 2));

                a.position.x = b.position.x + Math.sin(angle) * dist;
                a.position.y = b.position.y + Math.cos(angle) * dist;

                a.velocity.x = Math.sin(angle) * bSpeed;
                a.velocity.y = Math.cos(angle) * bSpeed;

                b.velocity.x = Math.sin(angle + Math.PI) * aSpeed;
                b.velocity.y = Math.cos(angle + Math.PI) * aSpeed;
            }
        }
        if(a.shape instanceof game.Rectangle && b.shape instanceof game.Circle) {
            if(a.collide(b)) {
                // collision response
                return false;
            }
        }
        if(a.shape instanceof game.Circle && b.shape instanceof game.Rectangle) {
            if(a.collide(b)) {
                // collision response
                if(a.last.x - a.shape.radius < b.last.x + b.shape.width) {
                    var angle = Math.atan2(a.position.x - a.last.x, a.position.y - a.last.y);
                    var dist = this.distance(a.last.x, a.last.y, a.position.x, a.position.y);

                    // how much to push circle forward from last position ???
                    var dist = 0;

                    a.position.x = a.last.x + Math.sin(angle) * dist;
                    a.position.y = a.last.y + Math.cos(angle) * dist;

                    a.velocity.x *= -1;
                }
            }
        }
        if(a.shape instanceof game.Line && b.shape instanceof game.Line) {
            if(a.collide(b)) {
                // collision response
                return false;
            }
        }
        if(a.shape instanceof game.Circle && b.shape instanceof game.Line) {
            if(a.collide(b)) {
                var cx = this.hitTestData[0];
                var cy = this.hitTestData[1];
                var d = this.hitTestData[2];
                var nx = this.hitTestData[3];
                var ny = this.hitTestData[4];

                var x = a.position.x - cx;
                var y = a.position.y - cy;

                a.position.x = cx + a.shape.radius * x / d;
                a.position.y = cy + a.shape.radius * y / d;

                var m = a.velocity.x * nx + a.velocity.y * ny;

                a.velocity.x -= nx * m * (1 + 1);
                a.velocity.y -= ny * m * (1 + 1);
            }
        }
        if(a.shape instanceof game.Line && b.shape instanceof game.Circle) {
            if(a.collide(b)) {
                // collision response
                return false;
            }
        }
    }
});

game.Body = game.Class.extend({
    world: null,
    shape: null,
    position: null,
    last: null,
    velocity: null,
    velocityLimit: null,
    mass: 0,
    collisionGroup: 0,
    collideAgainst: 0,
    friction: 0,
    rotation: 0,

    init: function(settings) {
        this.position = new game.Vector();
        this.velocity = new game.Vector();
        this.velocityLimit = new game.Vector(500, 500);
        this.last = new game.Vector();

        game.merge(this, settings);
    },

    addShape: function(shape) {
        this.shape = shape;
    },

    collide: function() {
        return true;
    },

    update: function() {
        this.last.copy(this.position);

        if(this.mass > 0) {
            this.velocity.multiplyAdd(this.world.gravity, game.system.tick);
            this.velocity.limit(this.velocityLimit);
        }

        this.position.multiplyAdd(this.velocity, game.scale * game.system.tick);
    }
});

game.Rectangle = game.Class.extend({
    width: 50,
    height: 50,

    init: function(width, height) {
        this.width = width || this.width * game.scale;
        this.height = height || this.height * game.scale;
    }
});

game.Circle = game.Class.extend({
    radius: 50,

    init: function(radius) {
        this.radius = radius || this.radius * game.scale;
    }
});

game.Line = game.Class.extend({
    length: 50,
    rotation: 0,

    init: function(length, rotation) {
        this.length = length || this.length * game.scale;
        this.rotation = rotation || this.rotation;
    }
});

game.Vector = game.Class.extend({
    value: null,

    init: function(x, y) {
        this.value = new Float32Array(2);
        this.x = x || 0;
        this.y = y || 0;
    },

    set: function(x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    clone: function() {
        return new game.Vector(this.x, this.y);
    },

    copy: function(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    },

    add: function(x, y) {
        this.x += x instanceof game.Vector ? x.x : x;
        this.y += x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    subtract: function(x, y) {
        this.x -= x instanceof game.Vector ? x.x : x;
        this.y -= x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    multiply: function(x, y) {
        this.x *= x instanceof game.Vector ? x.x : x;
        this.y *= x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    divide: function(x, y) {
        this.x /= x instanceof game.Vector ? x.x : x;
        this.y /= x instanceof game.Vector ? x.y : y || x;
        return this;
    },

    multiplyAdd: function(v, m) {
        this.x += v instanceof game.Vector ? v.x * m : v * m;
        this.y += v instanceof game.Vector ? v.y * m : v * m;
        return this;
    },

    distance: function(v) {
        var x = v.x - this.x;
        var y = v.y - this.y;
        return Math.sqrt(x * x + y * y);
    },

    length: function() {
        return Math.sqrt(this.dot());
    },

    dot: function(v) {
        if(v instanceof game.Vector) return this.x * v.x + this.y * v.y;
        else return this.x * this.x + this.y * this.y;
    },

    dotNormalized: function(v) {
        var len1 = this.length();
        var x1 = this.x / len1;
        var y1 = this.y / len1;

        if(v instanceof game.Vector) {
            var len2 = v.length();
            var x2 = v.x / len2;
            var y2 = v.y / len2;
            return x1 * x2 + y1 * y2;
        } else return x1 * x1 + y1 * y1;
    },

    rotate: function(angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var x = this.x * c - this.y * s;
        var y = this.y * c + this.x * s;
        this.x = x;
        this.y = y;
        return this;
    },

    normalize: function() {
        var len = this.length();
        this.x /= len;
        this.y /= len;
        return this;
    },

    limit: function(v) {
        this.x = Math.min(v.x, Math.max(-v.x, this.x));
        this.y = Math.min(v.y, Math.max(-v.y, this.y));
        return this;
    },

    angle: function(v) {
        return Math.atan2(v.y - this.y, v.x - this.x);
    },

    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
});

Object.defineProperty(game.Vector.prototype, 'x', {
    get: function() {
        return this.value[0];
    },
    set: function(value) {
        this.value[0] = value;
    }
});

Object.defineProperty(game.Vector.prototype, 'y', {
    get: function() {
        return this.value[1];
    },
    set: function(value) {
        this.value[1] = value;
    }
});

game.Vector.clone = function(v) {
    return new game.Vector(v.x, v.y);
};

game.BodySprite = game.Class.extend({
    collisionGroup: 0,
    collideAgainst: null,
    mass: 0,
    velocity: {x:0, y:0},
    color: 0xff0000,
    type: 'Circle',
    a: 50,
    b: 50,

    init: function(x, y, settings) {
        game.merge(this, settings);

        var shape = new game[this.type](this.a, this.b);

        this.body = new game.Body({
            position: {x: x, y: y},
            velocity: {x: this.velocity.x, y: this.velocity.y},
            collisionGroup: this.collisionGroup,
            collideAgainst: this.collideAgainst,
            mass: this.mass
        });
        this.body.addShape(shape);
        this.body.collide = this.collide.bind(this);

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(this.color);
        if(this.type === 'Circle') {
            this.sprite.drawCircle(0, 0, this.a);
        }
        if(this.type === 'Rectangle') {
            this.sprite.drawRect(-this.a / 2, -this.b / 2, this.a, this.b);
        }
        if(this.type === 'Line') {
            this.sprite.lineStyle(1, this.color);
            this.sprite.moveTo(-Math.sin(this.b) * (this.a / 2), -Math.cos(this.b) * (this.a / 2));
            this.sprite.lineTo(Math.sin(this.b) * (this.a / 2), Math.cos(this.b) * (this.a / 2));
        }
        this.sprite.position.x = x;
        this.sprite.position.y = y;

        game.scene.world.addBody(this.body);
    },

    collide: function() {
        return true;
    },

    update: function() {
        this.sprite.position.x = this.body.position.x;
        this.sprite.position.y = this.body.position.y;
        this.sprite.rotation = this.body.rotation;
    }
});

});
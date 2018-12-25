/**
    @module renderer.container
**/
game.module(
    'engine.renderer.container'
)
.require(
    'engine.geometry'
)
.body(function() {

/**
    @class Container
    @constructor
    @param {Object} [props]
**/
game.createClass('Container', {
    /**
        Container opacity, 0 makes it invisible.
        @property {Number} alpha
        @default 1
    **/
    alpha: 1,
    /**
        @property {Vector} anchor
    **/
    anchor: null,
    /**
        Change cursor, when mouse is over the container. Define cursor at `game.Input.buttonModeCursor`.
        @property {Boolean} buttonMode
        @default false
    **/
    buttonMode: false,
    /**
        @property {Array} children
    **/
    children: [],
    /**
        @property {Rectangle|Circle} hitArea
    **/
    hitArea: null,
    /**
        @property {Graphics} mask
    **/
    mask: null,
    /**
        @property {Vector} position
    **/
    position: null,
    /**
        @property {Boolean} renderable
        @default true
    **/
    renderable: true,
    /**
        @property {Number} rotation
        @default 0
    **/
    rotation: 0,
    /**
        @property {Vector} scale
    **/
    scale: null,
    /**
        @property {Vector} skew
    **/
    skew: null,
    /**
        @property {Container} stage
    **/
    stage: null,
    /**
        Visibility. If set to false, rendering and interactivity will be disabled.
        @property {Boolean} visible
        @default true
    **/
    visible: true,
    /**
        @property {Boolean} _cached
        @default false
        @private
    **/
    _cached: false,
    /**
        @property {Sprite} _cachedSprite
        @private
    **/
    _cachedSprite: null,
    /**
        @property {Number} _cosCache
        @default 1
        @private
    **/
    _cosCache: 1,
    /**
        @property {Boolean} _interactive
        @default false
        @private
    **/
    _interactive: false,
    /**
        @property {Number} _lastTransformUpdate
        @private
    **/
    _lastTransformUpdate: -1,
    /**
        @property {Matrix} _localTransform
        @private
    **/
    _localTransform: null,
    /**
        @property {Container} _parent
        @private
    **/
    _parent: null,
    /**
        @property {Number} _rotationCache
        @default 0
        @private
    **/
    _rotationCache: 0,
    /**
        @property {Number} _sinCache
        @default 0
        @private
    **/
    _sinCache: 0,
    /**
        @property {Number} _worldAlpha
        @default 1
        @private
    **/
    _worldAlpha: 1,
    /**
        @property {Rectangle} _worldBounds
        @private
    **/
    _worldBounds: null,
    /**
        @property {Matrix} _worldTransform
        @private
    **/
    _worldTransform: null,

    staticInit: function(props) {
        this.anchor = new game.Vector();
        this.position = new game.Vector();
        this.scale = new game.Vector(1);
        this.skew = new game.Vector();
        this._worldBounds = new game.Rectangle();
        this._worldTransform = new game.Matrix();
        this._localTransform = new game.Matrix();
        game.merge(this, props);
    },

    /**
        @method addChild
        @param {Container} child
        @chainable
    **/
    addChild: function(child) {
        if (!child) throw 'addChild: child undefined';
        child.parent = this;
        return this;
    },
    
    /**
        @method addChildAt
        @param {Container} child
        @param {Number} index
        @chainable
    **/
    addChildAt: function(child, index) {
        if (!child) throw 'addChildAt: child undefined';
        this.addChild(child);
        if (index >= 0 && index < this.children.length - 1) {
            this.children.splice(this.children.indexOf(child));
            this.children.splice(index, 0, child);
        }
        return this;
    },

    /**
        Add this to container.
        @method addTo
        @param {Container} container
        @param {Number} [index]
        @chainable
    **/
    addTo: function(container, index) {
        if (!container) throw 'addTo: child undefined';
        container.addChildAt(this, index);
        return this;
    },

    /**
        @method anchorCenter
        @chainable
    **/
    anchorCenter: function() {
        var width = this.width / this.scale.x;
        var height = this.height / this.scale.y;
        this.anchor.set(width / 2, height / 2);
        return this;
    },

    /**
        Position container to center of target.
        @method center
        @param {Container} target
        @param {Number} [offsetX]
        @param {Number} [offsetY]
        @param {Boolean} [worldPos] Use world position.
        @chainable
    **/
    center: function(target, offsetX, offsetY, worldPos) {
        if (!target) target = this.parent;
        if (!target) throw 'center: target undefined';

        if (target === game.scene.stage) {
            var x = game.width / 2;
            var y = game.height / 2;
            x += this.anchor.x * this.scale.x;
            y += this.anchor.y * this.scale.y;
        }
        else {
            target.updateTransform();
            var tb = target._getBounds();
            if (worldPos) {
                var x = tb.x + tb.width / 2;
                var y = tb.y + tb.height / 2;
            }
            else {
                var x = -target.anchor.x + tb.width / target.scale.x / 2;
                var y = -target.anchor.y + tb.height / target.scale.y / 2;
            }
            x += this.anchor.x * this.scale.x;
            y += this.anchor.y * this.scale.y;
        }
        var bounds = this._getBounds();
        x -= bounds.width * this.scale.x / 2;
        y -= bounds.height * this.scale.y / 2;
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        this.position.set(x + offsetX, y + offsetY);
        return this;
    },

    /**
        @method click
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
    **/
    click: function() {},

    /**
        Hit test container's hitArea against target's hitArea or target vector.
        @method hitTest
        @param {Container|Vector} target
        @return {Boolean}
    **/
    hitTest: function(target) {
        if (!target) throw 'hitTest: target undefined';

        var aBounds = this._getBounds();
        var aHitArea = this.hitArea;

        if (target instanceof game.Vector) {
            var x = aBounds.x + this.anchor.x + aHitArea.x;
            var y = aBounds.y + this.anchor.y + aHitArea.y;
            if (aHitArea.width) {
                // Rectangle
                return (
                    target.x >= x &&
                    target.x <= x + aHitArea.width &&
                    target.y >= y &&
                    target.y <= y + aHitArea.height
                );
            }
            else {
                // Circle
                var tx = x - target.x;
                var ty = y - target.y;
                var dist = Math.sqrt(tx * tx + ty * ty);
                return (aHitArea.radius > dist);
            }
        }

        var bBounds = target._getBounds();
        var bHitArea = target.hitArea;
        
        if (aHitArea.width && bHitArea.width) {
            // Rectangle vs Rectangle
            var x1 = aBounds.x + this.anchor.x + aHitArea.x + aHitArea.width / 2;
            var y1 = aBounds.y + this.anchor.y + aHitArea.y + aHitArea.height / 2;
            var x2 = bBounds.x + target.anchor.x + bHitArea.x + bHitArea.width / 2;
            var y2 = bBounds.y + target.anchor.y + bHitArea.y + bHitArea.height / 2;
            
            return !(
                y1 + aHitArea.height / 2 <= y2 - bHitArea.height / 2 ||
                y1 - aHitArea.height / 2 >= y2 + bHitArea.height / 2 ||
                x1 - aHitArea.width / 2 >= x2 + bHitArea.width / 2 ||
                x1 + aHitArea.width / 2 <= x2 - bHitArea.width / 2
            );
        }
        else if (aHitArea.radius && bHitArea.radius) {
            // Circle vs Circle
            var x1 = aBounds.x + this.anchor.x + aHitArea.x;
            var y1 = aBounds.y + this.anchor.y + aHitArea.y;
            var x2 = bBounds.x + target.anchor.x + bHitArea.x;
            var y2 = bBounds.y + target.anchor.y + bHitArea.y;
            var x = x1 - x2;
            var y = y1 - y2;
            var dist = Math.sqrt(x * x + y * y);
            return (aHitArea.radius + bHitArea.radius > dist);
        }
        else if (aHitArea.width && bHitArea.radius) {
            // Rectangle vs Circle
        }
        else if (aHitArea.radius && bHitArea.width) {
            // Circle vs Rectangle
        }
    },

    /**
        @method mousedown
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
        @return {Boolean} Return true, to skip to next object.
    **/
    mousedown: function() {},

    /**
        @method mousemove
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
        @return {Boolean} Return true, to skip to next object.
    **/
    mousemove: function() {},

    /**
        @method mouseout
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
    **/
    mouseout: function() {},

    /**
        @method mouseover
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
    **/
    mouseover: function() {},

    /**
        @method mouseup
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
        @return {Boolean} Return true, to skip to next object.
    **/
    mouseup: function() {},

    /**
        @method mouseupoutside
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {InputEvent} event
    **/
    mouseupoutside: function() {},

    /**
        Check if container is on the screen.
        @method onScreen
        @return {Boolean} Return true, if on the screen.
    **/
    onScreen: function() {
        var bounds = this._getBounds();
        if (bounds.x + bounds.width < 0) return false;
        if (bounds.x > game.width) return false;
        if (bounds.y + bounds.height < 0) return false;
        if (bounds.y > game.height) return false;
        return true;
    },

    /**
        Remove this from it's parent.
        @method remove
        @chainable
    **/
    remove: function() {
        if (this.parent) this.parent.removeChild(this);
        return this;
    },

    /**
        Remove all childrens.
        @method removeAll
        @chainable
    **/
    removeAll: function() {
        for (var i = this.children.length - 1; i >= 0; i--) {
            this.children[i].remove();
        }
        return this;
    },

    /**
        Remove children.
        @method removeChild
        @param {Container} child
        @chainable
    **/
    removeChild: function(child) {
        if (!child) throw 'removeChild: child undefined';
        var index = this.children.indexOf(child);
        if (index === -1) return;
        this.children.splice(index, 1);
        child._parent = null;
        if (this.stage) child._removeStageReference();
        if (this._cached) {
            this._destroyCachedSprite();
            this._generateCachedSprite();
        }
        return this;
    },

    /**
        Swap container drawing position with this container.
        @method swap
        @param {Container} container
        @chainable
    **/
    swap: function(container) {
        if (!container) throw 'swap: container undefined';
        if (!this.parent) return;
        this.parent.swapChildren(this, container);
        return this;
    },

    /**
        Swap drawing position of two childrens.
        @method swapChildren
        @param {Container} child
        @param {Container} child2
    **/
    swapChildren: function(child, child2) {
        if (child === child2) return;

        var index1 = this.children.indexOf(child);
        var index2 = this.children.indexOf(child2);

        if (index1 < 0 || index2 < 0) return;

        this.children[index1] = child2;
        this.children[index2] = child;
    },
    
    /**
        Move container to first children.
        @method toBottom
    **/
    toBottom: function() {
        if (!this.parent) return;
        var parent = this.parent;
        this.remove();
        this.addTo(parent, 0);
    },
    
    /**
        Move container to last children.
        @method toTop
    **/
    toTop: function() {
        if (!this.parent) return;
        var parent = this.parent;
        this.remove();
        this.addTo(parent);
    },

    /**
        Get current world position
        @method toWorldPosition
        @param {Vector} [vector] Vector to set world position
        @param {Boolean} [local] Convert world position to local position
        @return {Vector} Returns new Vector, if vector parameter not defined
    **/
    toWorldPosition: function(vector, local) {
        if (this._lastTransformUpdate !== game.Timer.time) this._updateParentTransform();

        var x = local ? -this.parent._worldTransform.tx + this.position.x : this._worldTransform.tx;
        var y = local ? -this.parent._worldTransform.ty + this.position.y : this._worldTransform.ty;

        if (!local) {
            x += this.anchor.x;
            y += this.anchor.y;
        }

        if (vector) vector.set(x, y);
        else return new game.Vector(x, y);
    },

    /**
        @method updateTransform
    **/
    updateTransform: function() {
        if (!this.parent) return this._updateChildTransform();
        
        var pt = this.parent._worldTransform;
        var lt = this._localTransform;
        var wt = this._worldTransform;
        
        if (this._rotationCache !== this.rotation) {
            this._rotationCache = this.rotation;
            this._sinCache = Math.sin(this.rotation);
            this._cosCache = Math.cos(this.rotation);
        }

        var ax = this.anchor.x;
        var ay = this.anchor.y;

        lt.a = this._cosCache * this.scale.x;
        lt.b = this._sinCache * this.scale.x;
        lt.c = -this._sinCache * this.scale.y;
        lt.d = this._cosCache * this.scale.y;
        lt.tx = this.position.x - (ax * lt.a + ay * lt.c);
        lt.ty = this.position.y - (ax * lt.b + ay * lt.d);

        if (this.parent.texture) {
            var pax = this.parent.anchor.x;
            var pay = this.parent.anchor.y;
            lt.tx += pax;
            lt.ty += pay;
        }

        wt.a = lt.a * pt.a + lt.b * pt.c;
        wt.b = lt.a * pt.b + lt.b * pt.d;
        wt.c = lt.c * pt.a + lt.d * pt.c;
        wt.d = lt.c * pt.b + lt.d * pt.d;
        wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx;
        wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty;

        wt.c += this.skew.x * wt.a;
        wt.d += this.skew.x * wt.b;
        wt.a += this.skew.y * wt.c;
        wt.b += this.skew.y * wt.d;

        this._worldAlpha = this.parent._worldAlpha * this.alpha;

        this._lastTransformUpdate = game.Timer.time;

        if (this._cachedSprite) this._cachedSprite._worldAlpha = this._worldAlpha;
        else this._updateChildTransform();
    },

    /**
        @method _destroyCachedSprite
        @private
    **/
    _destroyCachedSprite: function() {
        if (this._cachedSprite) this._cachedSprite.texture.remove();
        this._cachedSprite = null;
    },

    /**
        @method _generateCachedSprite
        @private
    **/
    _generateCachedSprite: function() {
        this.updateTransform();

        var canvas = game.Container._canvas;
        var context = game.Container._context;
        var bounds = this._getBounds();

        canvas.width = (bounds.width / this.scale.x) * game.scale;
        canvas.height = (bounds.height / this.scale.y) * game.scale;

        this._worldTransform.reset();
        this._updateChildTransform();
        
        this._renderCanvas(context);
        this._renderChildren(context);

        var texture = game.Texture.fromCanvas(canvas);
        var sprite = new game.Sprite(texture);
        sprite._parent = this;
        
        this._cachedSprite = sprite;
    },

    /**
        @method _getBounds
        @private
        @return {Rectangle} _worldBounds
    **/
    _getBounds: function() {
        if (!this.children.length) {
            this._worldBounds.x = this._worldTransform.tx;
            this._worldBounds.y = this._worldTransform.ty;
            this._worldBounds.width = 0;
            this._worldBounds.height = 0;
            return this._worldBounds;
        }

        if (this._cachedSprite) {
            if (this.rotation) {
                var width = this._cachedSprite.texture.width;
                var height = this._cachedSprite.texture.height;
                var wt = this._worldTransform;
                var a = wt.a;
                var b = wt.b;
                var c = wt.c;
                var d = wt.d;
                var tx = wt.tx;
                var ty = wt.ty;
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
            }
            this._worldBounds.x = this._worldTransform.tx + this._cachedSprite.position.x;
            this._worldBounds.y = this._worldTransform.ty + this._cachedSprite.position.y;
            this._worldBounds.width = this._cachedSprite.texture.width * this._worldTransform.a;
            this._worldBounds.height = this._cachedSprite.texture.height * this._worldTransform.d;
            return this._worldBounds;
        }

        if (this._lastTransformUpdate < game.Timer._lastFrameTime) this.updateTransform();

        var minX = this._worldTransform.tx;
        var minY = this._worldTransform.ty;
        var maxX = this._worldTransform.tx;
        var maxY = this._worldTransform.ty;

        if (this.mask) {
            var maskBounds = this.mask._getBounds();
            minX = maskBounds.x;
            minY = maskBounds.y;
            maxX = minX + maskBounds.width;
            maxY = minY + maskBounds.height;
        }
        else {
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                var childBounds = child._getBounds(child._localTransform);
                var childMinX = this._worldTransform.tx + childBounds.x;
                var childMinY = this._worldTransform.ty + childBounds.y;
                var childMaxX = childMinX + childBounds.width;
                var childMaxY = childMinY + childBounds.height;
                if (childMinX < minX) minX = childMinX;
                if (childMinY < minY) minY = childMinY;
                if (childMaxX > maxX) maxX = childMaxX;
                if (childMaxY > maxY) maxY = childMaxY;
            }
        }

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this._worldBounds.width = (maxX - minX) * Math.abs(this.scale.x);
        this._worldBounds.height = (maxY - minY) * Math.abs(this.scale.y);
        return this._worldBounds;
    },

    /**
        @method _removeStageReference
        @private
    **/
    _removeStageReference: function() {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child._removeStageReference();
        }

        if (this._interactive) game.input._needUpdate = true;
        this.stage = null;
    },

    /**
        @method _render
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _render: function(context) {
        if (this.mask && this.mask._renderMask) this.mask._renderMask(context, this._worldTransform);

        if (this._cachedSprite) {
            this._cachedSprite._renderCanvas(context, this._worldTransform);
        }
        else {
            this._renderCanvas(context);
            this._renderChildren(context);
        }

        if (this.mask && this.mask._renderMask) context.restore();
    },

    /**
        @method _renderCanvas
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _renderCanvas: function(context) {
    },

    /**
        @method _renderChildren
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _renderChildren: function(context) {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (!child.visible || child.alpha <= 0 || !child.renderable) continue;
            child._render(context);
        }
    },

    /**
        @method _setStageReference
        @param {Container} stage
        @private
    **/
    _setStageReference: function(stage) {
        this.stage = stage;
        if (this._interactive) game.input._needUpdate = true;

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child._setStageReference(stage);
        }
    },

    /**
        @method _updateChildTransform
        @private
    **/
    _updateChildTransform: function() {
        for (var i = this.children.length - 1; i >= 0; i--) {
            var child = this.children[i];
            if (!child.visible) continue;
            child.updateTransform();
        }
    },

    /**
        @method _updateParentTransform
        @private
    **/
    _updateParentTransform: function() {
        if (this.parent) this.parent._updateParentTransform();
        else this.updateTransform();
    }
});

game.addAttributes('Container', {
    /**
        @attribute {HTMLCanvasElement} _canvas
        @private
    **/
    _canvas: null,
    /**
        @attribute {CanvasRenderingContext2D} _context
        @private
    **/
    _context: null
});

game.Container._canvas = document.createElement('canvas');
game.Container._context = game.Container._canvas.getContext('2d');

game.defineProperties('Container', {
    /**
        Cache container content as bitmap.
        @property {Boolean} cache
        @default false
    **/
    cache: {
        get: function() {
            return this._cached;
        },

        set: function(value) {
            if (this._cached === value) return;

            if (value) this._generateCachedSprite();
            else this._destroyCachedSprite();

            this._cached = value;
        }
    },

    /**
        @property {Number} height
    **/
    height: {
        get: function() {
            return this._getBounds().height;
        },

        set: function(value) {
            this.scale.y = value / this.height;
        }
    },

    /**
        @property {Boolean} interactive
        @default false
    **/
    interactive: {
        get: function() {
            return this._interactive;
        },

        set: function(value) {
            if (this._interactive === value) return;
            this._interactive = value;
            if (this.stage) game.input._needUpdate = true;
        }
    },

    /**
        @property {Container} parent
    **/
    parent: {
        get: function() {
            return this._parent;
        },

        set: function(value) {
            var index = value.children.indexOf(this);
            if (index !== -1) return;
            if (this.parent) this.remove();
            value.children.push(this);
            this._parent = value;
            if (value.stage) this._setStageReference(value.stage);
            if (value._cached) {
                value._destroyCachedSprite();
                value._generateCachedSprite();
            }
        }
    },

    /**
        @property {Number} width
    **/
    width: {
        get: function() {
            return this._getBounds().width;
        },

        set: function(value) {
            this.scale.x = value / this.width;
        }
    },

    /**
        Shorthand for `position.x`
        @property {Number} x
    **/
    x: {
        get: function() {
            return this.position.x;
        },

        set: function(value) {
            this.position.x = value;
        }
    },

    /**
        Shorthand for `position.y`
        @property {Number} y
    **/
    y: {
        get: function() {
            return this.position.y;
        },

        set: function(value) {
            this.position.y = value;
        }
    }
});

});

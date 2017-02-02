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
        @property {Rectangle} hitArea
    **/
    hitArea: null,
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
        @property {Graphics} _mask
        @private
    **/
    _mask: null,
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
        game.merge(this, props);
    },

    /**
        @method addChild
        @param {Container} child
        @chainable
    **/
    addChild: function(child) {
        child.parent = this;
        return this;
    },

    /**
        Add this to container.
        @method addTo
        @param {Container} container
        @chainable
    **/
    addTo: function(container) {
        this.parent = container;
        return this;
    },

    /**
        @method anchorCenter
        @chainable
    **/
    anchorCenter: function() {
        this.anchor.set(this.width / this.scale.x / 2, this.height / this.scale.y / 2);
        return this;
    },

    /**
        Position container to center of target.
        @method center
        @param {Container} target
        @param {Number} [offsetX]
        @param {Number} [offsetY]
        @chainable
    **/
    center: function(target, offsetX, offsetY) {
        if (!target) target = this.parent;
        if (!target) return;

        if (target === game.scene.stage) {
            var x = game.width / 2;
            var y = game.height / 2;
        }
        else {
            var tb = target._getBounds();
            var x = tb.x + tb.width / 2;
            var y = tb.y + tb.height / 2;
        }
        var bounds = this._getBounds();
        x += this.anchor.x * this.scale.x;
        y += this.anchor.y * this.scale.y;
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
        @param {MouseEvent|TouchEvent} event
    **/
    click: function() {},

    /**
        @method mousedown
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @return {Boolean} return true, to skip to next object.
    **/
    mousedown: function() {},

    /**
        @method mousemove
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @return {Boolean} return true, to skip to next object.
    **/
    mousemove: function() {},

    /**
        @method mouseout
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    mouseout: function() {},

    /**
        @method mouseup
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @return {Boolean} return true, to skip to next object.
    **/
    mouseup: function() {},

    /**
        @method mouseupoutside
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    mouseupoutside: function() {},

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
        Swap container position with this container.
        @method swap
        @param {Container} container
        @chainable
    **/
    swap: function(container) {
        if (!this.parent) return;
        this.parent.swapChildren(this, container);
        return this;
    },

    /**
        Swap position of two childrens.
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
        @method updateTransform
    **/
    updateTransform: function() {
        if (!this.parent) return this._updateChildTransform();
        
        var pt = this.parent._worldTransform;
        var wt = this._worldTransform;
        
        if (this._rotationCache !== this.rotation) {
            this._rotationCache = this.rotation;
            this._sinCache = Math.sin(this.rotation);
            this._cosCache = Math.cos(this.rotation);
        }

        var ax = this.anchor.x;
        var ay = this.anchor.y;
        var a = this._cosCache * this.scale.x;
        var b = this._sinCache * this.scale.x;
        var c = -this._sinCache * this.scale.y;
        var d = this._cosCache * this.scale.y;
        var tx = this.position.x - (ax * a + ay * c);
        var ty = this.position.y - (ax * b + ay * d);

        wt.a = a * pt.a + b * pt.c;
        wt.b = a * pt.b + b * pt.d;
        wt.c = c * pt.a + d * pt.c;
        wt.d = c * pt.b + d * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

        wt.c += this.skew.x * wt.a;
        wt.d += this.skew.x * wt.b;
        wt.a += this.skew.y * wt.c;
        wt.b += this.skew.y * wt.d;

        this._worldAlpha = this.parent._worldAlpha * this.alpha;

        if (this._mask) this._mask.updateTransform();

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

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var bounds = this._getBounds();

        canvas.width = (bounds.width / this.scale.x) * game.scale;
        canvas.height = (bounds.height / this.scale.y) * game.scale;

        this._worldTransform.reset();
        this._updateChildTransform();
        
        this._renderCanvas(context);
        this._renderChildren(context);

        var texture = game.Texture.fromCanvas(canvas);
        var sprite = new game.Sprite(texture);

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

        var minX = this._worldTransform.tx;
        var minY = this._worldTransform.ty;
        var maxX = this._worldTransform.tx;
        var maxY = this._worldTransform.ty;

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var childBounds = child._getBounds();
            var childMaxX = childBounds.x + childBounds.width;
            var childMaxY = childBounds.y + childBounds.height;
            if (childBounds.x < minX) minX = childBounds.x;
            if (childBounds.y < minY) minY = childBounds.y;
            if (childMaxX > maxX) maxX = childMaxX;
            if (childMaxY > maxY) maxY = childMaxY;
        }

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this._worldBounds.width = maxX - minX;
        this._worldBounds.height = maxY - minY;
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
        if (this._mask) this._mask._renderMask(context);

        if (this._cachedSprite) {
            this._cachedSprite._renderCanvas(context, this._worldTransform);
        }
        else {
            this._renderCanvas(context);
            this._renderChildren(context);
        }

        if (this._mask) context.restore();
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
            if (!child.visible || child.alpha <= 0) continue;
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
        @property {Graphics} mask
    **/
    mask: {
        get: function() {
            return this._mask;
        },

        set: function(value) {
            if (this._mask === value) return;
            this._mask = value;
            if (value) this._mask.parent = this;
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
        Shorthand for `position.x`.
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
        Shorthand for `position.y`.
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

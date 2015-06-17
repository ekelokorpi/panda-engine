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
**/
game.createClass('Container', {
    /**
        @property {Number} alpha
        @default 1
    **/
    alpha: 1,
    /**
        @property {Vector} anchor
    **/
    anchor: null,
    /**
        @property {Array} children
    **/
    children: [],
    /**
        @property {Rectangle} hitArea
    **/
    hitArea: null,
    /**
        @property {Boolean} interactive
        @default false
    **/
    interactive: false,
    /**
        @property {Container} parent
    **/
    parent: null,
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
        @property {Boolean} _cacheAsBitmap
        @default false
        @private
    **/
    _cacheAsBitmap: false,
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

    staticInit: function() {
        this.anchor = new game.Vector();
        this.position = new game.Vector();
        this.scale = new game.Vector(1, 1);
        this.skew = new game.Vector();
        this._worldBounds = new game.Rectangle();
        this._worldTransform = new game.Matrix();
    },

    /**
        Add container to this.
        @method addChild
        @param {Container} child
        @chainable
    **/
    addChild: function(child) {
        var index = this.children.indexOf(child);
        if (index !== -1) return;
        if (child.parent) child.remove();
        this.children.push(child);
        child.parent = this;
        if (this.stage) child._setStageReference(this.stage);
        return this;
    },

    /**
        Add this to container.
        @method addTo
        @param {Container} container
        @chainable
    **/
    addTo: function(container) {
        container.addChild(this);
        return this;
    },

    /**
        Set anchor to center.
        @method anchorCenter
        @chainable
    **/
    anchorCenter: function() {
        this.anchor.set(this.width / 2, this.height / 2);
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
            var bounds = target._getBounds();
            var x = bounds.x + bounds.width / 2;
            var y = bounds.y + bounds.height / 2;
        }
        x += this.anchor.x * this.scale.x;
        y += this.anchor.y * this.scale.y;
        x -= this.width * this.scale.x / 2;
        y -= this.height * this.scale.y / 2;
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
    mousedown: function() {
        return true;
    },

    /**
        @method mousemove
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @return {Boolean} return true, to skip to next object.
    **/
    mousemove: function() {
        return true;
    },

    /**
        @method mouseout
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    mouseout: function() {
        return true;
    },

    /**
        @method mouseup
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @return {Boolean} return true, to skip to next object.
    **/
    mouseup: function() {
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
        var index = this.children.indexOf(child);
        if (index === -1) return;
        this.children.splice(index, 1);
        child.parent = null;
        if (this.stage) child._removeStageReference();
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
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        canvas.width = this.width * game.scale;
        canvas.height = this.height * game.scale;

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
        if (this._worldTransform.tx === null) this._updateParentTransform();

        if (this._cachedSprite) {
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
        this.updateTransform();

        if (this.mask) this._renderMask(context);

        if (this._cachedSprite) this._renderCachedSprite(context);
        else {
            this._renderCanvas(context);
            this._renderChildren(context);
        }

        if (this.mask) context.restore();
    },

    /**
        @method _renderCachedSprite
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _renderCachedSprite: function(context) {
        context.globalAlpha = this._worldAlpha;

        var t = this._cachedSprite.texture;
        var wt = this._worldTransform;
        var tx = wt.tx * game.scale;
        var ty = wt.ty * game.scale;
        var width = t.width * game.scale;
        var height = t.height * game.scale;
        
        if (game.Renderer.roundPixels) {
            tx = tx | 0;
            ty = ty | 0;
        }

        context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);
        context.drawImage(t.baseTexture.source, t.position.x, t.position.y, width, height, 0, 0, width, height);
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
        @method _renderMask
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _renderMask: function(context) {
        context.save();
        context.rect(this.mask.x, this.mask.y, this.mask.width, this.mask.height);
        context.clip();
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
        @property {Boolean} cacheAsBitmap
        @default false
    **/
    cacheAsBitmap: {
        get: function() {
            return this._cacheAsBitmap;
        },

        set: function(value) {
            if (this._cacheAsBitmap === value) return;

            if (value) this._generateCachedSprite();
            else this._destroyCachedSprite();

            this._cacheAsBitmap = value;
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
        Shorthand for x position.
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
        Shorthand for y position.
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

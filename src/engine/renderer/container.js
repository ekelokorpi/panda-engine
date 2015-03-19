/**
    @module renderer.container
**/
game.module(
	'engine.renderer.container'
)
.body(function() {
'use strict';

game.createClass('Matrix', {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: null,
    ty: null
});

/**
    @class Container
**/
game.createClass('Container', {
    /**
        @property {Number} alpha
        @default 1
    **/
    alpha: 1,
    children: [],
    parent: null,
    rotation: 0,
    visible: true,
    width: 0,
    height: 0,
    _worldAlpha: 1,

    init: function() {
        this.position = new game.Vector();
        this.scale = new game.Vector(1, 1);
        this.anchor = new game.Vector();
        this._worldTransform = new game.Matrix();
        this._worldBounds = new game.Rectangle();
    },

    addChild: function(child) {
        var index = this.children.indexOf(child);
        if (index !== -1) return;
        if (child.parent) child.remove();
        this.children.push(child);
        child.parent = this;
        this._updateTransform();
        this._updateBounds();
        return this;
    },

    addTo: function(container) {
        container.addChild(this);
        return this;
    },

    removeChild: function(child) {
        var index = this.children.indexOf(child);
        if (index === -1) return;
        this.children.splice(index, 1);
        child.parent = null;
        return this;
    },

    removeAll: function() {
        for (var i = this.children.length - 1; i >= 0; i--) {
            this.removeChild(this.children[i]);
        }
        return this;
    },

    remove: function() {
        if (this.parent) this.parent.removeChild(this);
        return this;
    },

    center: function(parent, offsetX, offsetY) {
        if (!parent) return;
        if (!parent.parent) {
            // Stage
            var x = game.system.width / 2;
            var y = game.system.height / 2;
        }
        else {
            var x = parent._worldBounds.x + parent._worldBounds.width / 2;
            var y = parent._worldBounds.y + parent._worldBounds.height / 2;
        }
        x += this.anchor.x * this.scale.x;
        y += this.anchor.y * this.scale.y;
        x -= this.width * this.scale.x / 2;
        y -= this.height * this.scale.y / 2;
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        this.position.set(x + offsetX, y + offsetY);
    },

    _updateTransform: function() {
        if (!this.parent) return this._updateChildrenTransform();

        var pt = this.parent._worldTransform;
        var wt = this._worldTransform;

        if (this.rotation % Math.PI * 2) {
            if (this.rotation !== this._rotationCache) {
                this._rotationCache = this.rotation;
                this._sr = Math.sin(this.rotation);
                this._cr = Math.cos(this.rotation);
            }

            var a = this._cr * this.scale.x;
            var b = this._sr * this.scale.x;
            var c = -this._sr * this.scale.y;
            var d = this._cr * this.scale.y;
            var tx = this.position.x - (this.anchor.x * a + this.anchor.y * c) + this.parent.anchor.x;
            var ty = this.position.y - (this.anchor.x * b + this.anchor.y * d) + this.parent.anchor.y;

            var new_a = a * pt.a + b * pt.c;
            var new_b = a * pt.b + b * pt.d;
            var new_c = c * pt.a + d * pt.c;
            var new_d = c * pt.b + d * pt.d;
            var new_tx = tx * pt.a + ty * pt.c + pt.tx;
            var new_ty = tx * pt.b + ty * pt.d + pt.ty;
        }
        else {
            var a = this.scale.x;
            var d = this.scale.y;
            var tx = this.position.x - this.anchor.x * a + this.parent.anchor.x;
            var ty = this.position.y - this.anchor.y * a + this.parent.anchor.y;

            var new_a = a * pt.a;
            var new_b = a * pt.b;
            var new_c = d * pt.c;
            var new_d = d * pt.d;
            var new_tx = tx * pt.a + ty * pt.c + pt.tx;
            var new_ty = tx * pt.b + ty * pt.d + pt.ty;
        }

        if (wt.a !== new_a ||
            wt.b !== new_b ||
            wt.c !== new_c ||
            wt.d !== new_d ||
            wt.tx !== new_tx ||
            wt.ty !== new_ty) {
            this._setTransformChanged();
        }

        wt.a = new_a;
        wt.b = new_b;
        wt.c = new_c;
        wt.d = new_d;
        wt.tx = new_tx;
        wt.ty = new_ty;

        this._worldAlpha = this.parent._worldAlpha * this.alpha;

        this._updateChildrenTransform();
    },

    _updateBounds: function() {
        if (!game.Renderer.updateBounds) return;
        if (!this.parent) {
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                child._updateBounds();
            }
            return;
        }
        if (!this._transformChanged) return this._worldBounds;
        this._transformChanged = false;

        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var childBounds = child._updateBounds();
            var childMaxX = childBounds.x + childBounds.width;
            var childMaxY = childBounds.y + childBounds.height;
            if (childBounds.x < minX) minX = childBounds.x;
            if (childBounds.y < minY) minY = childBounds.y;
            if (childMaxX > maxX) maxX = childMaxX;
            if (childMaxY > maxY) maxY = childMaxY;
        }

        this._worldBounds.x = minX;
        this._worldBounds.y = minY;
        this.width = this._worldBounds.width = maxX - minX;
        this.height = this._worldBounds.height = maxY - minY;
        return this._worldBounds;
    },

    _setTransformChanged: function() {
        this._transformChanged = true;
        if (this.parent) this.parent._setTransformChanged();
    },

    _updateChildrenTransform: function() {
        for (var i = this.children.length - 1; i >= 0; i--) {
            var child = this.children[i];
            if (!child.visible || child.alpha <= 0) continue;
            child._updateTransform();
        }
    },

    _render: function(context) {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (!child.visible || child.alpha <= 0) continue;
            child._render(context);
        }
    }
});

});

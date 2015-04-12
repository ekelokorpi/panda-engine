/**
    @module renderer.container
**/
game.module(
    'engine.renderer.container'
)
.require(
    'engine.renderer.geom.shapes'
)
.body(function() {
'use strict';

/**
    @class Container
**/
game.createClass('Container', {
    anchor: null,
    alpha: 1,
    children: [],
    interactive: false,
    parent: null,
    position: null,
    renderable: true,
    rotation: 0,
    scale: null,
    stage: null,
    visible: true,
    _cacheAsBitmap: false,
    _cachedSprite: null,
    _cosCache: 1,
    _interactive: false,
    _interactiveChildren: false,
    _rotationCache: 0,
    _sinCache: 0,
    _worldAlpha: 1,
    _worldBounds: null,
    _worldTransform: null,

    staticInit: function() {
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
        if (this.stage) child._setStageReference(this.stage);
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
        if (this.stage) child._removeStageReference();
        return this;
    },

    removeAll: function() {
        for (var i = this.children.length - 1; i >= 0; i--) {
            this.children[i].remove();
        }
        return this;
    },

    remove: function() {
        if (this.parent) this.parent.removeChild(this);
        return this;
    },

    center: function(container, offsetX, offsetY) {
        if (!container) return;

        if (container === this.stage) {
            var x = game.system.width / 2;
            var y = game.system.height / 2;
        }
        else {
            var bounds = container._getBounds();
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

    anchorCenter: function() {
        this.anchor.set(this.width / 2, this.height / 2);
        return this;
    },

    mousedown: function() {},
    mousemove: function() {},
    mouseup: function() {},
    click: function() {},

    updateTransform: function() {
        if (!this.parent) return this.updateChildTransform();
        
        var pt = this.parent._worldTransform;
        var wt = this._worldTransform;
        
        if (this._rotationCache !== this.rotation) {
            this._rotationCache = this.rotation;
            this._sinCache = Math.sin(this.rotation);
            this._cosCache = Math.cos(this.rotation);
        }

        var a = this._cosCache * this.scale.x;
        var b = this._sinCache * this.scale.x;
        var c = -this._sinCache * this.scale.y;
        var d = this._cosCache * this.scale.y;
        var tx = this.position.x - (this.anchor.x * a + this.anchor.y * c);
        var ty = this.position.y - (this.anchor.x * b + this.anchor.y * d);

        wt.a = a * pt.a + b * pt.c;
        wt.b = a * pt.b + b * pt.d;
        wt.c = c * pt.a + d * pt.c;
        wt.d = c * pt.b + d * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

        this._worldAlpha = this.parent._worldAlpha * this.alpha;

        if (this._cacheAsBitmap) return;

        this.updateChildTransform();
    },

    updateParentTransform: function() {
        if (this.parent) this.parent.updateParentTransform();
        else this.updateTransform();
    },

    updateChildTransform: function() {
        for (var i = this.children.length - 1; i >= 0; i--) {
            var child = this.children[i];
            if (!child.visible || child.alpha <= 0) continue;
            child.updateTransform();
        }
    },

    _setStageReference: function(stage) {
        this.stage = stage;
        if (this._interactive) game.input._needUpdate = true;

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child._setStageReference(stage);
        }
    },

    _removeStageReference: function() {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child._removeStageReference();
        }

        if (this._interactive) game.input._needUpdate = true;
        this.stage = null;
    },

    _getBounds: function() {
        if (!this.children.length) return game.Container.emptyBounds;
        if (this._worldTransform.tx === null) this.updateParentTransform();

        if (this._cachedSprite) {
            this._worldBounds.x = this._worldTransform.tx + this._cachedSprite.position.x;
            this._worldBounds.y = this._worldTransform.ty + this._cachedSprite.position.y;
            this._worldBounds.width = this._cachedSprite.texture.width;
            this._worldBounds.height = this._cachedSprite.texture.height;
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

    _render: function(context) {
        if (this._cachedSprite) {
            context.globalAlpha = this._worldAlpha;

            var t = this._cachedSprite.texture;
            var wt = this._worldTransform;
            var tx = wt.tx;
            var ty = wt.ty;
            
            if (game.Renderer.roundPixels) {
                tx = tx | 0;
                ty = ty | 0;
            }

            context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);
            context.drawImage(t.baseTexture.source, t.position.x, t.position.y, t.width, t.height, 0, 0, t.width, t.height);
            return;
        }

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (!child.visible || child.alpha <= 0 || !child.renderable) continue;
            child._render(context);
        }
    },

    _generateCachedSprite: function() {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        canvas.width = this.width;
        canvas.height = this.height;

        this._worldTransform.reset();
        this.updateChildTransform();

        this._render(context);

        var texture = game.Texture.fromCanvas(canvas);
        var sprite = new game.Sprite(texture);

        this._cachedSprite = sprite;
    }
});

game.addAttributes('Container', {
    emptyBounds: new game.Rectangle()
});

game.defineProperties('Container', {
    /**
        @property {Number} width
    **/
    width: {
        get: function() {
            return this.scale.x * this._getBounds().width;
        }
    },
    height: {
        get: function() {
            return this.scale.y * this._getBounds().height;
        }
    },
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
    }
});

});

/**
    @module renderer.texture
**/
game.module(
    'engine.renderer.texture'
)
.body(function() {
'use strict';

/**
    @class Texture
    @constructor
    @param {BaseTexture|String} baseTexture
    @param {Number} [x]
    @param {Number} [y]
    @param {Number} [width]
    @param {Number} [height]
**/
game.createClass('Texture', {
    /**
        @property {Number} width
    **/
    width: 0,
    /**
        @property {Number} height
    **/
    height: 0,
    /**
        @property {BaseTexture} baseTexture
    **/
    baseTexture: null,
    /**
        @property {Vector} position
    **/
    position: null,
    /**
        @property {Object} _uvs
        @private
    **/
    _uvs: {
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        x3: 0,
        y3: 0
    },

    init: function(baseTexture, x, y, width, height) {
        this.baseTexture = baseTexture instanceof game.BaseTexture ? baseTexture : game.BaseTexture.fromAsset(baseTexture);
        this.position = new game.Vector(x, y);
        this.width = width || this.baseTexture.width;
        this.height = height || this.baseTexture.height;

        if (game.renderer.webGL) this._updateUvs();
    },

    _updateUvs: function() {
        var tw = this.baseTexture.width;
        var th = this.baseTexture.height;
        this._uvs.x0 = this.position.x / tw;
        this._uvs.y0 = this.position.y / th;
        this._uvs.x1 = (this.position.x + this.width) / tw;
        this._uvs.y1 = this.position.y / th;
        this._uvs.x2 = (this.position.x + this.width) / tw;
        this._uvs.y2 = (this.position.y + this.height) / th;
        this._uvs.x3 = this.position.x / tw;
        this._uvs.y3 = (this.position.y + this.height) / th;
    }
});

game.addAttributes('Texture', {
    /**
        @method fromImage
        @static
        @param {String} path
    **/
    fromImage: function(path) {
        var texture = this.cache[path];

        if (!texture) {
            texture = new game.Texture(game.BaseTexture.fromImage(path));
            this.cache[path] = texture;
        }

        return texture;
    },

    /**
        @method fromAsset
        @static
        @param {String} id
    **/
    fromAsset: function(id) {
        var path = game.paths[id] || id;
        var texture = this.cache[path];

        if (!texture) {
            texture = game.Texture.fromImage(path);
        }

        return texture;
    },

    /**
        @method fromCanvas
        @static
        @param {HTMLCanvasElement} canvas
    **/
    fromCanvas: function(canvas) {
        var texture = this.cache[canvas._id];

        if (!texture) {
            var baseTexture = game.BaseTexture.fromCanvas(canvas);
            texture = new game.Texture(baseTexture);
            this.cache[canvas._id] = texture;
        }
        
        return texture;
    },

    /**
        @method clearCache
        @static
    **/
    clearCache: function() {
        for (var i in this.cache) {
            delete this.cache[i];
        }
    },

    /**
        @attribute {Object} cache
    **/
    cache: {}
});

/**
    @class BaseTexture
    @constructor
    @param {HTMLImageElement|HTMLCanvasElement} source
    @param {Function} loadCallback
**/
game.createClass('BaseTexture', {
    width: 0,
    height: 0,
    source: null,
    loaded: false,
    _loadCallback: null,
    _id: null,
    _dirty: [true, true, true, true],
    _glTextures: [],
    _premultipliedAlpha: true,
    _powerOf2: false,
    
    init: function(source, loadCallback) {
        this.source = source;
        this._loadCallback = loadCallback;

        if (source.complete || source.getContext) {
            this.onload();
        }
        else {
            source.onload = this.onload.bind(this);
        }
    },

    remove: function() {
        delete game.BaseTexture.cache[this._id];
    },

    onload: function() {
        this.loaded = true;
        this.width = this.source.width;
        this.height = this.source.height;
        if (this._loadCallback) this._loadCallback();
    }
});

game.addAttributes('BaseTexture', {
    fromImage: function(path, loadCallback) {
        var baseTexture = this.cache[path];

        if (!baseTexture) {
            var source = document.createElement('img');
            source.src = path;
            baseTexture = new game.BaseTexture(source, loadCallback);
            baseTexture._id = path;
            this.cache[path] = baseTexture;
        }

        return baseTexture;
    },

    fromAsset: function(id) {
        var path = game.paths[id];
        var baseTexture = this.cache[path];

        if (!baseTexture) {
            baseTexture = game.BaseTexture.fromImage(path);
        }

        return baseTexture;
    },

    fromCanvas: function(canvas) {
        if (!canvas._id) canvas._id = 'canvas_' + this.textureId++;

        var baseTexture = this.cache[canvas._id];

        if (!baseTexture) {
            baseTexture = new game.BaseTexture(canvas);
            baseTexture._id = canvas._id;
            this.cache[canvas._id] = baseTexture;
        }

        return baseTexture;
    },

    clearCache: function() {
        for (var i in this.cache) {
            delete this.cache[i];
        }
    },

    cache: {},
    textureId: 1
});

});

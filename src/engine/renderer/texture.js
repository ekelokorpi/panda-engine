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

    init: function(baseTexture, x, y, width, height) {
        this.baseTexture = baseTexture instanceof game.BaseTexture ? baseTexture : game.BaseTexture.fromAsset(baseTexture);
        this.position = new game.Vector(x, y);
        this.width = width || this.baseTexture.width;
        this.height = height || this.baseTexture.height;
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
    _loadCallback: null,
    _id: null,

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
        if (!canvas._id) canvas._id = 'canvas_' + this.canvasId++;

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
    canvasId: 1
});

});

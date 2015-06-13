/**
    @module renderer.texture
**/
game.module(
    'engine.renderer.texture'
)
.body(function() {

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
        @property {BaseTexture} baseTexture
    **/
    baseTexture: null,
    /**
        @property {Number} height
    **/
    height: 0,
    /**
        @property {Vector} position
    **/
    position: null,
    /**
        @property {Number} width
    **/
    width: 0,
    /**
        @property {Array} _uvs
        @private
    **/
    _uvs: [0, 0, 0, 0, 0, 0, 0, 0],

    init: function(baseTexture, x, y, width, height) {
        this.baseTexture = baseTexture instanceof game.BaseTexture ? baseTexture : game.BaseTexture.fromAsset(baseTexture);
        this.position = new game.Vector(x, y);
        this.width = width || this.baseTexture.width;
        this.height = height || this.baseTexture.height;

        if (game.renderer.webGL) this._updateUvs();
    },

    /**
        Remove texture from cache.
        @method remove
    **/
    remove: function() {
        for (var name in game.Texture.cache) {
            if (game.Texture.cache[name] === this) {
                delete game.Texture.cache[name];
                return;
            }
        }
    },

    /**
        @method _updateUvs
        @private
    **/
    _updateUvs: function() {
        var tw = this.baseTexture.width;
        var th = this.baseTexture.height;
        this._uvs[0] = this.position.x / tw;
        this._uvs[1] = this.position.y / th;
        this._uvs[2] = (this.position.x + this.width) / tw;
        this._uvs[3] = this.position.y / th;
        this._uvs[4] = (this.position.x + this.width) / tw;
        this._uvs[5] = (this.position.y + this.height) / th;
        this._uvs[6] = this.position.x / tw;
        this._uvs[7] = (this.position.y + this.height) / th;
    }
});

game.addAttributes('Texture', {
    /**
        @attribute {Object} cache
    **/
    cache: {},

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
        @method fromImage
        @static
        @param {String} path
        @return {Texture}
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
        @return {Texture}
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
        @return {Texture}
    **/
    fromCanvas: function(canvas) {
        var texture = this.cache[canvas._id];

        if (!texture) {
            var baseTexture = game.BaseTexture.fromCanvas(canvas);
            texture = new game.Texture(baseTexture);
            this.cache[canvas._id] = texture;
        }
        
        return texture;
    }
});

/**
    @class BaseTexture
    @constructor
    @param {HTMLImageElement|HTMLCanvasElement} source
    @param {Function} loadCallback
**/
game.createClass('BaseTexture', {
    /**
        @property {Number} height
    **/
    height: 0,
    /**
        @property {Boolean} loaded
        @default false
    **/
    loaded: false,
    /**
        @property {HTMLImageElement|HTMLCanvasElement} source
    **/
    source: null,
    /**
        @property {Number} width
    **/
    width: 0,
    /**
        @property {Array} _dirty
        @private
    **/
    _dirty: [true, true, true, true],
    /**
        @property {Array} _glTextures
        @private
    **/
    _glTextures: [],
    /**
        @property {Number|String} _id
        @private
    **/
    _id: null,
    /**
        @property {Function} _loadCallback
        @private
    **/
    _loadCallback: null,
    /**
        @property {Boolean} _powerOf2
        @default false
        @private
    **/
    _powerOf2: false,
    /**
        @property {Boolean} _premultipliedAlpha
        @default true
        @private
    **/
    _premultipliedAlpha: true,

    init: function(source, loadCallback) {
        this.source = source;
        this._loadCallback = loadCallback;

        if (source.getContext) this._onload();
        else source.onload = this._onload.bind(this);
    },

    /**
        @method _onload
        @private
    **/
    _onload: function() {
        this.loaded = true;
        this.width = this.source.width / game.scale;
        this.height = this.source.height / game.scale;
        if (this._loadCallback) this._loadCallback();
    }
});

game.addAttributes('BaseTexture', {
    /**
        @attribute {Object} cache
    **/
    cache: {},
    /**
        @attribute {Number} _id
    **/
    _id: 1,

    /**
        @method fromImage
        @static
        @param {String} path
        @param {Function} loadCallback
        @return {BaseTexture}
    **/
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

    /**
        @method fromAsset
        @static
        @param {String} id
        @return {BaseTexture}
    **/
    fromAsset: function(id) {
        var path = game.paths[id];
        var baseTexture = this.cache[path];

        if (!baseTexture) baseTexture = this.fromImage(path);

        return baseTexture;
    },

    /**
        @method fromCanvas
        @static
        @param {HTMLCanvasElement} canvas
        @return {BaseTexture}
    **/
    fromCanvas: function(canvas) {
        if (!canvas._id) canvas._id = 'canvas_' + this._id++;

        var baseTexture = this.cache[canvas._id];

        if (!baseTexture) {
            baseTexture = new game.BaseTexture(canvas);
            baseTexture._id = canvas._id;
            this.cache[canvas._id] = baseTexture;
        }

        return baseTexture;
    },

    /**
        @method clearCache
        @static
    **/
    clearCache: function() {
        for (var i in this.cache) {
            delete this.cache[i];
        }
    }
});

});

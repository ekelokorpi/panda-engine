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
        @property {Number} width
    **/
    width: 0,
    /**
        @property {Number} height
    **/
    height: 0,
    /**
        @property {HTMLImageElement|HTMLCanvasElement} source
    **/
    source: null,
    /**
        @property {Boolean} loaded
    **/
    loaded: false,
    /**
        @property {Function} _loadCallback
        @private
    **/
    _loadCallback: null,
    /**
        @property {Number|String} _id
        @private
    **/
    _id: null,
    // TODO WebGL stuff, check these
    _dirty: [true, true, true, true],
    _glTextures: [],
    _premultipliedAlpha: true,
    _powerOf2: false,
    
    init: function(source, loadCallback) {
        this.source = source;
        this._loadCallback = loadCallback;

        if (source.getContext) {
            this._onload();
        }
        else {
            source.onload = this._onload.bind(this);
        }
    },

    /**
        @method _onload
        @private
    **/
    _onload: function() {
        this.loaded = true;
        this.width = this.source.width;
        this.height = this.source.height;
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

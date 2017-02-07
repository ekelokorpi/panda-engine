/**
    @module loader
**/
game.module(
    'engine.loader'
)
.require(
    'engine.scene'
)
.body(function() {

/**
    Dynamic loader for files.
    @class Loader
    @constructor
**/
game.createClass('Loader', 'Scene', {
    /**
        Number of files loaded.
        @property {Number} loaded
    **/
    loaded: 0,
    /**
        Function or Scene name to run, when loader complete.
        @property {Function|String} onComplete
    **/
    onComplete: null,
    /**
        Percent of files loaded.
        @property {Number} percent
    **/
    percent: 0,
    /**
        Scene to set, when loader complete.
        @property {String} scene
    **/
    scene: null,
    /**
        Is loader started.
        @property {Boolean} started
        @default false
    **/
    started: false,
    /**
        Total files to load.
        @property {Number} totalFiles
    **/
    totalFiles: 0,
    /**
        @property {Number} _loadCount
        @private
    **/
    _loadCount: 0,
    /**
        List of media files to load.
        @property {Array} _queue
        @private
    **/
    _queue: [],

    staticInit: function(scene) {
        if (scene) {
            this.scene = scene;
            this.super();
        }

        for (var i = 0; i < game.mediaQueue.length; i++) {
            this._queue.push(this._getFilePath(game.mediaQueue[i]));
        }
        game.mediaQueue.length = 0;

        this.totalFiles = this._queue.length;
        if (this.totalFiles === 0) this.percent = 100;

        if (scene) this.start();
        else return true;
    },

    loadAudio: function(filePath, callback) {
        game.audio._load(filePath, callback);
    },

    /**
        Load file with XMLHttpRequest.
        @method loadFile
        @param {String} filePath
        @param {Function} callback
    **/
    loadFile: function(filePath, callback) {
        var request = new XMLHttpRequest();
        request.onload = callback.bind(this, request);
        request.open('GET', filePath + game._nocache, true);
        request.send();
    },

    /**
        @method loadFont
        @param {String} filePath
        @param {Function} callback
    **/
    loadFont: function(filePath, callback) {
        this.loadFile(filePath, this.parseXML.bind(this, filePath, callback));
    },

    /**
        @method loadImage
        @param {String} filePath
        @param {Function} callback
    **/
    loadImage: function(filePath, callback) {
        game.BaseTexture.fromImage(filePath, callback);
    },

    /**
        @method loadJSON
        @param {String} filePath
        @param {Function} callback
    **/
    loadJSON: function(filePath, callback) {
        this.loadFile(filePath, this.parseJSON.bind(this, filePath, callback));
    },

    /**
        Called, when all files loaded.
        @method onComplete
    **/
    onComplete: function() {
        if (this.scene) game.system.setScene(this.scene);
    },

    /**
        Called, when loader got error.
        @method onError
        @param {String} error
    **/
    onError: function(error) {
        throw error;
    },

    /**
        Called, when file is loaded.
        @method onProgress
        @param {Number} percent
    **/
    onProgress: function(percent) {
        if (this.barFg) this.barFg.scale.x = percent / 100;
    },

    /**
        Called, when loader is started.
        @method onStart
    **/
    onStart: function() {},

    /**
        @method parseFont
        @param {XML} data
        @param {Function} callback
    **/
    parseFont: function(data, callback) {
        game.Font.fromData(data);
        callback();
    },

    /**
        @method parseJSON
        @param {String} filePath
        @param {Function} callback
        @param {XMLHttpRequest} request
        @return {JSON} json
    **/
    parseJSON: function(filePath, callback, request) {
        if (!request.responseText || request.status === 404) callback('Error loading JSON ' + filePath);

        var json = JSON.parse(request.responseText);
        game.json[filePath] = json;
        if (json.frames) {
            // Sprite sheet
            var image = game._getFilePath(json.meta.image);
            this.loadImage(image, this.parseSpriteSheet.bind(this, json, callback));
            return;
        }
        else {
            callback();
        }

        return json;
    },

    /**
        @method parseSpriteSheet
        @param {Object} json
        @param {Function} callback
    **/
    parseSpriteSheet: function(json, callback) {
        var image = game._getFilePath(json.meta.image);
        var baseTexture = game.BaseTexture.fromImage(image);
        var frames = json.frames;

        for (var name in frames) {
            var frame = frames[name].frame || frames[name];
            var x = frame.x / game.scale;
            var y = frame.y / game.scale;
            var w = frame.w / game.scale;
            var h = frame.h / game.scale;
            var texture = new game.Texture(baseTexture, x, y, w, h);
            game.Texture.cache[name] = texture;
        }

        callback();
    },

    /**
        @method parseXML
        @param {String} filePath
        @param {Function} callback
        @param {XMLHttpRequest} request
    **/
    parseXML: function(filePath, callback, request) {
        if (!request.responseText || request.status === 404) callback('Error loading XML ' + filePath);

        var responseXML = request.responseXML;
        if (!responseXML || /MSIE 9/i.test(navigator.userAgent) || navigator.isCocoonJS) {
            if (typeof window.DOMParser === 'function') {
                var domparser = new DOMParser();
                responseXML = domparser.parseFromString(request.responseText, 'text/xml');
            }
            else {
                var div = document.createElement('div');
                div.innerHTML = request.responseText;
                responseXML = div;
            }
        }

        var pages = responseXML.getElementsByTagName('page');
        if (pages.length) {
            var font = pages[0].getAttribute('file');
            var image = game._getFilePath(font);
            this.loadImage(image, this.parseFont.bind(this, responseXML, callback));
        }
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        this.started = true;
        this.onStart();

        if (this.percent === 100) this._complete();
        else this._startLoading();
    },

    /**
        @method _complete
        @private
    **/
    _complete: function() {
        if (this.totalFiles > 0 && game.system.hires || game.system.retina) {
            for (var i in game.BaseTexture.cache) {
                if (i.indexOf('@' + game.scale + 'x') !== -1) {
                    game.BaseTexture.cache[i.replace('@' + game.scale + 'x', '')] = game.BaseTexture.cache[i];
                    delete game.BaseTexture.cache[i];
                }
            }
            for (var i in game.Texture.cache) {
                if (i.indexOf('@' + game.scale + 'x') !== -1) {
                    game.Texture.cache[i.replace('@' + game.scale + 'x', '')] = game.Texture.cache[i];
                    delete game.Texture.cache[i];
                }
            }
        }

        this.onComplete();
    },

    /**
        @method _getFilePath
        @private
        @return {String}
    **/
    _getFilePath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@' + game.scale + 'x.') : path;
    },

    /**
        @method _progress
        @param {String} error
        @private
    **/
    _progress: function(error) {
        if (error) return this.onError(error);
        this._loadCount--;
        this.loaded++;
        this.percent = Math.round(this.loaded / this.totalFiles * 100);
        this.onProgress(this.percent);
        if (this.loaded === this.totalFiles) this._complete();
        else this._startLoading();
    },

    /**
        @method _startLoading
        @private
    **/
    _startLoading: function() {
        for (var i = this._queue.length - 1; i >= 0; i--) {
            var filePath = this._queue[i];
            if (!filePath) continue;
            var fileType = filePath.split('?').shift().split('.').pop().toLowerCase();
            var loadFunc = game.Loader._formats[fileType];

            if (!loadFunc) {
                for (var i = game.Audio.formats.length - 1; i >= 0; i--) {
                    if (fileType === game.Audio.formats[i].ext) {
                        loadFunc = 'loadAudio';
                        continue;
                    }
                }
            }
            if (!loadFunc) throw 'Unsupported file format ' + fileType;

            this._loadCount++;
            this._queue.splice(i, 1);

            this[loadFunc](filePath, this._progress.bind(this));
            if (this._loadCount === game.Loader.maxFiles) return;
        }
    }
});

game.addAttributes('Loader', {
    /**
        How many files to load at same time.
        @attribute {Number} maxFiles
        @default 4
    **/
    maxFiles: 4,
    /**
        List of supported file formats and load functions.
        @attribute {Object} _formats
        @private
    **/
    _formats: {
        png: 'loadImage',
        jpg: 'loadImage',
        jpeg: 'loadImage',
        json: 'loadJSON',
        fnt: 'loadFont'
    }
});

});

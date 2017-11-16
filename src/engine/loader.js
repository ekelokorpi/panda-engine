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
        @property {String} _error
        @private
    **/
    _error: null,
    /**
        @property {Number} _loadCount
        @private
    **/
    _loadCount: 0,
    /**
        @property {Array} _loadedFiles
        @private
    **/
    _loadedFiles: [],
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
            this._queue.push(game.mediaQueue[i]);
        }
        game.mediaQueue.length = 0;

        this.totalFiles = this._queue.length;
        if (this.totalFiles === 0) this.percent = 100;

        if (scene) {
            this.init();
            this.start();
        }
        return true;
    },

    init: function() {
        this.backgroundColor = game.Loader.backgroundColor;

        if (game.Loader.showLogo) {
            this.logo = new game.Sprite(game.logo);
            this.logo.x = game.width / 2 - this.logo.width / game.scale / 2;
            this.logo.y = game.height / 2 - this.logo.height / game.scale / 2;
            this.logo.alpha = 0;
            this.logo.addTo(this.stage);
        }
        
        if (game.Loader.showPercent) {
            var size = 20;
            this.percentText = new game.SystemText('', { size: size / game.scale, align: 'center', color: game.Loader.textColor });
            this.percentText.position.set(game.width / 2, game.height / 2 - size / game.scale / 2 - 3 / game.scale);
            this.percentText.addTo(this.stage);
        }

        if (game.Loader.text) {
            this.loaderText = new game.SystemText(game.Loader.text, { size: 14 / game.scale, align: 'center', color: game.Loader.textColor });
            this.loaderText.position.set(game.width / 2, game.height - 20 / game.scale);
            this.loaderText.addTo(this.stage);
        }

        this.onProgress();
    },

    /**
        @method loadAtlas
        @param {String} filePath
        @param {Function} callback
    **/
    loadAtlas: function(filePath, callback) {
        this.loadFile(filePath, this.parseJSON.bind(this, filePath, callback));
    },

    /**
        @method loadAudio
        @param {String} filePath
        @param {Function} callback
    **/
    loadAudio: function(filePath, callback) {
        if (!game.Audio.enabled) callback();
        else game.audio._load(filePath, callback);
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
        request.onerror = this._progress.bind(this, 'Error loading file ' + filePath);
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
        if (this.percentText) this.percentText.color = game.Loader.errorColor;
        if (this.loaderText) {
            this.loaderText.color = game.Loader.errorColor;
            this.loaderText.text = error;
        }
        throw error;
    },

    /**
        Called, when file is loaded.
        @method onProgress
        @param {Number} percent
    **/
    onProgress: function() {
        if (this.percentText) this.percentText.text = this.percent + '%';
        if (this.logo) this.logo.alpha = this.percent / 100;
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
    **/
    parseJSON: function(filePath, callback, request) {
        if (!request.responseText || request.status === 404) callback('Error parsing file ' + filePath);

        var json = JSON.parse(request.responseText);
        game.json[filePath] = json;
        if (json.frames) {
            // Atlas
            json.meta.image = this._getFolder(filePath) + json.meta.image;
            var image = game._getFilePath(json.meta.image);
            this.loadImage(image, this.parseSpriteSheet.bind(this, json, callback));
            return;
        }
        
        callback();
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
            var folder = this._getFolder(filePath);
            var font = pages[0].getAttribute('file');
            pages[0].setAttribute('file', folder + font);
            var image = game._getFilePath(folder + font);
            this.loadImage(image, this.parseFont.bind(this, responseXML, callback));
        }
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        this.started = true;
        this._startTime = game.Timer.time;
        this.onStart();

        if (this.percent === 100) this._complete();
        else this._startLoading();
    },

    /**
        @method _complete
        @private
    **/
    _complete: function() {
        if (this.totalFiles > 0 && game.scale > 1) {
            for (var i in game.BaseTexture.cache) {
                if (i.indexOf('@' + game.scale + 'x') >= 0) {
                    game.BaseTexture.cache[i.replace('@' + game.scale + 'x', '')] = game.BaseTexture.cache[i];
                    delete game.BaseTexture.cache[i];
                }
            }
            for (var i in game.Texture.cache) {
                if (i.indexOf('@' + game.scale + 'x') >= 0) {
                    game.Texture.cache[i.replace('@' + game.scale + 'x', '')] = game.Texture.cache[i];
                    delete game.Texture.cache[i];
                }
            }
        }

        var waitTime = game.Loader.minTime - (game.Timer.time - this._startTime);
        if (waitTime > 0) game.Timer.add(waitTime, this.onComplete.bind(this));
        else this.onComplete();
    },

    /**
        @method _getFilePath
        @private
        @return {String}
    **/
    _getFilePath: function(path) {
        if (path.indexOf('@' + game.scale + 'x.') >= 0) return path;
        return game.scale > 1 ? path.replace(/\.(?=[^.]*$)/, '@' + game.scale + 'x.') : path;
    },

    /**
        @method _getFolder
        @private
        @return {String}
    **/
    _getFolder: function(filePath) {
        var folder = filePath.substr((game.config.mediaFolder + '/').length);
        folder = folder.substr(0, folder.lastIndexOf('/') + 1);
        return folder;
    },

    /**
        @method _progress
        @param {String} error
        @private
    **/
    _progress: function(error) {
        if (error) {
            this._error = error;
            return this.onError(error);
        }
        this._loadCount--;
        this.loaded++;
        this.percent = Math.round(this.loaded / this.totalFiles * 100);
        this.onProgress();
        if (this.loaded === this.totalFiles) this._complete();
        else this._startLoading();
    },

    /**
        @method _startLoading
        @private
    **/
    _startLoading: function() {
        this._queue.reverse();
        for (var i = this._queue.length - 1; i >= 0; i--) {
            var filePath = this._queue[i];
            if (!filePath) continue;
            var fileType = filePath.split('?').shift().split('.').pop().toLowerCase();
            var loadFunc = 'load' + game.Loader.formats[fileType];

            if (!this[loadFunc]) {
                for (var i = game.Audio.formats.length - 1; i >= 0; i--) {
                    if (fileType === game.Audio.formats[i].ext) {
                        loadFunc = 'loadAudio';
                        continue;
                    }
                }
            }

            if (loadFunc === 'loadImage' || loadFunc === 'loadFont' || loadFunc === 'loadAtlas') {
                filePath = this._getFilePath(filePath);
            }

            this._loadCount++;
            this._queue.splice(i, 1);
            this._loadedFiles.push(filePath);

            if (!this[loadFunc]) this.onError('Unsupported file format ' + fileType);
            else this[loadFunc](filePath, this._progress.bind(this));

            if (this._loadCount === game.Loader.maxFiles) return;
        }
    }
});

game.addAttributes('Loader', {
    /**
        @attribute {String} backgroundColor
        @default #000
    **/
    backgroundColor: '#000',
    /**
        @attribute {String} errorColor
        @default #ff0000
    **/
    errorColor: '#ff0000',
    /**
        List of supported file formats and types.
        @attribute {Object} formats
        @private
    **/
    formats: {
        atlas: 'Atlas',
        png: 'Image',
        jpg: 'Image',
        jpeg: 'Image',
        json: 'JSON',
        fnt: 'Font'
    },
    /**
        How many files to load at same time.
        @attribute {Number} maxFiles
        @default 4
    **/
    maxFiles: 4,
    /**
        @attribute {Number} minTime
        @default 500
    **/
    minTime: 500,
    /**
        @attribute {Boolean} showLogo
        @default true
    **/
    showLogo: true,
    /**
        @attribute {Boolean} showPercent
        @default true
    **/
    showPercent: true,
    /**
        Text to show on bottom of the loader
        @attribute {String} text
        @default Made with Panda 2 - www.panda2.io
    **/
    text: 'Made with Panda 2 - www.panda2.io',
    /**
        @attribute {String} textColor
        @default #fff
    **/
    textColor: '#fff'
});

});

/**
    @module loader
**/
game.module(
    'engine.loader'
)
.body(function() {

/**
    Dynamic loader for assets and audio files.
    @class Loader
    @constructor
    @param {Function|String} callback Callback function or scene name
**/
game.createClass('Loader', {
    /**
        Background color.
        @property {String} backgroundColor
    **/
    backgroundColor: null,
    /**
        Callback function or scene name
        @property {Function|String} callback
    **/
    callback: null,
    /**
        Is loader in dynamic mode.
        @property {Boolean} dynamic
        @default true
    **/
    dynamic: true,
    /**
        Number of files loaded.
        @property {Number} loaded
    **/
    loaded: 0,
    /**
        Percent of files loaded.
        @property {Number} percent
    **/
    percent: 0,
    /**
        Main container for loader.
        @property {Container} stage
    **/
    stage: null,
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
        @property {Array} tweens
    **/
    tweens: [],
    /**
        List of assets to load.
        @property {Array} assetQueue
        @private
    **/
    _assetQueue: [],
    /**
        List of audios to load.
        @property {Array} audioQueue
        @private
    **/
    _audioQueue: [],
    /**
        @property {Number} _loadCount
        @private
    **/
    _loadCount: 0,
    /**
        @property {Boolean} _onCompleteCalled
        @private
    **/
    _onCompleteCalled: false,
    /**
        @property {Number} _readyTime
        @private
    **/
    _readyTime: 0,
    /**
        @property {Number} _startTime
        @private
    **/
    _startTime: 0,

    init: function(callback) {
        this.callback = callback;

        if (!this.backgroundColor) this.backgroundColor = game.Loader.backgroundColor;

        for (var i = 0; i < game.assetQueue.length; i++) {
            this._assetQueue.push(this._getFilePath(game.assetQueue[i]));
        }
        game.assetQueue.length = 0;

        if (game.Audio && game.Audio.enabled) {
            for (var i = 0; i < game.audioQueue.length; i++) {
                this._audioQueue.push(game.audioQueue[i]);
            }
            game.audioQueue.length = 0;
        }

        this.totalFiles = this._assetQueue.length + this._audioQueue.length;
        if (this.totalFiles === 0) this.percent = 100;
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
        request.open('GET', filePath, true);
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
        Called, when loader is completed.
        @method onComplete
    **/
    onComplete: function() {
        if (!this.dynamic) game.system.setScene(this.callback);
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
    **/
    onProgress: function() {
        if (this.barFg) this.barFg.scale.x = this.percent / 100;
    },

    /**
        Called, when loader is started.
        @method onStart
    **/
    onStart: function() {
        var barWidth = game.Loader.barWidth;
        var barHeight = game.Loader.barHeight;

        var barBg = new game.Graphics();
        barBg.beginFill(game.Loader.barBgColor);
        barBg.drawRect(0, 0, barWidth, barHeight);
        barBg.position.set(game.system.width / 2 - barWidth / 2, game.system.height / 2 - barHeight / 2);
        barBg.addTo(this.stage);

        this.barFg = new game.Graphics();
        this.barFg.beginFill(game.Loader.barColor);
        this.barFg.drawRect(0, 0, barWidth, barHeight);
        this.barFg.position.set(game.system.width / 2 - barWidth / 2, game.system.height / 2 - barHeight / 2);
        this.barFg.addTo(this.stage);

        this.onProgress();
    },

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
        if (typeof this.callback === 'string') this.dynamic = false;

        if (!this.dynamic) {
            this._startTime = game.Timer.time;
            this.stage = new game.Container();
            this.stage.stage = this.stage;
            game.scene = this;
            if (!game.system._running) game.system._startRunLoop();
            this.onStart();
        }

        if (this.percent === 100) this._ready();
        else this._startLoading();
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
        this.onProgress();
        if (this.loaded === this.totalFiles) this._ready();
        else this._startLoading();
    },

    /**
        @method _ready
        @private
    **/
    _ready: function() {
        if (game.system.hires || game.system.retina) {
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

        if (this.dynamic) {
            this.onComplete();
        }
        else {
            var loadTime = game.Timer.time - this._startTime;
            var timeToWait = game.Loader.time - loadTime;
            // Show 100% for at least 100ms
            if (timeToWait < 100) timeToWait = 100;
            this._readyTime = game.Timer.time + timeToWait;
        }
    },

    /**
        @method _startLoading
        @private
    **/
    _startLoading: function() {
        for (var i = this._assetQueue.length - 1; i >= 0; i--) {
            var filePath = this._assetQueue[i];
            if (!filePath) continue;
            var fileType = filePath.split('?').shift().split('.').pop().toLowerCase();
            var loadFunc = game.Loader.formats[fileType];
            if (!this[loadFunc]) throw 'Unsupported file format ' + fileType;
            this._loadCount++;
            this._assetQueue.splice(i, 1);
            this[loadFunc](filePath, this._progress.bind(this));
            if (this._loadCount === game.Loader.maxFiles) return;
        }

        for (var i = this._audioQueue.length - 1; i >= 0; i--) {
            var audio = this._audioQueue[i];
            if (!audio) continue;
            this._loadCount++;
            this._audioQueue.splice(i, 1);
            game.audio._load(audio, this._progress.bind(this));
            if (this._loadCount === game.Loader.maxFiles) return;
        }
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (this.dynamic) return;

        for (var i = this.tweens.length - 1; i >= 0; i--) {
            if (!this.tweens[i]._update()) this.tweens.splice(i, 1);
        }

        if (this.loaded === this.totalFiles && game.Timer.time >= this._readyTime && !this._onCompleteCalled) {
            this.onComplete();
            this._onCompleteCalled = true;
        }

        game.renderer._render(this.stage);
    }
});

game.addAttributes('Loader', {
    /**
        Default background color.
        @attribute {String} backgroundColor
        @default #000
    **/
    backgroundColor: '#000',
    /**
        Loading bar background color.
        @attribute {String} barBg
        @default #515e73
    **/
    barBgColor: '#515e73',
    /**
        Loading bar color.
        @attribute {String} barColor
        @default #e6e7e8
    **/
    barColor: '#e6e7e8',
    /**
        Height of the loading bar.
        @attribute {Number} barHeight
        @default 20
    **/
    barHeight: 20,
    /**
        Width of the loading bar.
        @attribute {Number} barWidth
        @default 200
    **/
    barWidth: 200,
    /**
        List of supported file formats and load functions.
        @attribute {Object} formats
        @private
    **/
    formats: {
        png: 'loadImage',
        jpg: 'loadImage',
        jpeg: 'loadImage',
        json: 'loadJSON',
        fnt: 'loadFont'
    },
    /**
        How many files to load at same time.
        @attribute {Number} maxFiles
        @default 4
    **/
    maxFiles: 4,
    /**
        Minimum time to show loader (ms). Not used in dynamic mode.
        @attribute {Number} time
        @default 200
    **/
    time: 200
});

});

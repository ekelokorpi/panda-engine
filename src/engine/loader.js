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
    Dynamic loader for assets.
    @class Loader
    @extends Scene
    @constructor
**/
game.createClass('Loader', 'Scene', {
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
        Name of scene to set, when loader complete.
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

        if (scene) this.init();
        return true;
    },

    init: function() {
        this.backgroundColor = game.Loader.backgroundColor;

        if (game.Loader.showLogo) {
            this.logo = new game.Sprite(game.logo);
            this.logo.anchorCenter();
            this.logo.x = game.width / 2;
            this.logo.y = game.height / 2;
            this.logo.addTo(this.stage);
            this.logoTween = game.Tween.add(this.logo.scale, {
                x: 1.1,
                y: 1.1
            }, 500, {
                easing: 'Quadratic.Out',
                repeat: Infinity,
                yoyo: true
            }).start();
        }
        
        if (game.Loader.showPercent) {
            var size = 20;
            this.percentText = new game.SystemText('', { size: size / game.scale, align: 'center', color: game.Loader.textColor });
            this.percentText.position.set(game.width / 2, game.height / 2 - size / game.scale + 7);
            this.percentText.addTo(this.stage);
        }

        if (game.Loader.text) {
            this.loaderText = new game.SystemText(game.Loader.text, { size: 14 / game.scale, align: 'center', color: game.Loader.textColor });
            this.loaderText.position.set(game.width / 2, game.height - size / game.scale);
            this.loaderText.addTo(this.stage);
        }

        this.onProgress();
    },

    /**
        @method generateFont
        @param {XML|JSON} data
        @param {Function} callback
    **/
    generateFont: function(data, callback) {
        game.Font.fromData(data);
        callback();
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
        @method loadCSS
        @param {String} filePath
        @param {Function} callback
    **/
    loadCSS: function(filePath, callback) {
        this.loadFile(filePath, this.parseCSS.bind(this, filePath, callback));
    },

    /**
        Load file with XMLHttpRequest.
        @method loadFile
        @param {String} filePath
        @param {Function} callback
    **/
    loadFile: function(filePath, callback) {
        var request = new XMLHttpRequest();
        
        if (game.device.WKWebView) {
            request.addEventListener('loadend', callback.bind(this, request));
        }
        else {
            request.onload = callback.bind(this, request);
            request.onerror = this._progress.bind(this, 'Error loading file ' + filePath);
        }
        
        request.open('GET', filePath);
        request.send();
    },

    /**
        @method loadFont
        @param {String} filePath
        @param {Function} callback
    **/
    loadFont: function(filePath, callback) {
        this.loadFile(filePath, this.parseFont.bind(this, filePath, callback));
    },

    /**
        @method loadImage
        @param {String} filePath
        @param {Function} callback
    **/
    loadImage: function(filePath, callback) {
        game.BaseTexture.fromImage(filePath, function(error) {
            if (error) callback(error);
            else {
                if (game.Loader.preRender) game.renderer.context.drawImage(this.source, 0, 0);
                callback();
            }
        });
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
        @method loadScript
        @param {String} filePath
        @param {Function} callback
    **/
    loadScript: function(filePath, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = filePath;
        script.onload = function() {
            callback();
        };
        script.onerror = function(error) {
            callback('Error loading script ' + filePath);
        };
        document.getElementsByTagName('head')[0].appendChild(script);
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
        if (this.logoTween) this.logoTween.stop();
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
    },

    /**
        Called, when loader is started.
        @method onStart
    **/
    onStart: function() {},

    /**
        @method parseAtlas
        @param {Object} json
        @param {Function} callback
    **/
    parseAtlas: function(json, callback) {
        var image = game._getFilePath(json.meta.image);
        var baseTexture = game.BaseTexture.fromImage(image);
        var frames = json.frames;

        for (var name in frames) {
            var frame = frames[name].frame || frames[name];
            var x = frame.x / game.scale;
            var y = frame.y / game.scale;
            var w = frame.w / game.scale;
            var h = frame.h / game.scale;
            var texture = new game.Texture(baseTexture, x, y, w, h);
            if (frame.sx) texture._offset.x = frame.sx;
            if (frame.sy) texture._offset.y = frame.sy;
            if (frame.sw) texture._trim.x = frame.sw;
            if (frame.sh) texture._trim.y = frame.sh;
            if (frame.ax) texture._anchor.x = frame.ax;
            if (frame.ay) texture._anchor.y = frame.ay;
            game.Texture.cache[name] = texture;
        }

        callback();
    },

    /**
        @method parseCSS
        @param {String} filePath
        @param {Function} callback
        @param {XMLHttpRequest} request
    **/
    parseCSS: function(filePath, callback, request) {
        if (!request.responseText || request.status === 404) callback('Error loading CSS ' + filePath);

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = request.responseText;
        document.getElementsByTagName('head')[0].appendChild(style);
        
        callback();
    },

    /**
        @method parseFont
        @param {String} filePath
        @param {Function} callback
        @param {XMLHttpRequest} request
    **/
    parseFont: function(filePath, callback, request) {
        if (!request.responseText || request.status === 404) callback('Error loading font ' + filePath);

        var text = request.responseText.split('\n');
        if (text[0].indexOf('xml') !== -1 || text[0].indexOf('<font>') !== -1) {
            // XML
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
                var font = this._getFilePath(pages[0].getAttribute('file'));
                pages[0].setAttribute('file', folder + font);
                var image = game._getFilePath(folder + font);
                this.loadImage(image, this.generateFont.bind(this, responseXML, callback));
            }
        }
        else {
            // BMfont
            var font = {
                pages: [],
                chars: [],
                kernings: []
            };
            for (var i = 0; i < text.length; i++) {
                if (text[i].length === 0) continue; // Skip empty lines
                var lineData = text[i].split(' ');
                var name = lineData.shift();
                if (name === 'char' || name === 'kerning' || name === 'page') {
                    var fontData = {};
                    for (var o = 0; o < lineData.length; o++) {
                        var cont = lineData[o].split('=');
                        fontData[cont[0]] = cont[1].replace(/['"]+/g, '');
                    }
                    font[name + 's'].push(fontData);
                }
                else if (name !== 'chars' && name !== 'kernings') {
                    font[name] = {};
                    for (var o = 0; o < lineData.length; o++) {
                        var cont = lineData[o].split('=');
                        font[name][cont[0]] = cont[1].replace(/['"]+/g, '');
                    }
                }
            }
            font.pages[0].file = this._getFilePath(font.pages[0].file);
            var folder = this._getFolder(filePath);
            var image = game._getFilePath(folder + font.pages[0].file);
            this.loadImage(image, this.generateFont.bind(this, font, callback));
        }
    },

    /**
        @method parseJSON
        @param {String} filePath
        @param {Function} callback
        @param {XMLHttpRequest} request
    **/
    parseJSON: function(filePath, callback, request) {
        if (!request.responseText || request.status === 404) callback('Error loading JSON ' + filePath);

        try {
            var json = JSON.parse(request.responseText);
        }
        catch (error) {
            callback(error);
            return;
        }

        game.json[filePath] = json;
        if (json.frames) {
            // Atlas
            json.meta.image = this._getFolder(filePath) + json.meta.image;
            var image = game._getFilePath(json.meta.image);
            this.loadImage(image, this.parseAtlas.bind(this, json, callback));
            return;
        }
        
        callback();
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
        if (path.indexOf('@' + game.scale + 'x.') >= 0 || path.indexOf('.svg') >= 0) return path;
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
            var loadFunc = game.Loader.formats[fileType];

            if (!this[loadFunc]) {
                for (var i = game.Audio.formats.length - 1; i >= 0; i--) {
                    if (fileType === game.Audio.formats[i].ext) {
                        loadFunc = 'loadAudio';
                        continue;
                    }
                }
            }

            if (loadFunc === 'loadImage' || loadFunc === 'loadAtlas' || loadFunc === 'loadFont') {
                filePath = this._getFilePath(filePath);
            }

            this._loadCount++;
            this._queue.splice(i, 1);
            this._loadedFiles.push(filePath);

            if (!this[loadFunc]) this.onError('Unsupported file format ' + fileType);
            else this[loadFunc](filePath, this._progress.bind(this));

            if (this._loadCount === game.Loader.maxFiles) return;
        }
    },

    _update: function() {
        this.super();
        if (this.scene && !this.started) this.start();
    }
});

game.addAttributes('Loader', {
    /**
        Background color of loader.
        @attribute {String} backgroundColor
        @default #000
    **/
    backgroundColor: '#000',
    /**
        Color of error text.
        @attribute {String} errorColor
        @default #ff0000
    **/
    errorColor: '#ff0000',
    /**
        List of supported file formats and their loading functions.
        @attribute {Object} formats
        @private
    **/
    formats: {
        atlas: 'loadAtlas',
        css: 'loadCSS',
        png: 'loadImage',
        jpg: 'loadImage',
        jpeg: 'loadImage',
        js: 'loadScript',
        json: 'loadJSON',
        fnt: 'loadFont',
        svg: 'loadImage'
    },
    /**
        How many files to load at same time.
        @attribute {Number} maxFiles
        @default 4
    **/
    maxFiles: 4,
    /**
        Minimum time, that the loader is visible.
        @attribute {Number} minTime
        @default 500
    **/
    minTime: 500,
    /**
        Pre-render images, when they are loaded. Use this to avoid small pause, when rendering large images first time.
        @attribute {Boolean} preRender
        @default false
    **/
    preRender: false,
    /**
        Show Panda 2 logo in loader.
        @attribute {Boolean} showLogo
        @default true
    **/
    showLogo: true,
    /**
        Show percents of how much is loaded.
        @attribute {Boolean} showPercent
        @default true
    **/
    showPercent: true,
    /**
        Text to show on bottom of the loader
        @attribute {String} text
        @default 'Made with Panda 2 - www.panda2.io'
    **/
    text: 'Made with Panda 2 - www.panda2.io',
    /**
        Color of loader texts.
        @attribute {String} textColor
        @default #fff
    **/
    textColor: '#fff'
});

});

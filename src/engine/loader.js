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
        var totalHeight = 0;
        var totalLogo = 90 / game.scale;
        var totalBar = 4 / game.scale;
        var totalText = 16;
        var spacing = 20 / game.scale;

        var items = 0;
        if (game.Loader.showLogo) {
            totalHeight += totalLogo;
            items++;
        }
        if (game.Loader.showBar) {
            totalHeight += totalBar;
            items++;
        }
        if (game.Loader.showText) {
            totalHeight += totalText;
            items++;
        }
        totalHeight += (items - 1) * spacing;

        var curY = game.height / 2 - totalHeight / 2;

        if (game.Loader.showLogo) {
            var source = document.createElement('img');
            source.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH8AAABuCAMAAAA56TwfAAABlVBMVEUAAAD+/v7///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAGBgb29vYKCgoVFRUQEBDr6+skJCQaGhr4+Pj09PS2tradnZ2YmJiBgYF1dXXf39/FxcXAwMBycnJubm5KSkpEREQ8PDw1NTUxMTEqKiofHx/v7+/IyMhbW1v8/Pzn5+fc3NzW1tbPz8+vr696enpkZGRBQUHy8vKzs7OGhoZnZ2dSUlJOTk4uLi7j4+OoqKimpqaUlJSJiYlgYGBXV1fl5eWsrKykpKSRkZHh4eHU1NTMzMy/v7+6urqMjIyDg4N+fn5ra2vY2NjS0tLCwsLz8/OhoaHnBz12AAAAPnRSTlMA/vv3RQvNqA7znOuIcmAFAePfoe/n27+7jWlTA8etl389LSIfFxHXwraykndkW1dJODUxFAjSbGZOJ4Mc1Gnx8lYAAAdwSURBVGjevNf5X1JBEADweYCYCqiZt5aWVt6mdmg28zgUFBXl9M4bU1PDzDJTM+vvrnhc+3gLW6Df39/um539zMwCq7S/u6mjuLauvwHyqqWpUYd/6J5UdLUAxyNzjR73Zz6dbJ9KlabHkDelr/WnG0G7bJsP7rg9aDQPQ5o7dY14Ggk4KMq+c1XZDHnyvG1kl5LmJld09w1lkOqx6Z7VPUsp5BP9M8iPByOjxPJf49MhSLKUHG/YSeWkPD8pMCwHKE1wpsgCMQWF1imZ0sg/iiEPyowTpOW7y1SmpOep5z1p2dI9ykf4LidpClg74a8Kj5O0fTVB7orXiWNX1wcAg65Z4vBVQe7Kj4jnpBGg7M058YxiC+TqEc7z15f6oHnZSVxveyBX9SPEN/MaaheJ76wJctWZaf3Jamj8QHzuCshVxyfiWyqHEi/xXdRArgoniM+vB/0O8XmNkKu2SKb9izLHv1kFuXp6SXxHd8F4njk/rIaC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';
            var texture = new game.BaseTexture(source);
            var logo = new game.Sprite(new game.Texture(texture));
            logo.anchor.set(64 / game.scale, 110 / game.scale);
            logo.position.set(game.width / 2, curY + 86 / game.scale);
            logo.addTo(this.stage);

            var rotation = 0.1;
            logo.rotation = -rotation;
            var options = {
                easing: 'Quadratic.InOut',
                repeat: Infinity,
                yoyo: true
            };
            this.logoTween = game.Tween.add(logo, {
                rotation: rotation
            }, 500, options).start();

            curY += totalLogo + spacing;
        }

        if (game.Loader.showBar) {
            var barWidth = 200 / game.scale;
            var barHeight = 20 / game.scale;
            var barBorder = 2 / game.scale;

            var barBg = new game.Graphics();
            barBg.fillAlpha = 0;
            barBg.lineWidth = barBorder;
            barBg.drawRect(0, 0, barWidth, barHeight);
            barBg.position.set(game.system.width / 2 - barWidth / 2, curY);
            barBg.addTo(this.stage);

            this.barFg = new game.Graphics();
            this.barFg.beginFill('#fff');
            this.barFg.drawRect(0, 0, barWidth, barHeight);
            this.barFg.position.set(game.system.width / 2 - barWidth / 2, curY);
            this.barFg.addTo(this.stage);

            curY += totalBar + spacing;
        }

        if (game.Loader.showText) {
            this.loaderText = new game.SystemText('', { size: 14 / game.scale, align: 'center' });
            this.loaderText.position.set(game.width / 2, curY + 8);
            this.loaderText.addTo(this.stage);
        }

        if (game.Loader.showAd && game.Loader.ad !== '') {
            var credit = new game.SystemText(game.Loader.ad, { size: 14 / game.scale, align: 'center' });
            credit.position.set(game.width / 2, game.height - 18 / game.scale);
            credit.addTo(this.stage);
        }

        this.onProgress();
    },

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
        if (this.logoTween) this.logoTween.stop();
        if (this.loaderText) {
            this.loaderText.color = '#ff0000';
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
        if (this.barFg) this.barFg.scale.x = this.percent / 100;
        if (this.loaderText) this.loaderText.text = 'LOADING... ' + this.percent + '%';
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
        if (!request.responseText || request.status === 404) callback('Error loading JSON ' + filePath);

        var json = JSON.parse(request.responseText);
        if (json.frames) {
            // Sprite sheet
            if (game.scale > 1) {
                var newFile = this._getFilePath(filePath);
                if (newFile !== filePath) {
                    this.loadFile(newFile, this.parseJSON.bind(this, newFile, callback));
                    return;
                }
            }
            json.meta.image = this._getFolder(filePath) + json.meta.image;
            var image = game._getFilePath(json.meta.image);
            this.loadImage(image, this.parseSpriteSheet.bind(this, json, callback));
            return;
        }
        game.json[filePath] = json;
        
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
        if (error) return this.onError(error);
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

            if (loadFunc === 'loadImage' || loadFunc === 'loadFont') {
                filePath = this._getFilePath(filePath);
            }

            this._loadCount++;
            this._queue.splice(i, 1);
            this._loadedFiles.push(filePath);

            this[loadFunc](filePath, this._progress.bind(this));

            if (this._loadCount === game.Loader.maxFiles) return;
        }
    }
});

game.addAttributes('Loader', {
    ad: 'Created with Panda 2 Game Engine',
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
        @attribute {Boolean} showAd
        @default true
    **/
    showAd: true,
    /**
        @attribute {Boolean} showBar
        @default true
    **/
    showBar: true,
    /**
        @attribute {Boolean} showLogo
        @default true
    **/
    showLogo: true,
    /**
        @attribute {Boolean} showText
        @default true
    **/
    showText: true,
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

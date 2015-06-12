/**
    Panda Engine

    - Made by Eemeli Kelokorpi
    - Renderer based on Pixi.js by Mat Groves, Goodboy Digital
    - Financed by Yleisradio
    - Released under the MIT license

    @module game
**/

/**
    @class Core
**/
var game = {
    /**
        Engine version.
        @property {String} version
    **/
    version: '2.0.0',
    /**
        Engine config.
        @property {Object} config
    **/
    config: typeof pandaConfig !== 'undefined' ? pandaConfig : {},
    /**
        Current delta time in seconds.
        @property {Number} delta
    **/
    delta: 0,
    /**
        Scale multiplier for Retina and HiRes mode.
        @property {Number} scale
        @default 1
    **/
    scale: 1,
    /**
        @property {Audio} audio
    **/
    audio: null,
    /**
        @property {Scene} scene
    **/
    scene: null,
    /**
        @property {Debug} debug
    **/
    debug: null,
    /**
        @property {System} system
    **/
    system: null,
    /**
        @property {Pool} pool
    **/
    pool: null,
    /**
        @property {Storage} storage
    **/
    storage: null,
    /**
        @property {Input} input
    **/
    input: null,
    /**
        @property {Keyboard} keyboard
    **/
    keyboard: null,
    /**
        Device / browser information.
        @property {Object} device
    **/
    device: {},
    /**
        Device acceleration.
        @property {DeviceAcceleration} devicemotion
    **/
    devicemotion: null,
    /**
        Module load queue.
        @property {Array} moduleQueue
    **/
    moduleQueue: [],
    /**
        Asset load queue.
        @property {Array} assetQueue
    **/
    assetQueue: [],
    /**
        Audio load queue.
        @property {Array} audioQueue
    **/
    audioQueue: [],
    /**
        List of asset paths.
        @property {Object} paths
    **/
    paths: {},
    /**
        List of plugins.
        @property {Object} plugins
    **/
    plugins: {},
    /**
        List of JSON files.
        @property {Object} json
    **/
    json: {},
    /**
        List of modules.
        @property {Object} modules
    **/
    modules: {},
    /**
        Width of game.
        @property {Number} width
    **/
    width: 0,
    /**
        Height of game.
        @property {Number} height
    **/
    height: 0,
    /**
        @property {Array} _coreModules
        @private
    **/
    _coreModules: [
        'engine.analytics',
        'engine.audio',
        'engine.camera',
        'engine.debug',
        'engine.geometry',
        'engine.input',
        'engine.loader',
        'engine.particle',
        'engine.physics',
        'engine.pool',
        'engine.renderer.animation',
        'engine.renderer.container',
        'engine.renderer.core',
        'engine.renderer.graphics',
        'engine.renderer.sprite',
        'engine.renderer.spritesheet',
        'engine.renderer.text',
        'engine.renderer.texture',
        'engine.renderer.tilingsprite',
        'engine.renderer.webgl',
        'engine.scene',
        'engine.storage',
        'engine.system',
        'engine.timer',
        'engine.tween'
    ],
    /**
        @property {String} _nocache
        @private
    **/
    _nocache: '',
    /**
        @property {Function} _fnTest
        @private
    **/
    _fnTest: /xyz/.test(function() {
        var xyz; return xyz;
    }) ? /\bsuper\b/ : /[\D|\d]*/,
    /**
        @property {Boolean} _initializing
        @private
    **/
    _initializing: false,
    /**
        @property {Boolean} _loadFinished
        @private
    **/
    _loadFinished: false,
    /**
        @property {Number} _waitForLoad
        @private
    **/
    _waitForLoad: 0,
    /**
        @property {Boolean} _DOMLoaded
        @private
    **/
    _DOMLoaded: false,
    /**
        @property {Number} _gameLoopId
        @private
    **/
    _gameLoopId: 1,
    /**
        @property {Object} _gameLoops
        @private
    **/
    _gameLoops: {},
    /**
        @property {Object} _current
        @private
    **/
    _current: null,
    /**
        @property {Loader} _loader
        @private
    **/
    _loader: null,
    /**
        @property {Object} _currentModule
        @private
    **/
    _currentModule: null,
    /**
        @property {Boolean} _gameModuleDefined
        @private
    **/
    _gameModuleDefined: false,

    /**
        Clear engine cache.
        @method clearCache
    **/
    clearCache: function() {
        this.Texture.clearCache();
        this.BaseTexture.clearCache();
        this.Font.clearCache();
        this.json = {};
        this.paths = {};
    },

    /**
        Define new module.
        @method module
        @param {String} name
    **/
    module: function(name) {
        if (this._current) throw 'module ' + this._current.name + ' has no body';
        if (this.modules[name] && this.modules[name].body) throw 'module ' + name + ' is already defined';

        this._current = { name: name, requires: [], loaded: false, classes: [] };
        
        if (name.indexOf('game.') === 0) {
            this._gameModuleDefined = true;
            this._current.requires.push('engine.core');
        }

        this.modules[name] = this._current;
        this.moduleQueue.push(this._current);

        if (name === 'engine.core') {
            if (this.config.ignoreModules) {
                for (var i = this._coreModules.length - 1; i >= 0; i--) {
                    if (this.config.ignoreModules.indexOf(this._coreModules[i]) !== -1) this._coreModules.splice(i, 1);
                }
            }
            this._current.requires = this._coreModules;
            this.body(function() {});
        }
        return this;
    },

    /**
        Require module.
        @method require
        @param {Array} modules
    **/
    require: function(modules) {
        var i, modules = Array.prototype.slice.call(arguments);
        for (i = 0; i < modules.length; i++) {
            if (modules[i] && this._current.requires.indexOf(modules[i]) === -1) this._current.requires.push(modules[i]);
        }
        return this;
    },

    /**
        Define body for module.
        @method body
        @param {Function} body
    **/
    body: function(body) {
        this._current.body = body;
        this._current = null;
        if (this._loadFinished) this._loadModules();
        if (this._gameModuleDefined && this._DOMLoaded && !this._loadFinished) {
            this._loadModules();
        }
    },

    /**
        Called, when engine is started.
        @method onStart
    **/
    onStart: function() {},

    /**
        Called, when core is ready, and autoStart not enabled.
        @method ready
    **/
    ready: function() {},

    /**
        Create new class.
        @method createClass
        @param {String} name
        @param {String} [extend]
        @param {Object} content
    **/
    createClass: function(name, extend, content) {
        if (typeof name === 'object') return this.Class.extend(name);

        if (this[name]) throw 'class ' + name + ' already created';

        if (typeof extend === 'object') {
            content = extend;
            extend = 'Class';
        }

        this[name] = this[extend].extend(content);
        this._currentModule.classes.push(name);
        return this[name];
    },

    /**
        Create new scene.
        @method createScene
        @param {String} name
        @param {Object} content
    **/
    createScene: function(name, content) {
        return this.createClass(name, 'Scene', content);
    },

    /**
        Add attributes to class.
        @method addAttributes
        @param {String} className
        @param {Object} attributes
    **/
    addAttributes: function(className, attributes) {
        if (!this[className]) throw 'class ' + className + ' not found';

        for (var name in attributes) {
            this[className][name] = attributes[name];
        }
    },

    /**
        Define properties to class.
        @method defineProperties
        @param {String} className
        @param {Object} properties
    **/
    defineProperties: function(className, properties) {
        if (!this[className]) throw 'class ' + className + ' not found';

        for (var name in properties) {
            Object.defineProperty(this[className].prototype, name, {
                get: properties[name].get,
                set: properties[name].set
            });
        }
    },

    /**
        Vibrate device.
        @method vibrate
        @param {Number} [time] Time to vibrate (ms).
    **/
    vibrate: function(time) {
        if (navigator.vibrate) navigator.vibrate(time || 500);
    },

    /**
        Request fullscreen mode.
        @method fullscreen
    **/
    fullscreen: function() {
        if (this.system.canvas.requestFullscreen) this.system.canvas.requestFullscreen();
        else if (this.system.canvas.requestFullScreen) this.system.canvas.requestFullScreen();
    },

    /**
        Test fullscreen support.
        @method fullscreenSupport
        @return {Boolean} Return true, if browser supports fullscreen mode.
    **/
    fullscreenSupport: function() {
        return !!(this.system.canvas.requestFullscreen || this.system.canvas.requestFullScreen);
    },

    /**
        Add asset to loader.
        @method addAsset
        @param {String} path
        @param {String} [id]
    **/
    addAsset: function(path, id) {
        this._addFileToQueue(path, id, 'assetQueue');
    },

    /**
        Add audio to loader.
        @method addAudio
        @param {String} path
        @param {String} [id]
    **/
    addAudio: function(path, id) {
        this._addFileToQueue(path, id, 'audioQueue');
    },

    /**
        Get JSON data.
        @method getJSON
        @param {String} id
        @return {Object}
    **/
    getJSON: function(id) {
        return this.json[this.paths[id]];
    },

    /**
        Copy object.
        @method copy
        @param {Object} object
    **/
    copy: function(object) {
        var l, c, i;
        if (
            !object || typeof object !== 'object' ||
            object instanceof HTMLElement ||
            object instanceof this.Class ||
            (this.Container && object instanceof this.Container)
        ) {
            return object;
        }
        else if (object instanceof Array) {
            c = [];
            for (i = 0, l = object.length; i < l; i++) {
                c[i] = this.copy(object[i]);
            }
            return c;
        }
        else {
            c = {};
            for (i in object) {
                c[i] = this.copy(object[i]);
            }
            return c;
        }
    },

    /**
        Merge objects.
        @method merge
        @param {Object} to
        @param {Object} from
    **/
    merge: function(to, from) {
        for (var key in from) {
            var ext = from[key];
            if (
                typeof ext !== 'object' ||
                ext instanceof HTMLElement ||
                ext instanceof this.Class ||
                ext instanceof this.Container
            ) {
                to[key] = ext;
            }
            else {
                if (!to[key] || typeof to[key] !== 'object') {
                    to[key] = (ext instanceof Array) ? [] : {};
                }
                this.merge(to[key], ext);
            }
        }
        return to;
    },
    
    /**
        Sort object by key names.
        @method ksort
        @param {Object} obj
        @param {Function} [compare]
    **/
    ksort: function(obj, compare) {
        if (!obj || typeof obj !== 'object') return false;

        var keys = [], result = {}, i;
        for (i in obj) {
            keys.push(i);
        }
        
        keys.sort(compare);
        for (i = 0; i < keys.length; i++) {
            result[keys[i]] = obj[keys[i]];
        }

        return result;
    },

    /**
        @method _start
        @private
    **/
    _start: function() {
        if (this.moduleQueue.length > 0) return;

        // Required classes
        this.system = new this.System();
        this.renderer = new this.Renderer();
        this.system._onWindowResize();
        this.input = new this.Input(this.renderer.canvas);

        // Optional classes
        if (this.Keyboard) this.keyboard = new this.Keyboard();
        if (this.Audio) this.audio = new this.Audio();
        if (this.Pool) this.pool = new this.Pool();
        if (this.Debug && this.Debug.enabled) this.debug = new this.Debug();
        if (this.Storage && this.Storage.id) this.storage = new this.Storage();
        if (this.Analytics && this.Analytics.id) this.analytics = new this.Analytics();

        // Load plugins
        for (var name in this.plugins) {
            this.plugins[name] = new (this.plugins[name])();
        }

        var loaderClass = this.Loader.className;
        this._loader = new this[loaderClass](this.System.startScene);
        if (!this.system._rotateScreenVisible) this._loader.start();

        this.onStart();
    },

    /**
        @method _setVendorAttribute
        @private
    **/
    _setVendorAttribute: function(el, attr, val) {
        var uc = attr.ucfirst();
        el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
    },

    /**
        @method _getVendorAttribute
        @private
    **/
    _getVendorAttribute: function(el, attr) {
        var uc = attr.ucfirst();
        return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
    },

    /**
        @method _normalizeVendorAttribute
        @private
    **/
    _normalizeVendorAttribute: function(el, attr) {
        if (el[attr]) return;
        var prefixedVal = this._getVendorAttribute(el, attr);
        el[attr] = el[attr] || prefixedVal;
    },

    /**
        @method _addFileToQueue
        @param {String} path
        @param {String} id
        @param {String} queue
        @private
    **/
    _addFileToQueue: function(path, id, queue) {
        if (id && this.paths[id]) return;
        if (this.paths[path]) return;
        var realPath = this._getFilePath(path) + this._nocache;
        if (id) this.paths[id] = realPath;
        this.paths[path] = realPath;
        if (this[queue].indexOf(realPath) === -1) this[queue].push(realPath);
        return id;
    },

    /**
        @method _getFilePath
        @param {String} file
        @private
    **/
    _getFilePath: function(file) {
        if (file.indexOf('://') !== -1) return file;
        if (this.config.mediaFolder) file = this.config.mediaFolder + '/' + file;
        return file;
    },

    /**
        @method _loadScript
        @private
    **/
    _loadScript: function(name, requiredFrom) {
        this.modules[name] = true;
        this._waitForLoad++;

        var path = name.replace(/\./g, '/') + '.js' + this._nocache;
        if (this.config.sourceFolder) path = this.config.sourceFolder + '/' + path;

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = path;
        script.onload = this._scriptLoaded.bind(this);
        script.onerror = function() {
            throw 'Error loading module ' + name + ' at ' + path + ' required from ' + requiredFrom;
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    /**
        @method _scriptLoaded
        @private
    **/
    _scriptLoaded: function() {
        this._waitForLoad--;
        this._loadModules();
    },

    /**
        @method _loadModules
        @private
    **/
    _loadModules: function() {
        var moduleLoaded, i, j, module, name, dependenciesLoaded;
        for (i = 0; i < this.moduleQueue.length; i++) {
            module = this.moduleQueue[i];
            dependenciesLoaded = true;

            for (j = 0; j < module.requires.length; j++) {
                name = module.requires[j];
                if (!this.modules[name]) {
                    dependenciesLoaded = false;
                    this._loadScript(name, module.name);
                }
                else if (!this.modules[name].loaded) {
                    dependenciesLoaded = false;
                }
            }

            if (dependenciesLoaded && module.body) {
                this.moduleQueue.splice(i, 1);
                module.loaded = true;
                this._currentModule = module;
                module.body();
                moduleLoaded = true;
                i--;
                if (this.moduleQueue.length === 0) this._modulesLoaded();
            }
        }

        if (moduleLoaded && this.moduleQueue.length > 0) {
            this._loadModules();
        }
        else if (this._waitForLoad === 0 && this.moduleQueue.length !== 0) {
            var unresolved = [];
            for (i = 0; i < this.moduleQueue.length; i++) {
                var unloaded = [];
                var requires = this.moduleQueue[i].requires;
                for (j = 0; j < requires.length; j++) {
                    module = this.modules[requires[j]];
                    if (!module || !module.loaded) {
                        unloaded.push(requires[j]);
                    }
                }
                unresolved.push(this.moduleQueue[i].name + ' (requires: ' + unloaded.join(', ') + ')');
            }
            throw 'unresolved modules:\n' + unresolved.join('\n');
        }
        else {
            this._loadFinished = true;
        }
    },

    /**
        @method _modulesLoaded
        @private
    **/
    _modulesLoaded: function() {
        // Parse config
        for (var c in this.config) {
            var m = c.ucfirst();
            if (this[m]) {
                for (var o in this.config[c]) {
                    this[m][o] = this.config[c][o];
                }
            }
        }

        if (this.config.autoStart !== false && !this.system) this._start();
        else this.ready();
    },

    /**
        @method _setGameLoop
        @private
    **/
    _setGameLoop: function(callback) {
        if (this.System.frameRate) return window.setInterval(callback, 1000 / this.System.frameRate);
        if (window.requestAnimationFrame) {
            var id = this._gameLoopId++;
            this._gameLoops[id] = true;

            var animate = function() {
                if (!game._gameLoops[id]) return;
                window.requestAnimationFrame(animate);
                callback();
            };
            window.requestAnimationFrame(animate);
            return id;
        }
        else {
            return window.setInterval(callback, 1000 / 60);
        }
    },

    /**
        @method _clearGameLoop
        @private
    **/
    _clearGameLoop: function(id) {
        if (this._gameLoops[id]) delete this._gameLoops[id];
        else window.clearInterval(id);
    },

    /**
        @method _boot
        @private
    **/
    _boot: function() {
        if (this.config.noCanvasURL) {
            var canvas = document.createElement('canvas');
            var canvasSupported = !!(canvas.getContext && canvas.getContext('2d'));
            if (!canvasSupported) {
                window.location = this.config.noCanvasURL;
                return;
            }
        }

        delete window.pandaConfig;

        Math.distance = function(x, y, x2, y2) {
            x = x2 - x;
            y = y2 - y;
            return Math.sqrt(x * x + y * y);
        };

        Math._random = Math.random;
        Math.random = function(min, max) {
            if (typeof max === 'number') return Math._random() * (max - min) + min;
            else return Math._random(min);
        };

        Number.prototype.limit = function(min, max) {
            var i = this;
            if (i < min) i = min;
            if (i > max) i = max;
            return i;
        };

        Number.prototype.round = function(precision) {
            if (precision) precision = Math.pow(10, precision);
            else precision = 1;
            return Math.round(this * precision) / precision;
        };

        Number.prototype.random = function() {
            return Math.random() * this;
        };

        Array.prototype.erase = function(item) {
            for (var i = this.length; i >= 0; i--) {
                if (this[i] === item) {
                    this.splice(i, 1);
                    return this;
                }
            }
            return this;
        };

        Array.prototype.random = function() {
            return this[Math.floor(Math.random() * this.length)];
        };

        // http://jsperf.com/array-shuffle-comparator/2
        Array.prototype.shuffle = function() {
            var len = this.length;
            var i = len;
            while (i--) {
                var p = parseInt(Math.random() * len);
                var t = this[i];
                this[i] = this[p];
                this[p] = t;
            }
            return this;
        };

        Array.prototype.last = function() {
            return this[this.length - 1];
        };

        // http://jsperf.com/function-bind-performance
        Function.prototype.bind = function(context) {
            var fn = this, linked = [];
            Array.prototype.push.apply(linked, arguments);
            linked.shift();

            return function() {
                var args = [];
                Array.prototype.push.apply(args, linked);
                Array.prototype.push.apply(args, arguments);
                return fn.apply(context, args);
            };
        };

        String.prototype.ucfirst = function() {
            return this.charAt(0).toUpperCase() + this.slice(1);
        };

        this._normalizeVendorAttribute(window, 'requestAnimationFrame');
        this._normalizeVendorAttribute(navigator, 'vibrate');

        this.device.pixelRatio = window.devicePixelRatio || 1;
        this.device.screen = {
            width: window.screen.availWidth * this.device.pixelRatio,
            height: window.screen.availHeight * this.device.pixelRatio
        };

        // iPod
        this.device.iPod = /iPod/i.test(navigator.userAgent);

        // iPhone
        this.device.iPhone = /iPhone/i.test(navigator.userAgent);
        this.device.iPhone4 = (this.device.iPhone && this.device.pixelRatio === 2 && this.device.screen.height === 920);
        this.device.iPhone5 = (this.device.iPhone && this.device.pixelRatio === 2 && this.device.screen.height === 1096);

        // iPad
        this.device.iPad = /iPad/i.test(navigator.userAgent);
        this.device.iPadRetina = (this.device.iPad && this.device.pixelRatio === 2);

        // iOS
        this.device.iOS = this.device.iPod || this.device.iPhone || this.device.iPad;
        this.device.iOS5 = (this.device.iOS && /OS 5/i.test(navigator.userAgent));
        this.device.iOS6 = (this.device.iOS && /OS 6/i.test(navigator.userAgent));
        this.device.iOS7 = (this.device.iOS && /OS 7/i.test(navigator.userAgent));
        this.device.iOS71 = (this.device.iOS && /OS 7_1/i.test(navigator.userAgent));
        this.device.iOS8 = (this.device.iOS && /OS 8/i.test(navigator.userAgent));

        // Android
        this.device.android = /android/i.test(navigator.userAgent);
        this.device.android2 = /android 2/i.test(navigator.userAgent);
        var androidVer = navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
        this.device.androidStock = !!(androidVer && androidVer[1] < 537);
        
        // Internet Explorer
        this.device.ie9 = /MSIE 9/i.test(navigator.userAgent);
        this.device.ie10 = /MSIE 10/i.test(navigator.userAgent);
        this.device.ie11 = /rv:11.0/i.test(navigator.userAgent);
        this.device.ie = this.device.ie10 || this.device.ie11 || this.device.ie9;

        // Windows Phone
        this.device.wp7 = /Windows Phone OS 7/i.test(navigator.userAgent);
        this.device.wp8 = /Windows Phone 8/i.test(navigator.userAgent);
        this.device.wp = this.device.wp7 || this.device.wp8;

        // Windows Tablet
        this.device.wt = (this.device.ie && /Tablet/i.test(navigator.userAgent));

        // Others
        this.device.opera = /Opera/i.test(navigator.userAgent) || /OPR/i.test(navigator.userAgent);
        this.device.crosswalk = /Crosswalk/i.test(navigator.userAgent);
        this.device.cocoonJS = !!navigator.isCocoonJS;
        this.device.cocoonCanvasPlus = /CocoonJS/i.test(navigator.browser);
        this.device.ejecta = /Ejecta/i.test(navigator.userAgent);
        this.device.facebook = /FB/i.test(navigator.userAgent);
        this.device.wiiu = /Nintendo WiiU/i.test(navigator.userAgent);

        this.device.mobile = this.device.iOS || this.device.android || this.device.wp || this.device.wt;

        if (typeof navigator.plugins === 'undefined' || navigator.plugins.length === 0) {
            try {
                new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                this.device.flash = true;
            }
            catch (err) {
                this.device.flash = false;
            }
        }
        else {
            this.device.flash = !!navigator.plugins['Shockwave Flash'];
        }
    
        // Load device specific config
        for (var i in this.device) {
            if (this.device[i] && this.config[i]) {
                for (var o in this.config[i]) {
                    if (typeof this.config[i][o] === 'object') {
                        this.merge(this.config[o], this.config[i][o]);
                    }
                    else {
                        this.config[o] = this.config[i][o];
                    }
                }
            }
        }

        if (document.location.href.match(/\?nocache/) || this.config.disableCache) this._nocache = '?' + Date.now();

        // Default config
        if (typeof this.config.sourceFolder === 'undefined') this.config.sourceFolder = 'src';
        if (typeof this.config.mediaFolder === 'undefined') this.config.mediaFolder = 'media';

        if (this.device.mobile) {
            // Search for viewport meta
            var metaTags = document.getElementsByTagName('meta');
            for (i = 0; i < metaTags.length; i++) {
                if (metaTags[i].name === 'viewport') {
                    var viewportFound = true;
                    break;
                }
            }

            // Add viewport meta, if none found
            if (!viewportFound) {
                var viewport = document.createElement('meta');
                viewport.name = 'viewport';
                var content = 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no';
                if (this.device.iOS71) content += ',minimal-ui';
                viewport.content = content;
                document.getElementsByTagName('head')[0].appendChild(viewport);
            }
        }

        // Init device motion
        if (this.device.mobile) {
            window.addEventListener('devicemotion', function(event) {
                game.devicemotion = event.accelerationIncludingGravity;
            });
        }

        this.module('engine.core');

        if (document.readyState === 'complete') {
            this._DOMReady();
        }
        else {
            document.addEventListener('DOMContentLoaded', this._DOMReady.bind(this), false);
            window.addEventListener('load', this._DOMReady.bind(this), false);
        }
    },

    /**
        @method _DOMReady
        @private
    **/
    _DOMReady: function() {
        if (!this._DOMLoaded) {
            if (!document.body) return setTimeout(this._DOMReady.bind(this), 13);
            this._DOMLoaded = true;
            if (this._gameModuleDefined) this._loadModules();
        }
    }
};

game.Core = game;

/**
    @class Class
**/
game.Class = function() {};
/**
    Extend class.
    @method extend
    @static
    @param {Object} prop
    @return {Class}
**/
game.Class.extend = function(prop) {
    var parent = this.prototype;
    game._initializing = true;
    var prototype = new this();
    game._initializing = false;

    var makeFn = function(name, fn) {
        return function() {
            var tmp = this.super;
            this.super = parent[name];
            var ret = fn.apply(this, arguments);
            this.super = tmp;
            return ret;
        };
    };

    for (var name in prop) {
        if (
            typeof prop[name] === 'function' &&
            typeof parent[name] === 'function' &&
            game._fnTest.test(prop[name])
        ) {
            prototype[name] = makeFn(name, prop[name]);
        }
        else {
            prototype[name] = prop[name];
        }
    }

    function Class() {
        if (game._initializing) return this;

        for (var p in this) {
            if (typeof this[p] === 'object') {
                this[p] = game.copy(this[p]);
            }
        }
        /**
            This method is called before init.
            @method staticInit
            @static
            @param {Array} arguments
        **/
        if (this.staticInit) this.staticInit.apply(this, arguments);

        if (this.init) this.init.apply(this, arguments);
        if (game.scene && typeof this.update === 'function' && this !== game.scene) {
            game.scene.addObject(this);
        }
        return this;
    }

    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = game.Class.extend;
    /**
        Inject class.
        @method inject
        @static
        @param {Object} prop
    **/
    Class.inject = function(prop) {
        var proto = this.prototype;
        var parent = {};

        var makeFn = function(name, fn) {
            return function() {
                var tmp = this.super;
                this.super = parent[name];
                var ret = fn.apply(this, arguments);
                this.super = tmp;
                return ret;
            };
        };

        for (var name in prop) {
            if (
                typeof prop[name] === 'function' &&
                typeof proto[name] === 'function' &&
                game._fnTest.test(prop[name])
            ) {
                parent[name] = proto[name];
                proto[name] = makeFn(name, prop[name]);
            }
            else {
                proto[name] = prop[name];
            }
        }
    };

    return Class;
};

if (typeof exports !== 'undefined') exports = module.exports = game;
else game._boot();

/**
    @module game
    @class Core
**/
var game = {
    /**
        @property {Audio} audio
    **/
    audio: null,
    /**
        Engine config.
        @property {Object} config
    **/
    config: {},
    /**
        @property {Debug} debug
    **/
    debug: null,
    /**
        Device information.
        @property {Object} device
    **/
    device: {},
    /**
        Device acceleration.
        @property {DeviceAcceleration} devicemotion
    **/
    devicemotion: null,
    /**
        @property {Input} input
    **/
    input: null,
    /**
        Is engine started.
        @property {Boolean} isStarted
        @default false
    **/
    isStarted: false,
    /**
        List of JSON files.
        @property {Object} json
    **/
    json: {},
    /**
        @property {Keyboard} keyboard
    **/
    keyboard: null,
    /**
        @property {Texture} logo
    **/
    logo: null,
    /**
        Media load queue.
        @property {Array} mediaQueue
    **/
    mediaQueue: [],
    /**
        List of modules.
        @property {Object} modules
    **/
    modules: {},
    /**
        List of media paths.
        @property {Object} paths
    **/
    paths: {},
    /**
        List of plugins.
        @property {Object} plugins
    **/
    plugins: {},
    /**
        @property {Pool} pool
    **/
    pool: null,
    /**
        Scale multiplier for Retina and HiRes mode.
        @property {Number} scale
        @default 1
    **/
    scale: 1,
    /**
        @property {Storage} storage
    **/
    storage: null,
    /**
        @property {System} system
    **/
    system: null,
    /**
        Engine version.
        @property {String} version
    **/
    version: '2.0.0',
    /**
        @property {Boolean} _booted
        @private
    **/
    _booted: false,
    /**
        @property {Array} _coreModules
        @private
    **/
    _coreModules: [
        'engine.audio',
        'engine.camera',
        'engine.debug',
        'engine.geometry',
        'engine.input',
        'engine.loader',
        'engine.particle',
        'engine.physics',
        'engine.pool',
        'engine.renderer.core',
        'engine.scene',
        'engine.storage',
        'engine.system',
        'engine.timer',
        'engine.tween'
    ],
    /**
        @property {Object} _current
        @private
    **/
    _current: null,
    /**
        @property {Object} _currentModule
        @private
    **/
    _currentModule: null,
    /**
        @property {Boolean} _DOMLoaded
        @private
    **/
    _DOMLoaded: false,
    /**
        @property {Function} _fnTest
        @private
    **/
    _fnTest: /xyz/.test(function() {
        var xyz; return xyz;
    }) ? /\bsuper\b/ : /[\D|\d]*/,
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
        @property {Boolean} _gameModuleDefined
        @private
    **/
    _gameModuleDefined: false,
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
        @property {Array} _moduleQueue
        @private
    **/
    _moduleQueue: [],
    /**
        @property {String} _nocache
        @private
    **/
    _nocache: '',
    /**
        @property {Number} _waitForLoad
        @private
    **/
    _waitForLoad: 0,

    /**
        Add asset to load queue.
        @method addAsset
        @param {String} path
        @param {String} [id]
    **/
    addAsset: function(path, id) {
        if (id && this.paths[id]) return;
        if (this.paths[path]) return;
        var realPath = this._getFilePath(path);
        if (id) this.paths[id] = realPath;
        this.paths[path] = realPath;
        if (this.mediaQueue.indexOf(realPath) === -1) this.mediaQueue.push(realPath);
        return id;
    },

    /**
        Add attributes to class.
        @method addAttributes
        @param {String} className
        @param {Object} attributes
    **/
    addAttributes: function(className, attributes) {
        if (!this[className]) throw 'Class ' + className + ' not found';

        for (var name in attributes) {
            if (this[className][name]) continue;
            this[className][name] = attributes[name];
        }
    },

    /**
        Define body for module.
        @method body
        @param {Function} body
    **/
    body: function(body) {
        this._current.body = body;
        if (!this._booted && this._current.name.indexOf('engine.') !== 0) {
            this._current = null;
            return this._boot();
        }
        this._current = null;
        if (this._loadFinished) this._loadModules();
        if (this._gameModuleDefined && this._DOMLoaded && !this._loadFinished) {
            this._loadModules();
        }
    },

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
        Copy object.
        @method copy
        @param {Object} object
        @return {Object}
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
        Create new class.
        @method createClass
        @param {String} name
        @param {String} [extend]
        @param {Object} content
        @return {Class}
    **/
    createClass: function(name, extend, content) {
        if (typeof name === 'object') return this.Class.extend(name);

        if (this[name]) throw 'Class ' + name + ' already created';

        if (typeof extend === 'object') {
            content = extend;
            extend = 'Class';
        }

        if (!this[extend]) throw 'Class ' + extend + ' not found';

        this[name] = this[extend].extend(content);
        this[name]._name = name;
        this[name]._extend = extend;
        this._currentModule.classes.push({ name: name, extend: extend });
        return this[name];
    },

    /**
        Create new scene.
        @method createScene
        @param {String} name
        @param {String} [extend]
        @param {Object} content
        @return {Scene}
    **/
    createScene: function(name, extend, content) {
        if (typeof extend === 'object') {
            content = extend;
            extend = 'Scene';
        }
        return this.createClass(name, extend, content);
    },

    /**
        Define properties to class.
        @method defineProperties
        @param {String} className
        @param {Object} properties
    **/
    defineProperties: function(className, properties) {
        if (!this[className]) throw 'Class ' + className + ' not found';

        for (var name in properties) {
            Object.defineProperty(this[className].prototype, name, {
                get: properties[name].get,
                set: properties[name].set
            });
        }
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
        Sort object by key names.
        @method ksort
        @param {Object} obj
        @param {Function} [compare]
        @return {Object}
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
        Merge objects.
        @method merge
        @param {Object} to
        @param {Object} from
        @return {Object}
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
        Define new module.
        @method module
        @param {String} name
        @chainable
    **/
    module: function(name) {
        if (this._current) throw 'Module ' + this._current.name + ' has no body';

        if (this.modules[name] && this.modules[name].body) throw 'Module ' + name + ' is already defined';

        this._current = { name: name, requires: [], loaded: false, classes: [] };
        
        if (name.indexOf('game.') === 0) {
            this._gameModuleDefined = true;
            this._current.requires.push('engine.core');
        }

        this.modules[name] = this._current;
        this._moduleQueue.push(this._current);

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
        Called, when all modules are loaded.
        @method onReady
    **/
    onReady: function() {},

    /**
        Called, when engine is started.
        @method onStart
    **/
    onStart: function() {
        this.system.loadScene(this.System.startScene);
    },

    /**
        Remove all assets from memory.
        @method removeAllAssets
    **/
    removeAllAssets: function() {
        if (game.Audio) game.Audio.clearCache();
        game.BaseTexture.clearCache();
        game.Texture.clearCache();
        game.TilingSprite.clearCache();
        this.json = {};
        this.paths = {};
    },

    /**
        Remove asset from memory.
        @method removeAsset
        @param {String} id
    **/
    removeAsset: function(id) {
        if (!this.paths[id]) return;
        var path = this.paths[id];

        if (game.Audio && game.Audio.cache[path]) delete game.Audio.cache[path];
        if (game.BaseTexture.cache[path]) delete game.BaseTexture.cache[path];
        if (game.Texture.cache[path]) delete game.Texture.cache[path];
        if (game.TilingSprite.cache[path]) {
            game.TilingSprite.cache[path].baseTexture.remove();
            game.TilingSprite.cache[path].remove();
            delete game.TilingSprite.cache[path];
        }
        if (this.json[path]) delete this.json[path];
        delete this.paths[id];
    },

    /**
        Require module.
        @method require
        @param {Array} modules
        @chainable
    **/
    require: function(modules) {
        var i, modules = Array.prototype.slice.call(arguments);
        for (i = 0; i < modules.length; i++) {
            var name = modules[i];
            if (name && this._current.requires.indexOf(name) === -1) this._current.requires.push(name);
        }
        return this;
    },

    /**
        Start engine.
        @method start
    **/
    start: function() {
        if (this._moduleQueue.length > 0 || this.isStarted) return;
        
        // Required classes
        this.system = new this.System();
        this.input = new this.Input(this.renderer.canvas);

        // Optional classes
        if (this.Keyboard) this.keyboard = new this.Keyboard();
        if (this.Audio) this.audio = new this.Audio();
        if (this.Pool) this.pool = new this.Pool();
        if (this.Storage && this.Storage.id) this.storage = new this.Storage();

        // Load plugins
        for (var name in this.plugins) {
            this.plugins[name] = new (this.plugins[name])();
        }

        if (this.Debug && this.Debug.enabled) this.debug = new this.Debug();

        this.isStarted = true;
        if (!this.system._rotateScreenVisible) this.onStart();
    },

    /**
        @method _boot
        @private
    **/
    _boot: function() {
        this._booted = true;
        this._loadNativeExtensions();
        this._loadDeviceInformation();

        this._normalizeVendorAttribute(window, 'requestAnimationFrame');
        this._normalizeVendorAttribute(navigator, 'vibrate');

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

        this.module('engine.core');

        if (document.readyState === 'complete') {
            this._DOMReady();
        }
        else {
            document.addEventListener('DOMContentLoaded', this._DOMReady.bind(this));
            window.addEventListener('load', this._DOMReady.bind(this));
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
        @method _DOMReady
        @private
    **/
    _DOMReady: function() {
        if (!this._DOMLoaded) {
            if (!document.body) return setTimeout(this._DOMReady.bind(this), 13);
            this._DOMLoaded = true;
            if (this._gameModuleDefined) this._loadModules();
        }
    },

    /**
        @method _getFilePath
        @param {String} file
        @private
        @return {String}
    **/
    _getFilePath: function(file) {
        if (file.indexOf('://') !== -1) return file;
        if (this.config.mediaFolder) file = this.config.mediaFolder + '/' + file;
        return file;
    },

    /**
        @method _getId
        @param {String} path
        @private
        @return {String}
    **/
    _getId: function(path) {
        for (var id in this.paths) {
            if (this.paths[id] === path) return id;
        }
    },

    /**
        @method _getVendorAttribute
        @param {Object} el
        @param {String} attr
        @private
        @return {Object}
    **/
    _getVendorAttribute: function(el, attr) {
        var uc = attr.ucfirst();
        return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
    },

    /**
        @method _loadDeviceInformation
        @private
    **/
    _loadDeviceInformation: function() {
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
        this.device.iOS9 = (this.device.iOS && /OS 9/i.test(navigator.userAgent));
        this.device.iOS10 = (this.device.iOS && /OS 10/i.test(navigator.userAgent));

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
        this.device.safari = /Safari/i.test(navigator.userAgent);
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
    },

    /**
        @method _loadModules
        @private
    **/
    _loadModules: function() {
        var moduleLoaded, i, j, module, name, dependenciesLoaded;
        for (i = 0; i < this._moduleQueue.length; i++) {
            module = this._moduleQueue[i];
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
                this._moduleQueue.splice(i, 1);
                module.loaded = true;
                this._currentModule = module;
                module.body();
                moduleLoaded = true;
                i--;
                if (this._moduleQueue.length === 0) this._ready();
            }
        }

        if (moduleLoaded && this._moduleQueue.length > 0) {
            this._loadModules();
        }
        else if (this._waitForLoad === 0 && this._moduleQueue.length !== 0) {
            var unresolved = [];
            for (i = 0; i < this._moduleQueue.length; i++) {
                var unloaded = [];
                var requires = this._moduleQueue[i].requires;
                for (j = 0; j < requires.length; j++) {
                    module = this.modules[requires[j]];
                    if (!module || !module.loaded) {
                        unloaded.push(requires[j]);
                    }
                }
                unresolved.push(this._moduleQueue[i].name + ' (requires: ' + unloaded.join(', ') + ')');
            }
            throw 'Unresolved modules:\n' + unresolved.join('\n');
        }
        else {
            this._loadFinished = true;
        }
    },

    /**
        @method _loadNativeExtensions
        @private
    **/
    _loadNativeExtensions: function() {
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
        @method _normalizeVendorAttribute
        @param {Object} el
        @param {String} attr
        @private
    **/
    _normalizeVendorAttribute: function(el, attr) {
        if (el[attr]) return;
        var prefixedVal = this._getVendorAttribute(el, attr);
        el[attr] = el[attr] || prefixedVal;
    },

    /**
        Called, when all modules are loaded.
        @method _ready
        @private
    **/
    _ready: function() {
        // Parse config
        for (var c in this.config) {
            var m = c.ucfirst();
            if (this[m]) {
                for (var o in this.config[c]) {
                    this[m][o] = this.config[c][o];
                }
            }
        }

        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 120;
        var ctx = canvas.getContext('2d');
        var source = document.createElement('img');
        source.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4BAMAAADLSivhAAAAMFBMVEUAAAD4uABHR0f4uABHR0f4uAD4uAD4uABHR0dHR0dHR0f4uABHR0f4uABHR0f4uADRufxZAAAADnRSTlMAqqpV6aNEJFDJlHQb44EUTvwAAADvSURBVFjD7dkhDsIwFMbxQsIEIJiYIiRk4QYIJAkKReAGuwMHwOwcCwdAwA3QOO6AmalBTAJhGa9dspa3dGLJ9/c/t2bvtSKWhtbC3MaEHxYsjQEDtwB7O19pzMOHl9aZhZc6HgEDO8EpfZ52vAr1TuWDMTHgqbDUAQYGdox7Od7Wwl6OIw6m9vNPC8HHFDAw8L9L2ZGJY8WmV9Fkw0TbNHn19U2TV1eqAQMDGzD9tPmYxgU+pkGFj2lEAgYGdozv/rfgd65vod6sElNZgRNZzo6fBZbAwE7wQMcZC4uLrxREbbnABgaurMHnP8vD4xvY9ByhjWrtdAAAAABJRU5ErkJggg==';
        source.onload = function() {
            ctx.drawImage(source, 0, 0);
        };
        this.logo = new game.Texture(new game.BaseTexture(canvas));

        if (!this.onReady()) {
            if (this.config.autoStart !== false) this.start();
        }
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
        @method _setGameLoop
        @private
        @return {Number}
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
        @method _setVendorAttribute
        @param {Object} el
        @param {String} attr
        @param {*} val
        @private
    **/
    _setVendorAttribute: function(el, attr, val) {
        var uc = attr.ucfirst();
        el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
    }
};

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
            Called before init.
            @method staticInit
            @param {Array} arguments
            @return {Boolean} return true, to skip init function.
        **/
        var skipInit = false;
        if (this.staticInit) skipInit = this.staticInit.apply(this, arguments);
        /**
            Called, when creating new instance of class.
            @method init
            @param {Array} arguments
            @return {Boolean} return true, to skip adding class with update function automatically to the scene.
        **/
        var skipAdd = false;
        if (this.init && !skipInit) skipAdd = this.init.apply(this, arguments);
        if (!skipAdd && game.scene && typeof this.update === 'function' && this !== game.scene) {
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
    /**
        Name of the class that this class is extended from.
        @attribute {String} _extend
        @private
    **/
    /**
        Name of the class.
        @attribute {String} _name
        @private
    **/

    return Class;
};

if (typeof exports !== 'undefined') exports = module.exports = game;

// Panda.js HTML5 game engine

// created by Eemeli Kelokorpi
// inspired by Impact Game Engine
// sponsored by Yle

'use strict';

/**
    @module game
    @namespace game
    @requires loader
    @requires timer
    @requires system
    @requires audio
    @requires debug
    @requires storage
    @requires tween
    @requires scene
    @requires pool
    @requires analytics
**/
/**
    @class Core
**/
var game = {
    /**
        Current engine version.
        @property {String} version
    **/
    version: '1.10.1',
    /**
        Engine settings.
        @property {Object} config
    **/
    config: typeof pandaConfig !== 'undefined' ? pandaConfig : {},
    coreModules: [
        'engine.analytics',
        'engine.audio',
        'engine.camera',
        'engine.debug',
        'engine.keyboard',
        'engine.loader',
        'engine.particle',
        'engine.physics',
        'engine.pixi',
        'engine.pool',
        'engine.renderer',
        'engine.scene',
        'engine.storage',
        'engine.system',
        'engine.timer',
        'engine.tween'
    ],
    /**
        Scale factor for Retina and HiRes mode.
        @property {Number} scale
    **/
    scale: 1,
    /**
        Instance of current {{#crossLink "game.Scene"}}{{/crossLink}}.
        @property {game.Scene} scene
    **/
    scene: null,
    /**
        Instance of {{#crossLink "game.Debug"}}{{/crossLink}}.
        @property {game.Debug} debug
    **/
    debug: null,
    /**
        Instance of {{#crossLink "game.System"}}{{/crossLink}}.
        @property {game.System} system
    **/
    system: null,
    /**
        Instance of {{#crossLink "game.SoundManager"}}{{/crossLink}}.
        @property {game.SoundManager} sound
    **/
    sound: null,
    /**
        Instance of {{#crossLink "game.Pool"}}{{/crossLink}}.
        @property {game.Pool} pool
    **/
    pool: null,
    /**
        Instance of {{#crossLink "game.Storage"}}{{/crossLink}}.
        @property {game.Storage} storage
    **/
    storage: null,
    /**
        Instance of {{#crossLink "game.Keyboard"}}{{/crossLink}}.
        @property {game.Keyboard} keyboard
    **/
    keyboard: null,
    /**
        Device / browser detection.
        @property {Object} device
    **/
    device: {},
    paths: {},
    plugins: {},
    json: {},
    modules: {},
    renderer: null,
    nocache: '',
    current: null,
    waitForLoad: 0,
    DOMLoaded: false,
    next: 1,
    anims: {},
    moduleQueue: [],
    assetQueue: [],
    audioQueue: [],

    /**
        Get JSON data.
        @method getJSON
        @param {String} id
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

    ksort: function(obj) {
        if (!obj || typeof obj !== 'object') return false;

        var keys = [], result = {}, i;
        for (i in obj) {
            keys.push(i);
        }
        
        keys.sort();
        for (i = 0; i < keys.length; i++) {
            result[keys[i]] = obj[keys[i]];
        }

        return result;
    },

    setVendorAttribute: function(el, attr, val) {
        var uc = attr.ucfirst();
        el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
    },

    getVendorAttribute: function(el, attr) {
        var uc = attr.ucfirst();
        return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
    },

    normalizeVendorAttribute: function(el, attr) {
        var prefixedVal = this.getVendorAttribute(el, attr);
        if (el[attr]) return;
        el[attr] = el[attr] || prefixedVal;
    },

    /**
        Request fullscreen mode.
        @method fullscreen
    **/
    fullscreen: function() {
        if (this.system.canvas.requestFullscreen) this.system.canvas.requestFullscreen();
        if (this.system.canvas.requestFullScreen) this.system.canvas.requestFullScreen();
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
        @return {String} id
    **/
    addAsset: function(path, id) {
        return this.addFileToQueue(path, id, 'assetQueue');
    },

    /**
        Add multiple assets to loader.
        @method addAssets
        @param {Array} assets
    **/
    addAssets: function(assets) {
        for (var i = 0; i < assets.length; i++) {
            this.addAsset(assets[i]);
        }
    },

    /**
        Add audio to loader.
        @method addAudio
        @param {String} path
        @param {String} [id]
        @return {String} id
    **/
    addAudio: function(path, id) {
        return this.addFileToQueue(path, id, 'audioQueue');
    },

    addFileToQueue: function(path, id, queue) {
        id = id || path;
        path = path + this.nocache;
        if (this.config.mediaFolder) path = this.config.mediaFolder + '/' + path;
        if (this.paths[id]) return id;
        this.paths[id] = path;
        if (this[queue].indexOf(path) === -1) this[queue].push(path);
        return id;
    },

    /**
        Remove asset from memory.
        @method removeAsset
        @param {String} id
    **/
    removeAsset: function(id) {
        var path = this.paths[id];
        if (this.json[path] && this.json[path].frames) {
            // Sprite sheet
            for (var key in this.json[path].frames) {
                this.TextureCache[key].destroy(true);
                delete this.TextureCache[key];
            }
        }
        else if (this.TextureCache[path]) {
            // Sprite
            this.TextureCache[path].destroy(true);
            delete this.TextureCache[path];
        }
        delete this.paths[id];
    },

    /**
        Remove all assets from memory.
        @method removeAssets
    **/
    removeAssets: function() {
        for (var key in this.TextureCache) {
            this.TextureCache[key].destroy(true);
            delete this.TextureCache[key];
        }
        this.paths = {};
    },

    /**
        Define new module.
        @method module
        @param {String} name
    **/
    module: function(name) {
        if (this.current) throw('Module ' + this.current.name + ' has no body');
        if (this.modules[name] && this.modules[name].body) throw('Module ' + name + ' is already defined');

        this.current = { name: name, requires: [], loaded: false, body: null };
        if (name === 'game.main') this.current.requires.push('engine.core');
        this.modules[name] = this.current;
        this.moduleQueue.push(this.current);

        if (this.current.name === 'engine.core') {
            if (this.config.ignoreModules) {
                for (var i = this.coreModules.length - 1; i >= 0; i--) {
                    if (this.config.ignoreModules.indexOf(this.coreModules[i]) !== -1) this.coreModules.splice(i, 1);
                }
            }
            this.current.requires = this.coreModules;
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
            if (modules[i] && this.current.requires.indexOf(modules[i]) === -1) this.current.requires.push(modules[i]);
        }
        return this;
    },

    /**
        Define body for module.
        @method body
        @param {Function} body
    **/
    body: function(body) {
        this.current.body = body;
        this.current = null;
        if (this.loadFinished) this.loadModules();
    },

    /**
        Start the game engine.
        @method start
    **/
    start: function(scene, width, height) {
        if (this.moduleQueue.length > 0) return;

        this.system = new this.System(width, height);

        if (this.Audio) this.audio = new this.Audio();

        if (game.Debug && game.Debug.enabled) {
            console.log('Panda.js ' + game.version);
            console.log('Pixi.js ' + game.PIXI.VERSION.replace('v', ''));
            console.log((this.system.renderer.gl ? 'WebGL' : 'Canvas') + ' renderer ' + this.system.width + 'x' + this.system.height);
            if (this.Audio && this.Audio.enabled) console.log((this.audio.context ? 'Web Audio' : 'HTML5 Audio') + ' engine');
            else console.log('Audio disabled');
            if (this.config.version) console.log((this.config.name ? this.config.name : 'Game') + ' ' + this.config.version);
        }

        if (this.Pool) this.pool = new this.Pool();
        if (this.DebugDraw && this.DebugDraw.enabled) this.debugDraw = new this.DebugDraw();
        if (this.Storage && this.Storage.id) this.storage = new this.Storage(this.Storage.id);
        if (this.Analytics && this.Analytics.id) this.analytics = new this.Analytics(this.Analytics.id);
        if (this.TweenEngine) this.tweenEngine = new this.TweenEngine();

        // Load plugins
        for (var name in this.plugins) {
            this.plugins[name] = new (this.plugins[name])();
        }

        this.loader = new (this.Loader)(scene);
        if (!this.system.rotateScreenVisible) this.loader.start();
    },

    loadScript: function(name, requiredFrom) {
        this.modules[name] = true;
        this.waitForLoad++;

        var path = name.replace(/\./g, '/') + '.js' + this.nocache;
        if (this.config.sourceFolder) path = this.config.sourceFolder + '/' + path;

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = path;
        var me = this;
        script.onload = function() {
            me.waitForLoad--;
            me.loadModules();
        };
        script.onerror = function() {
            throw('Failed to load module ' + name + ' at ' + path + ' required from ' + requiredFrom);
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    loadModules: function() {
        var moduleLoaded, i, j, module, name, dependenciesLoaded;
        for (i = 0; i < this.moduleQueue.length; i++) {
            module = this.moduleQueue[i];
            dependenciesLoaded = true;

            for (j = 0; j < module.requires.length; j++) {
                name = module.requires[j];
                if (!this.modules[name]) {
                    dependenciesLoaded = false;
                    this.loadScript(name, module.name);
                }
                else if (!this.modules[name].loaded) {
                    dependenciesLoaded = false;
                }
            }

            if (dependenciesLoaded && module.body) {
                this.moduleQueue.splice(i, 1);
                if (this.moduleQueue.length === 0) {
                    // Last module loaded, parse config
                    for (var c in this.config) {
                        var m = c.ucfirst();
                        if (this[m]) {
                            for (var o in this.config[c]) {
                                this[m][o] = this.config[c][o];
                            }
                        }
                    }
                }
                module.loaded = true;
                module.body(this);
                moduleLoaded = true;
                i--;
                if (this.moduleQueue.length === 0 && this.config.autoStart !== false && !this.system) this.start();
            }
        }

        if (moduleLoaded && this.moduleQueue.length > 0) {
            this.loadModules();
        }
        else if (this.waitForLoad === 0 && this.moduleQueue.length !== 0) {
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
            throw('Unresolved modules:\n' + unresolved.join('\n'));
        }
        else {
            this.loadFinished = true;
        }
    },

    setGameLoop: function(callback, element) {
        if (window.requestAnimationFrame) {
            var current = this.next++;
            this.anims[current] = true;

            var me = this;
            var animate = function() {
                if (!me.anims[current]) return;
                window.requestAnimationFrame(animate, element);
                callback();
            };
            window.requestAnimationFrame(animate, element);
            return current;
        }
        else {
            return window.setInterval(callback, 1000 / 60);
        }
    },

    clearGameLoop: function(id) {
        if (window.requestAnimationFrame) {
            delete this.anims[id];
        }
        else {
            window.clearInterval(id);
        }
    },

    boot: function() {
        if (game.config.noCanvasURL) {
            var canvas = document.createElement('canvas');
            var canvasSupported = !!(canvas.getContext && canvas.getContext('2d'));
            if (!canvasSupported) window.location = game.config.noCanvasURL;
        }

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
            return parseFloat(i);
        };

        Number.prototype.round = function(precision) {
            if (precision) precision = Math.pow(10, precision);
            else precision = 1;
            return Math.round(this * precision) / precision;
        };

        Array.prototype.erase = function(item) {
            for (var i = this.length; i >= 0; i--) {
                if (this[i] === item) this.splice(i, 1);
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

        this.module('engine.core');

        game.normalizeVendorAttribute(window, 'requestAnimationFrame');

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
        this.device.androidStock = (androidVer && androidVer[1] < 537);
        
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
        this.device.opera = /Opera/i.test(navigator.userAgent) || /OPR/i.test(navigator.userAgent);
        this.device.crosswalk = /Crosswalk/i.test(navigator.userAgent);
        this.device.cocoonJS = !!navigator.isCocoonJS;
        this.device.ejecta = /Ejecta/i.test(navigator.userAgent);
        this.device.facebook = /FB/i.test(navigator.userAgent);

        this.device.mobile = this.device.iOS || this.device.android || this.device.wp || this.device.wt;

        if (typeof navigator.plugins === 'undefined' || navigator.plugins.length === 0) {
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

        if (document.location.href.match(/\?nocache/) || this.config.disableCache) this.nocache = '?' + Date.now();

        if (typeof this.config.sourceFolder === 'undefined') this.config.sourceFolder = 'src';
        if (typeof this.config.mediaFolder === 'undefined') this.config.mediaFolder = 'media';

        var metaTags = document.getElementsByTagName('meta');
        var viewportFound = false;

        for (i = 0; i < metaTags.length; i++) {
            if (metaTags[i].name === 'viewport') viewportFound = true;
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

        if (document.readyState === 'complete') {
            this.DOMReady();
        }
        else {
            document.addEventListener('DOMContentLoaded', this.DOMReady.bind(this), false);
            window.addEventListener('load', this.DOMReady.bind(this), false);
        }
    },

    DOMReady: function() {
        if (!this.DOMLoaded) {
            if (!document.body) return setTimeout(this.DOMReady.bind(this), 13);
            this.DOMLoaded = true;
            this.loadModules();
        }
    },

    createClass: function(name, extend, content) {
        if (game[name]) throw 'Class ' + name + ' already exist';

        if (typeof extend === 'object') {
            content = extend;
            extend = 'Class';
        }

        return game[name] = game[extend].extend(content);
    },

    createScene: function(name, content) {
        return this.createClass('Scene' + name, 'Scene', content);
    },

    addAttributes: function(className, attributes) {
        if (!this[className]) throw 'Class ' + className + ' not found';

        for (var name in attributes) {
            this[className][name] = attributes[name];
        }
    }
};

// http://ejohn.org/blog/simple-javascript-inheritance/
game.initializing = false;
game.fnTest = /xyz/.test(function() {
    var xyz; return xyz;
}) ? /\b_super\b/ : /[\D|\d]*/;

/**
    Base class.
    @class Class
**/
game.Class = function() {};

/**
    Extend class.
    @method extend
    @param {Object} prop
    @return {game.Class} Returns extended class
**/
game.Class.extend = function(prop) {
    var parent = this.prototype;
    game.initializing = true;
    var prototype = new this();
    game.initializing = false;

    var makeFn = function(name, fn) {
        return function() {
            /**
                Call functions parent function.
                @method _super
                @param {Array} arguments
            **/
            var tmp = this._super;
            this._super = parent[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
        };
    };

    for (var name in prop) {
        if (
            typeof prop[name] === 'function' &&
            typeof parent[name] === 'function' &&
            game.fnTest.test(prop[name])
        ) {
            prototype[name] = makeFn(name, prop[name]);
        }
        else {
            prototype[name] = prop[name];
        }
    }

    function Class() {
        if (!game.initializing) {
            if (this.staticInit) {
                /**
                    This method is called before init.
                    @method staticInit
                    @param {Array} arguments
                **/
                var obj = this.staticInit.apply(this, arguments);
                if (obj) {
                    return obj;
                }
            }
            for (var p in this) {
                if (typeof this[p] === 'object') {
                    this[p] = game.copy(this[p]);
                }
            }
            if (this.init) {
                /**
                    This method is called, when you create new instance of the class.
                    @method init
                    @param {Array} arguments
                **/
                this.init.apply(this, arguments);
            }
        }
        return this;
    }

    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = game.Class.extend;
    /**
        Inject class.
        @method inject
        @param {Object} prop
    **/
    Class.inject = function(prop) {
        var proto = this.prototype;
        var parent = {};

        var makeFn = function(name, fn) {
            return function() {
                var tmp = this._super;
                this._super = parent[name];
                var ret = fn.apply(this, arguments);
                this._super = tmp;
                return ret;
            };
        };

        for (var name in prop) {
            if (
                typeof prop[name] === 'function' &&
                typeof proto[name] === 'function' &&
                game.fnTest.test(prop[name])
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
else game.boot();

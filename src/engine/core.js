// Panda.js HTML5 game engine

// created by Eemeli Kelokorpi
// inspired by Impact Game Engine
// sponsored by Yle

(function(window) { 'use strict';

if(typeof(global) !== 'undefined' && global.game) return;
/**
    @module core
    @namespace game
    @requires loader
    @requires timer
    @requires system
    @requires audio
    @requires sprite
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
var core = {
    version: '1.3.1',
    config: window.pandaConfig || {},
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
    assets: {},
    plugins: {},
    json: {},
    renderer: null,
    modules: {},
    resources: [],
    nocache: '',
    current: null,
    loadQueue: [],
    waitForLoad: 0,
    DOMLoaded: false,
    
    getJSON: function(id) {
        return this.json[this.assets[id]];
    },

    copy: function(object) {
        var l,c,i;
        if(
            !object || typeof(object) !== 'object' ||
            object instanceof HTMLElement ||
            object instanceof game.Class ||
            (game.Container && object instanceof game.Container)
        ) {
            return object;
        }
        else if(object instanceof Array) {
            c = [];
            for(i = 0, l = object.length; i < l; i++) {
                c[i] = game.copy(object[i]);
            }
            return c;
        }
        else {
            c = {};
            for(i in object) {
                c[i] = game.copy(object[i]);
            }
            return c;
        }
    },
    
    merge: function(original, extended) {
        for(var key in extended) {
            var ext = extended[key];
            if(
                typeof(ext) !== 'object' ||
                ext instanceof HTMLElement ||
                ext instanceof game.Class ||
                ext instanceof game.Container
            ) {
                original[key] = ext;
            }
            else {
                if(!original[key] || typeof(original[key]) !== 'object') {
                    original[key] = (ext instanceof Array) ? [] : {};
                }
                game.merge(original[key], ext);
            }
        }
        return original;
    },
    
    ksort: function(obj) {
        if(!obj || typeof(obj) !== 'object') return false;
        
        var keys = [], result = {}, i;
        for(i in obj ) {
            keys.push(i);
        }
        keys.sort();
        for(i = 0; i < keys.length; i++ ) {
            result[keys[i]] = obj[keys[i]];
        }
        
        return result;
    },

    setVendorAttribute: function(el, attr, val) {
        var uc = attr.ucfirst();
        el[attr] = el['ms'+uc] = el['moz'+uc] = el['webkit'+uc] = el['o'+uc] = val;
    },

    getVendorAttribute: function(el, attr) {
        var uc = attr.ucfirst();
        return el[attr] || el['ms'+uc] || el['moz'+uc] || el['webkit'+uc] || el['o'+uc];
    },

    normalizeVendorAttribute: function(el, attr) {
        var prefixedVal = this.getVendorAttribute(el, attr);
        if(el[attr]) return;
        el[attr] = el[attr] || prefixedVal;
    },

    /**
        Request fullscreen mode.
        @method fullscreen
    **/
    fullscreen: function() {
        if(game.system.canvas.requestFullscreen) game.system.canvas.requestFullscreen();
        if(game.system.canvas.requestFullScreen) game.system.canvas.requestFullScreen();
    },

    /**
        @method fullscreenSupport
        @return {Boolean} Return true, if browser supports fullscreen mode.
    **/
    fullscreenSupport: function() {
        return !!(game.system.canvas.requestFullscreen || game.system.canvas.requestFullScreen);
    },

    /**
        Add asset to loader.
        @method addAsset
        @param {String} path
        @param {String} [id]
        @return {String} id
    **/
    addAsset: function(path, id) {
        id = id || path;
        path = this.config.mediaFolder + path + this.nocache;
        this.assets[id] = path;
        if(this.resources.indexOf(path) === -1) this.resources.push(path);
        return id;
    },

    /**
        Add audio to loader.
        @method addAudio
        @param {String} path
        @param {String} [id]
        @return {String} id
    **/
    addAudio: function(path, id) {
        id = id || path;
        path = this.config.mediaFolder + path + this.nocache;
        game.Audio.queue[path] = id;
        return id;
    },

    /**
        Define new module.
        @method module
        @param {String} name
        @param {String} [version]
    **/
    module: function(name, version) {
        if(this.current) throw('Module ' + this.current.name + ' has no body');
        if(this.modules[name] && this.modules[name].body) throw('Module ' + name + ' is already defined');
        
        this.current = {name: name, requires: [], loaded: false, body: null, version: version};
        if(name === 'game.main') this.current.requires.push('engine.core');
        this.modules[name] = this.current;
        this.loadQueue.push(this.current);
        return this;
    },

    /**
        Require modules for module.
        @method require
        @param {Array} modules
    **/
    require: function() {
        var i, modules = Array.prototype.slice.call(arguments);
        for (i = 0; i < modules.length; i++) {
            if(modules[i] && this.current.requires.indexOf(modules[i]) === -1) this.current.requires.push(modules[i]);
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
        if(this.initDOMReady) this.initDOMReady();
        else if(this.loadFinished) this.loadModules();
    },

    /**
        Start the game engine.
        @method start
        @param {game.Scene} [scene] Starting scene.
        @param {Number} [width] Width of canvas.
        @param {Number} [height] Height of canvas.
        @param {game.Loader} [loaderClass] Custom loader class.
        @param {String} [canvasId] Id of canvas element.
    **/
    start: function(scene, width, height, loaderClass, canvasId) {
        if(this.loadQueue.length > 0) throw('Core not ready.');

        this.system = new game.System(width, height, canvasId);

        if(game.Audio) this.audio = new game.Audio();
        if(game.Pool) this.pool = new game.Pool();
        if(game.DebugDraw && game.DebugDraw.enabled) this.debugDraw = new game.DebugDraw();
        if(game.Storage && game.Storage.id) this.storage = new game.Storage(game.Storage.id);
        if(game.Analytics && game.Analytics.id) this.analytics = new game.Analytics(game.Analytics.id);
        if(game.TweenEngine) game.tweenEngine = new game.TweenEngine();

        // Load plugins
        for(var name in this.plugins) {
            this.plugins[name] = new (this.plugins[name])();
        }
        
        this.loader = loaderClass || game.Loader;
        var loader = new this.loader(window[game.System.startScene] || game[game.System.startScene] || scene);
        loader.start();
    },

    Math: {
        /**
            Distance between two points.
            @method Math.distance
            @param {Number} x
            @param {Number} y
            @param {Number} x2
            @param {Number} y2
            @return {Number}
        **/
        distance: function(x, y, x2, y2) {
            x = x2 - x;
            y = y2 - y;
            return Math.sqrt(x * x + y * y);
        },

        /**
            Generate random number between `min` and `max`.
            @method Math.random
            @param {Number} min
            @param {Number} max
        **/
        random: function(min, max) {
            return Math.random() * (max - min) + min;
        }
    },
    
    loadScript: function(name, requiredFrom) {
        this.modules[name] = true;
        this.waitForLoad++;
        
        var path = this.config.sourceFolder + '/' + name.replace(/\./g, '/') + '.js' + this.nocache;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = path;
        script.onload = function() {
            game.waitForLoad--;
            game.loadModules();
        };
        script.onerror = function() {
            throw('Failed to load module ' + name + ' at ' + path + ' required from ' + requiredFrom);
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    },
    
    loadModules: function() {
        var moduleLoaded, i, j, module, name, dependenciesLoaded;
        for(i = 0; i < game.loadQueue.length; i++) {
            module = game.loadQueue[i];
            dependenciesLoaded = true;
            
            for(j = 0; j < module.requires.length; j++) {
                name = module.requires[j];
                if(!game.modules[name]) {
                    dependenciesLoaded = false;
                    game.loadScript(name, module.name);
                }
                else if(!game.modules[name].loaded) {
                    dependenciesLoaded = false;
                }
            }
            
            if(dependenciesLoaded && module.body) {
                game.loadQueue.splice(i, 1);
                if(game.loadQueue.length === 0) {
                    // Last module loaded, parse config
                    for(var c in this.config) {
                        var m = c.ucfirst();
                        if(game[m]) {
                            for(var o in this.config[c]) {
                                game[m][o] = this.config[c][o];
                            }
                        }
                    }
                }
                module.loaded = true;
                module.body();
                moduleLoaded = true;
                i--;
            }
        }
        
        if(moduleLoaded && this.loadQueue.length > 0) {
            game.loadModules();
        }
        else if(game.waitForLoad === 0 && game.loadQueue.length !== 0) {
            var unresolved = [];
            for(i = 0; i < game.loadQueue.length; i++ ) {
                var unloaded = [];
                var requires = game.loadQueue[i].requires;
                for(j = 0; j < requires.length; j++ ) {
                    module = game.modules[requires[j]];
                    if(!module || !module.loaded) {
                        unloaded.push(requires[j]);
                    }
                }
                unresolved.push(game.loadQueue[i].name + ' (requires: ' + unloaded.join(', ') + ')');
            }
            throw('Unresolved modules:\n' + unresolved.join('\n'));
        } else {
            this.loadFinished = true;
        }
    },
    
    boot: function() {
        if(document.location.href.match(/\?nocache/)) this.nocache = '?' + Date.now();

        this.device.pixelRatio = window.devicePixelRatio || 1;
        this.device.screen = {
            width: window.screen.availWidth * this.device.pixelRatio,
            height: window.screen.availHeight * this.device.pixelRatio
        };
        
        // iPhone
        this.device.iPhone = /iPhone/i.test(navigator.userAgent);
        this.device.iPhone4 = (this.device.iPhone && this.device.pixelRatio === 2);
        this.device.iPhone5 = (this.device.iPhone && this.device.pixelRatio === 2 && this.device.screen.height === 1096);

        // iPad
        this.device.iPad = /iPad/i.test(navigator.userAgent);
        this.device.iPadRetina = (this.device.iPad && this.device.pixelRatio === 2);
        
        // iOS
        this.device.iOS = this.device.iPhone || this.device.iPad;
        this.device.iOS5 = (this.device.iOS && /OS 5/i.test(navigator.userAgent));
        this.device.iOS6 = (this.device.iOS && /OS 6/i.test(navigator.userAgent));
        this.device.iOS7 = (this.device.iOS && /OS 7/i.test(navigator.userAgent));
        this.device.iOS71 = (this.device.iOS && /OS 7_1/i.test(navigator.userAgent));

        // Android
        this.device.android = /android/i.test(navigator.userAgent);
        this.device.android2 = /android 2/i.test(navigator.userAgent);

        // Internet Explorer
        this.device.ie9 = /MSIE 9/i.test(navigator.userAgent);
        this.device.ie10 = /MSIE 10/i.test(navigator.userAgent);
        this.device.ie11 = /rv:11.0/i.test(navigator.userAgent);
        this.device.ie = this.device.ie10 || this.device.ie11 || this.device.ie9;

        // Windows Phone
        this.device.wp7 = /Windows Phone OS 7/i.test(navigator.userAgent);
        this.device.wp8 = /Windows Phone 8/i.test(navigator.userAgent);
        this.device.wp = this.device.wp7 || this.device.wp8;
        this.device.wpApp = (this.device.wp && typeof(window.external) !== 'undefined' && typeof(window.external.notify) !== 'undefined');

        // Windows Tablet
        this.device.wt = (this.device.ie && /Tablet/i.test(navigator.userAgent));
        
        // Others
        this.device.opera = /Opera/i.test(navigator.userAgent);
        this.device.crosswalk = /Crosswalk/i.test(navigator.userAgent);
        this.device.cocoonJS = !!navigator.isCocoonJS;
        this.device.ejecta = /Ejecta/i.test(navigator.userAgent);

        this.device.mobile = this.device.iOS || this.device.android || this.device.wp || this.device.wt;

        if(typeof(navigator.plugins) === 'undefined' || navigator.plugins.length === 0) {
            try {
                new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                this.device.flash = true;
            }
            catch(err) {
                this.device.flash = false;
            }
        } else {
            this.device.flash = !!navigator.plugins['Shockwave Flash'];
        }

        // This is going to be used on Windows Phone App
        // if(this.device.wp) {
        //     if (typeof(window.external.notify) !== 'undefined') {
        //         window.console.log = function(message) {
        //             window.external.notify(message);
        //         };
        //     }
        // }
        
        var i;
        if(this.device.iOS && this.config.iOS) {
            for(i in this.config.iOS) this.config[i] = this.config.iOS[i];
        }

        if(this.device.android && this.config.android) {
            for(i in this.config.android) this.config[i] = this.config.android[i];
        }

        if(this.device.wp && this.config.wp) {
            for(i in this.config.wp) this.config[i] = this.config.wp[i];
        }

        this.config.sourceFolder = this.config.sourceFolder || 'src';
        this.config.mediaFolder = this.config.mediaFolder ?  this.config.mediaFolder + '/' : '';

        var metaTags = document.getElementsByTagName('meta');
        var viewportFound = false;
        
        for (i = 0; i < metaTags.length; i++) {
            if(metaTags[i].name === 'viewport') viewportFound = true;
        }

        if(!viewportFound) {
            var viewport = document.createElement('meta');
            viewport.name = 'viewport';
            var content = 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no';
            if(this.device.iOS71) content += ',minimal-ui';
            viewport.content = content;
            document.getElementsByTagName('head')[0].appendChild(viewport);
        }
    },

    DOMReady: function() {
        if(!game.DOMLoaded) {
            if(!document.body) return setTimeout(game.DOMReady, 13);
            game.DOMLoaded = true;
            game.loadModules();
        }
    },
    
    initDOMReady: function() {
        this.initDOMReady = null;
        this.boot();
        if (document.readyState === 'complete') this.DOMReady();
        else {
            document.addEventListener('DOMContentLoaded', this.DOMReady, false);
            window.addEventListener('load', this.DOMReady, false);
        }
    }
};

window.game = core;

var elem = document.createElement('canvas');
var canvasSupported = !!(elem.getContext && elem.getContext('2d'));
if(!canvasSupported && core.config.noCanvasURL) return window.location = core.config.noCanvasURL;

Number.prototype.limit = function(min, max) {
    var i = this;
    if(i < min) i = min;
    if(i > max) i = max;
    return i;
};

Number.prototype.round = function(precision) {
    if(precision) precision = Math.pow(10, precision);
    else precision = 1;
    return Math.round(this * precision) / precision;
};

Array.prototype.erase = function(item) {
    for(var i = this.length; i--;) {
        if(this[i] === item) this.splice(i, 1);
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

game.normalizeVendorAttribute(window, 'requestAnimationFrame');
if(window.requestAnimationFrame) {
    var next = 1, anims = {};

    game.setGameLoop = function(callback, element) {
        var current = next++;
        anims[current] = true;

        var animate = function() {
            if(!anims[current]) return;
            window.requestAnimationFrame(animate, element);
            callback();
        };
        window.requestAnimationFrame(animate, element);
        return current;
    };

    game.clearGameLoop = function(id) {
        delete anims[id];
    };
}
else {
    game.setGameLoop = function(callback) {
        return window.setInterval(callback, 1000/60);
    };
    game.clearGameLoop = function(id) {
        window.clearInterval(id);
    };
}

// http://ejohn.org/blog/simple-javascript-inheritance/
var initializing = false;
var fnTest = /xyz/.test(function() { var xyz; return xyz; }) ? /\b_super\b/ : /[\D|\d]*/;

/**
    @class Class
**/
game.Class = function() {};
/**
    @method extend
    @return {game.Class} Returns extended class
**/
game.Class.extend = function(prop) {
    var parent = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;
 
    var makeFn = function(name, fn) {
        return function() {
            /**
                Call functions parent function.
                @method _super
            **/
            var tmp = this._super;
            this._super = parent[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
        };
    };

    for(var name in prop) {
        if(
            typeof(prop[name]) === 'function' &&
            typeof(parent[name]) === 'function' &&
            fnTest.test(prop[name])
        ) {
            prototype[name] = makeFn(name, prop[name]);
        }
        else {
            prototype[name] = prop[name];
        }
    }
 
    function Class() {
        if(!initializing) {
            if(this.staticInit) {
                /**
                    This method is called before init.
                    @method staticInit
                **/
                var obj = this.staticInit.apply(this, arguments);
                if(obj) {
                    return obj;
                }
            }
            for(var p in this) {
                if(typeof(this[p]) === 'object') {
                    this[p] = game.copy(this[p]);
                }
            }
            if(this.init) {
                /**
                    This method is called, when you create new instance of the class.
                    @method init
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
        @method inject
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

        for(var name in prop) {
            if(
                typeof(prop[name]) === 'function' &&
                typeof(proto[name]) === 'function' &&
                fnTest.test(prop[name])
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

})(window);

game.module(
    'engine.core'
)
.require(
    'engine.loader',
    'engine.timer',
    'engine.system',
    'engine.audio',
    'engine.renderer',
    'engine.sprite',
    'engine.debug',
    'engine.storage',
    'engine.tween',
    'engine.scene',
    'engine.pool',
    'engine.analytics'
)
.body(function() {
});
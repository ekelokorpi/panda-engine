// ##################################################################################
// #######    #############################################################   #######
// ####            #####     #####      ###       ##         ############      ######
// ####              ##        ##                   #            #######        #####
// ###                #         #                    #             ####          ####
// ###                 #         #       ####        ##   ##        #            ####
// ##         ##       #          #      #####       ##   ####     #              ###
// ##         ###      #    #     ##     #####       ##   #####   #        #      ###
// ##         ###      #   ##      #     #####       ##   ####   #        ##       ##
// ##         ###     ##  ###      ##    #####       #    ###    #       ###       ##
// ###        ##     ##             #    ####        #          ##                 ##
// ###             ##               #    ####       #           #                  ##
// ###          ###     #####       #    ####       #           #       ####       ##
// ####         ##      #####       ##   ####      ##           #      #####       ##
// ####        ###     ######       ##################      ###############        ##
// #####     #################      #########################################      ##
// ##################################################################################

// Panda.js HTML5 game engine
// author Eemeli Kelokorpi

// inspired by Impact Game Engine
// sponsored by Yle

if(typeof(window) === 'undefined') window = {};
(function(window){ 'use strict';

if(typeof(global) !== 'undefined') return;
/**
    @module core
    @namespace game
**/
/**
    Instance automatically created at `game`
    @class Core
**/
var core = {
    version: '1.0.2',
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
        Device / browser detection.
        
            game.device.iPhone
            game.device.iPhone4
            game.device.iPhone5
            game.device.iPad
            game.device.iPadRetina
            game.device.iOS
            game.device.iOS5
            game.device.iOS6
            game.device.iOS7
            game.device.android
            game.device.android2
            game.device.wp7
            game.device.wp8
            game.device.wpApp
            game.device.wp
            game.device.ie9
            game.device.ie10
            game.device.ie11
            game.device.ie
            game.device.opera
            game.device.crosswalk
            game.device.cocoonJS
            game.device.mobile
        @property {Object} device
        @example
            if(game.device.mobile) return;
    **/
    device: {},
    renderer: null,
    modules: {},
    resources: [],
    audioResources: [],
    ready: false,
    nocache: '',
    _current: null,
    _loadQueue: [],
    _waitForLoad: 0,
    _DOMLoaded: false,
        
    copy: function(object) {
        var l,c,i;
        if(
            !object || typeof(object) !== 'object' ||
            object instanceof HTMLElement ||
            object instanceof game.Class ||
            object instanceof game.Container
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
        Add asset to preloader.
        @method addAsset
        @param {String} path
        @example
            game.addAsset('media/logo.png');
    **/
    addAsset: function(path) {
        this.resources.push(path);
    },

    /**
        Add sound to preloader.
        @method addSound
        @param {String} path
        @param {String} [name]
        @example
            game.addSound('media/sound/jump.m4a', 'jump');
    **/
    addSound: function(path, name) {
        name = name || path;
        this.SoundCache[name] = new game.Sound(path);
    },

    /**
        Add music to preloader.
        @method addMusic
        @param {String} path
        @param {String} [name]
    **/
    addMusic: function(path, name) {
        name = name || path;
        this.MusicCache[name] = new game.Music(path);
    },
    
    setNocache: function() {
        this.nocache = '?' + Date.now();
    },

    /**
        Define new module.
        @method module
        @param {String} name
        @param {String} [version]
        @example
            game.module('game.mymodule').body(function() {
                // body of new module
            });
    **/
    module: function(name, version) {
        if(name === 'engine.debug' && window.pandaMinified) return this;

        if(this._current) throw('Module ' + this._current.name + ' has no body');
        if(this.modules[name] && this.modules[name].body) throw('Module ' + name + ' is already defined');
        
        this._current = {name: name, requires: [], loaded: false, body: null, version: version};
        this.modules[name] = this._current;
        this._loadQueue.push(this._current);
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
            if(modules[i] === 'engine.debug' && window.pandaMinified) continue;
            if(modules[i]) this._current.requires.push(modules[i]);
        }
        return this;
    },

    /**
        Define body for module.
        @method body
    **/
    body: function(body) {
        this._current.body = body;
        this._current = null;
        if(this._initDOMReady) this._initDOMReady();
    },

    /**
        Start the game engine.
        @method start
        @param {game.Scene} scene
        @param {Number} width
        @param {Number} height
        @param {String} canvasId
    **/
    start: function(scene, width, height, canvasId) {
        if(this._loadQueue.length > 0) throw 'Engine modules not ready.';
        
        width = width || (game.System.orientation === game.System.PORTRAIT ? 768 : 1024);
        height = height || (game.System.orientation === game.System.PORTRAIT ? 927 : 672);

        this.system = new game.System(width, height, canvasId);
        this.sound = new game.SoundManager();
        this.pool = new game.Pool();
        if(game.Debug && game.Debug.enabled && !navigator.isCocoonJS) this.debug = new game.Debug();
        if(game.DebugDraw && game.DebugDraw.enabled) this.debugDraw = new game.DebugDraw();
        if(game.Storage.id) this.storage = new game.Storage(game.Storage.id);
        if(game.Analytics.id) this.analytics = new game.Analytics(game.Analytics.id);

        this.ready = true;
        
        var loader = new game.Loader(scene || SceneGame, this.resources, this.audioResources);
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
    
    _loadScript: function(name, requiredFrom) {
        this.modules[name] = true;
        this._waitForLoad++;
        
        var path = 'src/' + name.replace(/\./g, '/') + '.js' + this.nocache;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = path;
        script.onload = function() {
            game._waitForLoad--;
            game._loadModules();
        };
        script.onerror = function() {
            throw('Failed to load module ' + name + ' at ' + path + ' required from ' + requiredFrom);
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    },
    
    _loadModules: function() {
        var moduleLoaded, i, j, module, name, dependenciesLoaded;
        for(i = 0; i < game._loadQueue.length; i++) {
            module = game._loadQueue[i];
            dependenciesLoaded = true;
            
            for(j = 0; j < module.requires.length; j++) {
                name = module.requires[j];
                if(!game.modules[name]) {
                    dependenciesLoaded = false;
                    game._loadScript(name, module.name);
                }
                else if(!game.modules[name].loaded) {
                    dependenciesLoaded = false;
                }
            }
            
            if(dependenciesLoaded && module.body) {
                game._loadQueue.splice(i, 1);
                module.loaded = true;
                module.body();
                moduleLoaded = true;
                i--;
            }
        }
        
        if(moduleLoaded && this._loadQueue.length > 0) {
            game._loadModules();
        }
        else if(game._waitForLoad === 0 && game._loadQueue.length !== 0) {
            var unresolved = [];
            for(i = 0; i < game._loadQueue.length; i++ ) {
                var unloaded = [];
                var requires = game._loadQueue[i].requires;
                for(j = 0; j < requires.length; j++ ) {
                    module = game.modules[requires[j]];
                    if(!module || !module.loaded) {
                        unloaded.push(requires[j]);
                    }
                }
                unresolved.push(game._loadQueue[i].name + ' (requires: ' + unloaded.join(', ') + ')');
            }
            throw(
                'Unresolved (circular?) dependencies. ' +
                'Most likely there is a name/path mismatch for one of the listed modules:\n' +
                unresolved.join('\n')
            );
        }
    },
    
    _boot: function() {
        if(document.location.href.match(/\?nocache/)) this.setNocache();

        this.device.pixelRatio = window.devicePixelRatio || 1;
        this.device.screen = {
            width: window.screen.availWidth * this.device.pixelRatio,
            height: window.screen.availHeight * this.device.pixelRatio
        };
        
        this.device.iPhone = /iPhone/i.test(navigator.userAgent);
        this.device.iPhone4 = (this.device.iPhone && this.device.pixelRatio === 2);
        this.device.iPhone5 = (this.device.iPhone && this.device.pixelRatio === 2 && this.device.screen.height === 1096);

        this.device.iPad = /iPad/i.test(navigator.userAgent);
        this.device.iPadRetina = (this.device.iPad && this.device.pixelRatio === 2);
        
        this.device.iOS = this.device.iPhone || this.device.iPad;
        this.device.iOS5 = (this.device.iOS && /OS 5/i.test(navigator.userAgent));
        this.device.iOS6 = (this.device.iOS && /OS 6/i.test(navigator.userAgent));
        this.device.iOS7 = (this.device.iOS && /OS 7/i.test(navigator.userAgent));

        this.device.android = /android/i.test(navigator.userAgent);
        this.device.android2 = /android 2/i.test(navigator.userAgent);

        this.device.wp7 = (this.device.wp && /Windows Phone OS 7/i.test(navigator.userAgent));
        this.device.wp8 = (this.device.wp && /Windows Phone 8/i.test(navigator.userAgent));
        this.device.wpApp = (this.device.wp && typeof(window.external) !== 'undefined' && typeof(window.external.notify) !== 'undefined');
        this.device.wp = this.device.wp7 || this.device.wp8 || this.device.wpApp;

        this.device.ie9 = /MSIE 9/i.test(navigator.userAgent);
        this.device.ie10 = /MSIE 10/i.test(navigator.userAgent);
        this.device.ie11 = /rv:11.0/i.test(navigator.userAgent);
        this.device.ie = this.device.ie10 || this.device.ie11 || this.device.ie9;
        
        this.device.opera = /Opera/i.test(navigator.userAgent);
        this.device.crosswalk = /Crosswalk/i.test(navigator.userAgent);
        this.device.cocoonJS = !!navigator.isCocoonJS;

        this.device.mobile = this.device.iOS || this.device.android || this.device.wp;

        if(this.device.wp) {
            if (typeof(window.external.notify) !== 'undefined') {
                window.console.log = function (message) {
                    window.external.notify(message);
                };
            }
        }

        this.ua = this.device; // support for deprecated game.ua
    },

    _DOMReady: function() {
        if(!game._DOMLoaded) {
            if(!document.body) return setTimeout(game._DOMReady, 13);
            game._DOMLoaded = true;
            game._loadModules();
        }
    },
    
    _initDOMReady: function() {
        this._initDOMReady = null;
        this._boot();
        if (document.readyState === 'complete') this._DOMReady();
        else {
            document.addEventListener('DOMContentLoaded', this._DOMReady, false);
            window.addEventListener('load', this._DOMReady, false);
        }
    }
};

window.game = core;

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
Array.prototype.shuffle = function () {
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
Function.prototype.bind = function(context){
    var fn = this, linked = [];
    Array.prototype.push.apply(linked, arguments);
    linked.shift();

    return function(){
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

    window.game.setGameLoop = function(callback, element) {
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

    window.game.clearGameLoop = function(id) {
        delete anims[id];
    };
}
else {
    window.game.setGameLoop = function(callback) {
        return window.setInterval(callback, 1000/60);
    };
    window.game.clearGameLoop = function(id) {
        window.clearInterval(id);
    };
}

// http://ejohn.org/blog/simple-javascript-inheritance/
var initializing = false;
var fnTest = /xyz/.test(function(){ var xyz; return xyz; }) ? /\bsuper\b/ : /[\D|\d]*/;

/**
    @class Class
**/
core.Class = function() {};
/**
    @method extend
    @return {Class}
**/
core.Class.extend = function(prop) {
    var parent = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;
 
    var makeFn = function(name, fn){
        return function() {
            /**
                Call functions parent function.
                @method super
            **/
            var tmp = this.super;
            this.super = parent[name];
            var ret = fn.apply(this, arguments);
            this.super = tmp;
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
                    If Class has `staticInit` function, it is called before `init` function.
                    @property {Function} staticInit
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
                    Automatically called, when creating new class.
                    @property {Function} init
                **/
                this.init.apply(this, arguments);
            }
        }
        return this;
    }
    
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = window.game.Class.extend;
    /**
        @method inject
    **/
    Class.inject = function(prop) {
        var proto = this.prototype;
        var parent = {};

        var makeFn = function(name, fn){
            return function() {
                var tmp = this.super;
                this.super = parent[name];
                var ret = fn.apply(this, arguments);
                this.super = tmp;
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
    'engine.system',
    'engine.sound',
    'engine.renderer',
    'engine.sprite',
    'engine.debug',
    'engine.storage',
    'engine.tween',
    'engine.scene',
    'engine.pool',
    'engine.analytics'
)
.body(function(){
});
/**
    Tween engine.
    
    @module tween
    @namespace game
**/
game.module(
    'engine.tween'
)
.body(function() { 'use strict';

/**
    __Hint__: Use {{#crossLink "game.Scene/addTween:method"}}{{/crossLink}}

    @class Tween
    @extends game.Class
    @constructor
    @param {Object} obj
    @param {Object} properties
    @param {Number} duration
    @param {Object} [settings]
**/
game.Tween = game.Class.extend({
    /**
        @property {Easing} easing
    **/
    easing: null,
    /**
        @property {Loop} loop
    **/
    loop: 0,
    /**
        @property {Number} delay
        @default 0
    **/
    delay: 0,
    /**
        @property {Function} onComplete
    **/
    onComplete: false,
    /**
        @property {Function} onStart
    **/
    onStart: false,
    /**
        @property {Number} duration
        @default 1
    **/
    duration: 1,

    object: null,
    props: null,
    chained: false,
    elapsed: 0,
    valuesStart: {},
    valuesEnd: {},
    valuesDelta: {},
    timer: false,
    started: false,
    complete: false,
    paused: false,
    loopCount: -1,
    loopNum: null,

    init: function(obj, properties, duration, settings) {
        this.object = obj;
        this.props = properties;
        this.duration = duration || this.duration;
        this.easing = game.Tween.Easing.Linear.None;
        game.merge(this, settings);
        this.loopNum = this.loopCount;
    },

    /**
        @method start
    **/
    start: function() {
        var property;
        this.complete = false;
        this.paused = false;
        this.loopNum = this.loopCount;
        this.elapsed = 0;
        this.started = true;
        this.timer = new game.Timer();
        for (property in this.props) {
            this.initEnd(property, this.props, this.valuesEnd);
        }
        for (property in this.valuesEnd) {
            this.initStart(property, this.valuesEnd, this.object, this.valuesStart);
            this.initDelta(property, this.valuesDelta, this.object, this.valuesEnd);
        }
    },

    /**
        @method pause
    **/
    pause: function() {
        this.paused = true;
        if(this.timer) this.elapsed += this.timer.time();
    },

    /**
        @method resume
    **/
    resume: function() {
        this.paused = false;
        if(this.timer) this.timer.reset();
    },

    /**
        @method stop
        @param {Boolean} doComplete
    **/
    stop: function(doComplete) {
        if(doComplete) {
            this.paused = false;
            this.complete = false;
            this.loop = false;
            this.elapsed += this.duration;
            this.update();
        }
        this.complete = true;
    },

    /**
        @method chain
        @param {game.Tween} tween
    **/
    chain: function(tween) {
        this.chained = tween;
    },

    initEnd: function(prop, from, to) {
        if(typeof(from[prop]) !== 'object') {
            to[prop] = from[prop];
        } else {
            for (var subprop in from[prop]) {
                if(!to[prop]) to[prop] = {};
                this.initEnd(subprop, from[prop], to[prop]);
            }
        }
    },

    initStart: function(prop, end, from, to) {
        if(typeof(from[prop]) !== 'object') {
            if(typeof(end[prop]) !== 'undefined') to[prop] = from[prop];
        } else {
            for (var subprop in from[prop]) {
                if(!to[prop]) to[prop] = {};
                if(typeof(end[prop]) !== 'undefined') this.initStart(subprop, end[prop], from[prop], to[prop]);
            }
        }
    },

    initDelta: function(prop, delta, start, end) {
        if(typeof(end[prop]) !== 'object') {
            delta[prop] = end[prop] - start[prop];
        } else {
            for (var subprop in end[prop]) {
                if(!delta[prop]) delta[prop] = {};
                this.initDelta(subprop, delta[prop], start[prop], end[prop]);
            }
        }
    },

    propUpdate: function(prop, obj, start, delta, value) {
        if(typeof(start[prop]) !== 'object') {
            if(typeof start[prop] !== 'undefined') {
                obj[prop] = start[prop] + delta[prop] * value;
            } else {
                obj[prop] = obj[prop];
            }
        } else {
            for (var subprop in start[prop]) {
                this.propUpdate(subprop, obj[prop], start[prop], delta[prop], value);
            }
        }
    },

    propSet: function(prop, from, to) {
        if(typeof(from[prop]) !== 'object') {
            to[prop] = from[prop];
        } else {
            for (var subprop in from[prop]) {
                if(!to[prop]) to[prop] = {};
                this.propSet(subprop, from[prop], to[prop]);
            }
        }
    },

    update: function() {
        if(!this.started) return false;
        if(this.delay) {
            if(this.timer.time() < this.delay) return;
            this.delay = 0;
            this.timer.reset();
        }
        if(this.paused || this.complete) return false;

        if(this.onStart) {
            this.onStart();
            this.onStart = null;
        }

        var elapsed = Math.min(1, (this.timer.time() + this.elapsed) / this.duration);
        var value = this.easing(elapsed);

        for (var property in this.valuesDelta) {
            this.propUpdate(property, this.object, this.valuesStart, this.valuesDelta, value);
        }

        if(elapsed === 1) {
            if(this.loopNum === 0 || !this.loop) {
                this.complete = true;
                if(this.onComplete) this.onComplete();
                if(this.chained) this.chained.start();
                return false;
            } else if(this.loop === game.Tween.Loop.Revert) {
                // if(this.onComplete) this.onComplete();
                for (property in this.valuesStart) {
                    this.propSet(property, this.valuesStart, this.object);
                }
                this.elapsed = 0;
                this.timer.reset();
                if(this.loopNum !== -1) this.loopNum--;
            } else if(this.loop === game.Tween.Loop.Reverse) {
                // if(this.onComplete) this.onComplete();
                var _start = {}, _end = {};
                game.merge(_start, this.valuesEnd);
                game.merge(_end, this.valuesStart);
                game.merge(this.valuesStart, _start);
                game.merge(this.valuesEnd, _end);
                for (property in this.valuesEnd) {
                    this.initDelta(property, this.valuesDelta, this.object, this.valuesEnd);
                }
                this.elapsed = 0;
                this.timer.reset();
                if(this.loopNum !== -1) this.loopNum--;
            }
        }
    }
});

/**
    @attribute {Revert|Reverse} Loop
**/
game.Tween.Loop = { Revert: 1, Reverse: 2 };

/**
    Easing types: `In`, `Out` and `InOut`.
    @attribute {Linear|Quadratic|Cubic|Quartic|Quintic|Sinusoidal|Exponential|Circular|Elastic|Back|Bounce} Easing
**/
game.Tween.Easing = { Linear: {}, Quadratic: {}, Cubic: {}, Quartic: {}, Quintic: {}, Sinusoidal: {}, Exponential: {}, Circular: {}, Elastic: {}, Back: {}, Bounce: {} };

game.Tween.Easing.Linear.None = function (k) {
    return k;
};

game.Tween.Easing.Quadratic.In = function (k) {
    return k * k;
};

game.Tween.Easing.Quadratic.Out = function (k) {
    return - k * (k - 2);
};

game.Tween.Easing.Quadratic.InOut = function (k) {
    if((k *= 2) < 1) return 0.5 * k * k;
    return - 0.5 * (--k * (k - 2) - 1);
};

game.Tween.Easing.Cubic.In = function (k) {
    return k * k * k;
};

game.Tween.Easing.Cubic.Out = function (k) {
    return --k * k * k + 1;
};

game.Tween.Easing.Cubic.InOut = function (k) {
    if((k *= 2) < 1) return 0.5 * k * k * k;
    return 0.5 * ((k -= 2) * k * k + 2);
};

game.Tween.Easing.Quartic.In = function (k) {
    return k * k * k * k;
};

game.Tween.Easing.Quartic.Out = function (k) {
    return - (--k * k * k * k - 1);
};

game.Tween.Easing.Quartic.InOut = function (k) {
    if((k *= 2) < 1) return 0.5 * k * k * k * k;
    return - 0.5 * ((k -= 2) * k * k * k - 2);
};

game.Tween.Easing.Quintic.In = function (k) {
    return k * k * k * k * k;
};

game.Tween.Easing.Quintic.Out = function (k) {
    return (k = k - 1) * k * k * k * k + 1;
};

game.Tween.Easing.Quintic.InOut = function (k) {
    if((k *= 2) < 1) return 0.5 * k * k * k * k * k;
    return 0.5 * ((k -= 2) * k * k * k * k + 2);
};

game.Tween.Easing.Sinusoidal.In = function (k) {
    return - Math.cos(k * Math.PI / 2) + 1;
};

game.Tween.Easing.Sinusoidal.Out = function (k) {
    return Math.sin(k * Math.PI / 2);
};

game.Tween.Easing.Sinusoidal.InOut = function (k) {
    return - 0.5 * (Math.cos(Math.PI * k) - 1);
};

game.Tween.Easing.Exponential.In = function (k) {
    return k === 0 ? 0 : Math.pow(2, 10 * (k - 1));
};

game.Tween.Easing.Exponential.Out = function (k) {
    return k === 1 ? 1 : - Math.pow(2, - 10 * k) + 1;
};

game.Tween.Easing.Exponential.InOut = function (k) {
    if(k === 0) return 0;
    if(k === 1) return 1;
    if((k *= 2) < 1) return 0.5 * Math.pow(2, 10 * (k - 1));
    return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
};

game.Tween.Easing.Circular.In = function (k) {
    return - (Math.sqrt(1 - k * k) - 1);
};

game.Tween.Easing.Circular.Out = function (k) {
    return Math.sqrt(1 - (--k * k));
};

game.Tween.Easing.Circular.InOut = function (k) {
    if((k /= 0.5) < 1) return - 0.5 * (Math.sqrt(1 - k * k) - 1);
    return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
};

game.Tween.Easing.Elastic.In = function(k) {
    var s, a = 0.1, p = 0.4;
    if(k === 0) return 0; if(k === 1) return 1; if(!p) p = 0.3;
    if(!a || a < 1) { a = 1; s = p / 4; }
    else s = p / (2 * Math.PI) * Math.asin(1 / a);
    return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
};

game.Tween.Easing.Elastic.Out = function(k) {
    var s, a = 0.1, p = 0.4;
    if(k === 0) return 0; if(k === 1) return 1; if(!p) p = 0.3;
    if(!a || a < 1) { a = 1; s = p / 4; }
    else s = p / (2 * Math.PI) * Math.asin(1 / a);
    return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
};

game.Tween.Easing.Elastic.InOut = function(k) {
    var s, a = 0.1, p = 0.4;
    if(k === 0) return 0; if(k === 1) return 1; if(!p) p = 0.3;
    if(!a || a < 1) { a = 1; s = p / 4; }
    else s = p / (2 * Math.PI) * Math.asin(1 / a);
    if((k *= 2) < 1) return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
    return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
};

game.Tween.Easing.Back.In = function(k) {
    var s = 1.70158;
    return k * k * ((s + 1) * k - s);
};

game.Tween.Easing.Back.Out = function(k) {
    var s = 1.70158;
    return (k = k - 1) * k * ((s + 1) * k + s) + 1;
};

game.Tween.Easing.Back.InOut = function(k) {
    var s = 1.70158 * 1.525;
    if((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
    return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
};

game.Tween.Easing.Bounce.In = function(k) {
    return 1 - game.Tween.Easing.Bounce.Out(1 - k);
};

game.Tween.Easing.Bounce.Out = function(k) {
    if((k /= 1) < (1 / 2.75)) {
        return 7.5625 * k * k;
    } else if(k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
    } else if(k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
    } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
    }
};

game.Tween.Easing.Bounce.InOut = function(k) {
    if(k < 0.5) return game.Tween.Easing.Bounce.In(k * 2) * 0.5;
    return game.Tween.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
};

/**
    @class TweenGroup
    @extends game.Class
    @constructor
    @param {Number} duration
    @param {Function} [onComplete]
    @param {Object} [settings]
**/
game.TweenGroup = game.Class.extend({
    tweens: [],
    settings: {},
    duration: 1,
    onComplete: null,

    init: function(duration, onComplete, settings) {
        this.duration = duration || this.duration;
        this.onComplete = onComplete;
        this.settings = settings;
    },

    /**
        @method add
        @param {Object} obj
        @param {Object} props
        @return {game.Tween} tween
    **/
    add: function(obj, props) {
        var tween = new game.Tween(obj, props, this.duration, this.settings);
        this.tweens.push(tween);
        return tween;
    },

    /**
        @method remove
        @param {game.Tween} tween
    **/
    remove: function(tween) {
        this.tweens.erase(tween);
    },

    /**
        @method start
    **/
    start: function() {
        if(this.tweens.length === 0) return;

        this.tweens[0].onComplete = this.onComplete;
        for (var i = 0; i < this.tweens.length; i++) {
            game.scene.tweens.push(this.tweens[i]);
            this.tweens[i].start();
        }
    },

    /**
        @method pause
    **/
    pause: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].pause();
        }
    },

    /**
        @method resume
    **/
    resume: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].resume();
        }
    },

    /**
        @method stop
        @param {Boolean} doComplete
    **/
    stop: function(doComplete) {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].stop(doComplete);
        }
    }
});

});
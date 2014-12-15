// Based on https://github.com/sole/tween.js/

/**
    @module tween
    @namespace game
**/
game.module(
    'engine.tween'
)
.body(function() {
'use strict';

/**
    @class TweenEngine
    @extends game.Class
**/
game.createClass('TweenEngine', {
    /**
        List of tweens.
        @property {Array} tweens
    **/
    tweens: [],

    /**
        Remove all tweens.
        @method removeAll
    **/
    removeAll: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].shouldRemove = true;
        }
    },
    
    /**
        Stop all tweens for specific object.
        @method stopTweensForObject
        @param {Object} object
    **/
    stopTweensForObject: function(object) {
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            if (this.tweens[i].object === object) this.tweens[i].stop();
        }
    },

    /**
        Get first tween for specific object.
        @method getTweenForObject
        @param {Object} object
    **/
    getTweenForObject: function(object) {
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            if (this.tweens[i].object === object) return this.tweens[i];
        }
        return false;
    },

    add: function(tween) {
        this.tweens.push(tween);
    },

    remove: function(tween) {
        var i = this.tweens.indexOf(tween);
        if (i !== -1) this.tweens[i].shouldRemove = true;
    },

    update: function() {
        if (this.tweens.length === 0) return false;
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            if (!this.tweens[i].update()) this.tweens.splice(i, 1);
        }
        return true;
    }
});

/**
    @class Tween
    @extends game.Class
    @constructor
    @param {Object} object
**/
game.createClass('Tween', {
    /**
        Is tween playing.
        @property {Boolean} playing
    **/
    playing: false,
    /**
        Is tween paused.
        @property {Boolean} paused
    **/
    paused: false,
    object: null,
    valuesStart: {},
    valuesEnd: null,
    valuesStartRepeat: {},
    duration: 1000,
    repeatCount: 0,
    repeats: 0,
    yoyoEnabled: false,
    reversed: false,
    delayTime: 0,
    delayRepeat: false,
    startTime: null,
    originalStartTime: null,
    easingFunction: null,
    interpolationFunction: null,
    chainedTweens: [],
    onStartCallback: null,
    onStartCallbackFired: false,
    onUpdateCallback: null,
    onCompleteCallback: null,
    onRepeatCallback: null,
    currentTime: 0,
    shouldRemove: false,

    init: function(object) {
        if (typeof object !== 'object') throw('Tween parameter must be object');
        this.object = object;

        this.easingFunction = game.Tween.Easing.Linear.None;
        this.interpolationFunction = game.Tween.Interpolation.Linear;

        for (var field in object) {
            this.valuesStart[field] = parseFloat(object[field], 10);
        }
    },

    /**
        @method to
        @param {Object} properties
        @param {Number} duration
    **/
    to: function(properties, duration) {
        this.duration = duration || this.duration;
        this.valuesEnd = properties;
        return this;
    },

    /**
        @method start
    **/
    start: function() {
        game.tweenEngine.add(this);
        this.currentTime = 0;
        this.playing = true;
        this.onStartCallbackFired = false;
        this.startTime = this.delayTime;
        this.originalStartTime = this.startTime;
        for (var property in this.valuesEnd) {
            // check ifan Array was provided as property value
            if (this.valuesEnd[property] instanceof Array) {
                if (this.valuesEnd[property].length === 0) {
                    continue;
                }
                // create a local copy of the Array with the start value at the front
                this.valuesEnd[property] = [this.object[property]].concat(this.valuesEnd[property]);
            }
            this.valuesStart[property] = this.object[property];
            if ((this.valuesStart[property] instanceof Array) === false) {
                this.valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
            }
            this.valuesStartRepeat[property] = this.valuesStart[property] || 0;
        }
        return this;
    },

    /**
        @method stop
    **/
    stop: function() {
        if (!this.playing) {
            return this;
        }
        game.tweenEngine.remove(this);
        this.playing = false;
        this.stopChainedTweens();
        return this;
    },

    /**
        @method pause
    **/
    pause: function() {
        this.paused = true;
    },

    /**
        @method resume
    **/
    resume: function() {
        this.paused = false;
    },

    /**
        @method stopChainedTweens
    **/
    stopChainedTweens: function() {
        for (var i = 0, numChainedTweens = this.chainedTweens.length; i < numChainedTweens; i++) {
            this.chainedTweens[i].stop();
        }
    },

    /**
        @method delay
        @param {Number} time
        @param {Boolean} repeat
    **/
    delay: function(time, repeat) {
        this.delayTime = time;
        this.delayRepeat = !!repeat;
        return this;
    },

    /**
        @method repeat
        @param {Number} times
    **/
    repeat: function(times) {
        if (typeof times === 'undefined') times = Infinity;
        this.repeatCount = times;
        return this;
    },

    /**
        @method yoyo
        @param {Boolean} enabled
    **/
    yoyo: function(enabled) {
        if (typeof enabled === 'undefined') enabled = true;
        this.yoyoEnabled = enabled;
        return this;
    },

    /**
        @method easing
        @param {Function} easing
    **/
    easing: function(easing) {
        if (typeof easing === 'string') {
            easing = easing.split('.');
            this.easingFunction = game.Tween.Easing[easing[0]][easing[1]];
        }
        else {
            this.easingFunction = easing;
        }
        return this;
    },

    /**
        @method interpolation
        @param {Function} interpolation
    **/
    interpolation: function(interpolation) {
        this.interpolationFunction = interpolation;
        return this;
    },

    /**
        @method chain
        @param {game.Tween} tween
    **/
    chain: function() {
        this.chainedTweens = arguments;
        return this;
    },

    /**
        @method onStart
        @param {Function} callback
    **/
    onStart: function(callback) {
        this.onStartCallback = callback;
        return this;
    },

    /**
        @method onUpdate
        @param {Function} callback
    **/
    onUpdate: function(callback) {
        this.onUpdateCallback = callback;
        return this;
    },

    /**
        @method onComplete
        @param {Function} callback
    **/
    onComplete: function(callback) {
        this.onCompleteCallback = callback;
        return this;
    },
    
    /**
        @method onRepeat
        @param {Function} callback
    **/
    onRepeat: function(callback) {
        this.onRepeatCallback = callback;
        return this;
    },

    update: function() {
        if (this.shouldRemove) return false;
        if (this.paused) return true;

        this.currentTime += game.system.delta * 1000;

        if (this.currentTime < this.startTime) return true;
        
        if (this.onStartCallbackFired === false) {
            if (this.onStartCallback !== null) {
                this.onStartCallback.call(this.object);
            }
            this.onStartCallbackFired = true;
        }
        
        var elapsed = (this.currentTime - this.startTime) / this.duration;
        elapsed = elapsed > 1 ? 1 : elapsed;
        var value = this.easingFunction(elapsed);
        var property;
        for (property in this.valuesEnd) {
            var start = this.valuesStart[property] || 0;
            var end = this.valuesEnd[property];
            if (end instanceof Array) {
                this.object[property] = this.interpolationFunction(end, value);
            }
            else {
                // Parses relative end values with start as base (e.g.: +10, -3)
                if (typeof end === 'string') {
                    end = start + parseFloat(end, 10);
                }
                // protect against non numeric properties.
                if (typeof end === 'number') {
                    this.object[property] = start + (end - start) * value;
                }
            }
        }
        if (this.onUpdateCallback !== null) {
            this.onUpdateCallback.call(this.object, value);
        }
        if (elapsed === 1) {
            if (this.repeatCount > 0) {
                if (isFinite(this.repeatCount)) {
                    this.repeatCount--;
                }
                this.repeats += 1;
                // reassign starting values, restart by making startTime = now
                for (property in this.valuesStartRepeat) {
                    if (typeof this.valuesEnd[property] === 'string') {
                        this.valuesStartRepeat[property] = this.valuesStartRepeat[property] + parseFloat(this.valuesEnd[property], 10);
                    }
                    if (this.yoyoEnabled) {
                        var tmp = this.valuesStartRepeat[property];
                        this.valuesStartRepeat[property] = this.valuesEnd[property];
                        this.valuesEnd[property] = tmp;
                        this.reversed = !this.reversed;
                    }
                    this.valuesStart[property] = this.valuesStartRepeat[property];
                }
                if (!this.delayRepeat) this.delayTime = 0;
                this.startTime = this.originalStartTime + this.repeats * (this.duration + this.delayTime);
                if (this.onRepeatCallback !== null) {
                    this.onRepeatCallback.call(this.object);
                }
                return true;
            }
            else {
                this.playing = false;
                if (this.onCompleteCallback !== null) {
                    this.onCompleteCallback.call(this.object);
                }
                for (var i = 0, numChainedTweens = this.chainedTweens.length; i < numChainedTweens; i++) {
                    this.chainedTweens[i].start();
                }
                return false;
            }
        }
        return true;
    }
});

/**
    @attribute {Object} Easing
**/
game.Tween.Easing = {
    Linear: {
        None: function(k) {
            return k;
        }
    },

    Quadratic: {
        In: function(k) {
            return k * k;
        },

        Out: function(k) {
            return k * (2 - k);
        },

        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return -0.5 * (--k * (k - 2) - 1);
        }
    },

    Cubic: {
        In: function(k) {
            return k * k * k;
        },

        Out: function(k) {
            return --k * k * k + 1;
        },

        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k;
            return 0.5 * ((k -= 2) * k * k + 2);
        }
    },

    Quartic: {
        In: function(k) {
            return k * k * k * k;
        },

        Out: function(k) {
            return 1 - (--k * k * k * k);
        },

        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k;
            return -0.5 * ((k -= 2) * k * k * k - 2);
        }
    },

    Quintic: {
        In: function(k) {
            return k * k * k * k * k;
        },

        Out: function(k) {
            return --k * k * k * k * k + 1;
        },

        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    },

    Sinusoidal: {
        In: function(k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },

        Out: function(k) {
            return Math.sin(k * Math.PI / 2);
        },

        InOut: function(k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    },

    Exponential: {
        In: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },

        Out: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },

        InOut: function(k) {
            if (k === 0) return 0;
            if (k === 1) return 1;
            if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
            return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        }
    },

    Circular: {
        In: function(k) {
            return 1 - Math.sqrt(1 - k * k);
        },

        Out: function(k) {
            return Math.sqrt(1 - (--k * k));
        },

        InOut: function(k) {
            if ((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
            return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        }
    },

    Elastic: {
        In: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) return 0;
            if (k === 1) return 1;
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            }
            else s = p * Math.asin(1 / a) / (2 * Math.PI);
            return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        },

        Out: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) return 0;
            if (k === 1) return 1;
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            }
            else s = p * Math.asin(1 / a) / (2 * Math.PI);
            return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
        },

        InOut: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) return 0;
            if (k === 1) return 1;
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            }
            else s = p * Math.asin(1 / a) / (2 * Math.PI);
            if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
        }
    },

    Back: {
        In: function(k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },

        Out: function(k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },

        InOut: function(k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        }
    },

    Bounce: {
        In: function(k) {
            return 1 - game.Tween.Easing.Bounce.Out(1 - k);
        },

        Out: function(k) {
            if (k < (1 / 2.75)) {
                return 7.5625 * k * k;
            }
            else if (k < (2 / 2.75)) {
                return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
            }
            else if (k < (2.5 / 2.75)) {
                return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
            }
            else {
                return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
            }
        },
        
        InOut: function(k) {
            if (k < 0.5) return game.Tween.Easing.Bounce.In(k * 2) * 0.5;
            return game.Tween.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
        }
    }
};

/**
    @attribute {Object} Interpolation
**/
game.Tween.Interpolation = {
    Linear: function(v, k) {
        var m = v.length - 1,
            f = m * k,
            i = Math.floor(f),
            fn = game.Tween.Interpolation.Utils.Linear;
        if (k < 0) return fn(v[0], v[1], f);
        if (k > 1) return fn(v[m], v[m - 1], m - f);
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },

    Bezier: function(v, k) {
        var b = 0,
            n = v.length - 1,
            pw = Math.pow,
            bn = game.Tween.Interpolation.Utils.Bernstein,
            i;
        for (i = 0; i <= n; i++) {
            b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
        }
        return b;
    },

    CatmullRom: function(v, k) {
        var m = v.length - 1,
            f = m * k,
            i = Math.floor(f),
            fn = game.Tween.Interpolation.Utils.CatmullRom;
        if (v[0] === v[m]) {
            if (k < 0) i = Math.floor(f = m * (1 + k));
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        }
        else {
            if (k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
            if (k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    },

    Utils: {
        Linear: function(p0, p1, t) {
            return (p1 - p0) * t + p0;
        },

        Bernstein: function(n, i) {
            var fc = game.Tween.Interpolation.Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },

        Factorial: (function() {
            var a = [1];
            return function (n) {
                var s = 1, i;
                if (a[n]) return a[n];
                for (i = n; i > 1; i--) s *= i;
                return a[n] = s;
            };
        })(),

        CatmullRom: function(p0, p1, p2, p3, t) {
            var v0 = (p2 - p0) * 0.5,
                v1 = (p3 - p1) * 0.5,
                t2 = t * t,
                t3 = t * t2;
            return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
        }
    }
};

/**
    @class TweenGroup
    @extends game.Class
    @constructor
    @param {Function} [onComplete]
**/
game.createClass('TweenGroup', {
    tweens: [],
    onComplete: null,
    complete: false,

    init: function(onComplete) {
        this.onComplete = onComplete;
    },

    /**
        Add tween to group.
        @method add
        @param {game.Tween} tween
        @return {game.Tween} tween
    **/
    add: function(tween) {
        tween.onComplete(this.tweenComplete.bind(this));
        this.tweens.push(tween);
        return tween;
    },

    /**
        @method tweenComplete
    **/
    tweenComplete: function() {
        if (this.complete) return;
        for (var i = 0; i < this.tweens.length; i++) {
            if (this.tweens[i].playing) return;
        }
        this.complete = true;
        if (typeof this.onComplete === 'function') this.onComplete();
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
        for (var i = 0; i < this.tweens.length; i++) {
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
        @param {Boolean} doComplete Call onComplete function
        @param {Boolean} endTween Set started tweens to end values
    **/
    stop: function(doComplete, endTween) {
        if (this.complete) return;

        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].stop(endTween);
        }
        
        if (!this.complete && doComplete) this.tweenComplete();
        this.complete = true;
    }
});

});

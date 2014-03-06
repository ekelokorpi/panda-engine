/**
    Tween engine.
    
    @module tween
    @namespace game
**/
game.module(
    'engine.tween'
)
.body(function() {

/**
 * @author sole / http://soledadpenades.com
 * @author mrdoob / http://mrdoob.com
 * @author Robert Eisele / http://www.xarg.org
 * @author Philippe / http://philippe.elsass.me
 * @author Robert Penner / http://www.robertpenner.com/easing_terms_of_use.html
 * @author Paul Lewis / http://www.aerotwist.com/
 * @author lechecacharro
 * @author Josh Faul / http://jocafa.com/
 * @author egraether / http://egraether.com/
 * @author endel / http://endel.me
 * @author Ben Delarre / http://delarre.net
 */

// Date.now shim for (ahem) Internet Explo(d|r)er
if(Date.now === undefined) {
    Date.now = function () {
        return new Date().valueOf();
    };
}

/**
    Tween engine.
    @class TweenEngine
**/
game.TweenEngine = (function () {
    var _tweens = [];
    return {
        REVISION: '12',

        /**
            @method getAll
        **/
        getAll: function () {
            return _tweens;
        },

        /**
            @method removeAll
        **/
        removeAll: function () {
            _tweens.length = 0;
        },
        
        /**
            @method stopAllForObject
        **/
        stopAllForObject: function(obj) {
            for (var i = _tweens.length - 1; i >= 0; i--) {
                if(_tweens[i].getObject() === obj) _tweens[i].stop();
            }
        },

        /**
            @method getTweenForObject
        **/
        getTweenForObject: function(obj) {
            for (var i = _tweens.length - 1; i >= 0; i--) {
                if(_tweens[i].getObject() === obj) return _tweens[i];
            }
            return false;
        },

        /**
            @method add
            @param {game.Tween} tween
        **/
        add: function (tween) {
            _tweens.push(tween);
        },

        /**
            @method remove
            @param {game.Tween} tween
        **/
        remove: function (tween) {
            var i = _tweens.indexOf(tween);
            if(i !== -1) {
                _tweens.splice(i, 1);
            }
        },

        /**
            @method update
        **/
        update: function (time) {
            if(_tweens.length === 0) return false;
            time = time !== undefined ? time : game.Timer.time;
            for (var i = _tweens.length - 1; i >= 0; i--) {
                if(!_tweens[i].update(time)) _tweens.splice(i, 1);
            }
            return true;
        }
    };
})();

/**
    Tween.
    @class Tween
**/
game.Tween = function (object, properties, duration, settings) {
    if(!object) throw('No object defined for tween');
    settings = settings || {};
    var _object = object;
    var _valuesStart = {};
    var _valuesEnd = properties || {};
    var _valuesStartRepeat = {};
    var _duration = duration || 1000;
    var _repeat = 0;
    var _repeats = 0;
    var _yoyo = false;
    var _isPlaying = false;
    var _reversed = false;
    var _delayTime = 0;
    var _delayRepeat = false;
    var _startTime = null;
    var _originalStartTime = null;
    var _easingFunction = settings.easing || game.Tween.Easing.Linear.None;
    var _interpolationFunction = settings.interpolation || game.Tween.Interpolation.Linear;
    var _chainedTweens = [];
    var _onStartCallback = settings.onStart || null;
    var _onStartCallbackFired = false;
    var _onUpdateCallback = settings.onUpdate || null;
    var _onCompleteCallback = settings.onComplete || null;

    for (var field in object) {
        _valuesStart[field] = parseFloat(object[field], 10);
    }

    /**
        @method getObject
    **/
    this.getObject = function() {
        return _object;
    };

    /**
        @method to
        @param {Object} properties
        @param {Number} duration
    **/
    this.to = function (properties, duration) {
        if(duration !== undefined) {
            _duration = duration;
        }
        _valuesEnd = properties;
        return this;
    };

    /**
        @method start
    **/
    this.start = function (time) {
        game.TweenEngine.add(this);
        _isPlaying = true;
        _onStartCallbackFired = false;
        _startTime = time !== undefined ? time : game.Timer.time;
        _startTime += _delayTime;
        _originalStartTime = _startTime;
        for (var property in _valuesEnd) {
            // check ifan Array was provided as property value
            if(_valuesEnd[property] instanceof Array) {
                if(_valuesEnd[property].length === 0) {
                    continue;
                }
                // create a local copy of the Array with the start value at the front
                _valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);
            }
            _valuesStart[property] = _object[property];
            if((_valuesStart[property] instanceof Array) === false) {
                _valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
            }
            _valuesStartRepeat[property] = _valuesStart[property] || 0;
        }
        return this;
    };

    /**
        @method stop
    **/
    this.stop = function () {
        if(!_isPlaying) {
            return this;
        }
        game.TweenEngine.remove(this);
        _isPlaying = false;
        this.stopChainedTweens();
        return this;
    };

    /**
        @method stopChainedTweens
    **/
    this.stopChainedTweens = function () {
        for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
            _chainedTweens[i].stop();
        }
    };

    /**
        @method delay
        @param {Number} time
        @param {Boolean} repeat
    **/
    this.delay = function (time, repeat) {
        _delayTime = time;
        _delayRepeat = !!repeat;
        return this;
    };

    /**
        @method repeat
        @param {Number} times
    **/
    this.repeat = function (times) {
        if(typeof(times) === 'undefined') times = Infinity;
        _repeat = times;
        return this;
    };

    /**
        @method yoyo
        @param {Boolean} enabled
    **/
    this.yoyo = function (enabled) {
        if(typeof(enabled) === 'undefined') enabled = true;
        _yoyo = enabled;
        return this;
    };

    /**
        @method easing
        @param {Function} easing
    **/
    this.easing = function (easing) {
        _easingFunction = easing;
        return this;
    };

    /**
        @method interpolation
        @param {Function} interpolation
    **/
    this.interpolation = function (interpolation) {
        _interpolationFunction = interpolation;
        return this;
    };

    /**
        @method chain
        @param {game.Tween} tween
    **/
    this.chain = function () {
        _chainedTweens = arguments;
        return this;
    };

    /**
        @method onStart
        @param {Function} callback
    **/
    this.onStart = function (callback) {
        _onStartCallback = callback;
        return this;
    };

    /**
        @method onUpdate
        @param {Function} callback
    **/
    this.onUpdate = function (callback) {
        _onUpdateCallback = callback;
        return this;
    };

    /**
        @method onComplete
        @param {Function} callback
    **/
    this.onComplete = function (callback) {
        _onCompleteCallback = callback;
        return this;
    };

    /**
        @method isPlaying
        @return {Boolean}
    **/
    this.isPlaying = function() {
        return _isPlaying;
    };

    this.update = function (time) {
        var property;
        if(time < _startTime) {
            return true;
        }
        if(_onStartCallbackFired === false) {
            if(_onStartCallback !== null) {
                _onStartCallback.call(_object);
            }
            _onStartCallbackFired = true;
        }
        var elapsed = (time - _startTime) / _duration;
        elapsed = elapsed > 1 ? 1 : elapsed;
        var value = _easingFunction(elapsed);
        for (property in _valuesEnd) {
            var start = _valuesStart[property] || 0;
            var end = _valuesEnd[property];
            if(end instanceof Array) {
                _object[property] = _interpolationFunction(end, value);
            } else {
                // Parses relative end values with start as base (e.g.: +10, -3)
                if(typeof (end) === 'string') {
                    end = start + parseFloat(end, 10);
                }
                // protect against non numeric properties.
                if(typeof (end) === 'number') {
                    _object[property] = start + (end - start) * value;
                }
            }
        }
        if(_onUpdateCallback !== null) {
            _onUpdateCallback.call(_object, value);
        }
        if(elapsed === 1) {
            if(_repeat > 0) {
                if(isFinite(_repeat)) {
                    _repeat--;
                }
                _repeats += 1;
                // reassign starting values, restart by making startTime = now
                for (property in _valuesStartRepeat) {
                    if(typeof (_valuesEnd[property]) === 'string') {
                        _valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
                    }
                    if(_yoyo) {
                        var tmp = _valuesStartRepeat[property];
                        _valuesStartRepeat[property] = _valuesEnd[property];
                        _valuesEnd[property] = tmp;
                        _reversed = !_reversed;
                    }
                    _valuesStart[property] = _valuesStartRepeat[property];
                }
                if(!_delayRepeat) _delayTime = 0;
                _startTime = _originalStartTime + _repeats * (_duration + _delayTime);
                return true;
            } else {
                _isPlaying = false;
                if(_onCompleteCallback !== null) {
                    _onCompleteCallback.call(_object);
                }
                for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
                    _chainedTweens[i].start(time);
                }
                return false;
            }
        }
        return true;
    };
};

// Deprecated
game.Tween.Loop = {
    Reverse: 0,
    Revert: 1
};

game.Tween.Easing = {
    Linear: {
        None: function (k) {
            return k;
        }
    },

    Quadratic: {
        In: function (k) {
            return k * k;
        },
        Out: function (k) {
            return k * (2 - k);
        },
        InOut: function (k) {
            if((k *= 2) < 1) return 0.5 * k * k;
            return -0.5 * (--k * (k - 2) - 1);
        }
    },

    Cubic: {
        In: function (k) {
            return k * k * k;
        },
        Out: function (k) {
            return --k * k * k + 1;
        },
        InOut: function (k) {
            if((k *= 2) < 1) return 0.5 * k * k * k;
            return 0.5 * ((k -= 2) * k * k + 2);
        }
    },

    Quartic: {
        In: function (k) {
            return k * k * k * k;
        },
        Out: function (k) {
            return 1 - (--k * k * k * k);
        },
        InOut: function (k) {
            if((k *= 2) < 1) return 0.5 * k * k * k * k;
            return -0.5 * ((k -= 2) * k * k * k - 2);
        }
    },

    Quintic: {
        In: function (k) {
            return k * k * k * k * k;
        },
        Out: function (k) {
            return --k * k * k * k * k + 1;
        },
        InOut: function (k) {
            if((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    },

    Sinusoidal: {
        In: function (k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out: function (k) {
            return Math.sin(k * Math.PI / 2);
        },
        InOut: function (k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    },

    Exponential: {
        In: function (k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out: function (k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        InOut: function (k) {
            if(k === 0) return 0;
            if(k === 1) return 1;
            if((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
            return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        }
    },

    Circular: {
        In: function (k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out: function (k) {
            return Math.sqrt(1 - (--k * k));
        },
        InOut: function (k) {
            if((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
            return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        }
    },

    Elastic: {
        In: function (k) {
            var s, a = 0.1,
                p = 0.4;
            if(k === 0) return 0;
            if(k === 1) return 1;
            if(!a || a < 1) {
                a = 1;
                s = p / 4;
            } else s = p * Math.asin(1 / a) / (2 * Math.PI);
            return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        },
        Out: function (k) {
            var s, a = 0.1,
                p = 0.4;
            if(k === 0) return 0;
            if(k === 1) return 1;
            if(!a || a < 1) {
                a = 1;
                s = p / 4;
            } else s = p * Math.asin(1 / a) / (2 * Math.PI);
            return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
        },
        InOut: function (k) {
            var s, a = 0.1,
                p = 0.4;
            if(k === 0) return 0;
            if(k === 1) return 1;
            if(!a || a < 1) {
                a = 1;
                s = p / 4;
            } else s = p * Math.asin(1 / a) / (2 * Math.PI);
            if((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
        }
    },

    Back: {
        In: function (k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        Out: function (k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        InOut: function (k) {
            var s = 1.70158 * 1.525;
            if((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        }
    },

    Bounce: {
        In: function (k) {
            return 1 - game.Tween.Easing.Bounce.Out(1 - k);
        },
        Out: function (k) {
            if(k < (1 / 2.75)) {
                return 7.5625 * k * k;
            } else if(k < (2 / 2.75)) {
                return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
            } else if(k < (2.5 / 2.75)) {
                return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
            } else {
                return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
            }
        },
        InOut: function (k) {
            if(k < 0.5) return game.Tween.Easing.Bounce.In(k * 2) * 0.5;
            return game.Tween.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
        }
    }
};

game.Tween.Interpolation = {
    Linear: function (v, k) {
        var m = v.length - 1,
            f = m * k,
            i = Math.floor(f),
            fn = game.Tween.Interpolation.Utils.Linear;
        if(k < 0) return fn(v[0], v[1], f);
        if(k > 1) return fn(v[m], v[m - 1], m - f);
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },

    Bezier: function (v, k) {
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

    CatmullRom: function (v, k) {
        var m = v.length - 1,
            f = m * k,
            i = Math.floor(f),
            fn = game.Tween.Interpolation.Utils.CatmullRom;
        if(v[0] === v[m]) {
            if(k < 0) i = Math.floor(f = m * (1 + k));
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        } else {
            if(k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
            if(k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    },

    Utils: {
        Linear: function (p0, p1, t) {
            return (p1 - p0) * t + p0;
        },

        Bernstein: function (n, i) {
            var fc = game.Tween.Interpolation.Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },

        Factorial: (function () {
            var a = [1];
            return function (n) {
                var s = 1,
                    i;
                if(a[n]) return a[n];
                for (i = n; i > 1; i--) s *= i;
                return a[n] = s;
            };
        })(),

        CatmullRom: function (p0, p1, p2, p3, t) {
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
game.TweenGroup = game.Class.extend({
    tweens: [],
    onComplete: null,
    complete: false,

    init: function(onComplete) {
        this.onComplete = onComplete;
    },

    /**
        Add tween to group.
        @method add
        @param {Object} obj
        @return {game.Tween} tween
    **/
    add: function(obj) {
        var tween = new game.Tween(obj);
        tween.onComplete(this.tweenComplete.bind(this));
        this.tweens.push(tween);
        return tween;
    },

    /**
        @method tweenComplete
    **/
    tweenComplete: function() {
        if(this.complete) return;
        for (var i = 0; i < this.tweens.length; i++) {
            if(this.tweens[i].isPlaying()) return;
        }
        this.complete = true;
        if(typeof(this.onComplete) === 'function') this.onComplete();
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
        if(this.complete) return;

        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].stop(endTween);
        }
        
        if(!this.complete && doComplete) this.tweenComplete();
        this.complete = true;
    }
});

});
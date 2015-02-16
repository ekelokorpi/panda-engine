/**
    @module renderer
    @namespace game
**/
game.module(
    'engine.renderer'
)
.require(
    'engine.pixi'
)
.body(function() {
'use strict';

game.PIXI.dontSayHello = true;
game.PIXI.RETINA_PREFIX = false;

// Used to extend PIXI classes
game.PIXI.extend = function(prop) {
    var name;
    var proto = this.prototype;
    var base = this.prototype.base || this;

    function Class() {
        var name;
        if (this.init) this.init.apply(this, arguments);
        else this.base.apply(this, arguments);

        for (name in proto) {
            if (typeof proto[name] !== 'function' && !this[name]) this[name] = game.copy(proto[name]);
        }
        for (name in prop) {
            if (typeof prop[name] !== 'function' && !this[name]) this[name] = game.copy(prop[name]);
        }
    }

    Class.prototype = Object.create(base.prototype);

    var makeFn = function(name, fn) {
        var from = proto[name];
        if (name === 'init' && !from) from = base;
        return function() {
            var tmp = this._super;
            this._super = from;
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
        };
    };

    for (name in proto) {
        if (typeof proto[name] === 'function') {
            Class.prototype[name] = makeFn(name, proto[name]);
        }
        else {
            Class.prototype[name] = proto[name];
        }
    }

    for (name in prop) {
        if (typeof prop[name] === 'function') {
            Class.prototype[name] = makeFn(name, prop[name]);
        }
        else {
            Class.prototype[name] = prop[name];
        }
    }

    Class.prototype.constructor = Class;
    Class.prototype.base = base;

    Class.extend = game.PIXI.extend;

    return Class;
};

for (var i in game.PIXI) {
    if (game.PIXI[i].prototype instanceof Object) {
        game.PIXI[i].extend = game.PIXI.extend;
    }
}

game.AssetLoader = game.PIXI.AssetLoader;
game.Text = game.PIXI.Text;
game.HitRectangle = game.PIXI.Rectangle;
game.HitCircle = game.PIXI.Circle;
game.HitEllipse = game.PIXI.Ellipse;
game.HitPolygon = game.PIXI.Polygon;
game.TextureCache = game.PIXI.TextureCache;
game.RenderTexture = game.PIXI.RenderTexture;
game.Point = game.PIXI.Point;
game.CanvasRenderer = game.PIXI.CanvasRenderer;
game.autoDetectRenderer = game.PIXI.autoDetectRenderer;
game.Stage = game.PIXI.Stage;
game.blendModes = game.PIXI.blendModes;
game.BaseTexture = game.PIXI.BaseTexture;
game.Graphics = game.PIXI.Graphics;
game.BitmapText = game.PIXI.BitmapText;

game.PIXI.DisplayObject.prototype.remove = function() {
    if (this.parent) this.parent.removeChild(this);
};

game.PIXI.DisplayObject.prototype.addTo = function(container) {
    container.addChild(this);
    return this;
};

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Sprite.html
    @class Sprite
    @constructor
    @param {String} id Asset ID
    @param {Number} [x] The x coordinate to position at
    @param {Number} [y] The y coordinate to position at
    @param {Object} [settings] Other settings to merge into this Sprite
**/
game.Sprite = game.PIXI.Sprite.extend({
    debugDraw: true,

    init: function(id, x, y, settings) {
        if (typeof id === 'string') {
            id = game.paths[id] || id;
            id = game.Texture.fromFrame(id);
        }
        this._super(id);

        game.merge(this, settings);

        this.position.set(x * game.scale, y * game.scale);

        // Auto bind touch events for mobile
        if (game.device.mobile && !this.tap && this.click) this.tap = this.click;
        if (game.device.mobile && !this.touchmove && this.mousemove) this.touchmove = this.mousemove;
        if (game.device.mobile && !this.touchstart && this.mousedown) this.touchstart = this.mousedown;
        if (game.device.mobile && !this.touchend && this.mouseup) this.touchend = this.mouseup;
        if (game.device.mobile && !this.touchendoutside && this.mouseupoutside) this.touchendoutside = this.mouseupoutside;
    },

    /**
        Change sprite texture.
        @method setTexture
        @param {String} id Asset ID
    **/
    setTexture: function(id) {
        if (typeof id === 'string') {
            id = game.paths[id] || id;
            id = game.Texture.fromFrame(id);
        }
        this._super(id);
    },

    /**
        Crop sprite.
        @method crop
        @param {Number} x The x coordinate of left-top point to crop
        @param {Number} y The y coordinate of left-top point to crop
        @param {Number} width The width of sprite to crop to
        @param {Number} height The height of sprite to crop to
    **/
    crop: function(x, y, width, height) {
        var texture = new game.PIXI.Texture(this.texture, new game.HitRectangle(x, y, width, height));
        this.setTexture(texture);
        return this;
    },

    /**
        Position sprite to system center.
        @method center
        @param {Number} offsetX Offset x coordinate to system center
        @param {Number} offsetY Offset y coordinate to system center
    **/
    center: function(offsetX, offsetY) {
        this.position.x = game.system.width / 2 - this.width / 2 + this.width * this.anchor.x;
        this.position.y = game.system.height / 2 - this.height / 2 + this.height * this.anchor.y;
        this.position.x += offsetX || 0;
        this.position.y += offsetY || 0;
        return this;
    },

    addChild: function(obj) {
        this._super(obj);
        if (game.debugDraw && obj.interactive && obj.debugDraw) game.debugDraw.addSprite(obj);
    }
});

game.Sprite.fromImage = game.PIXI.Sprite.fromImage;

/**
    Spine animation.
    @class Spine
    @constructor
    @param {String} id Asset ID
    @param {Object} [settings] Settings to merge to this animation
**/
game.Spine = game.PIXI.Spine.extend({
    init: function(id, settings) {
        this._super(game.paths[id] || id);
        game.merge(this, settings);
    },

    /**
        Play animation.
        @method play
        @param {String} anim Name of animation.
        @param {Boolean} loop Animation looping.
        @param {Boolean} after Start after current animation.
    **/
    play: function(anim, loop, after) {
        if (after) this.state.addAnimationByName(anim, !!loop);
        else this.state.setAnimationByName(anim, !!loop);
    },

    /**
        Mix two animations for smooth transition.
        @method mix
        @param {String} from Animation name to mix from.
        @param {String} to Animation name to mix to.
        @param {Number} value Percent of mix.
    **/
    mix: function(from, to, value) {
        this.stateData.setMixByName(from, to, value / 100);
    }
});

/**
    http://www.goodboydigital.com/pixijs/docs/classes/DisplayObjectContainer.html
    @class Container
**/
game.Container = game.PIXI.DisplayObjectContainer.extend({
    /**
        Add object to container.
        @method addChild
    **/
    addChild: function(obj) {
        this._super(obj);
        if (game.debugDraw && obj.interactive && obj.debugDraw) game.debugDraw.addSprite(obj);
    }
});

game.Texture = game.PIXI.Texture.extend();
game.Texture.fromImage = function(id, crossorigin) {
    id = game.paths[id] || id;
    return game.PIXI.Texture.fromImage(id, crossorigin);
};
game.Texture.fromCanvas = game.PIXI.Texture.fromCanvas;
game.Texture.fromFrame = game.PIXI.Texture.fromFrame;

/**
    Tiling sprite.
    http://www.goodboydigital.com/pixijs/docs/classes/TilingSprite.html
    @class TilingSprite
    @constructor
    @param {String|game.Texture} texture Texture to be repeated
    @param {Number} width Sprite width
    @param {Number} height Sprite height
    @param {Object} [settings] Settings to be merged into this sprite
**/
game.TilingSprite = game.PIXI.TilingSprite.extend({
    /**
        @property {game.Point} speed Texture scroll speed
    **/
    speed: null,

    init: function(path, width, height, settings) {
        this.speed = new game.Point();
        path = game.paths[path] || path;
        var texture = path instanceof game.Texture ? path : path instanceof game.RenderTexture ? path : game.Texture.fromFrame(this.path || path);
        this._super(texture, width || texture.width, height || texture.height);
        game.merge(this, settings);
    },

    /**
        Update tile position with speed.
        @method update
    **/
    update: function() {
        this.tilePosition.x += this.speed.x * game.system.delta;
        this.tilePosition.y += this.speed.y * game.system.delta;
    }
});

/**
    Frame by frame animation. This can also be generated from a SpriteSheet
    http://www.goodboydigital.com/pixijs/docs/classes/MovieClip.html
    @class Animation
    @constructor
    @param {Array} textures Textures this animation made up of
**/
game.Animation = game.PIXI.MovieClip.extend({
    /**
        Play animation in reverse.
        @property {Boolean} reverse
        @default false
    **/
    reverse: false,

    init: function(textures) {
        if (typeof textures === 'string') {
            var frames = Array.prototype.slice.call(arguments);

            var textures = [];
            for (var i = 0; i < frames.length; i++) {
                textures.push(game.Texture.fromImage(frames[i]));
            }
        }

        this._super(textures);
    },

    /**
        Add to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        container.addChild(this);
        return this;
    },

    /**
        Remove from it's container.
        @method remove
    **/
    remove: function() {
        if (this.parent) this.parent.removeChild(this);
    },

    /**
        Play animation.
        @method play
        @param {Boolean} loop
    **/
    play: function(loop) {
        if (typeof loop === 'boolean') this.loop = loop;
        this.playing = true;
    },

    updateTransform: function() {
        if (this.playing) {
            this.currentFrame -= this.animationSpeed;
            this.currentFrame += this.animationSpeed * (this.reverse ? -1 : 1) * 60 * game.system.delta;
            
            if (this.currentFrame < 0 && this.reverse) {
                if (!this.loop) {
                    if (this.onComplete) this.onComplete();
                    this.currentFrame = 0;
                    this.playing = false;
                }
                else this.currentFrame = this.totalFrames - 1 + this.currentFrame;
            }
        }
        this._super();
    }
});

game.Animation.fromFrames = function(name, reverse) {
    var textures = [];

    for (var key in game.TextureCache) {
        if (key.indexOf(name) !== -1) {
            if (reverse) textures.unshift(game.TextureCache[key]);
            else textures.push(game.TextureCache[key]);
        }
    }

    return new game.Animation(textures);
};

/**
    @class SpriteSheet
    @constructor
    @param {String} id Asset ID
    @param {Number} width Sprite frame width
    @param {Number} height Sprite frame height
**/
game.createClass('SpriteSheet', {
    textures: [],

    init: function(id, width, height) {
        this.width = width;
        this.height = height;
        var baseTexture = game.TextureCache[game.paths[id]];
        this.sx = Math.floor(baseTexture.width / this.width);
        this.sy = Math.floor(baseTexture.height / this.height);
        this.frames = this.sx * this.sy;

        for (var i = 0; i < this.frames; i++) {
            var x = (i % this.sx) * this.width;
            var y = Math.floor(i / this.sx) * this.height;
            var texture = new game.Texture(baseTexture, new game.HitRectangle(x, y, this.width, this.height));
            this.textures.push(texture);
        }
    },

    /**
        Create sprite from specific frame.
        @method frame
        @param {Number} index Frame index
        @return {game.Sprite}
    **/
    frame: function(index) {
        index = index.limit(0, this.frames - 1);
        return new game.Sprite(this.textures[index]);
    },

    /**
        Create animation from spritesheet.
        @method anim
        @param {Number|Array} frames List or number of frames
        @param {Number} [startIndex] The index to begin with, default to 0
        @param {Boolean} [onlyTextures] Return only textures
        @return {game.Animation}
    **/
    anim: function(frames, startIndex, onlyTextures) {
        startIndex = startIndex || 0;
        frames = frames || this.frames;
        var textures = [];
        if (frames.length > 0) {
            for (var i = 0; i < frames.length; i++) {
                textures.push(this.textures[startIndex + frames[i]]);
            }
        }
        else {
            for (var i = 0; i < frames; i++) {
                textures.push(this.textures[startIndex + i]);
            }
        }
        if (onlyTextures) return textures;
        return new game.Animation(textures);
    }
});

/**
    @class Video
    @constructor
    @param {String} source
**/
game.createClass('Video', {
    /**
        @property {Boolean} loop
        @default false
    **/
    loop: false,
    /**
        Video element.
        @property {Video} videoElem
    **/
    videoElem: null,
    /**
        Video sprite.
        @property {game.Sprite} sprite
    **/
    sprite: null,

    init: function() {
        this.videoElem = document.createElement('video');
        this.videoElem.addEventListener('ended', this._complete.bind(this));

        var urls = Array.prototype.slice.call(arguments);
        var source;
        for (var i = 0; i < urls.length; i++) {
            source = document.createElement('source');
            source.src = game.getMediaPath(urls[i]);
            this.videoElem.appendChild(source);
        }

        var videoTexture = game.PIXI.VideoTexture.textureFromVideo(this.videoElem);
        videoTexture.baseTexture.addEventListener('loaded', this._loaded.bind(this));

        this.sprite = new game.Sprite(videoTexture);
    },

    _loaded: function() {
        if (typeof this._loadCallback === 'function') this._loadCallback();
    },

    _complete: function() {
        if (typeof this._completeCallback === 'function') this._completeCallback();
    },

    /**
        @method onLoaded
        @param {Function} callback
    **/
    onLoaded: function(callback) {
        this._loadCallback = callback;
    },

    /**
        @method onComplete
        @param {Function} callback
    **/
    onComplete: function(callback) {
        this._completeCallback = callback;
    },

    /**
        @method play
    **/
    play: function() {
        this.videoElem.loop = !!this.loop;
        this.videoElem.play();
    },

    /**
        @method stop
        @param {Boolean} remove
    **/
    stop: function(remove) {
        this.videoElem.pause();
        if (remove) this.sprite.remove();
    }
});

});

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

/**
    http://www.goodboydigital.com/pixijs/docs/classes/Sprite.html
    @class Sprite
    @constructor
    @param {String} id
    @param {Number} [x]
    @param {Number} [y]
    @param {Object} [settings]
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

        if (typeof x === 'number') this.position.x = x * game.scale;
        if (typeof y === 'number') this.position.y = y * game.scale;

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
        @param {String} id
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
        @param {Number} x
        @param {Number} y
        @param {Number} width
        @param {Number} height
    **/
    crop: function(x, y, width, height) {
        var texture = new game.PIXI.Texture(this.texture, new game.HitRectangle(x, y, width, height));
        this.setTexture(texture);
        return this;
    },

    /**
        Position sprite to system center.
        @method center
        @param {Number} offsetX
        @param {Number} offsetY
    **/
    center: function(offsetX, offsetY) {
        this.position.x = game.system.width / 2 - this.width / 2 + this.width * this.anchor.x;
        this.position.y = game.system.height / 2 - this.height / 2 + this.height * this.anchor.y;
        this.position.x += offsetX || 0;
        this.position.y += offsetY || 0;
        return this;
    },

    /**
        Remove sprite from it's parent.
        @method remove
    **/
    remove: function() {
        if (this.parent) this.parent.removeChild(this);
    },

    addChild: function(obj) {
        this._super(obj);
        if (game.debugDraw && obj.interactive && obj.debugDraw) game.debugDraw.addSprite(obj);
    },

    /**
        Add to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        container.addChild(this);
        return this;
    }
});

game.Sprite.fromImage = game.PIXI.Sprite.fromImage;

/**
    @class SpriteSheet
    @constructor
    @param {String} id
    @param {Number} width
    @param {Number} height
**/
game.SpriteSheet = game.Class.extend({
    init: function(id, width, height) {
        this.width = width;
        this.height = height;
        this.texture = game.TextureCache[game.paths[id]];
        this.sx = Math.floor(this.texture.width / this.width);
        this.sy = Math.floor(this.texture.height / this.height);
        this.frames = this.sx * this.sy;
    },

    /**
        Create sprite from specific frame.
        @method frame
        @param {Number} index Frame index
    **/
    frame: function(index) {
        index = index.limit(0, this.frames - 1);

        var i = 0;
        for (var y = 0; y < this.sy; y++) {
            for (var x = 0; x < this.sx; x++) {
                if (i === index) {
                    var sprite = new game.Sprite(this.texture);
                    sprite.crop(x * this.width, y * this.height, this.width, this.height);
                    return sprite;
                }
                i++;
            }
        }
    },

    /**
        Create animation from spritesheet.
        @method anim
        @param {Number} count Frame count
        @param {Number} index Start index
    **/
    anim: function(count, index) {
        index = index || 0;
        count = count || this.frames;
        var textures = [];
        for (var i = 0; i < count; i++) {
            textures.push(this.frame(index + i).texture);
        }
        return new game.Animation(textures);
    }
});

game.Graphics = game.PIXI.Graphics.extend({
    addTo: function(container) {
        container.addChild(this);
        return this;
    }
});

game.BitmapText = game.PIXI.BitmapText.extend({
    addTo: function(container) {
        container.addChild(this);
        return this;
    },

    remove: function() {
        if (this.parent) this.parent.removeChild(this);
    }
});

/**
    Spine animation.
    @class Spine
    @constructor
    @param {String} id
    @param {Object} [settings]
**/
game.Spine = game.PIXI.Spine.extend({
    init: function(id, settings) {
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
    debugDraw: true,
    
    /**
        Remove container from it's parent.
        @method remove
    **/
    remove: function() {
        if (this.parent) this.parent.removeChild(this);
    },

    /**
        Add object to container.
        @method addChild
    **/
    addChild: function(obj) {
        this._super(obj);
        if (game.debugDraw && obj.interactive && obj.debugDraw) game.debugDraw.addSprite(obj);
    },

    /**
        Add to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        container.addChild(this);
        return this;
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
    @param {String|game.Texture} texture
    @param {Number} width
    @param {Number} height
    @param {Object} [settings]
**/
game.TilingSprite = game.PIXI.TilingSprite.extend({
    /**
        @property {game.Point} speed
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
    },

    /**
        Add to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        container.addChild(this);
        return this;
    }
});

/**
    Frame by frame animation.
    @class Animation
    @extends game.Container
    @constructor
    @param {Array} textures
**/
game.Animation = game.PIXI.MovieClip.extend({
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

    updateTransform: function() {
        if (this.playing) {
            this.currentFrame -= this.animationSpeed;
            this.currentFrame += this.animationSpeed * 60 * game.system.delta;
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
    @class Video
    @constructor
    @param {String} source
**/
game.Video = game.Class.extend({
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
            source.src = game.config.mediaFolder + '/' + urls[i];
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

/**
    @module debug
**/
game.module(
    'engine.debug'
)
.require(
    'engine.physics',
    'engine.camera',
    'engine.renderer.core',
    'engine.scene',
    'engine.system'
)
.body(function() {
'use strict';

/**
    Debug bar.
    Automatically enabled, if URL contains `?debug`.
    @class Debug
**/
game.createClass('Debug', {
    /**
        Time of last update.
        @property {Number} last
    **/
    last: 0,
    /**
        Sprites count.
        @property {Number} sprites
    **/
    sprites: 0,
    /**
        Current fps.
        @property {Number} fps
    **/
    fps: 0,
    /**
        @property {Number} _frames
        @private
    **/
    _frames: 0,

    init: function() {
        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'pandaDebug';
        this.debugDiv.style.position = 'fixed';
        this.debugDiv.style.left = '0px';
        this.debugDiv.style[game.Debug.position] = '0px';
        this.debugDiv.style.zIndex = 9999;
        this.debugDiv.style.backgroundColor = game.Debug.backgroundColor;
        this.debugDiv.style.color = game.Debug.color;
        this.debugDiv.style.fontFamily = 'Arial';
        this.debugDiv.style.fontSize = '14px';
        this.debugDiv.style.width = '100%';
        this.debugDiv.style.pointerEvents = 'none';
        document.body.appendChild(this.debugDiv);

        game.Sprite.inject({
            _render: function(context) {
                this.super(context);
                game.debug.sprites++;
            }
        });

        game.Graphics.inject({
            _render: function(context) {
                this.super(context);
                game.debug.sprites++;
            }
        });

        game.Scene.inject({
            _update: function() {
                if (game.debug) game.debug._reset();
                this.super();
                if (game.debug) game.debug._update();
            }
        });
    },

    /**
        @method _reset
        @private
    **/
    _reset: function() {
        this.sprites = 0;
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        this._frames++;

        var now = Date.now();
        if (now >= this.last + game.Debug.frequency) {
            this.fps = Math.round(this._frames * 1000 / (now - this.last));
            this.last = now;
            this._frames = 0;
        }

        var text = 'FPS: ' + this.fps;
        if (game.scene.objects) text += ' OBJECTS: ' + game.scene.objects.length;
        text += ' SPRITES: ' + this.sprites;
        if (game.tween) text += ' TWEENS: ' + game.tween.tweens.length;
        if (game.scene.timers) text += ' TIMERS: ' + game.scene.timers.length;
        if (game.scene.emitters) text += ' EMITTERS: ' + game.scene.emitters.length;
        if (game.scene.world) text += ' BODIES:' + game.scene.world.bodies.length;
        text += ' INPUTS: ' + game.input.items.length;
        this._setText(text);
    },

    /**
        @method _setText
        @private
    **/
    _setText: function(text) {
        this.debugDiv.innerHTML = text;
    }
});

game.addAttributes('Debug', {
    /**
        Enable debug box.
        @attribute {Boolean} enabled
    **/
    enabled: !!document.location.href.toLowerCase().match(/\?debug/),
    /**
        How fast to update fps (ms).
        @attribute {Number} frequency
        @default 500
    **/
    frequency: 500,
    /**
        Text color of debug bar.
        @attribute {String} color
        @default #ff0000
    **/
    color: '#ff0000',
    /**
        Background color of debug bar.
        @attribute {String} backgroundColor
        @default rgba(0, 0, 0, 0.7)
    **/
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alpha: 0.7,
    /**
        Y position of debug bar.
        @attribute {String} position
        @default bottom
    **/
    position: 'bottom'
});

/**
    DebugDraw will draw all interactive sprite hit areas and physic shapes.
    Automatically enabled, if URL contains `?debugdraw`.
    @class DebugDraw
    @extends game.Class
**/
game.createClass('DebugDraw', {
    /**
        @property {game.Container} _spriteContainer
        @private
    **/
    _spriteContainer: null,
    /**
        @property {game.Container} _bodyContainer
        @private
    **/
    _bodyContainer: null,

    init: function() {
        this._spriteContainer = new game.Container();
        this._bodyContainer = new game.Container();

        game.Container.inject({
            _render: function(context) {
                this.super(context);
                
                var bounds = this._getBounds();
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.globalAlpha = 0.3;
                context.fillStyle = '#0000ff';
                context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            }
        });

        game.Scene.inject({
            staticInit: function() {
                this.super();
                // game.debugDraw._reset();
            },

            _render: function() {
                // game.debugDraw._update();
                this.super();
            }
        });
    },

    /**
        @method _reset
        @private
    **/
    _reset: function() {
        this._spriteContainer.removeAll();
        this._spriteContainer.addTo(game.system.stage);
        this._bodyContainer.removeAll();
        this._bodyContainer.addTo(game.system.stage);
    },

    /**
        @method _addSprite
        @param {game.Sprite} sprite
        @private
    **/
    _addSprite: function(sprite) {
        var grap = new game.Graphics();
        grap.beginFill(game.DebugDraw.spriteColor);
        grap.lineStyle(1, game.DebugDraw.spriteLineColor);

        if (sprite.hitArea) {
            if (sprite.hitArea instanceof game.HitRectangle) {
                grap.drawRect(sprite.hitArea.x, sprite.hitArea.y, sprite.hitArea.width, sprite.hitArea.height);
            }
            else if (sprite.hitArea instanceof game.HitCircle) {
                grap.drawCircle(sprite.hitArea.x, sprite.hitArea.y, sprite.hitArea.radius);
            }
        }
        else {
            grap.drawRect(-sprite.width * sprite.anchor.x, -sprite.height * sprite.anchor.y, sprite.width, sprite.height);
        }

        grap.position.x = sprite.position.x;
        grap.position.y = sprite.position.y;
        grap.target = sprite;
        grap.alpha = game.DebugDraw.spriteAlpha;
        this._spriteContainer.addChild(grap);
    },

    /**
        @method _addBody
        @param {game.Body} body
        @private
    **/
    _addBody: function(body) {
        var sprite = new game.Graphics();
        this._drawBodySprite(sprite, body);

        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.target = body;
        sprite.alpha = game.DebugDraw.bodyAlpha;
        this._bodyContainer.addChild(sprite);
    },

    /**
        @method _drawBodySprite
        @param {game.Graphics} sprite
        @param {game.Body} body
        @private
    **/
    _drawBodySprite: function(sprite, body) {
        sprite.clear();
        sprite.beginFill(game.DebugDraw.bodyColor);
        sprite.lineStyle(1, game.DebugDraw.bodyLineColor);

        if (body.shape instanceof game.Rectangle) {
            sprite.drawRect(-body.shape.width / 2, -body.shape.height / 2, body.shape.width, body.shape.height);
        }
        else if (body.shape instanceof game.Circle) {
            sprite.drawCircle(0, 0, body.shape.radius);
        }
    },

    /**
        @method updateSprites
        @private
    **/
    _updateSprites: function() {
        var sprite;
        for (var i = this._spriteContainer.children.length - 1; i >= 0; i--) {
            sprite = this._spriteContainer.children[i];
            sprite.rotation = sprite.target.rotation;
            sprite.visible = sprite.target.worldVisible;
            sprite.position.x = sprite.target.worldTransform.tx;
            sprite.position.y = sprite.target.worldTransform.ty;
            sprite.scale.x = sprite.target.scale.x;
            sprite.scale.y = sprite.target.scale.y;
            if (!sprite.target.parent) this._spriteContainer.removeChild(sprite);
        }
        // game.system.debug.sprites -= this._spriteContainer.children.length;
    },

    /**
        @method updateBodies
        @private
    **/
    _updateBodies: function() {
        var body;
        for (var i = this._bodyContainer.children.length - 1; i >= 0; i--) {
            body = this._bodyContainer.children[i];
            body.rotation = body.target.rotation;
            if (body.width !== body.target.shape.width ||
                body.height !== body.target.shape.height) {
                this._drawBodySprite(body, body.target);
            }
            else if (body.radius !== body.target.shape.radius) {
                this._drawBodySprite(body, body.target);
            }
            body.position.x = body.target.position.x;
            body.position.y = body.target.position.y;
            if (!body.target.world) body.remove();
        }
        // game.system.debug.sprites -= this._bodyContainer.children.length;
    },

    /**
        @method _update
    **/
    _update: function() {
        this._updateSprites();
        this._updateBodies();
    }
});

game.addAttributes('DebugDraw', {
    /**
        Enable DebugDraw.
        @attribute {Boolean} enabled
    **/
    enabled: !!document.location.href.toLowerCase().match(/\?debugdraw/),
    /**
        Color of DebugDraw sprites.
        @attribute {Number} spriteColor
        @default 0xff0000
    **/
    spriteColor: '#ff0000',
    /**
        Stroke color of DebugDraw sprites.
        @attribute {Number} spriteLineColor
        @default 0x0000ff
    **/
    spriteLineColor: '#0000ff',
    /**
        Alpha of DebugDraw sprites.
        @attribute {Number} spriteAlpha
        @default 0.5
    **/
    spriteAlpha: 0.5,
    /**
        Color of DebugDraw bodies.
        @attribute {Number} bodyColor
        @default 0x0000ff
    **/
    bodyColor: '#0000ff',
    /**
        Stroke color of DebugDraw bodies.
        @attribute {Number} bodyLineColor
        @default 0xff0000
    **/
    bodyLineColor: '#ff0000',
    /**
        Alpha of DebugDraw bodies.
        @attribute {Number} bodyAlpha
        @default 0.5
    **/
    bodyAlpha: 0.5
});

game.World.inject({
    addBody: function(body) {
        this.super(body);
        if (game.debugDraw && body.shape) game.debugDraw._addBody(body);
    }
});

game.Camera.inject({
    init: function(x, y) {
        this.super(x, y);

        if (game.debugDraw && game.Camera.debug) {
            this.debugBox = new game.Graphics();
            this.debugBox.beginFill(game.Camera.debugColor);
            this.debugBox.alpha = game.Camera.debugAlpha;
            this.debugBox.drawRect(-this.sensorWidth / 2, -this.sensorHeight / 2, this.sensorWidth, this.sensorHeight);
            game.system.stage.addChild(this.debugBox);
        }
    },

    setSensor: function(width, height) {
        this.super(width, height);

        if (this.debugBox) {
            this.debugBox.clear();
            this.debugBox.beginFill(game.Camera.debugColor);
            this.debugBox.drawRect(-this.sensorWidth / 2, -this.sensorHeight / 2, this.sensorWidth, this.sensorHeight);
        }
    },

    moveCamera: function() {
        this.super();
        if (this.debugBox) this.debugBox.alpha = game.Camera.debugAlpha * ((this.speed.x === 0 && this.speed.y === 0) ? 1 : 2);
    },

    update: function() {
        this.super();
        if (this.debugBox) this.debugBox.position.set(this.sensorPosition.x - this.position.x, this.sensorPosition.y - this.position.y);
    }
});

game.addAttributes('Camera', {
    debug: false,
    debugColor: 0xff00ff,
    debugAlpha: 0.2
});

game.onStart = function() {
    if (game.Debug && game.Debug.enabled) {
        console.log('Panda Engine ' + game.version);
        console.log('Canvas ' + this.system.width + 'x' + this.system.height);
        if (this.Audio && this.Audio.enabled) {
            console.log((this.audio.context ? 'Web' : 'HTML5') + ' Audio engine');
        }
        else {
            console.log('Audio disabled');
        }
        if (this.config.version) console.log((this.config.name ? this.config.name : 'Game') + ' ' + this.config.version);
    }
};

});

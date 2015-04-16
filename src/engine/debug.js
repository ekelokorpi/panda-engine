/**
    @module debug
**/
game.module(
    'engine.debug'
)
.body(function() {
'use strict';

/**
    @class Debug
**/
game.createClass('Debug', {
    /**
        Current fps.
        @property {Number} fps
    **/
    fps: 0,
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
        @property {Container} _bodyContainer
        @private
    **/
    _bodyContainer: null,
    /**
        @property {Number} _frames
        @private
    **/
    _frames: 0,

    init: function() {
        this._bodyContainer = new game.Container();

        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'pandaDebug';
        this.debugDiv.style.position = 'fixed';
        this.debugDiv.style.left = '0px';
        this.debugDiv.style[game.Debug.position] = '0px';
        this.debugDiv.style.zIndex = 9999;
        this.debugDiv.style.backgroundColor = game.Debug.backgroundColor;
        this.debugDiv.style.color = game.Debug.textColor;
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
                game.debug._reset();
                this.super();
                game.debug._update();
            }
        });

        game.Scene.inject({
            staticInit: function() {
                this.super();
                // game.debug._reset();
            },

            _render: function() {
                // game.debug._update();
                this.super();
            }
        });

        game.World.inject({
            addBody: function(body) {
                this.super(body);
                if (body.shape) game.debug._addBody(body);
            }
        });

        game.Container.inject({
            _render: function(context) {
                this.super(context);

                if (this._cacheAsBitmap) game.debug.sprites++;
                if (game.Debug.showBounds) game.debug._drawBounds(context, this);
                if (game.Debug.showHitAreas) game.debug._drawHitArea(context, this);
            }
        });

        if (game.Debug.camera) {
            game.Camera.inject({
                init: function(x, y) {
                    this.super(x, y);

                    if (game.debug && game.Camera.debug) {
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
        }
    },

    /**
        @method _drawBounds
        @private
        @param {CanvasRenderingContext2D|WebGLRenderingContext} context
        @param {Container} container
    **/
    _drawBounds: function(context, container) {
        if (!container.parent) return;
        if (context !== game.renderer.context) return;

        // TODO
        if (game.renderer.webGL) return;

        var bounds = container._getBounds();
        var x = bounds.x * game.scale;
        var y = bounds.y * game.scale;
        var width = bounds.width * game.scale;
        var height = bounds.height * game.scale;
        
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = game.Debug.boundAlpha;
        context.beginPath();
        context.lineWidth = 2;
        context.strokeStyle = game.Debug.boundColor;
        context.rect(x, y, width, height);
        context.stroke();
    },

    /**
        @method _drawHitArea
        @private
        @param {CanvasRenderingContext2D|WebGLRenderingContext} context
        @param {Container} container
    **/
    _drawHitArea: function(context, container) {
        if (!container.interactive) return;
        if (!container.parent) return;
        if (context !== game.renderer.context) return;

        // TODO
        if (game.renderer.webGL) return;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = game.Debug.hitAreaAlpha;
        context.fillStyle = game.Debug.hitAreaColor;

        var hitArea = container.hitArea;
        var bounds = container._getBounds();

        if (hitArea) {
            var ax = container.anchor.x * container.scale.x / container.width;
            var ay = container.anchor.y * container.scale.y / container.height;
            var x = bounds.x + bounds.width / 2 - container.width / 2 + hitArea.x;
            var y = bounds.y + bounds.height / 2 - container.height / 2 + hitArea.y;
            var hw = hitArea.width * container.scale.x;
            var hh = hitArea.height * container.scale.y;
            x += container.anchor.x * container.scale.x - hw * ax;
            y += container.anchor.y * container.scale.y - hh * ay;
            x *= game.scale;
            y *= game.scale;

            var width = hitArea.width * container.scale.x * game.scale;
            var height = hitArea.height * container.scale.y * game.scale;
        }
        else {
            hitArea = bounds;
            var x = hitArea.x * game.scale;
            var y = hitArea.y * game.scale;
            var width = hitArea.width * game.scale;
            var height = hitArea.height * game.scale;
        }

        context.fillRect(x, y, width, height);
    },

    /**
        @method _reset
        @private
    **/
    _reset: function() {
        this.sprites = 0;
    },

    /**
        @method _clearBodies
        @private
    **/
    _clearBodies: function() {
        this._bodyContainer.removeAll();
        this._bodyContainer.addTo(game.system.stage);
    },

    /**
        @method _addBody
        @param {Body} body
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
        @param {Graphics} sprite
        @param {Body} body
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
        @method _updateBodies
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
        text += ' WEBGL: ' + !!game.renderer.webGL;
        text += ' HIRES: ' + game.scale;

        this._setText(text);
    },

    /**
        @method _setText
        @param {String} text
        @private
    **/
    _setText: function(text) {
        this.debugDiv.innerHTML = text;
    }
});

game.addAttributes('Debug', {
    /**
        Is debug bar enabled.
        @attribute {Boolean} enabled
        @default false
    **/
    enabled: false,
    /**
        How often to update fps (ms).
        @attribute {Number} frequency
        @default 500
    **/
    frequency: 500,
    /**
        Text color of debug bar.
        @attribute {String} textColor
        @default #ff0000
    **/
    textColor: '#ff0000',
    /**
        Background color of debug bar.
        @attribute {String} backgroundColor
        @default rgba(0, 0, 0, 0.7)
    **/
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    /**
        Vertical position of debug bar (top or bottom).
        @attribute {String} position
        @default bottom
    **/
    position: 'bottom',
    /**
        Draw physics bodies.
        @attribute {Boolean} showBodies
        @default false
    **/
    showBodies: false,
    /**
        Draw container bounds.
        @attribute {Boolean} showBounds
        @default false
    **/
    showBounds: false,
    /**
        Draw camera debug.
        @attribute {Boolean} showCamera
        @default false
    **/
    showCamera: false,
    /**
        Draw interactive container hit areas.
        @attribute {Boolean} showHitAreas
        @default false
    **/
    showHitAreas: false,
    /**
        Color of bounds.
        @attribute {Number} boundColor
        @default #ff0000
    **/
    boundColor: '#ff0000',
    /**
        Alpha of bounds.
        @attribute {Number} boundAlpha
        @default 0.5
    **/
    boundAlpha: 0.5,
    /**
        Color of bodies.
        @attribute {Number} bodyColor
        @default #0000ff
    **/
    bodyColor: '#0000ff',
    /**
        Stroke color of bodies.
        @attribute {Number} bodyLineColor
        @default #ff0000
    **/
    bodyLineColor: '#ff0000',
    /**
        Alpha of bodies.
        @attribute {Number} bodyAlpha
        @default 0.5
    **/
    bodyAlpha: 0.5,
    /**
        Color of camera.
        @attribute {String} cameraColor
        @default #ff00ff
    **/
    cameraColor: '#ff00ff',
    /**
        Alpha of camera.
        @attribute {Number} cameraAlpha
        @default 0.2
    **/
    cameraAlpha: 0.2,
    /**
        @attribute {String} hitAreaColor
        @default #0000ff
    **/
    hitAreaColor: '#0000ff',
    /**
        @attribute {Number} hitAreaAlpha
        @default 0.5
    **/
    hitAreaAlpha: 0.5
});

var href = document.location.href.toLowerCase();
if (href.match(/\?debug/)) game.Debug.enabled = true;
if (href.match(/\?debugdraw/)) {
    game.Debug.showBodies = true;
    game.Debug.showBounds = true;
    game.Debug.showHitAreas = true;
}

game.onStart = function() {
    if (!this.Debug || !this.Debug.enabled) return;

    console.log('Panda Engine ' + this.version);
    var renderer = game.renderer.webGL ? 'WebGL' : 'Canvas';
    console.log(renderer + ' ' + this.system.width + 'x' + this.system.height);

    if (this.Audio && this.Audio.enabled) {
        console.log((this.audio.context ? 'Web' : 'HTML5') + ' Audio engine');
    }
    else {
        console.log('Audio disabled');
    }
};

});

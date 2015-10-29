/**
    @module debug
**/
game.module(
    'engine.debug'
)
.body(function() {

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
        Debug panel.
        @property {HTMLDivElement} panel
    **/
    panel: null,
    /**
        Sprites count.
        @property {Number} sprites
    **/
    sprites: 0,
    /**
        Debug panel text.
        @property {String} text
    **/
    text: '',
    /**
        @property {Array} _bodies
        @private
    **/
    _bodies: [],
    /**
        @property {Number} _fakeTouchTimer
        @private
    **/
    _fakeTouchTimer: 0,
    /**
        @property {Number} _fakeTouchId
        @private
    **/
    _fakeTouchId: 1,
    /**
        @property {Array} _fakeTouches
        @private
    **/
    _fakeTouches: [],
    /**
        @property {Number} _frames
        @private
    **/
    _frames: 0,

    init: function() {
        game.Input.inject({
            _calculateXY: function(event) {
                if (game.Debug.fakeTouch) return;
                this.super(event);
            }
        });

        game.Scene.inject({
            staticInit: function() {
                this.super();
                game.debug._bodies.length = 0;
            },

            _update: function() {
                game.debug._reset();
                this.super();
                game.debug._update();
            },

            _updateRenderer: function() {
                this.super();
                if (game.Debug.showHitAreas) game.debug._drawHitAreas();
                if (game.Debug.showBounds) {
                    for (var i = 0; i < this.stage.children.length; i++) {
                        var child = this.stage.children[i];
                        game.debug._drawBounds(child);
                    }
                }
                if (game.Debug.showBodies) game.debug._drawBodies();
                if (game.Debug.fakeTouch) game.debug._drawFakeTouch();
            }
        });

        game.World.inject({
            addBody: function(body) {
                this.super(body);
                game.debug._bodies.push(body);
            },

            removeBody: function(body) {
                this.super(body);
                game.debug._bodies.erase(body);
            }
        });

        if (game.device.cocoonCanvasPlus) return;

        game.Container.inject({
            _renderCachedSprite: function(context) {
                this.super(context);
                game.debug.sprites++;
            }
        });

        game.FastContainer.inject({
            _renderBatch: function(child, context) {
                this.super(child, context);
                game.debug.sprites++;
            }
        });

        game.Graphics.inject({
            _renderCanvas: function(context) {
                this.super(context);
                game.debug.sprites += this.shapes.length;
            }
        });

        game.Sprite.inject({
            _renderCanvas: function(context, transform, rect, offset) {
                this.super(context, transform, rect, offset);
                game.debug.sprites++;
            }
        });

        this._addPanel();
    },

    /**
        @method _addPanel
        @private
    **/
    _addPanel: function() {
        this.panel = document.createElement('div');
        this.panel.id = 'pandaDebug';
        this.panel.style.position = 'fixed';
        this.panel.style.left = '0px';
        this.panel.style[game.Debug.position] = '0px';
        this.panel.style.zIndex = 9999;
        this.panel.style.backgroundColor = game.Debug.backgroundColor;
        this.panel.style.color = game.Debug.textColor;
        this.panel.style.fontFamily = 'Arial';
        this.panel.style.fontSize = game.Debug.fontSize + 'px';
        this.panel.style.width = '100%';
        this.panel.style.pointerEvents = 'none';
        document.body.appendChild(this.panel);
    },

    /**
        @method _addText
        @private
        @param {String} name
        @param {Number|Boolean|String} value
    **/
    _addText: function(name, value) {
        this.text += name + ': ' + value + ' ';
    },

    /**
        @method _drawBodies
        @private
    **/
    _drawBodies: function() {
        for (var i = 0; i < this._bodies.length; i++) {
            this._drawBody(this._bodies[i]);
        }
    },

    /**
        @method _drawBody
        @param {Body} body
        @private
    **/
    _drawBody: function(body) {
        if (!body.world || !body.shape) return;

        var context = game.renderer.context;
        var shape = body.shape;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = game.Debug.bodyAlpha;
        context.fillStyle = game.Debug.bodyColor;
        context.strokeStyle = game.Debug.bodyLineColor;
        context.lineWidth = game.Debug.bodyLineWidth;

        if (shape.width && shape.height) {
            context.beginPath();
            context.rect(
                (body.position.x - shape.width / 2) * game.scale,
                (body.position.y - shape.height / 2) * game.scale,
                shape.width * game.scale,
                shape.height * game.scale
            );
            context.fill();
            context.stroke();
        }
        else if (shape.radius) {
            context.beginPath();
            context.arc(
                body.position.x * game.scale,
                body.position.y * game.scale,
                shape.radius * game.scale,
                0,
                Math.PI * 2
            );
            context.fill();
            context.stroke();
        }
    },

    /**
        @method _drawBounds
        @private
        @param {Container} container
    **/
    _drawBounds: function(container) {
        if (!container.parent || !container.visible || container.alpha <= 0 || !container.renderable) return;

        var context = game.renderer.context;
        var bounds = container._getBounds();
        var x = bounds.x * game.scale;
        var y = bounds.y * game.scale;
        var width = bounds.width * game.scale;
        var height = bounds.height * game.scale;

        if (!width && !height) return;
        
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = game.Debug.boundAlpha;
        context.lineWidth = game.Debug.boundLineWidth;
        context.strokeStyle = game.Debug.boundColor;
        context.beginPath();
        context.rect(x, y, width, height);
        context.stroke();

        if (container._cacheAsBitmap) return;

        for (var i = 0; i < container.children.length; i++) {
            var child = container.children[i];
            this._drawBounds(child);
        }
    },

    /**
        @method _drawFakeTouch
        @private
    **/
    _drawFakeTouch: function() {
        var context = game.renderer.context;

        for (var i = 0; i < this._fakeTouches.length; i++) {
            var touch = this._fakeTouches[i].touch;

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.globalAlpha = game.Debug.fakeTouchAlpha;
            context.fillStyle = game.Debug.fakeTouchColor;
            context.beginPath();
            context.arc(touch.canvasX, touch.canvasY, game.Debug.fakeTouchSize, 0, Math.PI * 2);
            context.fill();
        }
    },

    /**
        @method _drawHitArea
        @private
        @param {Container} container
    **/
    _drawHitArea: function(container) {
        if (!container.visible || container.alpha <= 0 || !container.renderable) return;

        var context = game.renderer.context;
        var wt = container._worldTransform;
        var hitArea = container.hitArea;
        var bounds = container._getBounds();

        var x = (bounds.x || wt.tx) * game.scale;
        var y = (bounds.y || wt.ty) * game.scale;

        context.setTransform(1, 0, 0, 1, x, y);
        context.globalAlpha = game.Debug.hitAreaAlpha;
        context.fillStyle = game.Debug.hitAreaColor;

        if (hitArea) {
            var scaleX = wt.a / container._cosCache;
            var scaleY = wt.d / container._cosCache;
            var aPercX = (container.anchor.x / container.width) || 0;
            var aPercY = (container.anchor.y / container.height) || 0;
            x = hitArea.x * game.scale * scaleX;
            y = hitArea.y * game.scale * scaleY;
            x += bounds.width * scaleX * aPercX * game.scale;
            y += bounds.height * scaleY * aPercY * game.scale;
            var width = hitArea.width * scaleX * game.scale;
            var height = hitArea.height * scaleY * game.scale;
        }
        else {
            x = 0;
            y = 0;
            var width = bounds.width * game.scale;
            var height = bounds.height * game.scale;
        }

        context.fillRect(x, y, width, height);
    },

    /**
        @method _drawHitAreas
        @private
    **/
    _drawHitAreas: function() {
        for (var i = 0; i < game.input.items.length; i++) {
            var item = game.input.items[i];
            this._drawHitArea(item);
        }
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
        if (!this.panel) return;

        this._frames++;

        var now = Date.now();
        if (now >= this.last + game.Debug.frequency) {
            this.fps = Math.round(this._frames * 1000 / (now - this.last));
            this.last = now;
            this._frames = 0;
        }

        this.text = '';
        this._addText('FPS', this.fps);
        this._addText('OBJECTS', game.scene.objects.length);
        this._addText('SPRITES', this.sprites);
        if (game.scene.tweens) this._addText('TWEENS', game.scene.tweens.length);
        if (game.scene.timers) this._addText('TIMERS', game.scene.timers.length);
        if (game.scene.emitters) this._addText('EMITTERS', game.scene.emitters.length);
        if (game.scene.world) this._addText('BODIES', game.scene.world.bodies.length);
        this._addText('INPUTS', game.input.items.length);
        this._addText('HIRES', game.scale);

        this._updateText();

        for (var i = this._fakeTouches.length - 1; i >= 0; i--) {
            this._fakeTouches[i]._update();
            if (this._fakeTouches[i]._remove) this._fakeTouches.splice(i, 1);
        }

        if (!game.Debug.fakeTouch) return;

        this._fakeTouchTimer += game.delta * 1000;
        if (this._fakeTouchTimer >= game.Debug.fakeTouchInterval) {
            this._fakeTouchTimer = 0;
            if (this._fakeTouches.length === 1 && !game.Input.multitouch) return;

            var touch = new game.DebugTouch(this._fakeTouchId++);
            if (this._fakeTouchId > 9999) this._fakeTouchId = 1;
        }
    },

    /**
        @method _updateText
        @private
    **/
    _updateText: function() {
        this.panel.innerHTML = this.text;
    }
});

game.addAttributes('Debug', {
    /**
        Background color of debug panel.
        @attribute {String} backgroundColor
        @default rgba(0, 0, 0, 0.7)
    **/
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    /**
        Alpha of bodies.
        @attribute {Number} bodyAlpha
        @default 0.5
    **/
    bodyAlpha: 0.5,
    /**
        Color of bodies.
        @attribute {Number} bodyColor
        @default #00ff00
    **/
    bodyColor: '#00ff00',
    /**
        Stroke color of bodies.
        @attribute {Number} bodyLineColor
        @default #ffff00
    **/
    bodyLineColor: '#ffff00',
    /**
        Body line width.
        @attribute {Number} bodyLineWidth
        @default 1
    **/
    bodyLineWidth: 1,
    /**
        Alpha of bounds.
        @attribute {Number} boundAlpha
        @default 0.5
    **/
    boundAlpha: 0.5,
    /**
        Color of bounds.
        @attribute {Number} boundColor
        @default #ff0000
    **/
    boundColor: '#ff0000',
    /**
        Bounds line width.
        @attribute {Number} boundLineWidth
        @default 1
    **/
    boundLineWidth: 1,
    /**
        Alpha of camera.
        @attribute {Number} cameraAlpha
        @default 0.2
    **/
    cameraAlpha: 0.2,
    /**
        Color of camera.
        @attribute {String} cameraColor
        @default #ff00ff
    **/
    cameraColor: '#ff00ff',
    /**
        Enable debugging (can also be enabled with ?debug on url).
        @attribute {Boolean} enabled
        @default false
    **/
    enabled: false,
    /**
        Enable fake touches.
        @attribute {Boolean} fakeTouch
        @default false
    **/
    fakeTouch: false,
    /**
        Sprite alpha for fake touches.
        @attribute {Number} fakeTouchAlpha
        @default 0.5
    **/
    fakeTouchAlpha: 0.5,
    /**
        Sprite color for fake touches.
        @attribute {String} fakeTouchColor
        @default #ff0000
    **/
    fakeTouchColor: '#ff0000',
    /**
        How often to create new fake touch (ms).
        @attribute {Number} fakeTouchInterval
        @default 100
    **/
    fakeTouchInterval: 100,
    /**
        Maximum lifetime of fake touch (ms).
        @attribute {Number} fakeTouchMaxLife
        @default 500
    **/
    fakeTouchMaxLife: 500,
    /**
        Maximum speed of fake touch movement.
        @attribute {Number} fakeTouchMaxSpeed
        @default 50
    **/
    fakeTouchMaxSpeed: 50,
    /**
        Minimum lifetime of fake touch (ms).
        @attribute {Number} fakeTouchMinLife
        @default 100
    **/
    fakeTouchMinLife: 100,
    /**
        Minimum speed of fake touch movement.
        @attribute {Number} fakeTouchMinSpeed
        @default 1
    **/
    fakeTouchMinSpeed: 1,
    /**
        How often to move fake touch (ms).
        @attribute {Number} fakeTouchMoveInterval
        @default 50
    **/
    fakeTouchMoveInterval: 50,
    /**
        Percent of fake touches, that will move.
        @attribute {Number} fakeTouchMovePercent
        @default 50
    **/
    fakeTouchMovePercent: 50,
    /**
        Sprite radius of fake touches.
        @attribute {Number} fakeTouchSize
        @default 20
    **/
    fakeTouchSize: 20,
    /**
        Debug panel font size.
        @attribute {Number} fontSize
        @default 14
    **/
    fontSize: 14,
    /**
        How often to update fps (ms).
        @attribute {Number} frequency
        @default 500
    **/
    frequency: 500,
    /**
        @attribute {String} hitAreaColor
        @default #0000ff
    **/
    hitAreaColor: '#0000ff',
    /**
        @attribute {Number} hitAreaAlpha
        @default 0.5
    **/
    hitAreaAlpha: 0.5,
    /**
        Vertical position of debug panel (top or bottom).
        @attribute {String} position
        @default top
    **/
    position: 'top',
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
        Show info on console.
        @attribute {Boolean} showInfo
        @default true
    **/
    showInfo: true,
    /**
        Text color of debug panel.
        @attribute {String} textColor
        @default #ff0000
    **/
    textColor: '#ff0000'
});

game.createClass('DebugTouch', {
    moveTimer: 0,
    lifeTimer: 0,
    event: {
        changedTouches: []
    },
    touch: {},

    init: function(id) {
        this.touch.identifier = id;
        this.touch.canvasX = game.width.random();
        this.touch.canvasY = game.height.random();
        this.event.changedTouches.push(this.touch);

        game.input._touchstart(this.event);
        game.debug._fakeTouches.push(this);

        this.life = Math.random(game.Debug.fakeTouchMinLife, game.Debug.fakeTouchMaxLife);
        this.speed = Math.random(game.Debug.fakeTouchMinSpeed, game.Debug.fakeTouchMaxSpeed);

        this.moving = Math.random() <= game.Debug.fakeTouchMovePercent / 100;

        if (this.moving) {
            this.dir = new game.Vector(this.speed, 0);
            this.dir.rotate(Math.random(0, Math.PI * 2));
        }
    },

    remove: function() {
        this._remove = true;
        game.input._touchend(this.event);
    },

    move: function() {
        this.touch.canvasX += this.dir.x;
        this.touch.canvasY += this.dir.y;
        if (this.touch.canvasX < 0 ||
            this.touch.canvasY < 0 ||
            this.touch.canvasX > game.width ||
            this.touch.canvasY > game.height) {
            return true;
        }
    },

    _update: function() {
        this.lifeTimer += game.delta * 1000;
        if (this.lifeTimer >= this.life) {
            this.remove();
            return;
        }

        if (!this.moving) return;

        this.moveTimer += game.delta * 1000;
        if (this.moveTimer >= game.Debug.fakeTouchMoveInterval) {
            this.moveTimer = 0;
            if (!this.move()) game.input._touchmove(this.event);
            else this.remove();
        }
    }
});

var href = document.location.href.toLowerCase();
if (href.match(/\?debug/)) game.Debug.enabled = true;
if (href.match(/\?debugdraw/)) {
    game.Debug.showBodies = true;
    game.Debug.showBounds = true;
    game.Debug.showCamera = true;
    game.Debug.showHitAreas = true;
}

game.onStart = function() {
    if (!this.Debug.enabled || !this.Debug.showInfo) return;

    console.log('Panda Engine ' + this.version);
    console.log('Canvas ' + this.system.width + 'x' + this.system.height);

    if (this.Audio && this.Audio.enabled) {
        console.log((this.audio.context ? 'Web' : 'HTML5') + ' Audio engine');
    }
    else {
        console.log('Audio disabled');
    }
};

});

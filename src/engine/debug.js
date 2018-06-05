/**
    @module debug
**/
game.module(
    'engine.debug'
)
.body(function() {

/**
    Instance of Debug class is created at `game.debug`, when game.Debug.enabled is true.
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
        @property {Camera} _camera
        @private
    **/
    _camera: null,
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
        if (game.Debug.showInfo) {
            console.log('Panda Engine ' + game.version);
            for (var name in game.modules) {
                if (name.indexOf('plugin') === 0 && game.modules[name].version) {
                    console.log(name + ' ' + game.modules[name].version);
                }
            }
        }
        game.Input.inject({
            _calculateXY: function(event) {
                if (game.Debug.fakeTouch) return;
                this.super(event);
            }
        });

        game.Camera.inject({
            staticInit: function(x, y) {
                this.super(x, y);
                game.debug._camera = this;
            }
        });

        game.Scene.inject({
            staticInit: function() {
                this.super();
                game.debug._bodies.length = 0;
                game.debug.last = 0;
            },

            _update: function() {
                game.debug._reset();
                this.super();
                game.debug._update();
            },

            _updateRenderer: function() {
                this.super();
                if (!game.Debug.enabled) return;
                if (game.Debug.showHitAreas) game.debug._drawHitAreas();
                if (game.Debug.showBodies) game.debug._drawBodies();
                if (game.Debug.fakeTouch) game.debug._drawFakeTouch();
                if (game.Debug.showCamera) game.debug._drawCamera();
            }
        });

        game.Physics.inject({
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
                game.debug._draws++;
            }
        });

        game.FastContainer.inject({
            _renderBatch: function(child, context) {
                this.super(child, context);
                game.debug._draws++;
                if (!game.Debug.showSprites) return;

                if (child.rotation % (Math.PI * 2) === 0) {
                    var texture = child.texture;

                    var x = (child.position.x - child.anchor.x * child.scale.x) * game.scale;
                    var y = (child.position.y - child.anchor.y * child.scale.y) * game.scale;
                    var width = texture.width * game.scale;
                    var height = texture.height * game.scale;

                    if (!width && !height) return;
                    
                    context.globalCompositeOperation = 'source-over';
                    context.globalAlpha = game.Debug.boundAlpha;
                    context.lineWidth = game.Debug.boundLineWidth;
                    context.strokeStyle = game.Debug.boundColor;
                    context.beginPath();
                    context.rect(x, y, width, height);
                    context.stroke();
                }
                else {
                    game.debug._drawSprite(child);
                }
            }
        });

        game.Graphics.inject({
            _renderCanvas: function(context) {
                this.super(context);
                game.debug._draws += this.shapes.length;
            }
        });

        game.Sprite.inject({
            _renderCanvas: function(context, transform, rect, offset) {
                this.super(context, transform, rect, offset);
                game.debug._draws++;
                if (game.Debug.showSprites) game.debug._drawSprite(this, transform, rect, offset);
            }
        });

        this._addPanel();
    },

    /**
        Add text to debug panel.
        @method addText
        @param {String} name
        @param {Number|Boolean|String} value
    **/
    addText: function(name, value) {
        this.text += name;
        if (typeof value !== 'undefined') this.text += ': ' + value;
        this.text += ' ';
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
        this.panel.style[game.Debug.panelPosition] = '0px';
        this.panel.style.zIndex = 9999;
        this.panel.style.backgroundColor = game.Debug.panelBackground;
        this.panel.style.color = game.Debug.panelColor;
        this.panel.style.fontFamily = 'Arial';
        this.panel.style.fontSize = game.Debug.panelFontSize + 'px';
        this.panel.style.width = '100%';
        this.panel.style.pointerEvents = 'none';
        this.panel.style.opacity = game.Debug.panelAlpha;
        document.body.appendChild(this.panel);
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

        var x = 0;
        var y = 0;
        if (this._camera) {
            x = -this._camera.position.x;
            y = -this._camera.position.y;
        }
        context.setTransform(1, 0, 0, 1, x, y);
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
        @method _drawCamera
        @private
    **/
    _drawCamera: function() {
        if (!this._camera) return;

        var context = game.renderer.context;
        var width = this._camera.sensorSize.x * game.scale;
        var height = this._camera.sensorSize.y * game.scale;
        var x = (this._camera.sensorPosition.x * game.scale) + (this._camera._container.position.x * game.scale) - width / 2;
        var y = (this._camera.sensorPosition.y * game.scale) + (this._camera._container.position.y * game.scale) - height / 2;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = game.Debug.cameraAlpha;
        context.fillStyle = game.Debug.cameraColor;
        context.beginPath();
        context.rect(x, y, width, height);
        context.fill();
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
            context.arc(touch.canvasX * game.scale, touch.canvasY * game.scale, game.Debug.fakeTouchSize * game.scale, 0, Math.PI * 2);
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

        var x = wt.tx * game.scale;
        var y = wt.ty * game.scale;

        context.globalAlpha = game.Debug.hitAreaAlpha;
        context.fillStyle = game.Debug.hitAreaColor;
        context.beginPath();

        if (hitArea) {
            var wt = container._worldTransform;
            var bounds = container._getBounds();
            var tx = (bounds.x || wt.tx);
            var ty = (bounds.y || wt.ty);
            var scaleX = Math.abs(wt.a / container._cosCache);
            var scaleY = Math.abs(wt.d / container._cosCache);
            var aPercX = (container.anchor.x / container.width) || 0;
            var aPercY = (container.anchor.y / container.height) || 0;
            var hx = tx + hitArea.x * scaleX;
            var hy = ty + hitArea.y * scaleY;
            hx += bounds.width * scaleX * aPercX;
            hy += bounds.height * scaleY * aPercY;
            if (hitArea.radius) {
                // Circle
                var r = hitArea.radius / 2 * game.scale;
                context.setTransform(1, 0, 0, 1, hx, hy);
                context.beginPath();
                context.arc(r, r, r, 0, Math.PI * 2);
                context.fill();
            }
            else {
                // Rectangle
                var hw = hitArea.width * scaleX * game.scale;
                var hh = hitArea.height * scaleY * game.scale;
                context.setTransform(1, 0, 0, 1, hx, hy);
                context.fillRect(0, 0, hw, hh);
            }
        }
        else {
            x = 0;
            y = 0;
            var width = bounds.width * game.scale;
            var height = bounds.height * game.scale;

            var bounds = container._getBounds();
            var hx = bounds.x * game.scale;
            var hy = bounds.y * game.scale;
            var hw = bounds.width * game.scale;
            var hh = bounds.height * game.scale;

            context.setTransform(1, 0, 0, 1, hx, hy);
            context.fillRect(0, 0, hw, hh);
        }
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
        @method _drawSprite
        @param {Container} container
        @private
    **/
    _drawSprite: function(container, transform, rect, offset) {
        var context = game.renderer.context;
        var texture = container.texture;
        var wt = transform || container._worldTransform;

        // Better way to know that it's cachedsprite?
        if (container._parent && container._parent._cachedSprite) {
            wt = container._parent._worldTransform;
        }

        var x = wt.tx * game.scale;
        var y = wt.ty * game.scale;
        var width = texture.width * game.scale;
        var height = texture.height * game.scale;
        var tx = 0;
        var ty = 0;

        if (!width && !height) return;

        if (rect) {
            width = rect.width;
            height = rect.height;
            tx = 0;
            ty = 0;
        }

        if (offset) {
            x += offset.x;
            y += offset.y;
        }
        
        context.globalCompositeOperation = 'source-over';
        context.setTransform(wt.a, wt.b, wt.c, wt.d, x, y);
        context.globalAlpha = game.Debug.boundAlpha;
        context.lineWidth = game.Debug.boundLineWidth;
        context.strokeStyle = game.Debug.boundColor;
        context.beginPath();
        context.rect(tx, ty, width, height);
        context.stroke();
    },

    /**
        @method _reset
        @private
    **/
    _reset: function() {
        this._draws = 0;
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (this.panel) this.panel.style.display = (game.Debug.showPanel && game.Debug.enabled) ? 'block' : 'none';
        if (!game.Debug.enabled) return;

        this._updateFakeTouch();

        if (!this.panel) return;

        if (!game.Debug.showPanel) return;

        this._frames++;

        var now = Date.now();
        if (now >= this.last + game.Debug.panelUpdate) {
            this.fps = Math.round(this._frames * 1000 / (now - this.last));
            this.last = now;
            this._frames = 0;
        }
        else return;

        this._updatePanel();
    },

    /**
        @method _updateFakeTouch
        @private
    **/
    _updateFakeTouch: function() {
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
        @method _updatePanel
        @private
    **/
    _updatePanel: function() {
        this.text = '';
        this.addText(game.version);
        this.addText('FPS', this.fps);
        this.addText('CANVAS', game.renderer.canvas.width + 'x' + game.renderer.canvas.height);
        this.addText('DRAWS', this._draws);
        this.addText('BODIES', this._bodies.length);
        this.addText('UPDATES', game.scene.objects.length);
        this.addText('TWEENS', game.scene.tweens.length);
        this.addText('TIMERS', game.scene.timers.length);
        this.addText('HIRES', game.scale);
        game.Debug.updatePanel.call(this);
        this.panel.innerHTML = this.text;
    }
});

game.addAttributes('Debug', {
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
        @default 0.2
    **/
    fakeTouchAlpha: 0.2,
    /**
        Sprite color for fake touches.
        @attribute {String} fakeTouchColor
        @default #ffff00
    **/
    fakeTouchColor: '#ffff00',
    /**
        How often to create new fake touch (ms).
        @attribute {Number} fakeTouchInterval
        @default 100
    **/
    fakeTouchInterval: 100,
    /**
        Maximum lifetime of fake touch (ms).
        @attribute {Number} fakeTouchMaxLife
        @default 400
    **/
    fakeTouchMaxLife: 400,
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
        Alpha of debug panel.
        @attribute {Number} panelAlpha
        @default 1.0
    **/
    panelAlpha: 1.0,
    /**
        Background color of debug panel.
        @attribute {String} panelBackground
        @default rgba(0, 0, 0, 0.7)
    **/
    panelBackground: 'rgba(0, 0, 0, 0.7)',
    /**
        Text color of debug panel.
        @attribute {String} panelColor
        @default #ff0000
    **/
    panelColor: '#ff0000',
    /**
        Debug panel font size.
        @attribute {Number} panelFontSize
        @default 14
    **/
    panelFontSize: 14,
    /**
        Vertical position of debug panel (top or bottom).
        @attribute {String} panelPosition
        @default bottom
    **/
    panelPosition: 'bottom',
    /**
        How often to update debug panel (ms).
        @attribute {Number} panelUpdate
        @default 500
    **/
    panelUpdate: 500,
    /**
        Draw physics bodies.
        @attribute {Boolean} showBodies
        @default false
    **/
    showBodies: false,
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
        Show version info on console.
        @attribute {Boolean} showInfo
        @default true
    **/
    showInfo: true,
    /**
        Show debug panel.
        @attribute {Boolean} showPanel
        @default true
    **/
    showPanel: true,
    /**
        Draw sprites.
        @attribute {Boolean} showSprites
        @default false
    **/
    showSprites: false,
    /**
        Function that is called every time the debug panel is updated.
        @method updatePanel
        @static
    **/
    updatePanel: function() {}
});

game.createClass('DebugTouch', {
    dir: null,
    event: {
        changedTouches: []
    },
    life: 0,
    lifeTimer: 0,
    moveTimer: 0,
    moving: false,
    speed: 0,
    touch: {},
    _remove: false,

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

    remove: function() {
        this._remove = true;
        if (this.touch.canvasX < 0) this.touch.canvasX = 0;
        if (this.touch.canvasY < 0) this.touch.canvasY = 0;
        if (this.touch.canvasX > game.width) this.touch.canvasX = game.width;
        if (this.touch.canvasY > game.height) this.touch.canvasY = game.height;
        game.input._touchend(this.event);
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
    game.Debug.showSprites = true;
    game.Debug.showCamera = true;
    game.Debug.showHitAreas = true;
}
if (href.match(/\?debugtouch/)) {
    game.Debug.fakeTouch = true;
}

});

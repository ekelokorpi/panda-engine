/**
    @module debug
    @namespace game
**/
game.module(
    'engine.debug'
)
.require(
    'engine.pixi'
)
.body(function() {
'use strict';

/**
    DebugDraw will draw all interactive sprite hit areas and physic shapes.
    Automatically enabled, if URL contains `?debugdraw`.
    @class DebugDraw
    @extends game.Class
**/
game.DebugDraw = game.Class.extend({
    spriteContainer: null,
    bodyContainer: null,

    init: function() {
        this.spriteContainer = new game.Container();
        this.bodyContainer = new game.Container();
    },

    /**
        Remove all sprites from DebugDraw.
        @method reset
    **/
    reset: function() {
        for (var i = this.spriteContainer.children.length - 1; i >= 0; i--) {
            this.spriteContainer.removeChild(this.spriteContainer.children[i]);
        }
        game.system.stage.addChild(this.spriteContainer);

        for (var i = this.bodyContainer.children.length - 1; i >= 0; i--) {
            this.bodyContainer.removeChild(this.bodyContainer.children[i]);
        }
        game.system.stage.addChild(this.bodyContainer);
    },

    /**
        Add sprite to DebugDraw.
        @method addSprite
        @param {game.Sprite} sprite
    **/
    addSprite: function(sprite) {
        var grap = new game.Graphics();
        grap.beginFill(game.DebugDraw.spriteColor);

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
        this.spriteContainer.addChild(grap);
    },

    /**
        Add body to DebugDraw.
        @method addBody
        @param {game.Body} body
    **/
    addBody: function(body) {
        var sprite = new game.Graphics();
        this.drawDebugSprite(sprite, body);

        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.target = body;
        sprite.alpha = game.DebugDraw.bodyAlpha;
        this.bodyContainer.addChild(sprite);
    },

    drawDebugSprite: function(sprite, body) {
        sprite.clear();
        sprite.beginFill(game.DebugDraw.bodyColor);

        if (body.shape instanceof game.Rectangle) {
            sprite.drawRect(-body.shape.width / 2, -body.shape.height / 2, body.shape.width, body.shape.height);
        }
        if (body.shape instanceof game.Circle) {
            sprite.drawCircle(0, 0, body.shape.radius);
        } // TODO add support for game.Line
    },

    /**
        Update DebugDraw sprites.
        @method update
    **/
    update: function() {
        for (var i = this.bodyContainer.children.length - 1; i >= 0; i--) {
            if (game.modules['plugins.p2']) {
                this.updateP2(this.bodyContainer.children[i]);
                continue;
            }

            this.bodyContainer.children[i].rotation = this.bodyContainer.children[i].target.rotation;

            if (this.bodyContainer.children[i].width !== this.bodyContainer.children[i].target.shape.width ||
                this.bodyContainer.children[i].height !== this.bodyContainer.children[i].target.shape.height) {
                this.drawDebugSprite(this.bodyContainer.children[i], this.bodyContainer.children[i].target);
            }

            if (this.bodyContainer.children[i].radius !== this.bodyContainer.children[i].target.shape.radius) {
                this.drawDebugSprite(this.bodyContainer.children[i], this.bodyContainer.children[i].target);
            }

            this.bodyContainer.children[i].position.x = this.bodyContainer.children[i].target.position.x;
            this.bodyContainer.children[i].position.y = this.bodyContainer.children[i].target.position.y;

            if (!this.bodyContainer.children[i].target.world) {
                this.bodyContainer.removeChild(this.bodyContainer.children[i]);
            }
        }

        for (var i = this.spriteContainer.children.length - 1; i >= 0; i--) {
            this.spriteContainer.children[i].rotation = this.spriteContainer.children[i].target.rotation;

            if (this.spriteContainer.children[i].target.parent) this.spriteContainer.children[i].target.updateTransform();

            this.spriteContainer.children[i].visible = this.spriteContainer.children[i].target.worldVisible;
            this.spriteContainer.children[i].position.x = this.spriteContainer.children[i].target.worldTransform.tx;
            this.spriteContainer.children[i].position.y = this.spriteContainer.children[i].target.worldTransform.ty;
            this.spriteContainer.children[i].scale.x = this.spriteContainer.children[i].target.scale.x;
            this.spriteContainer.children[i].scale.y = this.spriteContainer.children[i].target.scale.y;

            if (!this.spriteContainer.children[i].target.parent) {
                this.spriteContainer.removeChild(this.spriteContainer.children[i]);
            }
        }
    }
});

/**
    Color of DebugDraw sprites.
    @attribute {Number} spriteColor
    @default 0xff0000
**/
game.DebugDraw.spriteColor = 0xff0000;
/**
    Alpha of DebugDraw sprites.
    @attribute {Number} spriteAlpha
    @default 0.3
**/
game.DebugDraw.spriteAlpha = 0.3;
/**
    Color of DebugDraw bodies.
    @attribute {Number} bodyColor
    @default 0x0000ff
**/
game.DebugDraw.bodyColor = 0x0000ff;
/**
    Alpha of DebugDraw bodies.
    @attribute {Number} bodyAlpha
    @default 0.3
**/
game.DebugDraw.bodyAlpha = 0.3;
/**
    Enable DebugDraw.
    @attribute {Boolean} enabled
**/
game.DebugDraw.enabled = document.location.href.match(/\?debugdraw/) ? true : false;

/**
    Show FPS.
    Automatically enabled, if URL contains `?debug`.
    @class Debug
    @extends game.Class
**/
game.Debug = game.Class.extend({
    frames: 0,
    last: 0,
    fps: 0,
    fpsText: null,
    lastFps: 0,

    init: function() {
        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'pandaDebug';
        this.debugDiv.style.position = 'absolute';
        this.debugDiv.style.left = game.Debug.position.x + 'px';
        this.debugDiv.style.top = game.Debug.position.y + 'px';
        this.debugDiv.style.zIndex = 9999;
        this.debugDiv.style.color = game.Debug.color;
        this.debugDiv.style.fontFamily = 'Arial';
        this.debugDiv.style.fontSize = '20px';
        document.body.appendChild(this.debugDiv);
    },

    update: function() {
        this.frames++;

        if (game.Timer.last >= this.last + game.Debug.frequency) {
            this.fps = (Math.round((this.frames * 1000) / (game.Timer.last - this.last))).toString();
            if (this.fps !== this.lastFps) {
                this.lastFps = this.fps;
                this.debugDiv.innerHTML = this.fps;
            }
            this.last = game.Timer.last;
            this.frames = 0;
        }
    }
});

/**
    Enable fps display.
    @attribute {Boolean} enabled
**/
game.Debug.enabled = !!document.location.href.toLowerCase().match(/\?debug/);

/**
    How often update fps.
    @attribute {Number} frequence
    @default 1000
**/
game.Debug.frequency = 1000;

/**
    Color of fps text.
    @attribute {String} color
    @default red
**/
game.Debug.color = 'red';

/**
    Position of fps text.
    @attribute {Object} position
    @default 10,10
**/
game.Debug.position = {
    x: 10,
    y: 10
};

});

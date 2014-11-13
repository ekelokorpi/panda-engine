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
    Show debug box.
    Automatically enabled, if URL contains `?debug`.
    @class Debug
    @extends game.Class
**/
game.Debug = game.Class.extend({
    frames: 0,
    last: 0,
    objects: 0,

    init: function() {
        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'pandaDebug';
        this.debugDiv.style.position = 'absolute';
        this.debugDiv.style.left = game.Debug.positionX + 'px';
        this.debugDiv.style.top = game.Debug.positionY + 'px';
        this.debugDiv.style.zIndex = 9999;
        this.debugDiv.style.backgroundColor = game.Debug.backgroundColor;
        this.debugDiv.style.padding = '5px';
        this.debugDiv.style.color = game.Debug.color;
        this.debugDiv.style.fontFamily = 'Arial';
        this.debugDiv.style.fontSize = '16px';
        document.body.appendChild(this.debugDiv);
    },

    reset: function() {
        this.objects = 0;
    },

    update: function() {
        this.frames++;

        if (game.Timer.last >= this.last + game.Debug.frequency) {
            var fps = (Math.round((this.frames * 1000) / (game.Timer.last - this.last)));
            this.debugDiv.innerHTML = 'FPS: ' + fps + ' OBJECTS: ' + this.objects;
            this.last = game.Timer.last;
            this.frames = 0;
        }
    }
});

/**
    Enable debug box.
    @attribute {Boolean} enabled
**/
game.Debug.enabled = !!document.location.href.toLowerCase().match(/\?debug/);
/**
    How often to update debug box (ms).
    @attribute {Number} frequency
    @default 500
**/
game.Debug.frequency = 500;
/**
    Text color of debug box.
    @attribute {String} color
    @default red
**/
game.Debug.color = 'red';
/**
    Background color of debug box.
    @attribute {String} backgroundColor
    @default black
**/
game.Debug.backgroundColor = 'black';
/**
    X position of debug box.
    @attribute {Number} positionX
    @default 0
**/
game.Debug.positionX = 0;
/**
    Y position of debug box.
    @attribute {Number} positionY
    @default 0,0
**/
game.Debug.positionY = 0;

game.PIXI.DisplayObject.prototype._updateTransform = game.PIXI.DisplayObject.prototype.updateTransform;
game.PIXI.DisplayObject.prototype.updateTransform = function() {
    if (game.system.debug) game.system.debug.objects++;
    this._updateTransform();
};
game.PIXI.DisplayObject.prototype.displayObjectUpdateTransform = game.PIXI.DisplayObject.prototype.updateTransform;

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
        Add interactive sprite to DebugDraw.
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
        Add physic body to DebugDraw.
        @method addBody
        @param {game.Body} body
    **/
    addBody: function(body) {
        var sprite = new game.Graphics();
        this.drawBodySprite(sprite, body);

        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.target = body;
        sprite.alpha = game.DebugDraw.bodyAlpha;
        this.bodyContainer.addChild(sprite);
    },

    /**
        Draw debug sprite for physics body.
        @method drawBodySprite
        @param {game.Graphics} sprite
        @param {game.Body} body
    **/
    drawBodySprite: function(sprite, body) {
        sprite.clear();
        sprite.beginFill(game.DebugDraw.bodyColor);

        if (body.shape instanceof game.Rectangle) {
            sprite.drawRect(-body.shape.width / 2, -body.shape.height / 2, body.shape.width, body.shape.height);
        }
        else if (body.shape instanceof game.Circle) {
            sprite.drawCircle(0, 0, body.shape.radius);
        }
    },

    updateSprites: function() {
        var sprite;
        for (var i = this.spriteContainer.children.length - 1; i >= 0; i--) {
            sprite = this.spriteContainer.children[i];
            sprite.rotation = sprite.target.rotation;
            if (sprite.target.parent) sprite.target.updateTransform();
            sprite.visible = sprite.target.worldVisible;
            sprite.position.x = sprite.target.worldTransform.tx;
            sprite.position.y = sprite.target.worldTransform.ty;
            sprite.scale.x = sprite.target.scale.x;
            sprite.scale.y = sprite.target.scale.y;
            if (!sprite.target.parent) this.spriteContainer.removeChild(sprite);
        }
    },

    updateBodies: function() {
        var body;
        for (var i = this.bodyContainer.children.length - 1; i >= 0; i--) {
            body = this.bodyContainer.children[i];
            body.rotation = body.target.rotation;
            if (body.width !== body.target.shape.width ||
                body.height !== body.target.shape.height) {
                this.drawBodySprite(body, body.target);
            }
            else if (body.radius !== body.target.shape.radius) {
                this.drawBodySprite(body, body.target);
            }
            body.position.x = body.target.position.x;
            body.position.y = body.target.position.y;
            if (!body.target.world) this.bodyContainer.removeChild(body);
        }
    },

    /**
        Update DebugDraw sprites.
        @method update
    **/
    update: function() {
        this.updateSprites();
        this.updateBodies();
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

});

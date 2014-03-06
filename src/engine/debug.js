/**
    Debugging.
    
    @module debug
    @namespace game
**/
game.module(
    'engine.debug'
)
.body(function() { 'use strict';

/**
    DebugDraw will draw all interactive sprite hit areas and physic shapes.
    Automatically enabled, if URL contains `?debugdraw`.
    @class DebugDraw
**/
game.DebugDraw = game.Class.extend({
    /**
        @property {game.Container} container
    **/
    container: null,

    init: function() {
        this.container = new game.Container();
    },

    /**
        Remove all sprites from DebugDraw.
        @method reset
    **/
    reset: function() {
        for (var i = this.container.children.length - 1; i >= 0; i--) {
            this.container.removeChild(this.container.children[i]);
        }
        game.system.stage.addChild(this.container);
    },

    /**
        Add sprite to DebugDraw.
        @method addSprite
        @param {game.Sprite} sprite
    **/
    addSprite: function(sprite) {
        var grap = new game.Graphics();
        grap.beginFill(game.DebugDraw.spriteColor);

        if(sprite.hitArea) grap.drawRect(sprite.hitArea.x, sprite.hitArea.y, sprite.hitArea.width, sprite.hitArea.height);
        else grap.drawRect(-sprite.width * sprite.anchor.x, -sprite.height * sprite.anchor.y, sprite.width, sprite.height);

        grap.target = sprite;
        grap.alpha = game.DebugDraw.spriteAlpha;
        this.container.addChild(grap);
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
        sprite.alpha = game.DebugDraw.shapeAlpha;
        this.container.addChild(sprite);
    },

    drawDebugSprite: function(sprite, body) {
        sprite.clear();
        sprite.beginFill(game.DebugDraw.shapeColor);

        if(body.shape instanceof game.Rectangle) {
            sprite.drawRect(-body.shape.width/2, -body.shape.height/2, body.shape.width, body.shape.height);
            sprite.width = body.shape.width;
            sprite.height = body.shape.height;
        }
        if(body.shape instanceof game.Circle) {
            sprite.drawCircle(0, 0, body.shape.radius);
            sprite.radius = body.shape.radius;
        }
        // TODO add support for game.Line
    },

    /**
        Update DebugDraw sprites.
        @method update
    **/
    update: function() {
        for (var i = this.container.children.length - 1; i >= 0; i--) {
            this.container.children[i].rotation = this.container.children[i].target.rotation;

            if(game.modules['engine.physics'] && this.container.children[i].target instanceof game.Body) {
                if(this.container.children[i].width !== this.container.children[i].target.shape.width ||
                    this.container.children[i].height !== this.container.children[i].target.shape.height) {
                    this.drawDebugSprite(this.container.children[i], this.container.children[i].target);
                }
                if(this.container.children[i].radius !== this.container.children[i].target.shape.radius) {
                    this.drawDebugSprite(this.container.children[i], this.container.children[i].target);
                }

                this.container.children[i].position.x = this.container.children[i].target.position.x + game.scene.stage.position.x;
                this.container.children[i].position.y = this.container.children[i].target.position.y + game.scene.stage.position.y;
                if(!this.container.children[i].target.world) {
                    this.container.removeChild(this.container.children[i]);
                }
            } else {
                if(this.container.children[i].target.parent) this.container.children[i].target.updateTransform();
                this.container.children[i].position.x = this.container.children[i].target.worldTransform.tx;
                this.container.children[i].position.y = this.container.children[i].target.worldTransform.ty;
                this.container.children[i].scale.x = this.container.children[i].target.scale.x;
                this.container.children[i].scale.y = this.container.children[i].target.scale.y;
                if(!this.container.children[i].target.parent) {
                    this.container.removeChild(this.container.children[i]);
                }
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
    Color of DebugDraw shapes.
    @attribute {Number} shapeColor
    @default 0x0000ff
**/
game.DebugDraw.shapeColor = 0x0000ff;
/**
    Alpha of DebugDraw shapes.
    @attribute {Number} shapeAlpha
    @default 0.3
**/
game.DebugDraw.shapeAlpha = 0.3;
/**
    Enable DebugDraw.
    @attribute {Boolean} enabled
**/
game.DebugDraw.enabled = document.location.href.match(/\?debugdraw/) ? true : false;

/**
    @class Debug
    @extends game.Class
**/
game.Debug = game.Class.extend({
    frames: 0,
    last: 0,
    fps: 0,
    fpsText: null,

    init: function() {
        this.fpsText = new game.Text('0', {fill: game.Debug.color});
        this.fpsText.position.set(game.Debug.position.x, game.Debug.position.y);
        game.system.stage.addChild(this.fpsText);
    },

    update: function() {
        this.frames++;

        if(game.Timer.last >= this.last + game.Debug.frequency) {
            this.fps = (Math.round((this.frames * 1000) / (game.Timer.last - this.last))).toString();
            if(this.fps !== this.fpsText.text) this.fpsText.setText(this.fps.toString());
            this.last = game.Timer.last;
            this.frames = 0;
        }
    }
});

/**
    Enable fps display.
    @attribute {Boolean} enabled
    @default false
**/
game.Debug.enabled = !!document.location.href.toLowerCase().match(/\?debug/);

game.Debug.frequency = 1000;

game.Debug.color = 'black';

game.Debug.position = {
    x: 10,
    y: 10
};

});
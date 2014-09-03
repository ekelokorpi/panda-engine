/**
    @module camera
    @namespace game
**/
game.module(
    'engine.camera'
)
.body(function() {
'use strict';

/**
    @class Camera
    @extends game.Class
**/
game.Camera = game.Class.extend({
    /**
        Camera maximum move speed.
        @property {Number} maxSpeed
        @default 200
    **/
    maxSpeed: 200,
    /**
        Camera acceleration speed.
        @property {Number} acceleration
        @default 3
    **/
    acceleration: 3,
    /**
        Camera offset.
        @property {game.Point} offset
        @default game.system.width / 2, game.system.height / 2
    **/
    offset: null,
    /**
        Sprite, that camera follows.
        @property {game.Sprite} target
        @default null
    **/
    target: null,
    /**
        Container, that the camera is moving.
        @property {game.Container} container
        @default null
    **/
    container: null,
    /**
        Current speed of camera.
        @property {game.Point} speed
    **/
    speed: null,

    sensorPosition: null,
    sensorWidth: 200,
    sensorHeight: 200,
    threshold: 1.0,
    minX: null,
    maxX: null,
    minY: null,
    maxY: null,
    
    init: function(x, y) {
        this.position = new game.Point();
        this.speed = new game.Point();
        this.offset = new game.Point(game.system.width / 2, game.system.height / 2);
        this.sensorPosition = new game.Point(this.offset.x, this.offset.y);
        if (x && y) this.setPosition(x, y);

        game.scene.addObject(this);

        if (game.debugDraw && game.Camera.debug) {
            this.debugBox = new game.Graphics();
            this.debugBox.beginFill(game.Camera.debugColor);
            this.debugBox.alpha = game.Camera.debugAlpha;
            this.debugBox.drawRect(-this.sensorWidth / 2, -this.sensorHeight / 2, this.sensorWidth, this.sensorHeight);
            game.system.stage.addChild(this.debugBox);
        }
    },

    /**
        Set target for camera.
        @method target
        @param {game.Sprite} target
    **/
    follow: function(target) {
        this.target = target;
        this.sensorPosition.set(this.target.position.x, this.target.position.y);
    },

    /**
        Add camera to container.
        @method addTo
        @param {game.Container} container
    **/
    addTo: function(container) {
        this.container = container;
        this.container.position.set(-this.position.x, -this.position.y);
        return this;
    },

    setPosition: function(x, y) {
        this.position.set(x - this.offset.x, y - this.offset.y);

        if (typeof this.minX === 'number' && this.position.x < this.minX) {
            this.position.x = this.minX;
            this.speed.x = 0;
        }
        else if (typeof this.maxX === 'number' && this.position.x > this.maxX) {
            this.position.x = this.maxX;
            this.speed.x = 0;
        }
        if (typeof this.minY === 'number' && this.position.y < this.minY) {
            this.position.y = this.minY;
            this.speed.y = 0;
        }
        else if (typeof this.maxY === 'number' && this.position.y > this.maxY) {
            this.position.y = this.maxY;
            this.speed.y = 0;
        }

        if (this.container) {
            this.container.position.x = ~~-this.position.x;
            this.container.position.y = ~~-this.position.y;
        }
    },

    moveSensor: function() {
        var targetWidth = Math.abs(this.target.width);
        var targetHeight = Math.abs(this.target.height);
        if (this.sensorWidth < targetWidth || this.sensorHeight < targetHeight) this.setSensor(targetWidth, targetHeight);

        if (this.target.position.x < this.sensorPosition.x - this.sensorWidth / 2 + targetWidth / 2) {
            this.sensorPosition.x = this.target.position.x + this.sensorWidth / 2 - targetWidth / 2;
        }
        else if (this.target.position.x + (this.sensorWidth / 2 + targetWidth / 2) > this.sensorPosition.x + this.sensorWidth) {
            this.sensorPosition.x = this.target.position.x + (this.sensorWidth / 2 + targetWidth / 2) - this.sensorWidth;
        }

        if (this.target.position.y < this.sensorPosition.y - this.sensorHeight / 2 + targetHeight / 2) {
            this.sensorPosition.y = this.target.position.y + this.sensorHeight / 2 - targetHeight / 2;
        }
        else if (this.target.position.y + (this.sensorHeight / 2 + targetHeight / 2) > this.sensorPosition.y + this.sensorHeight) {
            this.sensorPosition.y = this.target.position.y + (this.sensorHeight / 2 + targetHeight / 2) - this.sensorHeight;
        }
    },

    setSensor: function(width, height) {
        this.sensorWidth = width;
        this.sensorHeight = height;

        if (this.debugBox) {
            this.debugBox.clear();
            this.debugBox.beginFill(game.Camera.debugColor);
            this.debugBox.drawRect(-this.sensorWidth / 2, -this.sensorHeight / 2, this.sensorWidth, this.sensorHeight);
        }
    },

    moveCamera: function() {
        this.speed.x = (this.position.x - this.sensorPosition.x + this.offset.x).limit(-this.maxSpeed, this.maxSpeed);
        this.speed.y = (this.position.y - this.sensorPosition.y + this.offset.y).limit(-this.maxSpeed, this.maxSpeed);

        if (this.speed.x > this.threshold ||
            this.speed.x < -this.threshold ||
            this.speed.y > this.threshold ||
            this.speed.y < -this.threshold
        ) {
            this.setPosition(
                this.position.x + this.offset.x - this.speed.x * this.acceleration * game.system.delta,
                this.position.y + this.offset.y - this.speed.y * this.acceleration * game.system.delta
            );
            if (this.debugBox) this.debugBox.alpha = game.Camera.debugAlpha * 2;
        }
        else {
            this.speed.x = 0;
            this.speed.y = 0;
            if (this.debugBox) this.debugBox.alpha = game.Camera.debugAlpha;
        }
    },

    update: function() {
        if (this.target) this.moveSensor();

        this.moveCamera();

        if (this.debugBox) this.debugBox.position.set(this.sensorPosition.x - this.position.x, this.sensorPosition.y - this.position.y);
    }
});

game.Camera.debug = false;
game.Camera.debugColor = 0xff00ff;
game.Camera.debugAlpha = 0.2;

});

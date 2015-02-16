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
game.createClass('Camera', {
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
    **/
    target: null,
    /**
        Container, that the camera is moving.
        @property {game.Container} container
    **/
    container: null,
    /**
        Current speed of camera.
        @property {game.Point} speed
    **/
    speed: null,
    /**
        Scale value of camera.
        @property {Number} scale
        @default 1
    **/
    scale: 1,
    /**
        Use rounding on container position.
        @property {Boolean} rounding
        @default false
    **/
    rounding: false,

    sensorPosition: null,
    sensorWidth: 0,
    sensorHeight: 0,
    threshold: 1,
    minX: null,
    maxX: null,
    minY: null,
    maxY: null,
    
    init: function(x, y) {
        this.position = new game.Point();
        this.speed = new game.Point();
        this.offset = new game.Point(game.system.width / 2, game.system.height / 2);
        this.sensorPosition = new game.Point(this.offset.x, this.offset.y);
        this.sensorWidth = 200 * game.scale;
        this.sensorHeight = 200 * game.scale;
        if (typeof x === 'number' && typeof y === 'number') this.setPosition(x, y);

        game.scene.addObject(this);
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

    /**
        Set target for camera.
        @method setTarget
        @param {game.Sprite} target
    **/
    setTarget: function(target) {
        this.target = target;
        this.sensorPosition.set(this.target.position.x * this.scale, this.target.position.y * this.scale);
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
            this.container.position.x = -(this.rounding ? (this.position.x + 0.5) | 0 : this.position.x);
            this.container.position.y = -(this.rounding ? (this.position.y + 0.5) | 0 : this.position.y);
        }
    },

    setSensor: function(width, height) {
        this.sensorWidth = width;
        this.sensorHeight = height;
    },

    moveSensor: function() {
        if (!this.target) return;

        var targetWidth = Math.abs(this.target.width) * this.scale;
        var targetHeight = Math.abs(this.target.height) * this.scale;
        var targetPosX = (this.target.position.x + this.target.width / 2) * this.scale;
        var targetPosY = (this.target.position.y + this.target.height / 2) * this.scale;
        
        if (this.sensorWidth < targetWidth || this.sensorHeight < targetHeight) this.setSensor(targetWidth, targetHeight);

        if (targetPosX < this.sensorPosition.x - this.sensorWidth / 2 + targetWidth / 2) {
            this.sensorPosition.x = targetPosX + this.sensorWidth / 2 - targetWidth / 2;
        }
        else if (targetPosX + (this.sensorWidth / 2 + targetWidth / 2) > this.sensorPosition.x + this.sensorWidth) {
            this.sensorPosition.x = targetPosX + (this.sensorWidth / 2 + targetWidth / 2) - this.sensorWidth;
        }

        if (targetPosY < this.sensorPosition.y - this.sensorHeight / 2 + targetHeight / 2) {
            this.sensorPosition.y = targetPosY + this.sensorHeight / 2 - targetHeight / 2;
        }
        else if (targetPosY + (this.sensorHeight / 2 + targetHeight / 2) > this.sensorPosition.y + this.sensorHeight) {
            this.sensorPosition.y = targetPosY + (this.sensorHeight / 2 + targetHeight / 2) - this.sensorHeight;
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
        }
        else {
            this.speed.set(0, 0);
        }
    },

    update: function() {
        this.moveSensor();
        this.moveCamera();
    }
});

});

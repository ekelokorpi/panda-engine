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
    sensor: {
        position: null,
        width: 200,
        height: 200
    },
    threshold: 1.0,
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
        Camera move limit.
        @property {game.Point} limit
        @default game.system.width, game.system.height
    **/
    limit: null,
    /**
        Camera offset.
        @property {game.Point} offset
        @default game.system.width / 2, game.system.height / 2
    **/
    offset: null,
    /**
        Camera target.
        @property {game.Container} target
        @default null
    **/
    target: null,
    /**
        Container, that the camera is moving.
        @property {game.Container} container
        @default null
    **/
    container: null,
    
    init: function(x, y) {
        this.position = new game.Point();
        this.limit = new game.Point();
        this.offset = new game.Point(game.system.width / 2, game.system.height / 2);
        this.sensor.position = new game.Point(this.offset.x, this.offset.y);
        if (x && y) this.setPosition(x, y);

        game.scene.addObject(this);
    },

    /**
        Set target for camera.
        @method target
        @param {game.Container} target
    **/
    follow: function(target) {
        this.target = target;
        this.sensor.position.set(this.target.position.x, this.target.position.y);
    },

    addTo: function(container) {
        this.container = container;
        this.container.position.set(-this.position.x, -this.position.y);
        return this;
    },

    setPosition: function(x, y) {
        this.position.set(x - this.offset.x, y - this.offset.y);

        if (this.limit.x) this.position.x = this.position.x.limit(0, this.limit.x - game.system.width);
        if (this.limit.y) this.position.y = this.position.y.limit(0, this.limit.y - game.system.height);
        if (this.container) this.container.position.set(-this.position.x, -this.position.y);
    },

    pan: function(x, y, speed) {
        this.target = null;

        game.scene.addTween(this.sensor.position, {
            x: x, y: y
        }, speed || 1000).start();
    },

    moveSensor: function() {
        if (this.target.position.x < this.sensor.position.x - this.sensor.width / 2 + this.target.width / 2) {
            this.sensor.position.x = this.target.position.x + this.sensor.width / 2 - this.target.width / 2;
        }
        else if (this.target.position.x + (this.sensor.width / 2 + this.target.width / 2) > this.sensor.position.x + this.sensor.width) {
            this.sensor.position.x = this.target.position.x + (this.sensor.width / 2 + this.target.width / 2) - this.sensor.width;
        }

        if (this.target.position.y < this.sensor.position.y - this.sensor.height / 2 + this.target.height / 2) {
            this.sensor.position.y = this.target.position.y + this.sensor.height / 2 - this.target.height / 2;
        }
        else if (this.target.position.y + (this.sensor.height / 2 + this.target.height / 2) > this.sensor.position.y + this.sensor.height) {
            this.sensor.position.y = this.target.position.y + (this.sensor.height / 2 + this.target.height / 2) - this.sensor.height;
        }
    },

    moveCamera: function() {
        var changeX = (this.position.x - this.sensor.position.x + this.offset.x).limit(-this.maxSpeed, this.maxSpeed);
        var changeY = (this.position.y - this.sensor.position.y + this.offset.y).limit(-this.maxSpeed, this.maxSpeed);

        if (changeX > this.threshold ||
            changeX < -this.threshold ||
            changeY > this.threshold ||
            changeY < -this.threshold
        ) {
            this.setPosition(
                this.position.x + this.offset.x - changeX * this.acceleration * game.system.delta,
                this.position.y + this.offset.y - changeY * this.acceleration * game.system.delta
            );
            if (this.debugBox) this.debugBox.alpha = 0.4;
        }
        else {
            if (this.debugBox) this.debugBox.alpha = 0.2;
        }
    },

    update: function() {
        if (this.target) this.moveSensor();

        this.moveCamera();

        if (game.debugDraw && !this.debugBox) {
            this.debugBox = new game.Graphics();
            this.debugBox.beginFill(0xff00ff);
            this.debugBox.alpha = 0.3;
            this.debugBox.drawRect(-this.sensor.width / 2, -this.sensor.height / 2, this.sensor.width, this.sensor.height);
            game.system.stage.addChild(this.debugBox);
        }

        if (this.debugBox) {
            this.debugBox.position.set(this.sensor.position.x - this.position.x, this.sensor.position.y - this.position.y);
        }
    }
});

});

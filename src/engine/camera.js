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
        Camera speed.
        @property {Number} speed
        @default 3
    **/
    speed: 3,
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
    **/
    target: null,
    /**
        Container, that the camera is moving.
        @property {game.Container} container
    **/
    container: null,
    
    init: function() {
        this.position = new game.Point();
        this.limit = new game.Point(game.system.width, game.system.height);
        this.offset = new game.Point(game.system.width / 2, game.system.height / 2);
        this.sensor.position = new game.Point();
    },

    /**
        Set target for camera.
        @method target
        @param {game.Container} target
    **/
    setTarget: function(target) {
        this.target = target;
        this.sensor.position.set(this.target.position.x, this.target.position.y);
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
        var changeX = this.position.x - this.sensor.position.x + this.offset.x;
        var changeY = this.position.y - this.sensor.position.y + this.offset.y;

        if (changeX > this.threshold ||
            changeX < -this.threshold ||
            changeY > this.threshold ||
            changeY < -this.threshold
        ) {
            this.position.x -= changeX * this.speed * game.system.delta;
            this.position.x = this.position.x.limit(0, this.limit.x - game.system.width);
            this.position.y -= changeY * this.speed * game.system.delta;
            this.position.y = this.position.y.limit(0, this.limit.y - game.system.height);
            if (this.debugBox) this.debugBox.alpha = 0.3;
        }
        else {
            if (this.debugBox) this.debugBox.alpha = 0.1;
        }
    },

    update: function() {
        if (!this.target) return;

        this.moveSensor();
        this.moveCamera();

        if (this.container) this.container.position.set(-this.position.x, -this.position.y);

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

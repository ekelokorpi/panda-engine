/**
    @module camera
**/
game.module(
    'engine.camera'
)
.body(function() {

/**
    @class Camera
    @constructor
    @param {Number} [x]
    @param {Number} [y]
**/
game.createClass('Camera', {
    /**
        Camera acceleration speed. Higher is faster.
        @property {Number} acceleration
        @default 3
    **/
    acceleration: 3,
    /**
        @property {Rectangle} boundary
    **/
    boundary: null,
    /**
        Container, that the camera is moving.
        @property {Container} container
    **/
    container: null,
    /**
        Camera maximum move speed.
        @property {Number} maxSpeed
        @default 200
    **/
    maxSpeed: 200,
    /**
        Camera offset.
        @property {Vector} offset
        @default game.width / 2, game.height / 2
    **/
    offset: null,
    /**
        Use rounding on container position.
        @property {Boolean} rounding
        @default false
    **/
    rounding: false,
    /**
        Scale value of camera.
        @property {Number} scale
        @default 1
    **/
    scale: 1,
    /**
        @property {Vector} sensorPosition
    **/
    sensorPosition: null,
    /**
        @property {Vector} sensorSize
    **/
    sensorSize: null,
    /**
        Current speed of camera.
        @property {Vector} speed
    **/
    speed: null,
    /**
        Container, that camera follows.
        @property {Container} target
    **/
    target: null,
    /**
        @property {Number} threshold
    **/
    threshold: 1,
    
    staticInit: function(x, y) {
        this.boundary = new game.Rectangle();
        this.position = new game.Vector();
        this.speed = new game.Vector();
        this.offset = new game.Vector(game.width / 2, game.height / 2);
        this.sensorPosition = new game.Vector(this.offset.x, this.offset.y);
        this.sensorSize = new game.Vector(200);
        if (typeof x === 'number' && typeof y === 'number') this.setPosition(x, y);
    },

    /**
        Add camera to container.
        @method addTo
        @param {Container} container
        @chainable
    **/
    addTo: function(container) {
        this.container = container;
        this.container.position.set(-this.position.x, -this.position.y);
        return this;
    },

    /**
        Set target for camera.
        @method setTarget
        @param {Container} target
    **/
    setTarget: function(target) {
        this.target = target;
        var targetPosX = (this.target.position.x - this.target.anchor.x + this.target.width / 2 * this.target.scale.x) * this.scale;
        var targetPosY = (this.target.position.y - this.target.anchor.y + this.target.height / 2 * this.target.scale.y) * this.scale;
        this.sensorPosition.set(targetPosX, targetPosY);
    },

    /**
        @method setPosition
        @param {Vector|Number} x
        @param {Number} [y]
    **/
    setPosition: function(x, y) {
        if (x instanceof game.Vector) {
            y = x.y;
            x = x.x;
        }

        this.position.set(x - this.offset.x, y - this.offset.y);

        if (typeof this.boundary.x === 'number' && this.position.x < this.boundary.x) {
            this.position.x = this.boundary.x;
            this.speed.x = 0;
        }
        else if (typeof this.boundary.width === 'number' && this.position.x > this.boundary.width) {
            this.position.x = this.boundary.width;
            this.speed.x = 0;
        }
        if (typeof this.boundary.y === 'number' && this.position.y < this.boundary.y) {
            this.position.y = this.boundary.y;
            this.speed.y = 0;
        }
        else if (typeof this.boundary.height === 'number' && this.position.y > this.boundary.height) {
            this.position.y = this.boundary.height;
            this.speed.y = 0;
        }

        if (this.container) {
            this.container.position.x = -(this.rounding ? (this.position.x + 0.5) | 0 : this.position.x);
            this.container.position.y = -(this.rounding ? (this.position.y + 0.5) | 0 : this.position.y);
        }
    },

    /**
        @method update
    **/
    update: function() {
        this._moveSensor();
        this._moveCamera();
    },

    /**
        @method _moveCamera
        @private
    **/
    _moveCamera: function() {
        this.speed.x = (this.position.x - this.sensorPosition.x + this.offset.x).limit(-this.maxSpeed, this.maxSpeed);
        this.speed.y = (this.position.y - this.sensorPosition.y + this.offset.y).limit(-this.maxSpeed, this.maxSpeed);

        if (this.speed.x > this.threshold ||
            this.speed.x < -this.threshold ||
            this.speed.y > this.threshold ||
            this.speed.y < -this.threshold
        ) {
            this.setPosition(
                this.position.x + this.offset.x - this.speed.x * this.acceleration * game.delta,
                this.position.y + this.offset.y - this.speed.y * this.acceleration * game.delta
            );
        }
        else {
            this.speed.set(0, 0);
        }
    },

    /**
        @method _moveSensor
        @private
    **/
    _moveSensor: function() {
        if (!this.target) return;

        var targetWidth = this.target.width * this.scale;
        var targetHeight = this.target.height * this.scale;
        var targetPosX = (this.target.position.x - this.target.anchor.x + this.target.width / 2 * this.target.scale.x) * this.scale;
        var targetPosY = (this.target.position.y - this.target.anchor.y + this.target.height / 2 * this.target.scale.y) * this.scale;
        
        if (this.sensorSize.x < targetWidth || this.sensorSize.y < targetHeight) this.sensorSize.set(targetWidth, targetHeight);

        if (targetPosX < this.sensorPosition.x - this.sensorSize.x / 2 + targetWidth / 2) {
            this.sensorPosition.x = targetPosX + this.sensorSize.x / 2 - targetWidth / 2;
        }
        else if (targetPosX + (this.sensorSize.x / 2 + targetWidth / 2) > this.sensorPosition.x + this.sensorSize.x) {
            this.sensorPosition.x = targetPosX + (this.sensorSize.x / 2 + targetWidth / 2) - this.sensorSize.x;
        }

        if (targetPosY < this.sensorPosition.y - this.sensorSize.y / 2 + targetHeight / 2) {
            this.sensorPosition.y = targetPosY + this.sensorSize.y / 2 - targetHeight / 2;
        }
        else if (targetPosY + (this.sensorSize.y / 2 + targetHeight / 2) > this.sensorPosition.y + this.sensorSize.y) {
            this.sensorPosition.y = targetPosY + (this.sensorSize.y / 2 + targetHeight / 2) - this.sensorSize.y;
        }
    }
});

});

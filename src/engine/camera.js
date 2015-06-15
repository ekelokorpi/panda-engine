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
        Camera acceleration speed.
        @property {Number} acceleration
        @default 3
    **/
    acceleration: 3,
    /**
        Container, that the camera is moving.
        @property {Container} container
    **/
    container: null,
    /**
        Camera offset.
        @property {Vector} offset
        @default game.width / 2, game.height / 2
    **/
    offset: null,
    /**
        Camera maximum move speed.
        @property {Number} maxSpeed
        @default 200
    **/
    maxSpeed: 200,
    /**
        @property {Number} maxX
    **/
    maxX: null,
    /**
        @property {Number} maxY
    **/
    maxY: null,
    /**
        @property {Number} minX
    **/
    minX: null,
    /**
        @property {Number} minY
    **/
    minY: null,
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
        @property {Number} sensorHeight
    **/
    sensorHeight: 0,
    /**
        @property {Vector} sensorPosition
    **/
    sensorPosition: null,
    /**
        @property {Number} sensorWidth
    **/
    sensorWidth: 0,
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
        this.position = new game.Vector();
        this.speed = new game.Vector();
        this.offset = new game.Vector(game.width / 2, game.height / 2);
        this.sensorPosition = new game.Vector(this.offset.x, this.offset.y);
        this.sensorWidth = 200 * game.scale;
        this.sensorHeight = 200 * game.scale;
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
        this.sensorPosition.set(this.target.position.x * this.scale, this.target.position.y * this.scale);
    },

    /**
        @method setPosition
        @param {Number} x
        @param {Number} y
    **/
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

    /**
        @method setSensor
        @param {Number} width
        @param {Number} height
    **/
    setSensor: function(width, height) {
        this.sensorWidth = width;
        this.sensorHeight = height;
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
    }
});

});

/**
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
        @method reset
    **/
    reset: function() {
        for (var i = this.container.children.length - 1; i >= 0; i--) {
            this.container.removeChild(this.container.children[i]);
        }
        game.system.stage.addChild(this.container);
    },

    /**
        @method addSprite
        @param {game.Sprite} sprite
    **/
    addSprite: function(sprite) {
        var grap = new game.Graphics();
        grap.beginFill(game.DebugDraw.spriteColor);

        grap.drawRect(-sprite.width * sprite.anchor.x, -sprite.height * sprite.anchor.y, sprite.width, sprite.height);

        grap.target = sprite;
        grap.alpha = game.DebugDraw.spriteAlpha;
        this.container.addChild(grap);
    },

    /**
        @method addBody
        @param {game.Body} body
    **/
    addBody: function(body) {
        var sprite = new game.Graphics();
        sprite.beginFill(game.DebugDraw.shapeColor);

        // TODO add support for game.Circle and game.Line
        if(body.shape instanceof game.Rectangle) {
            sprite.drawRect(-body.shape.width/2, -body.shape.height/2, body.shape.width, body.shape.height);
        }

        sprite.target = body;
        sprite.alpha = game.DebugDraw.shapeAlpha;
        this.container.addChild(sprite);
    },

    /**
        @method update
    **/
    update: function() {
        for (var i = this.container.children.length - 1; i >= 0; i--) {
            this.container.children[i].rotation = this.container.children[i].target.rotation;

            if(game.modules['engine.physics'] && this.container.children[i].target instanceof game.Body) {
                this.container.children[i].position.x = this.container.children[i].target.position.x + game.scene.stage.position.x;
                this.container.children[i].position.y = this.container.children[i].target.position.y + game.scene.stage.position.y;
                if(!this.container.children[i].target.world) {
                    this.container.removeChild(this.container.children[i]);
                }
            } else {
                if(this.container.children[i].target.parent) this.container.children[i].target.updateTransform();
                this.container.children[i].position.x = this.container.children[i].target.worldTransform[2];
                this.container.children[i].position.y = this.container.children[i].target.worldTransform[5];
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
    @attribute {Number} spriteColor
    @default 0xff0000
**/
game.DebugDraw.spriteColor = 0xff0000;
/**
    @attribute {Number} spriteAlpha
    @default 0.3
**/
game.DebugDraw.spriteAlpha = 0.3;
/**
    @attribute {Number} shapeColor
    @default 0x0000ff
**/
game.DebugDraw.shapeColor = 0x0000ff;
/**
    @attribute {Number} shapeAlpha
    @default 0.3
**/
game.DebugDraw.shapeAlpha = 0.3;
/**
    @attribute {Boolean} enabled
**/
game.DebugDraw.enabled = document.location.href.match(/\?debugdraw/) ? true : false;

/**
    Instance automatically created at {{#crossLink "game.Core"}}{{/crossLink}}, if URL contains `?debug`.
    @class Debug
    @extends game.Class
**/
game.Debug = game.Class.extend({
    init: function() {
        var Stats = function () {

            var startTime = Date.now(), prevTime = startTime;
            var ms = 0, msMin = Infinity, msMax = 0;
            var fps = 0, fpsMin = Infinity, fpsMax = 0;
            var frames = 0, mode = 0, bar;

            var container = document.createElement( 'div' );
            container.id = 'stats';
            container.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); setMode( ++ mode % 2 ); }, false );
            container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

            var fpsDiv = document.createElement( 'div' );
            fpsDiv.id = 'fps';
            fpsDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#002';
            container.appendChild( fpsDiv );

            var fpsText = document.createElement( 'div' );
            fpsText.id = 'fpsText';
            fpsText.style.cssText = 'color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
            fpsText.innerHTML = 'FPS';
            fpsDiv.appendChild( fpsText );

            var fpsGraph = document.createElement( 'div' );
            fpsGraph.id = 'fpsGraph';
            fpsGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0ff';
            fpsDiv.appendChild( fpsGraph );

            while ( fpsGraph.children.length < 74 ) {

                bar = document.createElement( 'span' );
                bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#113';
                fpsGraph.appendChild( bar );

            }

            var msDiv = document.createElement( 'div' );
            msDiv.id = 'ms';
            msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;display:none';
            container.appendChild( msDiv );

            var msText = document.createElement( 'div' );
            msText.id = 'msText';
            msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
            msText.innerHTML = 'MS';
            msDiv.appendChild( msText );

            var msGraph = document.createElement( 'div' );
            msGraph.id = 'msGraph';
            msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
            msDiv.appendChild( msGraph );

            while ( msGraph.children.length < 74 ) {

                bar = document.createElement( 'span' );
                bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
                msGraph.appendChild( bar );

            }

            var setMode = function ( value ) {

                mode = value;

                switch ( mode ) {

                    case 0:
                        fpsDiv.style.display = 'block';
                        msDiv.style.display = 'none';
                        break;
                    case 1:
                        fpsDiv.style.display = 'none';
                        msDiv.style.display = 'block';
                        break;
                }

            };

            var updateGraph = function ( dom, value ) {

                var child = dom.appendChild( dom.firstChild );
                child.style.height = value + 'px';

            };

            return {

                REVISION: 11,

                domElement: container,

                setMode: setMode,

                begin: function () {

                    startTime = Date.now();

                },

                end: function () {

                    var time = Date.now();

                    ms = time - startTime;
                    msMin = Math.min( msMin, ms );
                    msMax = Math.max( msMax, ms );

                    msText.textContent = ms + ' MS (' + msMin + '-' + msMax + ')';
                    updateGraph( msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

                    frames ++;

                    if ( time > prevTime + 1000 ) {

                        fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );
                        fpsMin = Math.min( fpsMin, fps );
                        fpsMax = Math.max( fpsMax, fps );

                        fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';
                        updateGraph( fpsGraph, Math.min( 30, 30 - ( fps / 100 ) * 30 ) );

                        prevTime = time;
                        frames = 0;

                    }

                    return time;

                },

                update: function () {

                    startTime = this.end();

                }

            };

        };

        this.stats = new Stats();
        document.body.appendChild(this.stats.domElement);
        this.stats.domElement.style.position = 'absolute';

        if(game.ua.mobile) {
            this.setPosition = game.Debug.position.mobile;
            this.setPosition();
            document.getElementById('fpsGraph').style.display = 'none';
            document.getElementById('msGraph').style.display = 'none';
        }
        else {
            this.setPosition = game.Debug.position.desktop;
            this.setPosition();
        }

        if(game.renderer.gl) document.getElementById('fps').style.backgroundColor = game.Debug.backgroundColor.webGL;
        else document.getElementById('fps').style.backgroundColor = game.Debug.backgroundColor.canvas;
    }
});

game.Debug.backgroundColor = {
    /**
        @attribute {String} backgroundColor.canvas
        @default '#ff0000'
    **/
    canvas: '#ff0000',
    /**
        @attribute {String} backgroundColor.webGL
        @default '#0000ff'
    **/
    webGL: '#0000ff'
};

game.Debug.POSITION = {
    TOPLEFT: function() {
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';
    },
    BOTTOMLEFT: function() {
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.bottom = '0px';
    },
    TOPRIGHT: function() {
        this.stats.domElement.style.right = '0px';
        this.stats.domElement.style.top = '0px';
    },
    BOTTOMRIGHT: function() {
        this.stats.domElement.style.right = '0px';
        this.stats.domElement.style.bottom = '0px';
    }
};

game.Debug.position = {
    /**
        @attribute {TOPLEFT|BOTTOMLEFT|TOPRIGHT|BOTTOMRIGHT} position.desktop
        @default game.Debug.POSITION.TOPLEFT
    **/
    desktop: game.Debug.POSITION.TOPLEFT,
    /**
        @attribute {TOPLEFT|BOTTOMLEFT|TOPRIGHT|BOTTOMRIGHT} position.mobile
        @default game.Debug.POSITION.TOPLEFT
    **/
    mobile: game.Debug.POSITION.TOPLEFT
};

/**
    @attribute {Boolean} enabled
**/
game.Debug.enabled = document.location.href.match(/\?debug/) ? true : false;

});
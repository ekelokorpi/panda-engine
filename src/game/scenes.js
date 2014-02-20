game.module(
    'game.scenes'
)
.require(
    'engine.scene'
)
.body(function() {

SceneGame = game.Scene.extend({
    backgroundColor: 0x808080,

    init: function() {
        var sprite, tween;

        // Sprite 1
        sprite = new game.Sprite(0, game.system.height / 2, 'media/logo.png', {
            anchor: {x: 0.5, y: 0.5}
        });
        tween = new game.Tween(sprite.position)
            .to({y: 0}, 500)
            .repeat(Infinity)
            .yoyo(true)
            .start();
        this.stage.addChild(sprite);

        // Sprite 2
        sprite = new game.Sprite(game.system.width, game.system.height / 2, 'media/logo.png', {
            anchor: {x: 0.5, y: 0.5}
        });
        tween = new game.Tween(sprite.position)
            .to({y: 0}, 250)
            .repeat(Infinity)
            .yoyo(true)
            .start();
        this.stage.addChild(sprite);
    }
});

});
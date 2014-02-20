game.module(
    'game.scenes'
)
.require(
    'engine.scene',
    'engine.audio'
)
.body(function() {

game.addAudio('media/sound/jump.m4a', 'jump');

SceneGame = game.Scene.extend({
    backgroundColor: 0x808080,

    init: function() {
        var logo = new game.Sprite(game.system.width / 2, game.system.height / 2, 'media/logo.png', {
            anchor: {x: 0.5, y: 0.5}
        });
        this.stage.addChild(logo);

        this.addTween(logo.scale, {x: 1.05, y: 1.05}, 2, {
            easing: game.Tween.Easing.Quadratic.InOut,
            loop: game.Tween.Loop.Reverse
        }).start();

        game.audio.playSound('jump');
    }
});

});
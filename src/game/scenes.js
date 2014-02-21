game.module(
    'game.scenes'
)
.require(
    'engine.scene',
    'engine.audio'
)
.body(function() {

game.addAudio('media/sound/jump.m4a', 'jump');
game.addAudio('media/sound/music.m4a', 'music');

SceneGame = game.Scene.extend({
    backgroundColor: 0x808080,

    init: function() {
        var logo = new game.Sprite(game.system.width / 2, game.system.height / 2, 'media/logo.png', {
            anchor: {x: 0.5, y: 0.5}
        });
        this.stage.addChild(logo);

        var tween = new game.Tween(logo.scale)
            .to({x: 1.05, y: 1.05}, 2000)
            .easing(game.Tween.Easing.Quadratic.InOut)
            .repeat()
            .yoyo()
            .start();

        game.audio.playSound('jump');

        game.system.canvas.style.display = 'block';
    }
});

});
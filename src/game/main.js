game.module(
    'game.main'
)
.body(function() {

game.addAsset('logo.png');

game.SceneGame = game.Scene.extend({
    backgroundColor: 0xb9bec7,

    init: function() {
        var logo = new game.Sprite('logo.png').center().addTo(this.stage);
    }
});

game.start();

});

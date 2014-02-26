game.module(
    'game.main'
)
.require(
    'engine.core'
)
.body(function() {

SceneGame = game.Scene.extend({
    backgroundColor: 0x808080,

    init: function() {
    }
});

game.start();

});
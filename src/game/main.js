game.module(
    'game.main',
    '1.0.0'
)
.require(
    'engine.core',
    'game.assets',
    'game.objects',
    'game.scenes'
)
.body(function(){

game.System.hires = true;
game.System.retina = true;

game.start();

});
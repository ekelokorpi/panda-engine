var UglifyJS = require('uglify-js');
var fs = require('fs');
var i = 0, stats, size, result;

var outputFile = process.argv[2] || 'game.min.js';
var header = '// Made with Panda.js';
var totalSize = 0;
var required = ['engine/core.js', 'game/main.js'];

global['game'] = {};
game.modules = [];
game.module = function(name) {
    name = name.replace(/\./g, '/') + '.js';
    if(game.modules.indexOf(name) === -1) game.modules.push(name);
    return game;
};
game.require = function() {
    var i, name, modules = Array.prototype.slice.call(arguments);
    for (i = 0; i < modules.length; i++) {
        name = modules[i].replace(/\./g, '/') + '.js';
        if(game.modules.indexOf(name) === -1) {
            game.modules.push(name);
            require('../' + name);
        }
    }
    return game;
};
game.body = function() {};

console.log('Building...');

for (i = 0; i < required.length; i++) {
    require('../' + required[i]);
}

for (i = 0; i < game.modules.length; i++) {
    game.modules[i] = 'src/' + game.modules[i];

    stats = fs.statSync(game.modules[i]);
    size = stats['size'];
    totalSize += size;

    console.log(game.modules[i] + ' ' + size + ' bytes');
}

console.log('Total ' + totalSize + ' bytes');

result = UglifyJS.minify(game.modules);

result.code = header + '\n' + result.code;

fs.writeFile(outputFile, result.code, function(err) {
    if(err) console.log(err);
    else {
        var stats = fs.statSync(outputFile);
        var size = stats['size'];
        var percent = Math.round((size / totalSize) * 100);
        console.log('Saved ' + outputFile + ' ' + size + ' bytes (' + percent + '%)');
    }
});
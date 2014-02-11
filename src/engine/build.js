var UglifyJS = require('uglify-js');
var fs = require('fs');
var i, file, size, result;

var outputFile = process.argv[2] || 'game.min.js';
var outputDir = process.argv[3] || './';
var header = '// Made with Panda.js - http://www.pandajs.net';
var totalSize = 0;
var include = ['engine/core.js', 'game/main.js'];
var exclude = ['engine/debug.js'];
var dir = process.cwd() + '/src/';

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
            require(dir + name);
        }
    }
    return game;
};
game.body = function() {};

console.log('Building...');

for (i = 0; i < include.length; i++) {
    require(dir + include[i]);
}

for (var i = game.modules.length - 1; i >= 0; i--) {
    if(exclude.indexOf(game.modules[i]) !== -1) game.modules.splice(i, 1);
}

for (i = 0; i < game.modules.length; i++) {
    file = game.modules[i];
    game.modules[i] = dir + game.modules[i];
    size = fs.statSync(game.modules[i]).size;
    totalSize += size;
    console.log(file + ' ' + size + ' bytes');
}

console.log('Total ' + totalSize + ' bytes');

result = UglifyJS.minify(game.modules);

result.code = header + '\n' + 'window.pandaMinified = true;' + '\n' + result.code;

fs.writeFile(outputDir + outputFile, result.code, function(err) {
    if(err) console.log(err);
    else {
        var size = fs.statSync(outputDir + outputFile).size;
        var percent = Math.round((size / totalSize) * 100);
        console.log('Saved ' + outputFile + ' ' + size + ' bytes (' + percent + '%)');
    }
});
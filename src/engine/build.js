// Usage: node src/engine/build.js [sitelock-hostname]
var UglifyJS = require('uglify-js');
var fs = require('fs');
var i, file, size, result, output, totalSize = 0;

var sitelock = process.argv[2];
var outputFile = 'game.min.js';
var outputDir = './';
var header = '// Made with Panda.js - http://www.pandajs.net';
var include = ['engine/core.js', 'game/main.js'];
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

for (i = 0; i < game.modules.length; i++) {
    file = game.modules[i];
    game.modules[i] = dir + game.modules[i];
    size = fs.statSync(game.modules[i]).size;
    totalSize += size;
    console.log(file + ' ' + size + ' bytes');
}

console.log('Total ' + totalSize + ' bytes');

result = UglifyJS.minify(game.modules);

output = header + '\n';

if(sitelock) {
    var secret = 0;
    for (var i = 0; i < sitelock.length; i++) {
        secret += sitelock[i].charCodeAt(0);
    }
    var sitelockFunc = 'var s='+secret+',h=0,n=location.hostname;for(var i=0;i<n.length;i++)h+=n[i].charCodeAt(0);if(s!==h)throw 0;';
    output += sitelockFunc;
}

output += result.code;

fs.writeFile(outputDir + outputFile, output, function(err) {
    if(err) console.log(err);
    else {
        var size = fs.statSync(outputDir + outputFile).size;
        var percent = Math.round((size / totalSize) * 100);
        console.log('Saved ' + outputFile + ' ' + size + ' bytes (' + percent + '%)');
    }
});
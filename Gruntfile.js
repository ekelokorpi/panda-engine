/*global module:false*/
module.exports = function(grunt) {
    var sourceFiles = [
        'src/engine/core.js',
        'src/engine/analytics.js',
        'src/engine/debug.js',
        'src/engine/loader.js',
        'src/engine/particle.js',
        'src/engine/physics.js',
        'src/engine/pool.js',
        'src/engine/scene.js',
        'src/engine/sound.js',
        'src/engine/sprite.js',
        'src/engine/storage.js',
        'src/engine/system.js',
        'src/engine/timer.js',
        'src/engine/tween.js',
        'src/engine/renderer.js'
    ];

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: sourceFiles,
                dest: 'build/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },

        replace: {
            options: {
                variables: {
                    'VERSION': '<%= pkg.version %>'
                },
                prefix: '@',
                force: true
            },

            dist: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [ 'build/<%= pkg.name %>-<%= pkg.version %>.js' ],
                        dest: 'build/'
                    }
                ]
            },

        },

        uglify: {
            options: {
                report: 'min',
                preserveComments: 'some'
            },
            dist: {
                files: {
                    'build/<%= pkg.name %>-<%= pkg.version %>-min.js': [
                        '<%= concat.dist.dest %>'
                    ]
                }
            }
        },

        jshint: {
            options: {
                jshintrc: ".jshintrc"
            },

            beforeConcat: {
                files: {
                    src: sourceFiles
                }
            },

            afterConcat: {
                files: {
                    src: [ '<%= concat.dist.dest %>' ]
                }
            }
        },

        clean: {
            dist: [
                'build/<%= pkg.name %>-<%= pkg.version %>.js',
                'build/<%= pkg.name %>-<%= pkg.version %>-min.js'
            ],
        },
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-replace');

    // Custom Tasks (not for now!)
    // grunt.loadTasks('tasks');

    // Default task.
    grunt.registerTask('default', ['concat', 'replace:dist', 'uglify']);
    grunt.registerTask('lint', ['jshint:beforeConcat', 'concat', 'replace:dist', 'jshint:afterConcat']);
};

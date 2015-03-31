game.module(
    'engine.renderer.webgl.shader'
)
.body(function() {
'use strict';
    
/**
    @class WebGLShader
    @constructor
    @param {WebGLRenderingContext} context
**/
game.createClass('WebGLShader', {
    attributes: [],
    program: null,
    textureCount: 0,
    firstRun: true,
    dirty: true,
    uSampler: null,
    projectionVector: null,
    offsetVector: null,
    dimensions: null,
    aVertexPosition: null,
    colorAttribute: null,
    context: null,
    _UID: null,
    uniforms: null,

    staticInit: function(context) {
        this._UID = game.WebGLShader._UID++;
        this.context = context;
    },

    init: function() {
        var gl = this.context;
        this.program = game.WebGLShader.compileProgram(gl, this.vertexSrc || game.WebGLShader.vertexSrc, game.WebGLShader.fragmentSrc);

        gl.useProgram(this.program);

        this.uSampler = gl.getUniformLocation(this.program, 'uSampler');
        this.projectionVector = gl.getUniformLocation(this.program, 'projectionVector');
        this.offsetVector = gl.getUniformLocation(this.program, 'offsetVector');
        this.dimensions = gl.getUniformLocation(this.program, 'dimensions');
        this.aVertexPosition = gl.getAttribLocation(this.program, 'aVertexPosition');
        this.aTextureCoord = gl.getAttribLocation(this.program, 'aTextureCoord');
        this.colorAttribute = gl.getAttribLocation(this.program, 'aColor');

        if (this.colorAttribute === -1) this.colorAttribute = 2;

        this.attributes.push(this.aVertexPosition);
        this.attributes.push(this.aTextureCoord);
        this.attributes.push(this.colorAttribute);

        for (var key in this.uniforms) {
            this.uniforms[key].uniformLocation = gl.getUniformLocation(this.program, key);
        }

        this.initUniforms();
    },

    initUniforms: function() {
        this.textureCount = 1;
        var gl = this.context;
        var uniform;

        for (var key in this.uniforms) {
            uniform = this.uniforms[key];

            var type = uniform.type;

            if (type === 'mat2' || type === 'mat3' || type === 'mat4') {
                uniform.glMatrix = true;
                uniform.glValueLength = 1;

                if (type === 'mat2') {
                    uniform.glFunc = gl.uniformMatrix2fv;
                }
                else if (type === 'mat3') {
                    uniform.glFunc = gl.uniformMatrix3fv;
                }
                else if (type === 'mat4') {
                    uniform.glFunc = gl.uniformMatrix4fv;
                }
            }
            else {
                uniform.glFunc = gl['uniform' + type];

                if (type === '2f' || type === '2i') {
                    uniform.glValueLength = 2;
                }
                else if (type === '3f' || type === '3i') {
                    uniform.glValueLength = 3;
                }
                else if (type === '4f' || type === '4i') {
                    uniform.glValueLength = 4;
                }
                else {
                    uniform.glValueLength = 1;
                }
            }
        }
    },

    syncUniforms: function() {
        this.textureCount = 1;
        var uniform;
        var gl = this.context;

        for (var key in this.uniforms) {
            uniform = this.uniforms[key];

            if (uniform.glValueLength === 1) {
                if (uniform.glMatrix === true) {
                    uniform.glFunc.call(gl, uniform.uniformLocation, uniform.transpose, uniform.value);
                }
                else {
                    uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value);
                }
            }
            else if (uniform.glValueLength === 2) {
                uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value.x, uniform.value.y);
            }
            else if (uniform.glValueLength === 3) {
                uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value.x, uniform.value.y, uniform.value.z);
            }
            else if (uniform.glValueLength === 4) {
                uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value.x, uniform.value.y, uniform.value.z, uniform.value.w);
            }
            else if (uniform.type === 'sampler2D') {
                if (uniform._init) {
                    gl.activeTexture(gl['TEXTURE' + this.textureCount]);

                    if (uniform.value.baseTexture._dirty[gl.id]) {
                        PIXI.instances[gl.id].updateTexture(uniform.value.baseTexture);
                    }
                    else {
                        gl.bindTexture(gl.TEXTURE_2D, uniform.value.baseTexture._glTextures[gl.id]);
                    }

                    gl.uniform1i(uniform.uniformLocation, this.textureCount);
                    this.textureCount++;
                }
            }
        }
    },

    destroy: function() {
        this.context.deleteProgram(this.program);
        this.uniforms = null;
        this.context = null;
        this.attributes.length = 0;
    }
});

game.addAttributes('WebGLShader', {
    _UID: 0,

    compileProgram: function(gl, vertexSrc, fragmentSrc) {
        var fragmentShader = this.compileFragmentShader(gl, fragmentSrc);
        var vertexShader = this.compileVertexShader(gl, vertexSrc);
        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.log('Could not initialise shaders');
        }

        return shaderProgram;
    },

    compileFragmentShader: function(gl, shaderSrc) {
        return this.compileShader(gl, shaderSrc, gl.FRAGMENT_SHADER);
    },

    compileVertexShader: function(gl, shaderSrc) {
        return this.compileShader(gl, shaderSrc, gl.VERTEX_SHADER);
    },

    compileShader: function(gl, shaderSrc, shaderType) {
        var src = shaderSrc.join('\n');
        var shader = gl.createShader(shaderType);

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    },

    vertexSrc: [
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',
        'attribute vec4 aColor;',

        'uniform vec2 projectionVector;',
        'uniform vec2 offsetVector;',

        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',

        'const vec2 center = vec2(-1.0, 1.0);',

        'void main(void) {',
        '   gl_Position = vec4( ((aVertexPosition + offsetVector) / projectionVector) + center , 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '   vColor = vec4(aColor.rgb * aColor.a, aColor.a);',
        '}'
    ],

    fragmentSrc: [
        'precision lowp float;',
        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',
        'uniform sampler2D uSampler;',
        'void main(void) {',
        '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;',
        '}'
    ]
});

});

/**
    @module renderer.webgl
**/
game.module(
    'engine.renderer.webgl'
)
.body(function() {

/**
    @class WebGLAbstractFilter
**/
game.createClass('WebGLAbstractFilter', {
    dirty: true,
    fragmentSrc: [],
    padding: 0,
    passes: [],
    shaders: [],
    uniforms: {},
    
    init: function(fragmentSrc, uniforms) {
        this.passes.push(this);
        this.uniforms = uniforms || this.uniforms;
        this.fragmentSrc = fragmentSrc || this.fragmentSrc;
    },

    syncUniforms: function() {
        for (var i = 0, j = this.shaders.length; i < j; i++) {
            this.shaders[i].dirty = true;
        }
    }
});

/**
    @class WebGLShader
    @constructor
    @param {WebGLRenderingContext} context
**/
game.createClass('WebGLShader', {
    aVertexPosition: null,
    attributes: [],
    colorAttribute: null,
    context: null,
    dimensions: null,
    dirty: true,
    firstRun: true,
    offsetVector: null,
    program: null,
    projectionVector: null,
    textureCount: 0,
    uSampler: null,
    uniforms: null,
    _UID: null,
    
    staticInit: function(context) {
        this._UID = game.WebGLShader._UID++;
        this.context = context;
    },

    init: function() {
        var gl = this.context;
        this.program = this.compileProgram(gl, this.vertexSrc || game.WebGLShader.vertexSrc, game.WebGLShader.fragmentSrc);

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

    destroy: function() {
        this.context.deleteProgram(this.program);
        this.uniforms = null;
        this.context = null;
        this.attributes.length = 0;
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
    }
});

game.addAttributes('WebGLShader', {
    _UID: 0,

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

/**
    @class WebGLShaderManager
**/
game.createClass('WebGLShaderManager', {
    attribState: [],
    context: null,
    defaultShader: null,
    maxAttibs: 10,
    stack: [],
    tempAttribState: [],

    init: function() {
        for (var i = 0; i < this.maxAttibs; i++) {
            this.attribState[i] = false;
        }
    },

    destroy: function() {
        this.attribState = null;
        this.tempAttribState = null;
        this.defaultShader.destroy();
        this.context = null;
    },

    setAttribs: function(attribs) {
        var gl = this.context;

        for (var i = 0; i < this.tempAttribState.length; i++) {
            this.tempAttribState[i] = false;
        }

        for (var i = 0; i < attribs.length; i++) {
            var attribId = attribs[i];
            this.tempAttribState[attribId] = true;
        }

        for (var i = 0; i < this.attribState.length; i++) {
            if (this.attribState[i] === this.tempAttribState[i]) continue;

            this.attribState[i] = this.tempAttribState[i];

            if (this.tempAttribState[i]) {
                gl.enableVertexAttribArray(i);
            }
            else {
                gl.disableVertexAttribArray(i);
            }
        }
    },

    setContext: function(context) {
        this.context = context;
        this.defaultShader = new game.WebGLShader(context);
        this.setShader(this.defaultShader);
    },

    setShader: function(shader) {
        if (this._currentId === shader._UID) return false;

        this._currentId = shader._UID;
        this.currentShader = shader;
        this.context.useProgram(shader.program);
        this.setAttribs(shader.attributes);

        return true;
    }
});

/**
    @class WebGLSpriteBatch
**/
game.createClass('WebGLSpriteBatch', {
    blendModes: [],
    currentBatchSize: 0,
    currentBaseTexture: null,
    dirty: true,
    drawing: false,
    lastIndexCount: 0,
    size: 2000,
    shaders: [],
    sprites: [],
    textures: [],
    vertSize: 5,

    init: function() {
        var numVerts = this.size * 4 * 4 * this.vertSize;
        var numIndices = this.size * 6;

        this.vertices = new ArrayBuffer(numVerts);
        this.positions = new Float32Array(this.vertices);
        this.colors = new Uint32Array(this.vertices);
        this.indices = new Uint16Array(numIndices);

        for (var i = 0, j = 0; i < numIndices; i += 6, j += 4) {
            this.indices[i + 0] = j + 0;
            this.indices[i + 1] = j + 1;
            this.indices[i + 2] = j + 2;
            this.indices[i + 3] = j + 0;
            this.indices[i + 4] = j + 2;
            this.indices[i + 5] = j + 3;
        }

        this.defaultShader = new game.WebGLAbstractFilter([
            'precision lowp float;',
            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',
            'uniform sampler2D uSampler;',
            'void main(void) {',
            '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;',
            '}'
        ]);
    },

    setContext: function(gl) {
        this.gl = gl;

        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

        this.currentBlendMode = 99999;

        var shader = new game.WebGLShader(gl);
        shader.fragmentSrc = this.defaultShader.fragmentSrc;
        shader.uniforms = {};
        shader.init();

        this.defaultShader.shaders[gl.id] = shader;
    },

    begin: function(renderSession) {
        this.renderSession = renderSession;
        this.shader = this.renderSession._shaderManager.defaultShader;
        this.start();
    },

    end: function() {
        this.flush();
    },

    render: function(sprite, transform) {
        var texture = sprite.texture;

        if (this.currentBatchSize >= this.size) {
            this.flush();
            this.currentBaseTexture = texture.baseTexture;
        }

        var uvs = texture._uvs;
        if (!uvs) return;

        var aX = sprite.anchor.x;
        var aY = sprite.anchor.y;
        var w0 = texture.width;
        var h0 = texture.height;
        var w1 = 0;
        var h1 = 0;
        var index = this.currentBatchSize * 4 * this.vertSize;
        var wt = transform || sprite._worldTransform;
        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx * game.scale;
        var ty = wt.ty * game.scale;
        var colors = this.colors;
        var positions = this.positions;

        if (game.Renderer.roundPixels) {
            positions[index] = a * w1 + c * h1 + tx | 0;
            positions[index + 1] = d * h1 + b * w1 + ty | 0;
            positions[index + 5] = a * w0 + c * h1 + tx | 0;
            positions[index + 6] = d * h1 + b * w0 + ty | 0;
            positions[index + 10] = a * w0 + c * h0 + tx | 0;
            positions[index + 11] = d * h0 + b * w0 + ty | 0;
            positions[index + 15] = a * w1 + c * h0 + tx | 0;
            positions[index + 16] = d * h0 + b * w1 + ty | 0;
        }
        else {
            positions[index] = a * w1 + c * h1 + tx;
            positions[index + 1] = d * h1 + b * w1 + ty;
            positions[index + 5] = a * w0 + c * h1 + tx;
            positions[index + 6] = d * h1 + b * w0 + ty;
            positions[index + 10] = a * w0 + c * h0 + tx;
            positions[index + 11] = d * h0 + b * w0 + ty;
            positions[index + 15] = a * w1 + c * h0 + tx;
            positions[index + 16] = d * h0 + b * w1 + ty;
        }
        
        positions[index + 2] = uvs[0];
        positions[index + 3] = uvs[1];
        positions[index + 7] = uvs[2];
        positions[index + 8] = uvs[3];
        positions[index + 12] = uvs[4];
        positions[index + 13] = uvs[5];
        positions[index + 17] = uvs[6];
        positions[index + 18] = uvs[7];

        var tint = 0xffffff;
        var color = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) + (sprite._worldAlpha * 255 << 24);
        colors[index + 4] = colors[index + 9] = colors[index + 14] = colors[index + 19] = color;

        this.sprites[this.currentBatchSize++] = sprite;
    },

    flush: function() {
        if (this.currentBatchSize === 0) return;

        var gl = this.gl;
        var shader;

        if (this.dirty) {
            this.dirty = false;
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

            shader = this.defaultShader.shaders[gl.id];

            var stride = this.vertSize * 4;
            gl.vertexAttribPointer(shader.aVertexPosition, 2, gl.FLOAT, false, stride, 0);
            gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, stride, 2 * 4);
            gl.vertexAttribPointer(shader.colorAttribute, 4, gl.UNSIGNED_BYTE, true, stride, 4 * 4);
        }

        if (this.currentBatchSize > (this.size * 0.5)) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        }
        else {
            var view = this.positions.subarray(0, this.currentBatchSize * 4 * this.vertSize);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }

        var nextTexture, nextShader;
        var batchSize = 0;
        var start = 0;

        var currentBaseTexture = null;
        var currentShader = null;

        var shaderSwap = false;
        var sprite;

        for (var i = 0, j = this.currentBatchSize; i < j; i++) {
            sprite = this.sprites[i];

            nextTexture = sprite.texture.baseTexture;
            nextShader = sprite.shader || this.defaultShader;

            shaderSwap = currentShader !== nextShader;

            if (currentBaseTexture !== nextTexture || shaderSwap) {
                this.renderBatch(currentBaseTexture, batchSize, start);

                start = i;
                batchSize = 0;
                currentBaseTexture = nextTexture;

                if (shaderSwap) {
                    currentShader = nextShader;
                    
                    shader = currentShader.shaders[gl.id];

                    if (!shader) {
                        shader = new game.WebGLShader(gl);

                        shader.fragmentSrc = currentShader.fragmentSrc;
                        shader.uniforms = currentShader.uniforms;
                        shader.init();

                        currentShader.shaders[gl.id] = shader;
                    }

                    this.renderSession._shaderManager.setShader(shader);

                    if (shader.dirty) shader.syncUniforms();
                    
                    var projection = this.renderSession._projection;
                    gl.uniform2f(shader.projectionVector, projection.x, projection.y);

                    var offsetVector = this.renderSession._offset;
                    gl.uniform2f(shader.offsetVector, offsetVector.x, offsetVector.y);
                }
            }

            batchSize++;
        }

        this.renderBatch(currentBaseTexture, batchSize, start);
        this.currentBatchSize = 0;
    },

    renderBatch: function(texture, size, startIndex) {
        if (size === 0) return;
        var gl = this.gl;

        if (texture._dirty[gl.id]) {
            this.renderSession._updateTexture(texture);
        }
        else {
            gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);
        }

        gl.drawElements(gl.TRIANGLES, size * 6, gl.UNSIGNED_SHORT, startIndex * 6 * 2);
    },

    stop: function() {
        this.flush();
        this.dirty = true;
    },

    start: function() {
        this.dirty = true;
    },

    destroy: function() {
        this.vertices = null;
        this.indices = null;
        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.indexBuffer);
        this.currentBaseTexture = null;
        this.gl = null;
    }
});

});

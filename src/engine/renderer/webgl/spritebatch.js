game.module(
    'engine.renderer.webgl.spritebatch'
)
.body(function() {
'use strict';

/**
    @class WebGLAbstractFilter
**/
game.createClass('WebGLAbstractFilter', {
    shaders: [],
    dirty: true,
    padding: 0,

    init: function(fragmentSrc, uniforms) {
        this.passes = [this];
        this.uniforms = uniforms || {};
        this.fragmentSrc = fragmentSrc || [];
    },

    syncUniforms: function() {
        for (var i = 0, j = this.shaders.length; i < j; i++) {
            this.shaders[i].dirty = true;
        }
    }
});

/**
    @class WebGLSpriteBatch
**/
game.createClass('WebGLSpriteBatch', {
    vertSize: 5,
    size: 2000,
    lastIndexCount: 0,
    drawing: false,
    currentBatchSize: 0,
    currentBaseTexture: null,
    dirty: true,
    textures: [],
    blendModes: [],
    shaders: [],
    sprites: [],

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

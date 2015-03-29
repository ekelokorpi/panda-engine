game.module(
	'engine.renderer.webgl.shader'
)
.body(function() {
	
game.createClass('WebGLShader', {
	program: null,
	fragmentSrc: [
	    'precision lowp float;',
	    'varying vec2 vTextureCoord;',
	    'varying vec4 vColor;',
	    'uniform sampler2D uSampler;',
	    'void main(void) {',
	    '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;',
	    '}'
	],
	textureCount: 0,
	firstRun: true,
	dirty: true,
	attributes: [],

	staticInit: function(gl) {
		this._UID = game.WebGLShader._UID++;
		this.gl = gl;
	},

	init: function() {
		var gl = this.gl;
		var program = game.WebGLShader.compileProgram(gl, this.vertexSrc || game.WebGLShader.defaultVertexSrc, this.fragmentSrc);

		gl.useProgram(program);

		this.uSampler = gl.getUniformLocation(program, 'uSampler');
		this.projectionVector = gl.getUniformLocation(program, 'projectionVector');
		this.offsetVector = gl.getUniformLocation(program, 'offsetVector');
		this.dimensions = gl.getUniformLocation(program, 'dimensions');
		this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
		this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
		this.colorAttribute = gl.getAttribLocation(program, 'aColor');

		if (this.colorAttribute === -1) this.colorAttribute = 2;

		this.attributes = [this.aVertexPosition, this.aTextureCoord, this.colorAttribute];

		for (var key in this.uniforms) {
		    this.uniforms[key].uniformLocation = gl.getUniformLocation(program, key);
		}

		this.initUniforms();

		this.program = program;
	},

	initUniforms: function() {
	    this.textureCount = 1;
	    var gl = this.gl;
	    var uniform;

	    for (var key in this.uniforms) {
	        uniform = this.uniforms[key];

	        var type = uniform.type;

	        if (type === 'sampler2D') {
	            uniform._init = false;
	            if (uniform.value !== null) this.initSampler2D(uniform);
	        }
	        else if (type === 'mat2' || type === 'mat3' || type === 'mat4') {
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

	initSampler2D: function(uniform) {
	    if (!uniform.value || !uniform.value.baseTexture || !uniform.value.baseTexture.loaded) {
	        return;
	    }

	    var gl = this.gl;

	    gl.activeTexture(gl['TEXTURE' + this.textureCount]);
	    gl.bindTexture(gl.TEXTURE_2D, uniform.value.baseTexture._glTextures[gl.id]);

	    if (uniform.textureData) {
	        var data = uniform.textureData;
	        var magFilter = (data.magFilter) ? data.magFilter : gl.LINEAR;
	        var minFilter = (data.minFilter) ? data.minFilter : gl.LINEAR;
	        var wrapS = (data.wrapS) ? data.wrapS : gl.CLAMP_TO_EDGE;
	        var wrapT = (data.wrapT) ? data.wrapT : gl.CLAMP_TO_EDGE;
	        var format = (data.luminance) ? gl.LUMINANCE : gl.RGBA;

	        if (data.repeat) {
	            wrapS = gl.REPEAT;
	            wrapT = gl.REPEAT;
	        }

	        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!data.flipY);

	        if (data.width) {
	            var width = (data.width) ? data.width : 512;
	            var height = (data.height) ? data.height : 2;
	            var border = (data.border) ? data.border : 0;

	            gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, border, format, gl.UNSIGNED_BYTE, null);
	        }
	        else {
	            gl.texImage2D(gl.TEXTURE_2D, 0, format, gl.RGBA, gl.UNSIGNED_BYTE, uniform.value.baseTexture.source);
	        }

	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
	    }

	    gl.uniform1i(uniform.uniformLocation, this.textureCount);

	    uniform._init = true;

	    this.textureCount++;
	},

	syncUniforms: function() {
	    this.textureCount = 1;
	    var uniform;
	    var gl = this.gl;

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
	            else {
	                this.initSampler2D(uniform);
	            }
	        }
	    }

	},

	destroy: function() {
	    this.gl.deleteProgram(this.program);
	    this.uniforms = null;
	    this.gl = null;
	    this.attributes = null;
	}
});

game.addAttributes('WebGLShader', {
	_UID: 0,

	compileProgram: function(gl, vertexSrc, fragmentSrc) {
	    var fragmentShader = this.CompileFragmentShader(gl, fragmentSrc);
	    var vertexShader = this.CompileVertexShader(gl, vertexSrc);

	    var shaderProgram = gl.createProgram();

	    gl.attachShader(shaderProgram, vertexShader);
	    gl.attachShader(shaderProgram, fragmentShader);
	    gl.linkProgram(shaderProgram);

	    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	        console.log('Could not initialise shaders');
	    }

	    return shaderProgram;
	},

	CompileFragmentShader: function(gl, shaderSrc) {
		return this._CompileShader(gl, shaderSrc, gl.FRAGMENT_SHADER);
	},

	CompileVertexShader: function(gl, shaderSrc) {
	    return this._CompileShader(gl, shaderSrc, gl.VERTEX_SHADER);
	},

	_CompileShader: function(gl, shaderSrc, shaderType) {
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

	defaultVertexSrc: [
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
	]
});

});

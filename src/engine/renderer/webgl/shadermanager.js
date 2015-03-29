game.module(
	'engine.renderer.webgl.shadermanager'
)
.body(function() {
	
game.createClass('WebGLShaderManager', {
	maxAttibs: 10,
	attribState: [],
	tempAttribState: [],
	stack: [],

	init: function() {
		for (var i = 0; i < this.maxAttibs; i++) {
		    this.attribState[i] = false;
		}
	},

	setContext: function(gl) {
	    this.gl = gl;
	    
	    // this.primitiveShader = new PIXI.PrimitiveShader(gl);
	    // this.complexPrimitiveShader = new PIXI.ComplexPrimitiveShader(gl);
	    this.defaultShader = new game.WebGLShader(gl);
	    // this.fastShader = new PIXI.PixiFastShader(gl);
	    // this.stripShader = new PIXI.StripShader(gl);
	    this.setShader(this.defaultShader);
	},

	setAttribs: function(attribs) {
	    var i;

	    for (i = 0; i < this.tempAttribState.length; i++) {
	        this.tempAttribState[i] = false;
	    }

	    for (i = 0; i < attribs.length; i++) {
	        var attribId = attribs[i];
	        this.tempAttribState[attribId] = true;
	    }

	    var gl = this.gl;

	    for (i = 0; i < this.attribState.length; i++) {
	        if (this.attribState[i] !== this.tempAttribState[i]) {
	            this.attribState[i] = this.tempAttribState[i];

	            if (this.tempAttribState[i]) {
	                gl.enableVertexAttribArray(i);
	            }
	            else {
	                gl.disableVertexAttribArray(i);
	            }
	        }
	    }
	},

	setShader: function(shader) {
	    if (this._currentId === shader._UID) return false;

	    this._currentId = shader._UID;
	    this.currentShader = shader;

	    this.gl.useProgram(shader.program);
	    this.setAttribs(shader.attributes);

	    return true;
	},

	destroy: function() {
	    this.attribState = null;
	    this.tempAttribState = null;
	    // this.primitiveShader.destroy();
	    // this.complexPrimitiveShader.destroy();
	    this.defaultShader.destroy();
	    // this.fastShader.destroy();
	    // this.stripShader.destroy();
	    this.gl = null;
	}
});

});

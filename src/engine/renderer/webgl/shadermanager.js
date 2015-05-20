/**
    @module renderer.webgl.shadermanager
**/
game.module(
    'engine.renderer.webgl.shadermanager'
)
.body(function() {

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

});

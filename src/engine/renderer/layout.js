/**
    @module renderer.layout
**/
game.module(
    'engine.renderer.layout'
)
.require(
    'engine.renderer.container'
)
.body(function() {

/**
    @class Layout
    @extends Container
    @constructor
    @param {String} json
    @param {Object} [props]
**/
game.createClass('Layout', 'Container', {
    /**
        List of nodes in layout, node name as the key.
        @property {Object} nodes
    **/
    nodes: {},

    staticInit: function(json, props) {
        this.super(props);

        var data = game.getJSON(json);
        if (!data) return;

        for (var i = 0; i < data.nodes.length; i++) {
            var nodeData = data.nodes[i];

            if (this.nodes[nodeData.name]) continue;

            this.nodes[nodeData.name] = new game[nodeData.class](nodeData.param, nodeData.props);
            this.nodes[nodeData.name].parent = nodeData.parent || this;
        }
    }
});

});

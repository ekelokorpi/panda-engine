/**
    @module analytics
    @namespace game
**/
game.module(
    'engine.analytics'
)
.body(function() {
'use strict';

/**
    @class Analytics
    @extends game.Class
**/
game.Analytics = game.Class.extend({
    init: function(id) {
        if (!navigator.onLine || game.device.cocoonJS) return;
        if (!id) throw('Analytics id not set.');
        
        (function(i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function() {
                (i[r].q = i[r].q || []).push(arguments)
            };
            i[r].l = 1 * new Date();
            a = s.createElement(o);
            m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m);
        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

        ga('create', id, 'auto');
        ga('send', 'pageview');
    },

    /**
        Send event to analytics.
        @method event
        @param {String} category
        @param {String} action
    **/
    event: function(category, action) {
        if (!navigator.onLine || game.device.cocoonJS) return;
        ga('send', 'event', category, action);
    }
});

/**
    @attribute {String} id
**/
game.Analytics.id = '';

});

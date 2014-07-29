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
    Google Analytics tracking.
    @class Analytics
    @extends game.Class
    @constructor
    @param {String} id
**/
game.Analytics = game.Class.extend({
    trackId: null,
    userId: null,

    init: function(id) {
        if (!navigator.onLine || game.device.cocoonJS && !game.Analytics.cocoonJS) return;
        if (!id) throw('Analytics id not set.');

        this.trackId = id;

        if (game.device.cocoonJS && game.Analytics.cocoonJS) {
            this.userId = this.guid();
            var request = new XMLHttpRequest();
            var params = 'v=1&tid=' + this.trackId + '&cid=' + this.userId + '&t=pageview&dp=%2F';
            request.open('POST', 'http://www.google-analytics.com/collect', true);
            request.send(params);
        }
        else {
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
        }
    },

    guid: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    /**
        Send event to analytics.
        @method send
        @param {String} category
        @param {String} action
        @param {String} [label]
        @param {String} [value]
    **/
    send: function(category, action, label, value) {
        if (!navigator.onLine || game.device.cocoonJS && !game.Analytics.cocoonJS) return;

        if (game.device.cocoonJS && game.Analytics.cocoonJS) {
            var request = new XMLHttpRequest();
            var params = 'v=1&tid=' + this.trackId + '&cid=' + this.userId + '&t=event&ec=' + category + '&ea=' + action;
            if (typeof label !== 'undefined') params += '&el=' + label;
            if (typeof value !== 'undefined') params += '&ev=' + value;
            request.open('POST', 'http://www.google-analytics.com/collect', true);
            request.send(params);
        }
        else {
            ga('send', 'event', category, action, label, value);
        }
    },

    // Deprecated
    event: function(category, action, label, value) {
        this.send(category, action, label, value);
    }
});

/**
    Tracking id for analytics.
    @attribute {String} id
**/
game.Analytics.id = '';

/**
    Enable analytics on CocoonJS.
    @attribute {Boolean} cocoonJS
    @default false
**/
game.Analytics.cocoonJS = false;

});

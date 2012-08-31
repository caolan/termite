define(['exports'], function (exports) {

    exports.create = function () {
        var s, w;
        w = {postMessage: function (msg) { s.onmessage({data: msg}); }};
        s = {postMessage: function (msg) { w.onmessage({data: msg}); }};

        setTimeout(function () {
            require(['termite/lib/worker-msg-handler'], function (m) { m.init(s); });
        }, 0);

        return {worker: w, ready: false, type: 'page'};
    };

});

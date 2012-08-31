define(['exports'], function (exports) {

    exports.resolveURL = function (url) {
        var loc = window.location;
        if (url[0] === '/') {
            return loc.origin + url[0];
        }
        if (/^https?:\/\//.test(url)) {
            return url;
        }
        var parts = loc.pathname.split('/');
        parts.pop();
        parts.push(url);
        return loc.origin + parts.join('/');
    };

    exports.srcToObjectURL = function (src) {
        var blob = new Blob([src], {type: 'application/javascript'});
        return (window.URL || window.webkitURL).createObjectURL(blob);
    };

    exports.workerSrc = function (rjs) {
        var rcfg = requirejs.s.contexts._.config;
        var baseUrl = exports.resolveURL(rcfg.baseUrl);
        return 'importScripts(["' + exports.resolveURL(rjs) + '"]);\n' +
            'require({baseUrl: "' + baseUrl + '"}, ["./lib/worker-msg-handler"], ' +
            'function (m) { m.init(self); });';
    };

    exports.create = function (requirejs) {
        var src = exports.workerSrc(requirejs);
        var w = new Worker(exports.srcToObjectURL(src));
        return {worker: w, ready: false, type: 'webworker'};
    };

});

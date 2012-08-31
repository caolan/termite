define(['exports', './utils'], function (exports, utils) {

    exports.srcToObjectURL = function (src) {
        var blob = new Blob([src], {type: 'application/javascript'});
        return (window.URL || window.webkitURL).createObjectURL(blob);
    };

    exports.workerSrc = function (rjs) {
        var rcfg = requirejs.s.contexts._.config;
        var baseUrl = utils.resolveURL(rcfg.baseUrl);
        return 'importScripts(["' + utils.resolveURL(rjs) + '"]);\n' +
            'require({baseUrl: "' + baseUrl + '"}, ["termite/lib/worker-msg-handler"], ' +
            'function (m) { m.init(self); });';
    };

    exports.create = function (requirejs) {
        var src = exports.workerSrc(requirejs);
        var w = new Worker(exports.srcToObjectURL(src));
        return {worker: w, ready: false, type: 'webworker'};
    };

});

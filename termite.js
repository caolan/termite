// need to know:
// - location of require.js
// - number of workers
//
// need to implement
// - spawn
// - send
// - stop
// - ls

define(['exports', 'lodash'], function (exports, _) {

    var root = typeof window !== 'undefined' ? window: global;

    var PID_COUNTER = 1;
    var WID_COUNTER = 1;

    var MESSAGES = root.MESSAGES = [];
    var PROCESSES = root.PROCESSES = {};
    var WORKERS = root.WORKERS = {};
    var REQUIREJS = './jam/require.js';


    var PAGE_WORKER = {
        postMessage: function (msg) {
            if (msg.type === 'process_init') {
                PAGE_WORKER.processInit(msg.pid, msg.module, msg.args);
            }
            else if (msg.type === 'process_message') {
                PAGE_WORKER.processMessage(msg);
            }
        },
        onmessage: function (ev) {
            var msg = ev.data;
            if (msg.type === 'process_ready') {
                var p = PROCESSES[msg.pid];
                p.ready = true;
                p.state = msg.state;
            }
            else if (msg.type === 'process_message') {
                exports.deliver(msg.pid, msg.to, msg.data);
            }
            console.log(['message from page worker', msg]);
        },
        self: {
            postMessage: function (msg) {
                PAGE_WORKER.onmessage({data: msg});
            }
        },
        processReady: function (pid, state) {
            PAGE_WORKER.self.postMessage({
                type: 'process_ready',
                state: state,
                pid: pid
            });
        },
        processInit: function (pid, module, args) {
            require([module], function (m) {
                var state = m.init.apply(null, args);
                PAGE_WORKER.processReady(pid, state);
            });
        },
        processMessage: function (msg) {
            require([msg.module], function (m) {
                var process = {
                    send: function (pid, data) {
                        exports.deliver(msg.to, pid, data);
                    }
                };
                var state = m.receive(process, msg.data, msg.from, msg.state);
                PAGE_WORKER.processReady(msg.to, state);
            });
        }
    };


    exports.getPid = function () {
        // return current value of PID_COUNTER, then increment
        return PID_COUNTER++;
    };

    exports.getWid = function () {
        // return current value of WID_COUNTER, then increment
        return WID_COUNTER++;
    };

    exports.createObjectURL = function (src) {
        var BlobBuilder = window.BlobBuilder;
        if (!BlobBuilder && typeof MozBlobBuilder !== 'undefined') {
            BlobBuilder = MozBlobBuilder;
        }
        if (!BlobBuilder && typeof WebKitBlobBuilder !== 'undefined') {
            BlobBuilder = WebKitBlobBuilder;
        }
        var oBuilder = new BlobBuilder();
        oBuilder.append(src);
        var URL = window.URL ? window.URL: window.webkitURL;
        return URL.createObjectURL(oBuilder.getBlob());
    };

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

    exports.workerSrc = function () {
        var rcfg = requirejs.s.contexts._.config;
        var baseUrl = exports.resolveURL(rcfg.baseUrl);
        return 'importScripts(["' + exports.resolveURL(REQUIREJS) + '"]);\n\n' +
            'require({baseUrl: "' + baseUrl + '"}, ["worker"], ' +
            'function (worker) { worker.init(self); });';
    };

    exports.getReadyWorker = function () {
        var keys = _.keys(WORKERS);
        for (var i = 0, len = keys.length; i < len; i++) {
            var k = keys[i];
            var w = WORKERS[k];
            if (w.ready) {
                return w;
            }
        }
    };

    exports.processMessages = function () {
        var w = exports.getReadyWorker();
        for (var i = 0, len = MESSAGES.length; i < len; i++) {
            var m = MESSAGES[i];
            if (!m) {
                console.log(MESSAGES);
            }
            var p = m.to ? PROCESSES[m.to]: null;
            if (p) {
                m.module = p.module;
                m.state = p.state;
            }
            if (p && p.page) {
                p.ready = false;
                PAGE_WORKER.postMessage(m);
                MESSAGES.splice(i, 1);
                return exports.processMessages();
            }
            if (w && (p && p.ready || m.system)) {
                if (p) {
                    p.ready = false;
                }
                w.ready = false;
                w.worker.postMessage(m);
                MESSAGES.splice(i, 1);
                return exports.processMessages();
            }
        }
    };

    exports.startWorker = function () {
        var id = exports.getWid();
        var src = exports.workerSrc();
        var w = new Worker(exports.srcToObjectURL(src));
        WORKERS[id] = {worker: w, ready: false};
        WORKERS[id].worker.onmessage = function (ev) {
            // when worker sends 'ready' message, change ready: true
            var msg = ev.data;
            if (msg.type == 'worker_ready') {
                WORKERS[id].ready = true;
                exports.processMessages();
            }
            else if (msg.type === 'process_ready') {
                var p = PROCESSES[msg.pid];
                p.ready = true;
                p.state = msg.state;
                WORKERS[id].ready = true;
                exports.processMessages();
            }
            else if (msg.type === 'process_message') {
                exports.deliver(msg.pid, msg.to, msg.data);
            }
            console.log(['message from worker ' + id, ev.data]);
        };
        return id;
    };

    exports.sendMessage = function (msg) {
        MESSAGES.push(msg);
        exports.processMessages();
    };

    exports.spawn = function (module /* args.. */) {
        var id = exports.getPid();
        var args = Array.prototype.slice.call(arguments, 1);
        PROCESSES[id] = {
            state: null,
            ready: false,
            module: module,
            args: args
        };
        exports.sendMessage({
            type: 'process_init',
            system: true,
            module: module,
            args: args,
            pid: id
        });
        return id;
    };

    exports.spawnPage = function (module /* args.. */) {
        var id = exports.getPid();
        var args = Array.prototype.slice.call(arguments, 1);
        PROCESSES[id] = {
            state: null,
            ready: false,
            page: true,
            module: module,
            args: args
        };
        exports.sendMessage({
            type: 'process_init',
            system: true,
            page: true,
            module: module,
            args: args,
            pid: id
        });
        return id;
    };

    // don't export this after testing, use the version passed to init and
    // receive callbacks inside processes instead

    exports.deliver = function (from, to, msg) {
        var p = PROCESSES[to];
        if (!p) {
            throw new Error('No process with pid: ' + to);
        }
        exports.sendMessage({
            type: 'process_message',
            from: from,
            to: to,
            data: msg
        });
    };

});

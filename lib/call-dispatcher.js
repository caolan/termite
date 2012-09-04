define([
    'exports',
    './page-worker',
    './web-worker'
],
function (exports, pageworker, webworker) {

    exports.getPageWorker = function (dispatcher) {
        for (var i = 0; i < dispatcher.workers.length; i++) {
            var w = dispatcher.workers[i];
            if (w.type === 'page' && w.ready) {
                return w;
            }
        }
    };

    exports.processPageCalls = function (dispatcher) {
        var pw = exports.getPageWorker(dispatcher);
        if (!pw) {
            // page worker not found or not ready
            return;
        }
        var q = dispatcher.call_queue;
        for (var i = 0; i < q.length; i++) {
            var c = q[i];
            if (c.pageonly) {
                q.splice(i, 1);
                //console.log(['call', 'page', c.module, c.fn].concat(c.args));
                pw.current_call = c;
                pw.ready = false;
                exports.postMessage(pw.worker, {type: 'make_call', data: c});
                return;
            }
        }
    };

    exports.postMessage = function (worker, msg) {
        try {
            var msgstr = JSON.stringify(msg)
        }
        catch (e) {
            console.log(['ERROR: Message is not valid JSON', msg]);
            throw e;
        }
        worker.postMessage(msgstr);
    };

    exports.getReadyWorker = function (dispatcher) {
        for (var i = 0; i < dispatcher.workers.length; i++) {
            var w = dispatcher.workers[i];
            if (w.ready) {
                return w;
            }
        }
    };

    exports.processQueue = function (dispatcher) {
        exports.processPageCalls(dispatcher);

        var q = dispatcher.call_queue;
        if (!q.length) {
            // queue is empty
            return
        }
        var w = exports.getReadyWorker(dispatcher);
        if (!w) {
            // no workers available
            return;
        }
        for (var i = 0, len = q.length; i < len; i++) {
            var c = q[i];
            if (!c.pageonly) {
                q.splice(i, 1);
                w.current_call = c;
                w.ready = false;
                //console.log(['call', w.type, c.module, c.fn].concat(c.args));
                var msg = {type: 'make_call', data: {
                    module: c.module,
                    fn: c.fn,
                    args: c.args || [],
                    pid: c.pid,
                    pageonly: c.pageonly || false
                }};
                exports.postMessage(w.worker, msg);
                return;
            }
        }
    };

    /**
     * callobj format:
     * - pid
     * - module {String}
     * - fn {String}
     * - args {Array}
     * - pageonly {Boolean}
     * - callback {Function}
     */

    exports.makeCall = function (dispatcher, callobj) {
        dispatcher.call_queue.push(callobj);
        exports.processQueue(dispatcher);
    };

    exports.completeCall = function (wd, w, err, data) {
        if (w.current_call) {
            w.current_call.callback(err, data);
        }
        delete w.current_call;
        exports.workerReady(wd, w);
    };

    exports.workerReady = function (wd, w) {
        w.ready = true;
        exports.processQueue(wd);
    };

    exports.workerOnMessage = function (wd, w, md) {
        return function (ev) {
            try {
                var msg = JSON.parse(ev.data);
            }
            catch (e) {
                console.log(['Error processing JSON message: ' + ev.data]);
                throw e;
            }
            switch (msg.type) {
            case 'worker_ready':
                exports.workerReady(wd, w);
                break;
            case 'call_complete':
                exports.completeCall(wd, w, msg.error, msg.data);
                break;
            case 'process_message':
                //md.deliver(w.current_call.pid, msg.to, msg.data);
                md.deliver(msg.from, msg.to, msg.data);
                break;
            default:
                console.log(['Unknown message from worker ' + j, msg]);
            }
        };
    };

    exports.workerOnError = function (wd, w) {
        return function (err) {
            exports.completeCall(wd, w, err);
        };
    };

    exports.addResponseHandlers = function (wd, md) {
        var workers = wd.workers;
        for (var j = 0; j < workers.length; j++) {
            (function (j) {
                var w = workers[j];
                w.worker.onmessage = exports.workerOnMessage(wd, w, md);
                w.worker.onerror = exports.workerOnError(wd, w);
            }(j));
        }
        return workers;
    };

    exports.create = function (message_dispatcher, requirejs, n) {
        var d = {
            workers: [],
            call_queue: [],
            makeCall: function (callobj) {
                return exports.makeCall(d, callobj);
            }
        };
        for (var i = 0; i < n; i++) {
            d.workers.push(webworker.create(requirejs));
        }
        // always have one page worker
        d.workers.push(pageworker.create());

        exports.addResponseHandlers(d, message_dispatcher);
        return d;
    };

});

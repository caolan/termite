define(['exports', './call-dispatcher'], function (exports, calld) {

    exports.processMsgQueue = function (manager, call_dispatcher, pid) {
        var p = manager.processes[pid];
        if (!p) {
            throw new Error('Unknown pid: ' + pid);
        }
        if (p.message_queue.length) {
            var msg = p.message_queue.shift();
            p.ready = false;
            /*
            var process = {
                send: function (to, msg) {
                    manager.deliver(pid, to, msg);
                }
            };
            */
            call_dispatcher.makeCall({
                pid: pid,
                module: p.module,
                fn: 'receive',
                args: [msg.from, msg.data, p.state],
                pageonly: p.pageonly,
                callback: function (err, data) {
                    if (err) {
                        console.error(err);
                        console.log(['Process error', {
                            message: msg,
                            state: p.state
                        }]);
                    }
                    else {
                        p.state = data;
                    }
                    p.ready = true;
                    exports.processMsgQueue(manager, call_dispatcher, pid);
                }
            });
        }
    };

    exports.createPid = function (manager) {
        return manager.next_pid++;
    };

    exports.spawn = function (manager, call_dispatcher, module, pageonly) {
        var pid = exports.createPid(manager);
        var p = {
            module: module,
            ready: false,
            message_queue: [],
            pageonly: pageonly,
            state: null
        };
        manager.processes[pid] = p;
        var callobj = {
            pid: pid,
            module: module,
            fn: 'init',
            args: [],
            pageonly: pageonly
        };
        callobj.callback = function (err, data) {
            if (err) {
                console.error(err);
                console.log(['Process init error', callobj]);
            }
            else {
                p.state = data;
                p.ready = true;
                exports.processMsgQueue(manager, call_dispatcher, pid);
            }
        };
        console.log(['spawn', module]);
        call_dispatcher.makeCall(callobj);
        return pid;
    };

    exports.deliver = function (manager, call_dispatcher, from, to, msg) {
        var p = manager.processes[to];
        if (!p) {
            throw new Error('Unknown recipient pid: ' + to);
        }
        p.message_queue.push({to: to, from: from, data: msg});
        console.log(['message', from, to, msg]);
        exports.processMsgQueue(manager, call_dispatcher, to);
    };

    exports.create = function (requirejs, n) {
        var m = {
            next_pid: 1,
            processes: {}
        }
        var d = calld.create(m, requirejs, n);
        m.call_dispatcher = d;
        m.deliver = function (from, to, msg) {
            return exports.deliver(m, d, from, to, msg);
        };
        m.spawn = function (module, pageonly) {
            return exports.spawn(m, d, module, pageonly);
        };
        return m;
    };

});

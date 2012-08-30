define(['exports'], function (exports) {

    exports.init = function (self) {
        self.postMessage({type: 'worker_ready'});
        self.onmessage = function (ev) {
            var msg = ev.data;
            //self.postMessage(['got message', msg]);
            if (msg.type === 'process_init') {
                exports.processInit(msg.pid, msg.module, msg.args);
            }
            else if (msg.type === 'process_message') {
                exports.processMessage(msg);
            }
        };
    };

    exports.processReady = function (pid, state) {
        self.postMessage({
            type: 'process_ready',
            state: state,
            pid: pid
        });
    };

    exports.processInit = function (pid, module, args) {
        require([module], function (m) {
            var state = m.init.apply(null, args);
            exports.processReady(pid, state);
        });
    };

    exports.processMessage = function (msg) {
        require([msg.module], function (m) {
            var process = {
                send: function (pid, data) {
                    self.postMessage({
                        type: 'process_message',
                        from: msg.to,
                        to: pid,
                        data: data
                    });
                }
            };
            var state = m.receive(process, msg.data, msg.from, msg.state);
            exports.processReady(msg.to, state);
        });
    };

});

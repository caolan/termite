define(['exports'], function (exports) {

    exports.init = function (self) {
        self.onmessage = function (ev) {
            var msg = ev.data;
            if (msg.type === 'make_call') {
                exports.makeCall(self, msg.data);
            }
            else {
                throw new Error('Unknown message: ' + JSON.stringify(msg));
            }
        };
        self.postMessage({type: 'worker_ready'});
    };

    exports.callComplete = function (self, result) {
        self.postMessage({
            type: 'call_complete',
            data: result
        });
    };

    exports.makeCall = function (self, callobj) {
        require([callobj.module], function (m) {
            if (callobj.fn === 'receive' || callobj.fn === 'init') {
                callobj.args.unshift({send: function (to, data) {
                    self.postMessage({
                        type: 'process_message',
                        to: to,
                        data: data
                    });
                }});
            }
            var r = m[callobj.fn].apply(null, callobj.args);
            exports.callComplete(self, r);
        });
    };

});

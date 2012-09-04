define(['exports'], function (exports) {

    var postMessage = function (self, msg) {
        return self.postMessage(JSON.stringify(msg));
    };

    exports.init = function (self) {
        self.onmessage = function (ev) {
            try {
                var msg = JSON.parse(ev.data);
            }
            catch (e) {
                postMessage(self, {
                    type: 'process_message',
                    to: 'termite',
                    from: '<unknown>',
                    data: 'Error processing JSON message: ' + ev.data
                });
                throw e;
            }
            if (msg.type === 'make_call') {
                exports.makeCall(self, msg.data);
            }
            else {
                throw new Error('Unknown message: ' + JSON.stringify(msg));
            }
        };
        postMessage(self, {type: 'worker_ready'});
    };

    exports.callComplete = function (self, result) {
        postMessage(self, {
            type: 'call_complete',
            data: result
        });
    };

    exports.makeCall = function (self, callobj) {
        require([callobj.module], function (m) {
            if (callobj.fn === 'receive' || callobj.fn === 'init') {
                callobj.args.unshift({send: function (to, data) {
                    postMessage(self, {
                        type: 'process_message',
                        to: to,
                        from: callobj.pid,
                        data: data
                    });
                }});
            }
            var r = m[callobj.fn].apply(null, callobj.args);
            exports.callComplete(self, r);
        });
    };

});

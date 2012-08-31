define(['exports'], function (exports) {

    exports.init = function () {
        return {};
    };

    exports.receive = function (process, from, msg, state) {
        //throw new Error('console received message');
        if (msg.log) {
            console.log(['from ' + from, msg.log]);
        }
        if (msg.error) {
            console.error(['from ' + from, msg.log]);
        }
        return state;
    };

});

define(['exports'], function (exports) {

    exports.init = function () {
        return {};
    };

    exports.receive = function (process, msg, from, state) {
        if (msg.log) {
            console.log(['from ' + from, msg.log]);
        }
        if (msg.error) {
            console.error(['from ' + from, msg.log]);
        }
        return state;
    };

});

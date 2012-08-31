define(['exports'], function (exports) {

    exports.init = function () {
        return {};
    };

    exports.receive = function (process, from, msg, state) {
        if (msg.log) {
            console.log([from, msg.log]);
        }
        if (msg.error) {
            console.error([from, msg.log]);
        }
        return state;
    };

});

define(['exports'], function (exports) {

    exports.init = function () {
        return {};
    };

    exports.receive = function (process, from, msg, state) {
        console.log(['termite', 'message from: ' + from, msg]);
        return state;
    };

});

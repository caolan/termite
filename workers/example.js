define(['exports'], function (exports) {

    exports.init = function () {
        return {example: 'state', foo: 123};
    };

    exports.receive = function (process, msg, from, state) {
        process.send(2, {log: 'message from example worker'});
        return {example: 'state', foo: 456, bar: 'baz'};
    };

});

define(['exports'], function (exports) {

    exports.init = function () {
        return {document: document};
    };

    exports.receive = function (process, from, msg, state) {
        if (msg.text) {
            var el = state.document.getElementById(msg.id);
            el.innerText = msg.text;
            el.textContent = msg.text;
        }
        else {
            process.send(from, {error: 'Unknown message', msg: msg});
        }
        return state;
    };

});

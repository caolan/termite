define([
    'exports',
    'termite/lib/process-manager',
    'termite/processes/termite'
],
function (exports, pmngr) {

    exports.start = function (opt) {
        opt.workers = opt.workers || 2;
        if (!opt.requirejs) {
            throw new Error('start call missing "requirejs" url option');
        }
        var pm = pmngr.create(opt.requirejs, opt.workers);
        pm.spawn('termite', 'termite/processes/termite', true);
        return {
            process_manager: pm,
            spawn: pm.spawn,
            send: function (to, msg) {
                pm.deliver('termite', to, msg);
            }
        };
    };

});

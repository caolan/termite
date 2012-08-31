define(['exports'], function (exports) {

    exports.resolveURL = function (url) {
        var loc = window.location;
        if (url[0] === '/') {
            return loc.protocol + '//' + loc.host + url[0];
        }
        if (/^https?:\/\//.test(url)) {
            return url;
        }
        var parts = loc.pathname.split('/');
        parts.pop();
        parts.push(url);
        return loc.protocol + '//' + loc.host + parts.join('/');
    };

});

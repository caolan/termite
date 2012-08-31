var jam = {
    "packages": [
        {
            "name": "qwery",
            "location": "jam/qwery",
            "main": "./qwery.js"
        },
        {
            "name": "bean",
            "location": "jam/bean",
            "main": "./bean.js"
        },
        {
            "name": "lodash",
            "location": "jam/lodash",
            "main": "lodash.min.js"
        }
    ],
    "version": "0.2.4",
    "shim": {}
};

if (typeof require !== "undefined" && require.config) {
    require.config({packages: jam.packages, shim: jam.shim});
}
else {
    var require = {packages: jam.packages, shim: jam.shim};
}

if (typeof exports !== "undefined" && typeof module !== "undefined") {
    module.exports = jam;
}
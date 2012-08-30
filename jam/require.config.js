var jam = {
    "packages": [
        {
            "name": "lodash",
            "location": "jam/lodash",
            "main": "lodash.min.js"
        }
    ],
    "version": "0.2.3",
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
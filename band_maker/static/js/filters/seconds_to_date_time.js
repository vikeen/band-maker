(function () {
    "use strict";

    window.bm.utils.secondsToDateTime = function (seconds) {
        var d = new Date(0, 0, 0, 0, 0, 0, 0);
        d.setSeconds(seconds);
        return d;
    };
})();

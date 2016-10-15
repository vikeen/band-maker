(function () {
    "use strict";

    angular.module("bmApp").filter("bmSecondsToDateTime", SecondsToDateTime);

    SecondsToDateTime.$inject = [];
    function SecondsToDateTime() {
        return function (seconds) {
            var d = new Date(0, 0, 0, 0, 0, 0, 0);
            d.setSeconds(seconds);
            return d;
        };
    }
})();

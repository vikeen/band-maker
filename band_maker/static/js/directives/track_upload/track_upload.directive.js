(function () {
    "use strict";

    angular.module("bmApp", []).directive("bmTrackUpload", TrackUploadDirective);

    TrackUploadDirective.$inject = [];
    function TrackUploadDirective() {
        return {
            scope: {},
            templateUrl: "/static/js/directives/track_upload/track_upload.html",
            restrict: "E",
            controller: TrackUploadController,
            controllerAs: "vm",
            bindToController: true
        }
    }

    TrackUploadController.$inject = [];
    function TrackUploadController() {
        $(document).ready(function () {
            $("#id_media_url").on('change', function () {
                try {
                    $("#submit-song").prop('disabled', true);
                    var files = $(this)[0].files;
                    var file = files[0];

                    if (!file) {
                        return console.error("No file selected.");
                    }
                    getSignedRequest(file);
                } catch (error) {
                    console.error(error);
                    $("#submit-song").prop('disabled', false);
                }
            });
        });

        function getSignedRequest(file) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/songs/upload?file_name=" + file.name + "&file_type=" + file.type);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var response = JSON.parse(xhr.responseText);
                        uploadFile(file, response.data, response.url);
                    }
                    else {
                        console.error("Could not get signed URL.");
                    }
                }
            };
            xhr.send();
        }

        function uploadFile(file, s3Data, url) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", s3Data.url);

            var postData = new FormData();
            for (var key in s3Data.fields) {
                postData.append(key, s3Data.fields[key]);
            }
            postData.append('file', file);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 204) {
                        $("#id_media_url_value").val(url);
                        $("#submit-song").prop('disabled', false);
                    }
                    else {
                        console.error("Could not upload file.");
                    }
                }
            };
            xhr.send(postData);
        }
    }
})();


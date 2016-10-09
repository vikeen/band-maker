(function () {
    "use strict";

    angular.module("bmApp").controller("TrackUploadController", TrackUploadController);

    TrackUploadController.$inject = ["$scope", "$resource"];
    function TrackUploadController($scope, $resource) {
        var vm = this,
            TrackUploadResource = $resource("/tracks/upload?file_name&file_type", {}, {});

        vm.id = $scope.$id;
        vm.onTrackInputChange = onTrackInputChange;

        ////////////

        function onTrackInputChange(element) {
            var $element = $(element)[0];

            $("#submit-track").prop('disabled', true);

            try {
                var file = $element.files[0];

                if (!file) {
                    return console.error("No file selected.");
                }

                _getSignedRequest(file);
            } catch (error) {
                console.error(error);
                $("#submit-track").prop('disabled', false);
            }

        }

        // PRIVATE API

        function _getSignedRequest(file) {
            TrackUploadResource.get({
                "file_name": file.name,
                "file_type": file.type
            }).$promise.then(function (response) {
                try {
                    _uploadFile(file, response.data, response.url);
                } catch (error) {
                    console.error("Failed to parse song upload signed request", error);
                }
            }).catch(function (error) {
                console.error("Could not get signed URL.", error);
            });
        }

        function _uploadFile(file, s3Data, url) {
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
                        $("#id_media_url").val(url);
                        $("#submit-track").prop('disabled', false);
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
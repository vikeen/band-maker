(function () {
    "use strict";

    angular.module("bmApp").directive("bmMediaPlayer", MediaPlayerDirective);

    MediaPlayerDirective.$inject = [];
    function MediaPlayerDirective() {
        return {
            scope: {
                title: "@",
                tracks: "="
            },
            restrict: "E",
            templateUrl: "/static/js/directives/media_player/media_player.html",
            controller: MediaPlayerController,
            controllerAs: "vm",
            bindToController: true,
            link: function(scope, element) {
                scope.vm.$element = $(element);

                scope.vm.activate();
            }
        }
    }

    MediaPlayerController.$inject = ["$scope", "$timeout", "$q"];
    function MediaPlayerController($scope, $timeout, $q) {
        var vm = this;

        vm.songLoadingPercentStyle = {
            width: "0%"
        };
        vm.trackLoadingProgressMap = {};

        vm.play = play;
        vm.pause = pause;
        vm.restart = restart;
        vm.activate = activate;

        function activate() {
            $timeout(function () {
                _createAudioWaves(vm.tracks);
            })
        }

        function restart() {
            vm.tracks.forEach(function (track) {
                track.__audio.play(0);
            });
        }

        function play() {
            vm.tracks.forEach(function (track) {
                if (!track.__audio.isPlaying()) {
                    track.__audio.play();
                }
            });
        }

        function pause() {
            vm.tracks.forEach(function (track) {
                if (track.__audio.isPlaying()) {
                    track.__audio.pause();
                }
            });
        }

        // PRIVATE API

        function _createAudioWaves(tracks) {

            tracks.forEach(function (track) {
                vm.trackLoadingProgressMap[track.pk] = 0;
                var ctx = document.createElement('canvas').getContext('2d');
                var linGrad = ctx.createLinearGradient(0, 64, 0, 200);
                linGrad.addColorStop(0.5, 'rgba(225, 225, 225, 1.000)');
                linGrad.addColorStop(0.5, 'rgba(183, 183, 183, 1.000)');

                var wavesurfer = WaveSurfer.create({
                    container: '#waveform-' + track.pk,
                    waveColor: linGrad,
                    progressColor: 'hsla(200, 100%, 30%, 0.5)',
                    cursorColor: '#fff',
                    height: 37
                });

                wavesurfer.on('ready', function () {
                    vm.$element.find('.progress').hide();
                    vm.$element.find('wave').show();
                });

                wavesurfer.on("error", function (error) {
                    console.error("error processing video", error);
                });

                wavesurfer.on('loading', function (percent) {
                    vm.trackLoadingProgressMap[track.pk] = percent;

                    vm.songLoadingPercentStyle.width = _getLoadingProgress() + "%";

                    // progress bar change won't render without this
                    $scope.$apply();
                });

                wavesurfer.on('seek', _onSeekEvent);

                wavesurfer.load(track.fields.media_url);

                vm.$element.find('wave').hide();

                track.__audio = wavesurfer;
            });
        }

        function _getLoadingProgress() {
            var keys = Object.keys(vm.trackLoadingProgressMap),
                totalProgress = 0;

            keys.forEach(function (key) {
                totalProgress += vm.trackLoadingProgressMap[key];
            });

            totalProgress = totalProgress / keys.length;

            return totalProgress;
        }

        function _onSeekEvent(progress) {
            var unsubSeekPromises = [];

            // prevent excess seek events from firing
            vm.tracks.forEach(function (track) {
                var promise = $q(function (resolve, reject) {
                    try {
                        track.__audio.un("seek");
                        resolve();
                    } catch (error) {
                        console.log(error);
                        reject(error);
                    }
                });

                unsubSeekPromises.push(promise);
            });

            $q.all(unsubSeekPromises).then(function () {
                vm.pause();

                vm.tracks.forEach(function (track) {
                    track.__audio.seekTo(progress);
                    track.__audio.on("seek", _onSeekEvent);
                });

                vm.play();
            }).catch(function (error) {
                console.log(error);
            });
        }
    }
})();

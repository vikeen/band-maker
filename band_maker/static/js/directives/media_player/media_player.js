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
            bindToController: true
        }
    }

    MediaPlayerController.$inject = ["$timeout"];
    function MediaPlayerController($timeout) {
        var vm = this;


        vm.play = play;
        vm.pause = pause;

        activate();

        function activate() {
            $timeout(function () {
                _createAudioWaves(vm.tracks);
            })
        }

        function _createAudioWaves(tracks) {

            tracks.forEach(function (track) {
                var ctx = document.createElement('canvas').getContext('2d');
                var linGrad = ctx.createLinearGradient(0, 64, 0, 200);
                linGrad.addColorStop(0.5, 'rgba(225, 225, 225, 1.000)');
                linGrad.addColorStop(0.5, 'rgba(183, 183, 183, 1.000)');

                var wavesurfer = WaveSurfer.create({
                    container: '#waveform-' + track.pk,
                    waveColor: linGrad,
                    progressColor: 'hsla(200, 100%, 30%, 0.5)',
                    cursorColor: '#fff',
                    normalize: true,
                    barWidth: 3
                });

                wavesurfer.on('ready', function () {
                    $('.progress').hide();
                });

                wavesurfer.on("error", function (error) {
                    console.error("error processing video", error);
                });

                wavesurfer.on('loading', function (percents) {
                    $('.progress .progress-bar').css({
                        width: percents + "%"
                    })
                });

                wavesurfer.load(track.fields.media_url);

                track.__audio = wavesurfer;
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
    }
})();

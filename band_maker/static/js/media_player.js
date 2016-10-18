exports = MediaPlayer;

class MediaPlayer {
    constructor($element, tracks) {
        console.log($element, tracks);
        // this.$element = $element;
        // this.trackLoadingProgressMap = {};
        // this.tracks = tracks.map(this._createAudioWave.bind(this));
        // this.play = play;
        // this.pause = pause;
        // this.restart = restart;
        //
        // this.$controls = {
        //     '$restart': this.$element.find('.media-player__control--restart'),
        //     '$pause': this.$element.find('.media-player__control--pause'),
        //     '$play': this.$element.find('.media-player__control--play')
        // };
        //
        // this.$controls.$play.on("click", this.play.bind(this));
        // this.$controls.$pause.on("click", this.pause.bind(this));
        // this.$controls.$restart.on("click", this.restart.bind(this));
        //
        // this.$element.find(".media-player__track-title-control--mute").on("click", this.handleTrackMuteClick);
    }
}
//
//     /*
//      *
//      * PUBLIC API
//      *
//      */
//
//     function restart() {
//         var self = this;
//
//         self.tracks.forEach(function (track) {
//             track.__audio.play(0);
//         });
//
//         _updateSongDurations.bind(self)();
//     }
//
//     function play() {
//         var self = this;
//
//         self.tracks.forEach(function (track) {
//             if (!track.__audio.isPlaying()) {
//                 track.__audio.play();
//             }
//         });
//
//         _updateSongDurations.bind(self)();
//     }
//
//     function pause() {
//         var self = this;
//
//         self.tracks.forEach(function (track) {
//             if (track.__audio.isPlaying()) {
//                 track.__audio.pause();
//             }
//         });
//
//         _updateSongDurations.bind(self)();
//     }
//
//
//     /*
//      *
//      * PRIVATE API
//      *
//      */
//
//     MediaPlayer.prototype.handleTrackMuteClick = function (event) {
//
//         debugger;
//
//         var $trackControl = $(event),
//             trackId = $trackControl.parents(".media-player__track").data("trackId"),
//             track = self._getTrackById(trackId);
//
//         self.toggleTrackMute(track);
//
//         $trackControl.find("a").toggleClass("btn-default", !track.__audio.isMuted);
//         $trackControl.find("a").toggleClass("btn-primary", track.__audio.isMuted);
//     };
//
//     MediaPlayer.prototype.allTracksAreLoaded = function () {
//         var self = this;
//
//         return self.tracks.every(function (track) {
//             return !!track._loadingComplete;
//         });
//     };
//
//     MediaPlayer.prototype.getLongestTrack = function () {
//         var longestTrack = this.tracks[0];
//
//         this.tracks.forEach(function (track) {
//             var trackDuration = track.__audio.getDuration();
//
//             if (trackDuration > longestTrack.__audio.getDuration()) {
//                 longestTrack = track;
//             }
//         });
//
//         return longestTrack;
//     };
//
//     MediaPlayer.prototype._createAudioWave = function (track) {
//         var self = this;
//
//         self.trackLoadingProgressMap[track.pk] = 0;
//         var ctx = document.createElement('canvas').getContext('2d');
//         var linGrad = ctx.createLinearGradient(0, 64, 0, 200);
//         linGrad.addColorStop(0.5, 'rgba(225, 225, 225, 1.000)');
//         linGrad.addColorStop(0.5, 'rgba(183, 183, 183, 1.000)');
//
//         var wavesurfer = WaveSurfer.create({
//             container: '#waveform-' + track.pk,
//             waveColor: linGrad,
//             progressColor: 'hsla(200, 100%, 30%, 0.5)',
//             cursorColor: '#fff',
//             height: 45,
//             barWidth: 3
//         });
//
//         wavesurfer.on('ready', function () {
//             _onTrackReadyEvent.bind(self)(track);
//         });
//         wavesurfer.on("error", _onTrackErrorEvent.bind(self));
//         wavesurfer.on('loading', function (progress) {
//             _onTrackLoadingEvent.bind(self)(track, progress);
//         });
//         wavesurfer.on('seek', _onTrackSeekEvent.bind(self));
//
//         wavesurfer.load(track.fields.media_url);
//
//         self.$element.find('.media-player__track').hide();
//
//         track.__audio = wavesurfer;
//
//         return track;
//     };
//
//     MediaPlayer.prototype.toggleTrackMute = function (track) {
//         track.__audio.toggleMute();
//     };
// //
// //     function toggleSoloForTrack(track, $event) {
// //         track.isSolo = !track.isSolo;
// //
// //         var $control = $($event.target);
// //         $control.toggleClass("btn-default", !track.isSolo);
// //         $control.toggleClass("btn-primary", track.isSolo);
// //
// //         var tracksAreSoloed = self.tracks.some(function (t) {
// //             return t.isSolo;
// //         });
// //
// //         if (!tracksAreSoloed) {
// //             self.tracks.forEach(function (t) {
// //                 t.__audio.setMute(false);
// //             });
// //
// //             return;
// //         }
// //
// //         self.tracks.forEach(function (t) {
// //             t.__audio.setMute(!t.isSolo);
// //         });
// //     }
// //
// //     // PRIVATE API
// //
// //
//     function _getLoadingProgress() {
//         var self = this,
//             keys = Object.keys(self.trackLoadingProgressMap),
//             totalProgress = 0;
//
//         keys.forEach(function (key) {
//             totalProgress += self.trackLoadingProgressMap[key];
//         });
//
//         totalProgress = totalProgress / keys.length;
//
//         return totalProgress;
//     }
//
//     function _onTrackReadyEvent(track) {
//         var self = this;
//
//         self.$element.find('.progress').hide();
//         self.$element.find('.media-player__track').show();
//
//         track._loadingComplete = true;
//
//         if (self.allTracksAreLoaded()) {
//             console.log("all tracks are loaded");
//
//
//             _updateSongDurations.bind(self)();
//
//             self.longestTrack.__audio.on("play", function () {
//
//                 if (self.seekUpdateInterval) {
//                     clearInterval(self.seekUpdateInterval);
//                 }
//
//                 self.seekUpdateInterval = setInterval(_updateSongDurations.bind(self), 250);
//             });
//         }
//     }
//
//     function _updateSongDurations() {
//         var self = this;
//
//         var $timer = self.$element.find(".media-player__control--duration");
//
//         self.longestTrack = self.getLongestTrack();
//         self.songCurrentSeek = self.longestTrack.__audio.getCurrentTime();
//         self.songDuration = self.longestTrack.__audio.getDuration();
//
//         var durationDateTime = bm.utils.secondsToDateTime(self.songDuration),
//             seekDateTime = bm.utils.secondsToDateTime(self.songCurrentSeek);
//
//         function dateTimeToMediaTime(dateTime) {
//             return dateTime.getMinutes() + ":" + String("00" + dateTime.getSeconds()).slice(-2);
//         }
//
//         $timer.text(dateTimeToMediaTime(seekDateTime) + " / " + dateTimeToMediaTime(durationDateTime))
//
//         if (self.songCurrentSeek >= self.songDuration) {
//             self.songCurrentSeek = self.songDuration;
//
//             if (self.seekUpdateInterval) {
//                 clearInterval(self.seekUpdateInterval);
//             }
//         }
//     }
//
//     function _onTrackErrorEvent(error) {
//         console.error("error processing video", error);
//     }
//
//     function _onTrackSeekEvent(progress) {
//         var self = this;
//
//         // prevent excess seek events from firing
//         var promises = self.tracks.map(function (track) {
//             var defer = $.Deferred();
//
//             try {
//                 track.__audio.un("seek");
//                 defer.resolve();
//             } catch (error) {
//                 console.log(error);
//                 defer.reject(error);
//             }
//
//             return defer.promise();
//         });
//
//         $.when(promises).done(function () {
//             self.pause();
//
//             self.tracks.forEach(function (track) {
//                 track.__audio.seekTo(progress);
//                 track.__audio.on("seek", _onTrackSeekEvent.bind(self));
//             });
//
//             self.play();
//         }).fail(function (error) {
//             console.log(error);
//         });
//     }
//
//     function _onTrackLoadingEvent(track, progress) {
//         var self = this;
//
//         self.trackLoadingProgressMap[track.pk] = progress;
//         self.$element.find("#progress").css({
//             width: _getLoadingProgress.bind(this)() + "%"
//         });
//     }
//
//     MediaPlayer.prototype._getTrackById = function (trackId) {
//         var self = this;
//
//         return self.tracks.filter(function (track) {
//             return track.pk === trackId;
//         })[0];
//     }
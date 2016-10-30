(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _media_player = require("./components/media_player");

var _seconds_to_date_time = require("./utils/seconds_to_date_time");

window.bm = {
    components: {
        MediaPlayer: _media_player.MediaPlayer
    },
    utils: {
        secondsToDateTime: _seconds_to_date_time.secondsToDateTime
    }
};

/*
 * Initialize application widgets
 */
$(document).ready(function () {});

},{"./components/media_player":2,"./utils/seconds_to_date_time":3}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MediaPlayer = exports.MediaPlayer = function () {
    function MediaPlayer($element, tracks) {
        _classCallCheck(this, MediaPlayer);

        var self = this;

        self.$element = $element;

        self.loadTracks(tracks);

        var $controls = {
            '$restart': self.$element.find('.media-player__control--restart'),
            '$pause': self.$element.find('.media-player__control--pause'),
            '$play': self.$element.find('.media-player__control--play')
        };

        $controls.$play.on("click", self.play.bind(self));
        $controls.$pause.on("click", self.pause.bind(self));
        $controls.$restart.on("click", self.restart.bind(self));

        self.$element.find(".media-player__track-control--mute").on("click", __handleTrackMuteClick.bind(self));
    }

    _createClass(MediaPlayer, [{
        key: 'loadTracks',
        value: function loadTracks(tracks) {
            var self = this;

            self.trackLoadingProgressMap = {};

            self.tracks = tracks.map(__createAudioWave.bind(self));
        }
    }, {
        key: 'replaceTrackById',
        value: function replaceTrackById(trackId, newTrack) {
            var self = this;

            self.tracks = self.tracks.map(function (track) {
                if (track.pk === trackId) {
                    track.__audio && track.__audio.empty(); // wipe wavesurfer data and events
                    self.$element.find("#waveform-" + trackId).find("wave").remove();
                    track = __createAudioWave.bind(self)(newTrack);
                }

                return track;
            });
        }
    }, {
        key: 'restart',
        value: function restart() {
            var self = this;

            self.tracks.forEach(function (track) {
                track.__audio && track.__audio.play(0);
            });

            __updateSongDurations.bind(self)();
        }
    }, {
        key: 'play',
        value: function play() {
            var self = this;

            self.tracks.forEach(function (track) {
                if (track.__audio && !track.__audio.isPlaying()) {
                    track.__audio.play();
                }
            });

            __updateSongDurations.bind(self)();
        }
    }, {
        key: 'pause',
        value: function pause() {
            var self = this;

            self.tracks.forEach(function (track) {
                if (track.__audio && track.__audio.isPlaying()) {
                    track.__audio.pause();
                }
            });

            __updateSongDurations.bind(self)();
        }
    }, {
        key: 'getLoadingProgress',
        value: function getLoadingProgress() {
            var self = this;

            var totalProgress = 0,
                keys = Object.keys(self.trackLoadingProgressMap);

            keys.forEach(function (key) {
                totalProgress += self.trackLoadingProgressMap[key];
            });

            totalProgress = totalProgress / keys.length;

            return totalProgress;
        }
    }, {
        key: 'getLongestTrack',
        value: function getLongestTrack() {
            var self = this,
                tracksWithMedia = self.tracks.filter(function (track) {
                return !!track.fields.audio_url;
            });

            var longestTrack = undefined;

            tracksWithMedia.forEach(function (track) {
                longestTrack = longestTrack || track;
                var trackDuration = track.__audio.getDuration();

                if (trackDuration > longestTrack.__audio.getDuration()) {
                    longestTrack = track;
                }
            });

            return longestTrack;
        }
    }, {
        key: 'allTracksAreLoaded',
        value: function allTracksAreLoaded() {
            var self = this;

            return self.tracks.every(function (track) {
                return !!track.__loaded;
            });
        }
    }, {
        key: 'getTrackById',
        value: function getTrackById(trackId) {
            var self = this;

            return self.tracks.filter(function (track) {
                return track.pk === trackId;
            })[0];
        }
    }, {
        key: 'toggleTrackMute',
        value: function toggleTrackMute(track) {
            track.__audio && track.__audio.toggleMute();
        }
    }]);

    return MediaPlayer;
}();

function __createAudioWave(track) {
    var self = this;

    if (track.fields.audio_url) {
        self.trackLoadingProgressMap[track.pk] = 0;
        var ctx = document.createElement('canvas').getContext('2d');
        var linGrad = ctx.createLinearGradient(0, 64, 0, 200);
        linGrad.addColorStop(0.5, 'rgba(225, 225, 225, 1.000)');
        linGrad.addColorStop(0.5, 'rgba(183, 183, 183, 1.000)');

        var wavesurfer = WaveSurfer.create({
            container: '#waveform-' + track.pk,
            waveColor: linGrad,
            progressColor: 'hsla(200, 100%, 30%, 0.5)',
            cursorColor: '#fff',
            height: 45,
            barWidth: 3
        });

        wavesurfer.on('ready', function () {
            __onTrackReadyEvent.bind(self)(track);
        });
        wavesurfer.on("error", __onTrackErrorEvent);
        wavesurfer.on('loading', function (progress) {
            return __onTrackLoadingEvent.bind(self)(track, progress);
        });
        wavesurfer.on('seek', __onTrackSeekEvent.bind(self));

        wavesurfer.load(track.fields.audio_url);

        track.__audio = wavesurfer;
    } else {
        track.__loaded = true;
    }

    return track;
}
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

function __onTrackReadyEvent(track) {
    var self = this;

    track.__loaded = true;

    if (self.allTracksAreLoaded()) {
        console.log("all tracks are loaded");
        self.$element.find(".progress").hide();

        __updateSongDurations.bind(self)();

        self.longestTrack.__audio.on("play", function () {

            if (self.seekUpdateInterval) {
                clearInterval(self.seekUpdateInterval);
            }

            self.seekUpdateInterval = setInterval(__updateSongDurations.bind(self), 250);
        });
    }
}

function __onTrackErrorEvent(error) {
    console.error("error processing video", error);
}

function __onTrackSeekEvent(progress) {
    var self = this,
        tracksWithMedia = self.tracks.filter(function (track) {
        return !!track.fields.audio_url;
    });

    // prevent excess seek events from firing
    var promises = tracksWithMedia.map(function (track) {
        var defer = $.Deferred();

        try {
            track.__audio.un("seek");
            defer.resolve();
        } catch (error) {
            console.log(error);
            defer.reject(error);
        }

        return defer.promise();
    });

    $.when(promises).done(function () {
        self.pause();

        tracksWithMedia.forEach(function (track) {
            track.__audio.seekTo(progress);
            track.__audio.on("seek", __onTrackSeekEvent.bind(self));
        });

        self.play();
    }).fail(function (error) {
        console.log(error);
    });
}

function __onTrackLoadingEvent(track, progress) {
    var self = this;

    self.trackLoadingProgressMap[track.pk] = progress;

    self.$element.find("#progress").css({
        width: self.getLoadingProgress.bind(self)() + "%"
    });
}

function __updateSongDurations() {
    var self = this;
    var $timer = self.$element.find(".media-player__control--duration");

    self.longestTrack = self.getLongestTrack();

    // no tracks to media duration from
    if (!self.longestTrack) {
        return;
    }

    self.songCurrentSeek = self.longestTrack.__audio.getCurrentTime();
    self.songDuration = self.longestTrack.__audio.getDuration();

    var durationDateTime = bm.utils.secondsToDateTime(self.songDuration),
        seekDateTime = bm.utils.secondsToDateTime(self.songCurrentSeek);

    function dateTimeToMediaTime(dateTime) {
        return dateTime.getMinutes() + ":" + String("00" + dateTime.getSeconds()).slice(-2);
    }

    $timer.text(dateTimeToMediaTime(seekDateTime) + " / " + dateTimeToMediaTime(durationDateTime));

    if (self.songCurrentSeek >= self.songDuration) {
        self.songCurrentSeek = self.songDuration;

        if (self.seekUpdateInterval) {
            clearInterval(self.seekUpdateInterval);
        }
    }
}

function __handleTrackMuteClick(event) {
    var self = this,
        $trackControl = $(event.currentTarget),
        trackId = $trackControl.parents(".media-player__track").data("trackId"),
        track = self.getTrackById(trackId);

    self.toggleTrackMute(track);

    $trackControl.find("button").toggleClass("btn-default", !track.__audio.isMuted);
    $trackControl.find("button").toggleClass("btn-primary", track.__audio.isMuted);
}

},{}],3:[function(require,module,exports){
"use strict";

exports.secondsToDateTime = function (seconds) {
    var d = new Date(0, 0, 0, 0, 0, 0, 0);
    d.setSeconds(seconds);
    return d;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1I7QUFEUSxLQURKO0FBSVIsV0FBTztBQUNIO0FBREc7QUFKQyxDQUFaOztBQVVBOzs7QUFHQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQU0sQ0FDdkIsQ0FERDs7Ozs7Ozs7Ozs7OztJQ2hCYSxXLFdBQUEsVztBQUNULHlCQUFZLFFBQVosRUFBc0IsTUFBdEIsRUFBOEI7QUFBQTs7QUFDMUIsWUFBTSxPQUFPLElBQWI7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLFFBQWhCOztBQUVBLGFBQUssVUFBTCxDQUFnQixNQUFoQjs7QUFFQSxZQUFNLFlBQVk7QUFDZCx3QkFBWSxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLGlDQUFuQixDQURFO0FBRWQsc0JBQVUsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQiwrQkFBbkIsQ0FGSTtBQUdkLHFCQUFTLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsOEJBQW5CO0FBSEssU0FBbEI7O0FBTUEsa0JBQVUsS0FBVixDQUFnQixFQUFoQixDQUFtQixPQUFuQixFQUE0QixLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUE1QjtBQUNBLGtCQUFVLE1BQVYsQ0FBaUIsRUFBakIsQ0FBb0IsT0FBcEIsRUFBNkIsS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFoQixDQUE3QjtBQUNBLGtCQUFVLFFBQVYsQ0FBbUIsRUFBbkIsQ0FBc0IsT0FBdEIsRUFBK0IsS0FB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QW9DLEtBQXBDLEdBQTRDLG9CQUFvQixnQkFBcEIsQ0FBeEQ7O0FBRUEsUUFBSSxLQUFLLGVBQUwsSUFBd0IsS0FBSyxZQUFqQyxFQUErQztBQUMzQyxhQUFLLGVBQUwsR0FBdUIsS0FBSyxZQUE1Qjs7QUFFQSxZQUFJLEtBQUssa0JBQVQsRUFBNkI7QUFDekIsMEJBQWMsS0FBSyxrQkFBbkI7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsU0FBUyxzQkFBVCxDQUFnQyxLQUFoQyxFQUF1QztBQUNuQyxRQUFNLE9BQU8sSUFBYjtBQUFBLFFBQ0ksZ0JBQWdCLEVBQUUsTUFBTSxhQUFSLENBRHBCO0FBQUEsUUFFSSxVQUFVLGNBQWMsT0FBZCxDQUFzQixzQkFBdEIsRUFBOEMsSUFBOUMsQ0FBbUQsU0FBbkQsQ0FGZDtBQUFBLFFBR0ksUUFBUSxLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsQ0FIWjs7QUFLQSxTQUFLLGVBQUwsQ0FBcUIsS0FBckI7O0FBRUEsa0JBQWMsSUFBZCxDQUFtQixRQUFuQixFQUE2QixXQUE3QixDQUF5QyxhQUF6QyxFQUF3RCxDQUFDLE1BQU0sT0FBTixDQUFjLE9BQXZFO0FBQ0Esa0JBQWMsSUFBZCxDQUFtQixRQUFuQixFQUE2QixXQUE3QixDQUF5QyxhQUF6QyxFQUF3RCxNQUFNLE9BQU4sQ0FBYyxPQUF0RTtBQUNIOzs7OztBQ2pURCxRQUFRLGlCQUFSLEdBQTRCLFVBQVUsT0FBVixFQUFtQjtBQUMzQyxRQUFJLElBQUksSUFBSSxJQUFKLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLENBQVI7QUFDQSxNQUFFLFVBQUYsQ0FBYSxPQUFiO0FBQ0EsV0FBTyxDQUFQO0FBQ0gsQ0FKRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge01lZGlhUGxheWVyfSBmcm9tIFwiLi9jb21wb25lbnRzL21lZGlhX3BsYXllclwiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyXG4gICAgfSxcbiAgICB1dGlsczoge1xuICAgICAgICBzZWNvbmRzVG9EYXRlVGltZTogc2Vjb25kc1RvRGF0ZVRpbWVcbiAgICB9XG59O1xuXG5cbi8qXG4gKiBJbml0aWFsaXplIGFwcGxpY2F0aW9uIHdpZGdldHNcbiAqL1xuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xufSk7IiwiZXhwb3J0IGNsYXNzIE1lZGlhUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCwgdHJhY2tzKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQgPSAkZWxlbWVudDtcblxuICAgICAgICBzZWxmLmxvYWRUcmFja3ModHJhY2tzKTtcblxuICAgICAgICBjb25zdCAkY29udHJvbHMgPSB7XG4gICAgICAgICAgICAnJHJlc3RhcnQnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXJlc3RhcnQnKSxcbiAgICAgICAgICAgICckcGF1c2UnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBhdXNlJyksXG4gICAgICAgICAgICAnJHBsYXknOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBsYXknKVxuICAgICAgICB9O1xuXG4gICAgICAgICRjb250cm9scy4kcGxheS5vbihcImNsaWNrXCIsIHNlbGYucGxheS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRwYXVzZS5vbihcImNsaWNrXCIsIHNlbGYucGF1c2UuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcmVzdGFydC5vbihcImNsaWNrXCIsIHNlbGYucmVzdGFydC5iaW5kKHNlbGYpKTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jb250cm9sLS1tdXRlXCIpLm9uKFwiY2xpY2tcIiwgX19oYW5kbGVUcmFja011dGVDbGljay5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICBsb2FkVHJhY2tzKHRyYWNrcykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwID0ge307XG5cbiAgICAgICAgc2VsZi50cmFja3MgPSB0cmFja3MubWFwKF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikpO1xuICAgIH1cblxuICAgIHJlcGxhY2VUcmFja0J5SWQodHJhY2tJZCwgbmV3VHJhY2spIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MgPSBzZWxmLnRyYWNrcy5tYXAodHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLnBrID09PSB0cmFja0lkKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmVtcHR5KCk7IC8vIHdpcGUgd2F2ZXN1cmZlciBkYXRhIGFuZCBldmVudHNcbiAgICAgICAgICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjd2F2ZWZvcm0tXCIgKyB0cmFja0lkKS5maW5kKFwid2F2ZVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0cmFjayA9IF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikobmV3VHJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJhY2s7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpbyAmJiAhdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGxheSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIHBhdXNlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgZ2V0TG9hZGluZ1Byb2dyZXNzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBsZXQgdG90YWxQcm9ncmVzcyA9IDAsXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCk7XG5cbiAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICB0b3RhbFByb2dyZXNzICs9IHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG90YWxQcm9ncmVzcyA9IHRvdGFsUHJvZ3Jlc3MgLyBrZXlzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gdG90YWxQcm9ncmVzcztcbiAgICB9XG5cbiAgICBnZXRMb25nZXN0VHJhY2soKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgdHJhY2tzV2l0aE1lZGlhID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+ICEhdHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAgICAgbGV0IGxvbmdlc3RUcmFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0cmFja3NXaXRoTWVkaWEuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBsb25nZXN0VHJhY2sgPSBsb25nZXN0VHJhY2sgfHwgdHJhY2s7XG4gICAgICAgICAgICBsZXQgdHJhY2tEdXJhdGlvbiA9IHRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKTtcblxuICAgICAgICAgICAgaWYgKHRyYWNrRHVyYXRpb24gPiBsb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgbG9uZ2VzdFRyYWNrID0gdHJhY2s7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxvbmdlc3RUcmFjaztcbiAgICB9XG5cbiAgICBhbGxUcmFja3NBcmVMb2FkZWQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5ldmVyeSh0cmFjayA9PiAhIXRyYWNrLl9fbG9hZGVkKTtcbiAgICB9XG5cbiAgICBnZXRUcmFja0J5SWQodHJhY2tJZCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHRyYWNrLnBrID09PSB0cmFja0lkKVswXTtcbiAgICB9XG5cbiAgICB0b2dnbGVUcmFja011dGUodHJhY2spIHtcbiAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnRvZ2dsZU11dGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fY3JlYXRlQXVkaW9XYXZlKHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodHJhY2suZmllbGRzLmF1ZGlvX3VybCkge1xuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IDA7XG4gICAgICAgIHZhciBjdHggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB2YXIgbGluR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCA2NCwgMCwgMjAwKTtcbiAgICAgICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgyMjUsIDIyNSwgMjI1LCAxLjAwMCknKTtcbiAgICAgICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgxODMsIDE4MywgMTgzLCAxLjAwMCknKTtcblxuICAgICAgICB2YXIgd2F2ZXN1cmZlciA9IFdhdmVTdXJmZXIuY3JlYXRlKHtcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJyN3YXZlZm9ybS0nICsgdHJhY2sucGssXG4gICAgICAgICAgICB3YXZlQ29sb3I6IGxpbkdyYWQsXG4gICAgICAgICAgICBwcm9ncmVzc0NvbG9yOiAnaHNsYSgyMDAsIDEwMCUsIDMwJSwgMC41KScsXG4gICAgICAgICAgICBjdXJzb3JDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgaGVpZ2h0OiA0NSxcbiAgICAgICAgICAgIGJhcldpZHRoOiAzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdhdmVzdXJmZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgX19vblRyYWNrUmVhZHlFdmVudC5iaW5kKHNlbGYpKHRyYWNrKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oXCJlcnJvclwiLCBfX29uVHJhY2tFcnJvckV2ZW50KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbignbG9hZGluZycsIHByb2dyZXNzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfX29uVHJhY2tMb2FkaW5nRXZlbnQuYmluZChzZWxmKSh0cmFjaywgcHJvZ3Jlc3MpO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbignc2VlaycsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcblxuICAgICAgICB3YXZlc3VyZmVyLmxvYWQodHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAgICAgdHJhY2suX19hdWRpbyA9IHdhdmVzdXJmZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFjaztcbn1cbi8vIC8vXG4vLyAvLyAgICAgZnVuY3Rpb24gdG9nZ2xlU29sb0ZvclRyYWNrKHRyYWNrLCAkZXZlbnQpIHtcbi8vIC8vICAgICAgICAgdHJhY2suaXNTb2xvID0gIXRyYWNrLmlzU29sbztcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciAkY29udHJvbCA9ICQoJGV2ZW50LnRhcmdldCk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLmlzU29sbyk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suaXNTb2xvKTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciB0cmFja3NBcmVTb2xvZWQgPSBzZWxmLnRyYWNrcy5zb21lKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICByZXR1cm4gdC5pc1NvbG87XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgaWYgKCF0cmFja3NBcmVTb2xvZWQpIHtcbi8vIC8vICAgICAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZShmYWxzZSk7XG4vLyAvLyAgICAgICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgICAgICByZXR1cm47XG4vLyAvLyAgICAgICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKCF0LmlzU29sbyk7XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy8gICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgLy8gUFJJVkFURSBBUElcbi8vIC8vXG4vLyAvL1xuXG5mdW5jdGlvbiBfX29uVHJhY2tSZWFkeUV2ZW50KHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG5cbiAgICBpZiAoc2VsZi5hbGxUcmFja3NBcmVMb2FkZWQoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImFsbCB0cmFja3MgYXJlIGxvYWRlZFwiKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuXG4gICAgICAgIHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8ub24oXCJwbGF5XCIsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuc2Vla1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZiksIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19vblRyYWNrRXJyb3JFdmVudChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBwcm9jZXNzaW5nIHZpZGVvXCIsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrU2Vla0V2ZW50KHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgLy8gcHJldmVudCBleGNlc3Mgc2VlayBldmVudHMgZnJvbSBmaXJpbmdcbiAgICBsZXQgcHJvbWlzZXMgPSB0cmFja3NXaXRoTWVkaWEubWFwKHRyYWNrID0+IHtcbiAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnVuKFwic2Vla1wiKTtcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgIH0pO1xuXG4gICAgJC53aGVuKHByb21pc2VzKS5kb25lKCgpID0+IHtcbiAgICAgICAgc2VsZi5wYXVzZSgpO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8uc2Vla1RvKHByb2dyZXNzKTtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ub24oXCJzZWVrXCIsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5wbGF5KCk7XG4gICAgfSkuZmFpbChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrTG9hZGluZ0V2ZW50KHRyYWNrLCBwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSBwcm9ncmVzcztcblxuICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiNwcm9ncmVzc1wiKS5jc3Moe1xuICAgICAgICB3aWR0aDogc2VsZi5nZXRMb2FkaW5nUHJvZ3Jlc3MuYmluZChzZWxmKSgpICsgXCIlXCJcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX191cGRhdGVTb25nRHVyYXRpb25zKCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGxldCAkdGltZXIgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX19jb250cm9sLS1kdXJhdGlvblwiKTtcblxuICAgIHNlbGYubG9uZ2VzdFRyYWNrID0gc2VsZi5nZXRMb25nZXN0VHJhY2soKTtcblxuICAgIC8vIG5vIHRyYWNrcyB0byBtZWRpYSBkdXJhdGlvbiBmcm9tXG4gICAgaWYgKCFzZWxmLmxvbmdlc3RUcmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgc2VsZi5zb25nRHVyYXRpb24gPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICBsZXQgZHVyYXRpb25EYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0R1cmF0aW9uKSxcbiAgICAgICAgc2Vla0RhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nQ3VycmVudFNlZWspO1xuXG4gICAgZnVuY3Rpb24gZGF0ZVRpbWVUb01lZGlhVGltZShkYXRlVGltZSkge1xuICAgICAgICByZXR1cm4gZGF0ZVRpbWUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBTdHJpbmcoXCIwMFwiICsgZGF0ZVRpbWUuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gICAgfVxuXG4gICAgJHRpbWVyLnRleHQoZGF0ZVRpbWVUb01lZGlhVGltZShzZWVrRGF0ZVRpbWUpICsgXCIgLyBcIiArIGRhdGVUaW1lVG9NZWRpYVRpbWUoZHVyYXRpb25EYXRlVGltZSkpO1xuXG4gICAgaWYgKHNlbGYuc29uZ0N1cnJlbnRTZWVrID49IHNlbGYuc29uZ0R1cmF0aW9uKSB7XG4gICAgICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5zb25nRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja011dGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suX19hdWRpby5pc011dGVkKTtcbn0iLCJleHBvcnRzLnNlY29uZHNUb0RhdGVUaW1lID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICB2YXIgZCA9IG5ldyBEYXRlKDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgIGQuc2V0U2Vjb25kcyhzZWNvbmRzKTtcbiAgICByZXR1cm4gZDtcbn07Il19

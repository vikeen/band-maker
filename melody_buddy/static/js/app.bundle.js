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
$(document).ready(function () {
    $(".dropdown-button").dropdown({
        hover: false
    });
    $(".button-collapse").sideNav();
    $('ul.tabs').tabs();
});

},{"./components/media_player":2,"./utils/seconds_to_date_time":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MediaPlayer = exports.MediaPlayer = function () {
    function MediaPlayer($element, tracks, trackRequests) {
        _classCallCheck(this, MediaPlayer);

        var self = this;

        console.log("media player init", $element);

        self.$element = $element;
        self.tracks = tracks || [];
        self.trackRequests = trackRequests || [];

        console.log("tracks", self.tracks);
        console.log("track requests", self.trackRequests);

        self.loadTracks();

        var $controls = {
            '$restart': self.$element.find('.media-player__control--restart'),
            '$pause': self.$element.find('.media-player__control--pause'),
            '$play': self.$element.find('.media-player__control--play')
        };

        $controls.$play.on("click", self.play.bind(self));
        $controls.$pause.on("click", self.pause.bind(self));
        $controls.$restart.on("click", self.restart.bind(self));

        self.$element.find(".media-player__track-control--mute").on("click", __handleTrackMuteClick.bind(self));
        self.$element.find(".media-player__track-changer").on("change", __handleTrackRequestChange.bind(self));
        self.$element.find(".media-player__track-changer").change();
    }

    _createClass(MediaPlayer, [{
        key: "loadTracks",
        value: function loadTracks() {
            var self = this;

            self.trackLoadingProgressMap = {};

            __loadTrackRequests.bind(self)();
            self.tracks = self.tracks.map(__createAudioWave.bind(self));
        }
    }, {
        key: "replaceTrackById",
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
        key: "restart",
        value: function restart() {
            var self = this;

            self.tracks.forEach(function (track) {
                track.__audio && track.__audio.play(0);
            });

            __updateSongDurations.bind(self)();
        }
    }, {
        key: "play",
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
        key: "pause",
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
        key: "getLoadingProgress",
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
        key: "getLongestTrack",
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
        key: "allTracksAreLoaded",
        value: function allTracksAreLoaded() {
            var self = this;

            return self.tracks.every(function (track) {
                return !!track.__loaded;
            });
        }
    }, {
        key: "getTrackById",
        value: function getTrackById(trackId) {
            var self = this;

            return self.tracks.filter(function (track) {
                return track.pk === trackId;
            })[0];
        }
    }, {
        key: "toggleTrackMute",
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
            height: 60,
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

function __loadTrackRequests() {
    var self = this;

    self.trackRequests.forEach(function (trackRequest) {
        var matchingTrack = self.tracks.filter(function (track) {
            return track.pk === trackRequest.fields.track;
        })[0];

        if (matchingTrack) {
            matchingTrack.fields.audio_url = trackRequest.fields.audio_url;
        }
    });
}

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

function __handleTrackRequestChange(event) {
    var self = this,
        $trackControl = $(event.currentTarget),
        trackId = $trackControl.parents(".media-player__track").data("trackId"),
        track = self.getTrackById(trackId);

    $trackControl.parents(".media-player__track--no-media").removeClass("media-player__track--no-media");

    track.fields.audio_url = $trackControl.val();
    self.replaceTrackById(trackId, track);
}

},{}],3:[function(require,module,exports){
"use strict";

exports.secondsToDateTime = function (seconds) {
    var d = new Date(0, 0, 0, 0, 0, 0, 0);
    d.setSeconds(seconds);
    return d;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2FwcC5qcyIsIm1lbG9keV9idWRkeS9zdGF0aWMvanMvY29tcG9uZW50cy9tZWRpYV9wbGF5ZXIuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1I7QUFEUSxLQURKO0FBSVIsV0FBTztBQUNIO0FBREc7QUFKQyxDQUFaOztBQVVBOzs7QUFHQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQU07QUFDcEIsTUFBRSxrQkFBRixFQUFzQixRQUF0QixDQUErQjtBQUMzQixlQUFPO0FBRG9CLEtBQS9CO0FBR0EsTUFBRSxrQkFBRixFQUFzQixPQUF0QjtBQUNBLE1BQUUsU0FBRixFQUFhLElBQWI7QUFDSCxDQU5EOzs7Ozs7Ozs7Ozs7O0lDaEJhLFcsV0FBQSxXO0FBQ1QseUJBQVksUUFBWixFQUFzQixNQUF0QixFQUE4QixhQUE5QixFQUE2QztBQUFBOztBQUN6QyxZQUFNLE9BQU8sSUFBYjs7QUFFQSxnQkFBUSxHQUFSLENBQVksbUJBQVosRUFBaUMsUUFBakM7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsYUFBSyxNQUFMLEdBQWMsVUFBVSxFQUF4QjtBQUNBLGFBQUssYUFBTCxHQUFxQixpQkFBaUIsRUFBdEM7O0FBRUEsZ0JBQVEsR0FBUixDQUFZLFFBQVosRUFBc0IsS0FBSyxNQUEzQjtBQUNBLGdCQUFRLEdBQVIsQ0FBWSxnQkFBWixFQUE4QixLQUFLLGFBQW5DOztBQUdBLGFBQUssVUFBTDs7QUFFQSxZQUFNLFlBQVk7QUFDZCx3QkFBWSxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLGlDQUFuQixDQURFO0FBRWQsc0JBQVUs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QUFKLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLENBQVI7QUFDQSxNQUFFLFVBQUYsQ0FBYSxPQUFiO0FBQ0EsV0FBTyxDQUFQO0FBQ0gsQ0FKRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge01lZGlhUGxheWVyfSBmcm9tIFwiLi9jb21wb25lbnRzL21lZGlhX3BsYXllclwiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyXG4gICAgfSxcbiAgICB1dGlsczoge1xuICAgICAgICBzZWNvbmRzVG9EYXRlVGltZTogc2Vjb25kc1RvRGF0ZVRpbWVcbiAgICB9XG59O1xuXG5cbi8qXG4gKiBJbml0aWFsaXplIGFwcGxpY2F0aW9uIHdpZGdldHNcbiAqL1xuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgICQoXCIuZHJvcGRvd24tYnV0dG9uXCIpLmRyb3Bkb3duKHtcbiAgICAgICAgaG92ZXI6IGZhbHNlXG4gICAgfSk7XG4gICAgJChcIi5idXR0b24tY29sbGFwc2VcIikuc2lkZU5hdigpO1xuICAgICQoJ3VsLnRhYnMnKS50YWJzKCk7XG59KTsiLCJleHBvcnQgY2xhc3MgTWVkaWFQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50LCB0cmFja3MsIHRyYWNrUmVxdWVzdHMpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJtZWRpYSBwbGF5ZXIgaW5pdFwiLCAkZWxlbWVudCk7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudCA9ICRlbGVtZW50O1xuICAgICAgICBzZWxmLnRyYWNrcyA9IHRyYWNrcyB8fCBbXTtcbiAgICAgICAgc2VsZi50cmFja1JlcXVlc3RzID0gdHJhY2tSZXF1ZXN0cyB8fCBbXTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcInRyYWNrc1wiLCBzZWxmLnRyYWNrcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwidHJhY2sgcmVxdWVzdHNcIiwgc2VsZi50cmFja1JlcXVlc3RzKTtcblxuXG4gICAgICAgIHNlbGYubG9hZFRyYWNrcygpO1xuXG4gICAgICAgIGNvbnN0ICRjb250cm9scyA9IHtcbiAgICAgICAgICAgICckcmVzdGFydCc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcmVzdGFydCcpLFxuICAgICAgICAgICAgJyRwYXVzZSc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcGF1c2UnKSxcbiAgICAgICAgICAgICckcGxheSc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcGxheScpXG4gICAgICAgIH07XG5cbiAgICAgICAgJGNvbnRyb2xzLiRwbGF5Lm9uKFwiY2xpY2tcIiwgc2VsZi5wbGF5LmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHBhdXNlLm9uKFwiY2xpY2tcIiwgc2VsZi5wYXVzZS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRyZXN0YXJ0Lm9uKFwiY2xpY2tcIiwgc2VsZi5yZXN0YXJ0LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNvbnRyb2wtLW11dGVcIikub24oXCJjbGlja1wiLCBfX2hhbmRsZVRyYWNrTXV0ZUNsaWNrLmJpbmQoc2VsZikpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jaGFuZ2VyXCIpLm9uKFwiY2hhbmdlXCIsIF9faGFuZGxlVHJhY2tSZXF1ZXN0Q2hhbmdlLmJpbmQoc2VsZikpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jaGFuZ2VyXCIpLmNoYW5nZSgpO1xuICAgIH1cblxuICAgIGxvYWRUcmFja3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXAgPSB7fTtcblxuICAgICAgICBfX2xvYWRUcmFja1JlcXVlc3RzLmJpbmQoc2VsZikoKTtcbiAgICAgICAgc2VsZi50cmFja3MgPSBzZWxmLnRyYWNrcy5tYXAoX19jcmVhdGVBdWRpb1dhdmUuYmluZChzZWxmKSk7XG4gICAgfVxuXG4gICAgcmVwbGFjZVRyYWNrQnlJZCh0cmFja0lkLCBuZXdUcmFjaykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcyA9IHNlbGYudHJhY2tzLm1hcCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2sucGsgPT09IHRyYWNrSWQpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8uZW1wdHkoKTsgLy8gd2lwZSB3YXZlc3VyZmVyIGRhdGEgYW5kIGV2ZW50c1xuICAgICAgICAgICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiN3YXZlZm9ybS1cIiArIHRyYWNrSWQpLmZpbmQoXCJ3YXZlXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRyYWNrID0gX19jcmVhdGVBdWRpb1dhdmUuYmluZChzZWxmKShuZXdUcmFjayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmFjaztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzdGFydCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8ucGxheSgwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmICF0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBnZXRMb2FkaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB0b3RhbFByb2dyZXNzID0gMCxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwKTtcblxuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgKz0gc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b3RhbFByb2dyZXNzID0gdG90YWxQcm9ncmVzcyAvIGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFByb2dyZXNzO1xuICAgIH1cblxuICAgIGdldExvbmdlc3RUcmFjaygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICBsZXQgbG9uZ2VzdFRyYWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IGxvbmdlc3RUcmFjayB8fCB0cmFjaztcbiAgICAgICAgICAgIGxldCB0cmFja0R1cmF0aW9uID0gdHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAodHJhY2tEdXJhdGlvbiA+IGxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBsb25nZXN0VHJhY2sgPSB0cmFjaztcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbG9uZ2VzdFRyYWNrO1xuICAgIH1cblxuICAgIGFsbFRyYWNrc0FyZUxvYWRlZCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmV2ZXJ5KHRyYWNrID0+ICEhdHJhY2suX19sb2FkZWQpO1xuICAgIH1cblxuICAgIGdldFRyYWNrQnlJZCh0cmFja0lkKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gdHJhY2sucGsgPT09IHRyYWNrSWQpWzBdO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWNrTXV0ZSh0cmFjaykge1xuICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8udG9nZ2xlTXV0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jcmVhdGVBdWRpb1dhdmUodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGlmICh0cmFjay5maWVsZHMuYXVkaW9fdXJsKSB7XG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gMDtcbiAgICAgICAgdmFyIGN0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciBsaW5HcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDY0LCAwLCAyMDApO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDIyNSwgMjI1LCAyMjUsIDEuMDAwKScpO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDE4MywgMTgzLCAxODMsIDEuMDAwKScpO1xuXG4gICAgICAgIHZhciB3YXZlc3VyZmVyID0gV2F2ZVN1cmZlci5jcmVhdGUoe1xuICAgICAgICAgICAgY29udGFpbmVyOiAnI3dhdmVmb3JtLScgKyB0cmFjay5wayxcbiAgICAgICAgICAgIHdhdmVDb2xvcjogbGluR3JhZCxcbiAgICAgICAgICAgIHByb2dyZXNzQ29sb3I6ICdoc2xhKDIwMCwgMTAwJSwgMzAlLCAwLjUpJyxcbiAgICAgICAgICAgIGN1cnNvckNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICBoZWlnaHQ6IDYwLFxuICAgICAgICAgICAgYmFyV2lkdGg6IDNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICBfX29uVHJhY2tSZWFkeUV2ZW50LmJpbmQoc2VsZikodHJhY2spO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbihcImVycm9yXCIsIF9fb25UcmFja0Vycm9yRXZlbnQpO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdsb2FkaW5nJywgcHJvZ3Jlc3MgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF9fb25UcmFja0xvYWRpbmdFdmVudC5iaW5kKHNlbGYpKHRyYWNrLCBwcm9ncmVzcyk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdzZWVrJywgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHdhdmVzdXJmZXIubG9hZCh0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICB0cmFjay5fX2F1ZGlvID0gd2F2ZXN1cmZlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYWNrO1xufVxuLy8gLy9cbi8vIC8vICAgICBmdW5jdGlvbiB0b2dnbGVTb2xvRm9yVHJhY2sodHJhY2ssICRldmVudCkge1xuLy8gLy8gICAgICAgICB0cmFjay5pc1NvbG8gPSAhdHJhY2suaXNTb2xvO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyICRjb250cm9sID0gJCgkZXZlbnQudGFyZ2V0KTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suaXNTb2xvKTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5pc1NvbG8pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyIHRyYWNrc0FyZVNvbG9lZCA9IHNlbGYudHJhY2tzLnNvbWUoZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHJldHVybiB0LmlzU29sbztcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICBpZiAoIXRyYWNrc0FyZVNvbG9lZCkge1xuLy8gLy8gICAgICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKGZhbHNlKTtcbi8vIC8vICAgICAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgICAgIHJldHVybjtcbi8vIC8vICAgICAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoIXQuaXNTb2xvKTtcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvLyAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAvLyBQUklWQVRFIEFQSVxuLy8gLy9cbi8vIC8vXG5cbmZ1bmN0aW9uIF9fbG9hZFRyYWNrUmVxdWVzdHMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrUmVxdWVzdHMuZm9yRWFjaCh0cmFja1JlcXVlc3QgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaGluZ1RyYWNrID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cmFjay5wayA9PT0gdHJhY2tSZXF1ZXN0LmZpZWxkcy50cmFja1xuICAgICAgICB9KVswXTtcblxuICAgICAgICBpZiAobWF0Y2hpbmdUcmFjaykge1xuICAgICAgICAgICAgbWF0Y2hpbmdUcmFjay5maWVsZHMuYXVkaW9fdXJsID0gdHJhY2tSZXF1ZXN0LmZpZWxkcy5hdWRpb191cmw7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrUmVhZHlFdmVudCh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuXG4gICAgaWYgKHNlbGYuYWxsVHJhY2tzQXJlTG9hZGVkKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJhbGwgdHJhY2tzIGFyZSBsb2FkZWRcIik7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcblxuICAgICAgICBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLm9uKFwicGxheVwiLCAoKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpLCAyNTApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja0Vycm9yRXZlbnQoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiZXJyb3IgcHJvY2Vzc2luZyB2aWRlb1wiLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja1NlZWtFdmVudChwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgIC8vIHByZXZlbnQgZXhjZXNzIHNlZWsgZXZlbnRzIGZyb20gZmlyaW5nXG4gICAgbGV0IHByb21pc2VzID0gdHJhY2tzV2l0aE1lZGlhLm1hcCh0cmFjayA9PiB7XG4gICAgICAgIHZhciBkZWZlciA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby51bihcInNlZWtcIik7XG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICBkZWZlci5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgICB9KTtcblxuICAgICQud2hlbihwcm9taXNlcykuZG9uZSgoKSA9PiB7XG4gICAgICAgIHNlbGYucGF1c2UoKTtcblxuICAgICAgICB0cmFja3NXaXRoTWVkaWEuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnNlZWtUbyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLm9uKFwic2Vla1wiLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYucGxheSgpO1xuICAgIH0pLmZhaWwoZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja0xvYWRpbmdFdmVudCh0cmFjaywgcHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gcHJvZ3Jlc3M7XG5cbiAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjcHJvZ3Jlc3NcIikuY3NzKHtcbiAgICAgICAgd2lkdGg6IHNlbGYuZ2V0TG9hZGluZ1Byb2dyZXNzLmJpbmQoc2VsZikoKSArIFwiJVwiXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fdXBkYXRlU29uZ0R1cmF0aW9ucygpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBsZXQgJHRpbWVyID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fY29udHJvbC0tZHVyYXRpb25cIik7XG5cbiAgICBzZWxmLmxvbmdlc3RUcmFjayA9IHNlbGYuZ2V0TG9uZ2VzdFRyYWNrKCk7XG5cbiAgICAvLyBubyB0cmFja3MgdG8gbWVkaWEgZHVyYXRpb24gZnJvbVxuICAgIGlmICghc2VsZi5sb25nZXN0VHJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXRDdXJyZW50VGltZSgpO1xuICAgIHNlbGYuc29uZ0R1cmF0aW9uID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgbGV0IGR1cmF0aW9uRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdEdXJhdGlvbiksXG4gICAgICAgIHNlZWtEYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0N1cnJlbnRTZWVrKTtcblxuICAgIGZ1bmN0aW9uIGRhdGVUaW1lVG9NZWRpYVRpbWUoZGF0ZVRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGRhdGVUaW1lLmdldE1pbnV0ZXMoKSArIFwiOlwiICsgU3RyaW5nKFwiMDBcIiArIGRhdGVUaW1lLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuICAgIH1cblxuICAgICR0aW1lci50ZXh0KGRhdGVUaW1lVG9NZWRpYVRpbWUoc2Vla0RhdGVUaW1lKSArIFwiIC8gXCIgKyBkYXRlVGltZVRvTWVkaWFUaW1lKGR1cmF0aW9uRGF0ZVRpbWUpKTtcblxuICAgIGlmIChzZWxmLnNvbmdDdXJyZW50U2VlayA+PSBzZWxmLnNvbmdEdXJhdGlvbikge1xuICAgICAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYuc29uZ0R1cmF0aW9uO1xuXG4gICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2soZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgIHNlbGYudG9nZ2xlVHJhY2tNdXRlKHRyYWNrKTtcblxuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tSZXF1ZXN0Q2hhbmdlKGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICR0cmFja0NvbnRyb2wgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICB0cmFja0lkID0gJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2tcIikuZGF0YShcInRyYWNrSWRcIiksXG4gICAgICAgIHRyYWNrID0gc2VsZi5nZXRUcmFja0J5SWQodHJhY2tJZCk7XG5cbiAgICAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFjay0tbm8tbWVkaWFcIikucmVtb3ZlQ2xhc3MoXCJtZWRpYS1wbGF5ZXJfX3RyYWNrLS1uby1tZWRpYVwiKTtcblxuICAgIHRyYWNrLmZpZWxkcy5hdWRpb191cmwgPSAkdHJhY2tDb250cm9sLnZhbCgpO1xuICAgIHNlbGYucmVwbGFjZVRyYWNrQnlJZCh0cmFja0lkLCB0cmFjayk7XG59IiwiZXhwb3J0cy5zZWNvbmRzVG9EYXRlVGltZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgICBkLnNldFNlY29uZHMoc2Vjb25kcyk7XG4gICAgcmV0dXJuIGQ7XG59OyJdfQ==

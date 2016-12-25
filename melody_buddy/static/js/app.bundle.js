(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _media_player = require("./components/media_player");

var _messages = require("./components/messages");

var _seconds_to_date_time = require("./utils/seconds_to_date_time");

window.bm = {
    components: {
        MediaPlayer: _media_player.MediaPlayer,
        Messages: _messages.Messages
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
    $('select').material_select();

    new window.bm.components.Messages();
});

},{"./components/media_player":2,"./components/messages":3,"./utils/seconds_to_date_time":4}],2:[function(require,module,exports){
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

            mixpanel.track("media-player:restart");

            self.tracks.forEach(function (track) {
                track.__audio && track.__audio.play(0);
            });

            __updateSongDurations.bind(self)();
        }
    }, {
        key: "play",
        value: function play() {
            var self = this;

            mixpanel.track("media-player:play");

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

            mixpanel.track("media-player:pause");

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
        self.$element.find(".media-player__loading-progress").hide();

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

    mixpanel.track("media-player:mute-track", track);

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
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Messages = exports.Messages = function Messages() {
    _classCallCheck(this, Messages);

    var messages = $('.message');

    messages.each(function (index, message) {
        new Message($(message));
    });
};

var Message = function Message($element) {
    _classCallCheck(this, Message);

    this.$element = $element;
    this.$closeIcon = this.$element.find('.js-message-close');
    this.$closeIcon.on('click', __closeMessageHandler.bind(this));
};

function __closeMessageHandler() {
    this.$closeIcon.parents('.message').remove();
}

},{}],4:[function(require,module,exports){
"use strict";

exports.secondsToDateTime = function (seconds) {
    var d = new Date(0, 0, 0, 0, 0, 0, 0);
    d.setSeconds(seconds);
    return d;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2FwcC5qcyIsIm1lbG9keV9idWRkeS9zdGF0aWMvanMvY29tcG9uZW50cy9tZWRpYV9wbGF5ZXIuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2NvbXBvbmVudHMvbWVzc2FnZXMuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1IsOENBRFE7QUFFUjtBQUZRLEtBREo7QUFLUixXQUFPO0FBQ0g7QUFERztBQUxDLENBQVo7O0FBV0E7OztBQUdBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBTTtBQUNwQixNQUFFLGtCQUFGLEVBQXNCLFFBQXRCLENBQStCO0FBQzNCLGVBQU87QUFEb0IsS0FBL0I7QUFHQSxNQUFFLGtCQUFGLEVBQXNCLE9BQXRCO0FBQ0EsTUFBRSxTQUFGLEVBQWEsSUFBYjtBQUNBLE1BQUUsUUFBRixFQUFZLGVBQVo7O0FBRUEsUUFBSSxPQUFPLEVBQVAsQ0FBVSxVQUFWLENBQXFCLFFBQXpCO0FBQ0gsQ0FURDs7Ozs7Ozs7Ozs7OztJQ2xCYSxXLFdBQUEsVztBQUNULHlCQUFZLFFBQVosRUFBc0IsTUFBdEIsRUFBOEIsYUFBOUIsRUFBNkM7QUFBQTs7QUFDekMsWUFBTSxPQUFPLElBQWI7O0FBRUEsZ0JBQVEsR0FBUixDQUFZLG1CQUFaLEVBQWlDLFFBQWpDOztBQUVBLGFBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBLGFBQUssTUFBTCxHQUFjLFVBQVUsRUFBeEI7QUFDQSxhQUFLLGFBQUwsR0FBcUIsaUJBQWlCLEVBQXRDOztBQUVBLGdCQUFRLEdBQVIsQ0FBWSxRQUFaLEVBQXNCLEtBQUssTUFBM0I7QUFD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c0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge01lZGlhUGxheWVyfSBmcm9tIFwiLi9jb21wb25lbnRzL21lZGlhX3BsYXllclwiO1xuaW1wb3J0IHtNZXNzYWdlc30gZnJvbSBcIi4vY29tcG9uZW50cy9tZXNzYWdlc1wiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyLFxuICAgICAgICBNZXNzYWdlczogTWVzc2FnZXNcbiAgICB9LFxuICAgIHV0aWxzOiB7XG4gICAgICAgIHNlY29uZHNUb0RhdGVUaW1lOiBzZWNvbmRzVG9EYXRlVGltZVxuICAgIH1cbn07XG5cblxuLypcbiAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gd2lkZ2V0c1xuICovXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgJChcIi5kcm9wZG93bi1idXR0b25cIikuZHJvcGRvd24oe1xuICAgICAgICBob3ZlcjogZmFsc2VcbiAgICB9KTtcbiAgICAkKFwiLmJ1dHRvbi1jb2xsYXBzZVwiKS5zaWRlTmF2KCk7XG4gICAgJCgndWwudGFicycpLnRhYnMoKTtcbiAgICAkKCdzZWxlY3QnKS5tYXRlcmlhbF9zZWxlY3QoKTtcblxuICAgIG5ldyB3aW5kb3cuYm0uY29tcG9uZW50cy5NZXNzYWdlcygpO1xufSk7IiwiZXhwb3J0IGNsYXNzIE1lZGlhUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCwgdHJhY2tzLCB0cmFja1JlcXVlc3RzKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwibWVkaWEgcGxheWVyIGluaXRcIiwgJGVsZW1lbnQpO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgc2VsZi50cmFja3MgPSB0cmFja3MgfHwgW107XG4gICAgICAgIHNlbGYudHJhY2tSZXF1ZXN0cyA9IHRyYWNrUmVxdWVzdHMgfHwgW107XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJ0cmFja3NcIiwgc2VsZi50cmFja3MpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInRyYWNrIHJlcXVlc3RzXCIsIHNlbGYudHJhY2tSZXF1ZXN0cyk7XG5cblxuICAgICAgICBzZWxmLmxvYWRUcmFja3MoKTtcblxuICAgICAgICBjb25zdCAkY29udHJvbHMgPSB7XG4gICAgICAgICAgICAnJHJlc3RhcnQnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXJlc3RhcnQnKSxcbiAgICAgICAgICAgICckcGF1c2UnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBhdXNlJyksXG4gICAgICAgICAgICAnJHBsYXknOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBsYXknKVxuICAgICAgICB9O1xuXG4gICAgICAgICRjb250cm9scy4kcGxheS5vbihcImNsaWNrXCIsIHNlbGYucGxheS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRwYXVzZS5vbihcImNsaWNrXCIsIHNlbGYucGF1c2UuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcmVzdGFydC5vbihcImNsaWNrXCIsIHNlbGYucmVzdGFydC5iaW5kKHNlbGYpKTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jb250cm9sLS1tdXRlXCIpLm9uKFwiY2xpY2tcIiwgX19oYW5kbGVUcmFja011dGVDbGljay5iaW5kKHNlbGYpKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY2hhbmdlclwiKS5vbihcImNoYW5nZVwiLCBfX2hhbmRsZVRyYWNrUmVxdWVzdENoYW5nZS5iaW5kKHNlbGYpKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY2hhbmdlclwiKS5jaGFuZ2UoKTtcbiAgICB9XG5cbiAgICBsb2FkVHJhY2tzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwID0ge307XG5cbiAgICAgICAgX19sb2FkVHJhY2tSZXF1ZXN0cy5iaW5kKHNlbGYpKCk7XG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikpO1xuICAgIH1cblxuICAgIHJlcGxhY2VUcmFja0J5SWQodHJhY2tJZCwgbmV3VHJhY2spIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MgPSBzZWxmLnRyYWNrcy5tYXAodHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLnBrID09PSB0cmFja0lkKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmVtcHR5KCk7IC8vIHdpcGUgd2F2ZXN1cmZlciBkYXRhIGFuZCBldmVudHNcbiAgICAgICAgICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjd2F2ZWZvcm0tXCIgKyB0cmFja0lkKS5maW5kKFwid2F2ZVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0cmFjayA9IF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikobmV3VHJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJhY2s7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIG1peHBhbmVsLnRyYWNrKFwibWVkaWEtcGxheWVyOnJlc3RhcnRcIik7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8ucGxheSgwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBtaXhwYW5lbC50cmFjayhcIm1lZGlhLXBsYXllcjpwbGF5XCIpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgIXRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbWl4cGFuZWwudHJhY2soXCJtZWRpYS1wbGF5ZXI6cGF1c2VcIik7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIGdldExvYWRpbmdQcm9ncmVzcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHRvdGFsUHJvZ3Jlc3MgPSAwLFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXApO1xuXG4gICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgdG90YWxQcm9ncmVzcyArPSBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW2tleV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRvdGFsUHJvZ3Jlc3MgPSB0b3RhbFByb2dyZXNzIC8ga2V5cy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsUHJvZ3Jlc3M7XG4gICAgfVxuXG4gICAgZ2V0TG9uZ2VzdFRyYWNrKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgICAgIGxldCBsb25nZXN0VHJhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgbG9uZ2VzdFRyYWNrID0gbG9uZ2VzdFRyYWNrIHx8IHRyYWNrO1xuICAgICAgICAgICAgbGV0IHRyYWNrRHVyYXRpb24gPSB0cmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICAgICAgICAgIGlmICh0cmFja0R1cmF0aW9uID4gbG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IHRyYWNrO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsb25nZXN0VHJhY2s7XG4gICAgfVxuXG4gICAgYWxsVHJhY2tzQXJlTG9hZGVkKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZXZlcnkodHJhY2sgPT4gISF0cmFjay5fX2xvYWRlZCk7XG4gICAgfVxuXG4gICAgZ2V0VHJhY2tCeUlkKHRyYWNrSWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiB0cmFjay5wayA9PT0gdHJhY2tJZClbMF07XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhY2tNdXRlKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby50b2dnbGVNdXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2NyZWF0ZUF1ZGlvV2F2ZSh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHRyYWNrLmZpZWxkcy5hdWRpb191cmwpIHtcbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSAwO1xuICAgICAgICB2YXIgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdmFyIGxpbkdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgNjQsIDAsIDIwMCk7XG4gICAgICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMjI1LCAyMjUsIDIyNSwgMS4wMDApJyk7XG4gICAgICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMTgzLCAxODMsIDE4MywgMS4wMDApJyk7XG5cbiAgICAgICAgdmFyIHdhdmVzdXJmZXIgPSBXYXZlU3VyZmVyLmNyZWF0ZSh7XG4gICAgICAgICAgICBjb250YWluZXI6ICcjd2F2ZWZvcm0tJyArIHRyYWNrLnBrLFxuICAgICAgICAgICAgd2F2ZUNvbG9yOiBsaW5HcmFkLFxuICAgICAgICAgICAgcHJvZ3Jlc3NDb2xvcjogJ2hzbGEoMjAwLCAxMDAlLCAzMCUsIDAuNSknLFxuICAgICAgICAgICAgY3Vyc29yQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgIGhlaWdodDogNjAsXG4gICAgICAgICAgICBiYXJXaWR0aDogM1xuICAgICAgICB9KTtcblxuICAgICAgICB3YXZlc3VyZmVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgIF9fb25UcmFja1JlYWR5RXZlbnQuYmluZChzZWxmKSh0cmFjayk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKFwiZXJyb3JcIiwgX19vblRyYWNrRXJyb3JFdmVudCk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oJ2xvYWRpbmcnLCBwcm9ncmVzcyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gX19vblRyYWNrTG9hZGluZ0V2ZW50LmJpbmQoc2VsZikodHJhY2ssIHByb2dyZXNzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oJ3NlZWsnLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5sb2FkKHRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgICAgIHRyYWNrLl9fYXVkaW8gPSB3YXZlc3VyZmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhY2s7XG59XG4vLyAvL1xuLy8gLy8gICAgIGZ1bmN0aW9uIHRvZ2dsZVNvbG9Gb3JUcmFjayh0cmFjaywgJGV2ZW50KSB7XG4vLyAvLyAgICAgICAgIHRyYWNrLmlzU29sbyA9ICF0cmFjay5pc1NvbG87XG4vLyAvL1xuLy8gLy8gICAgICAgICB2YXIgJGNvbnRyb2wgPSAkKCRldmVudC50YXJnZXQpO1xuLy8gLy8gICAgICAgICAkY29udHJvbC50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5pc1NvbG8pO1xuLy8gLy8gICAgICAgICAkY29udHJvbC50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLmlzU29sbyk7XG4vLyAvL1xuLy8gLy8gICAgICAgICB2YXIgdHJhY2tzQXJlU29sb2VkID0gc2VsZi50cmFja3Muc29tZShmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgcmV0dXJuIHQuaXNTb2xvO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIGlmICghdHJhY2tzQXJlU29sb2VkKSB7XG4vLyAvLyAgICAgICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoZmFsc2UpO1xuLy8gLy8gICAgICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICAgICAgcmV0dXJuO1xuLy8gLy8gICAgICAgICB9XG4vLyAvL1xuLy8gLy8gICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZSghdC5pc1NvbG8pO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vICAgICB9XG4vLyAvL1xuLy8gLy8gICAgIC8vIFBSSVZBVEUgQVBJXG4vLyAvL1xuLy8gLy9cblxuZnVuY3Rpb24gX19sb2FkVHJhY2tSZXF1ZXN0cygpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tSZXF1ZXN0cy5mb3JFYWNoKHRyYWNrUmVxdWVzdCA9PiB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nVHJhY2sgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRyYWNrLnBrID09PSB0cmFja1JlcXVlc3QuZmllbGRzLnRyYWNrXG4gICAgICAgIH0pWzBdO1xuXG4gICAgICAgIGlmIChtYXRjaGluZ1RyYWNrKSB7XG4gICAgICAgICAgICBtYXRjaGluZ1RyYWNrLmZpZWxkcy5hdWRpb191cmwgPSB0cmFja1JlcXVlc3QuZmllbGRzLmF1ZGlvX3VybDtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tSZWFkeUV2ZW50KHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG5cbiAgICBpZiAoc2VsZi5hbGxUcmFja3NBcmVMb2FkZWQoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImFsbCB0cmFja3MgYXJlIGxvYWRlZFwiKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fbG9hZGluZy1wcm9ncmVzc1wiKS5oaWRlKCk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcblxuICAgICAgICBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLm9uKFwicGxheVwiLCAoKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpLCAyNTApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja0Vycm9yRXZlbnQoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiZXJyb3IgcHJvY2Vzc2luZyB2aWRlb1wiLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja1NlZWtFdmVudChwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgIC8vIHByZXZlbnQgZXhjZXNzIHNlZWsgZXZlbnRzIGZyb20gZmlyaW5nXG4gICAgbGV0IHByb21pc2VzID0gdHJhY2tzV2l0aE1lZGlhLm1hcCh0cmFjayA9PiB7XG4gICAgICAgIHZhciBkZWZlciA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby51bihcInNlZWtcIik7XG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICBkZWZlci5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgICB9KTtcblxuICAgICQud2hlbihwcm9taXNlcykuZG9uZSgoKSA9PiB7XG4gICAgICAgIHNlbGYucGF1c2UoKTtcblxuICAgICAgICB0cmFja3NXaXRoTWVkaWEuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnNlZWtUbyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLm9uKFwic2Vla1wiLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYucGxheSgpO1xuICAgIH0pLmZhaWwoZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja0xvYWRpbmdFdmVudCh0cmFjaywgcHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gcHJvZ3Jlc3M7XG5cbiAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjcHJvZ3Jlc3NcIikuY3NzKHtcbiAgICAgICAgd2lkdGg6IHNlbGYuZ2V0TG9hZGluZ1Byb2dyZXNzLmJpbmQoc2VsZikoKSArIFwiJVwiXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fdXBkYXRlU29uZ0R1cmF0aW9ucygpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBsZXQgJHRpbWVyID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fY29udHJvbC0tZHVyYXRpb25cIik7XG5cbiAgICBzZWxmLmxvbmdlc3RUcmFjayA9IHNlbGYuZ2V0TG9uZ2VzdFRyYWNrKCk7XG5cbiAgICAvLyBubyB0cmFja3MgdG8gbWVkaWEgZHVyYXRpb24gZnJvbVxuICAgIGlmICghc2VsZi5sb25nZXN0VHJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXRDdXJyZW50VGltZSgpO1xuICAgIHNlbGYuc29uZ0R1cmF0aW9uID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgbGV0IGR1cmF0aW9uRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdEdXJhdGlvbiksXG4gICAgICAgIHNlZWtEYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0N1cnJlbnRTZWVrKTtcblxuICAgIGZ1bmN0aW9uIGRhdGVUaW1lVG9NZWRpYVRpbWUoZGF0ZVRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGRhdGVUaW1lLmdldE1pbnV0ZXMoKSArIFwiOlwiICsgU3RyaW5nKFwiMDBcIiArIGRhdGVUaW1lLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuICAgIH1cblxuICAgICR0aW1lci50ZXh0KGRhdGVUaW1lVG9NZWRpYVRpbWUoc2Vla0RhdGVUaW1lKSArIFwiIC8gXCIgKyBkYXRlVGltZVRvTWVkaWFUaW1lKGR1cmF0aW9uRGF0ZVRpbWUpKTtcblxuICAgIGlmIChzZWxmLnNvbmdDdXJyZW50U2VlayA+PSBzZWxmLnNvbmdEdXJhdGlvbikge1xuICAgICAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYuc29uZ0R1cmF0aW9uO1xuXG4gICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2soZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgIG1peHBhbmVsLnRyYWNrKFwibWVkaWEtcGxheWVyOm11dGUtdHJhY2tcIiwgdHJhY2spO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suX19hdWRpby5pc011dGVkKTtcbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja1JlcXVlc3RDaGFuZ2UoZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLS1uby1tZWRpYVwiKS5yZW1vdmVDbGFzcyhcIm1lZGlhLXBsYXllcl9fdHJhY2stLW5vLW1lZGlhXCIpO1xuXG4gICAgdHJhY2suZmllbGRzLmF1ZGlvX3VybCA9ICR0cmFja0NvbnRyb2wudmFsKCk7XG4gICAgc2VsZi5yZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIHRyYWNrKTtcbn0iLCJleHBvcnQgY2xhc3MgTWVzc2FnZXMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlcyA9ICQoJy5tZXNzYWdlJyk7XG5cbiAgICAgICAgbWVzc2FnZXMuZWFjaCgoaW5kZXgsIG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIG5ldyBNZXNzYWdlKCQobWVzc2FnZSkpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIE1lc3NhZ2Uge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uID0gdGhpcy4kZWxlbWVudC5maW5kKCcuanMtbWVzc2FnZS1jbG9zZScpO1xuICAgICAgICB0aGlzLiRjbG9zZUljb24ub24oJ2NsaWNrJywgX19jbG9zZU1lc3NhZ2VIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jbG9zZU1lc3NhZ2VIYW5kbGVyKCkge1xuICAgICAgICB0aGlzLiRjbG9zZUljb24ucGFyZW50cygnLm1lc3NhZ2UnKS5yZW1vdmUoKTtcbn0iLCJleHBvcnRzLnNlY29uZHNUb0RhdGVUaW1lID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICB2YXIgZCA9IG5ldyBEYXRlKDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgIGQuc2V0U2Vjb25kcyhzZWNvbmRzKTtcbiAgICByZXR1cm4gZDtcbn07Il19

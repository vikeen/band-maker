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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2FwcC5qcyIsIm1lbG9keV9idWRkeS9zdGF0aWMvanMvY29tcG9uZW50cy9tZWRpYV9wbGF5ZXIuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2NvbXBvbmVudHMvbWVzc2FnZXMuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1IsOENBRFE7QUFFUjtBQUZRLEtBREo7QUFLUixXQUFPO0FBQ0g7QUFERztBQUxDLENBQVo7O0FBV0E7OztBQUdBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBTTtBQUNwQixNQUFFLGtCQUFGLEVBQXNCLFFBQXRCLENBQStCO0FBQzNCLGVBQU87QUFEb0IsS0FBL0I7QUFHQSxNQUFFLGtCQUFGLEVBQXNCLE9BQXRCO0FBQ0EsTUFBRSxTQUFGLEVBQWEsSUFBYjtBQUNBLE1BQUUsUUFBRixFQUFZLGVBQVo7O0FBRUEsUUFBSSxPQUFPLEVBQVAsQ0FBVSxVQUFWLENBQXFCLFFBQXpCO0FBQ0gsQ0FURDs7Ozs7Ozs7Ozs7OztJQ2xCYSxXLFdBQUEsVztBQUNULHlCQUFZLFFBQVosRUFBc0IsTUFBdEIsRUFBOEIsYUFBOUIsRUFBNkM7QUFBQTs7QUFDekMsWUFBTSxPQUFPLElBQWI7O0FBRUEsZ0JBQVEsR0FBUixDQUFZLG1CQUFaLEVBQWlDLFFBQWpDOztBQUVBLGFBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBLGFBQUssTUFBTCxHQUFjLFVBQVUsRUFBeEI7QUFDQSxhQUFLLGFBQUwsR0FBcUIsaUJBQWlCLEVBQXRDOztBQUVBLGdCQUFRLEdBQVIsQ0FBWSxRQUFaLEVBQXNCLEtBQUssTUFBM0I7QUFD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YixHQUF5QixjQUFjLEdBQWQsRUFBekI7QUFDQSxTQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLEtBQS9CO0FBQ0g7Ozs7Ozs7Ozs7O0lDdFZZLFEsV0FBQSxRLEdBQ1Qsb0JBQWM7QUFBQTs7QUFDVixRQUFNLFdBQVcsRUFBRSxVQUFGLENBQWpCOztBQUVBLGFBQVMsSUFBVCxDQUFjLFVBQUMsS0FBRCxFQUFRLE9BQVIsRUFBb0I7QUFDOUIsWUFBSSxPQUFKLENBQVksRUFBRSxPQUFGLENBQVo7QUFDSCxLQUZEO0FBR0gsQzs7SUFHQyxPLEdBQ0YsaUJBQVksUUFBWixFQUFzQjtBQUFBOztBQUNsQixTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLFVBQUwsR0FBa0IsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixtQkFBbkIsQ0FBbEI7QUFDQSxTQUFLLFVBQUwsQ0FBZ0IsRUFBaEIsQ0FBbUIsT0FBbkIsRUFBNEIsc0JBQXNCLElBQXRCLENBQTJCLElBQTNCLENBQTVCO0FBQ0gsQzs7QUFHTCxTQUFTLHFCQUFULEdBQWlDO0FBQ3pCLFNBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixVQUF4QixFQUFvQyxNQUFwQztBQUNQOzs7OztBQ3BCRCxRQUFRLGlCQUFSLEdBQTRCLFVBQVUsT0FBVixFQUFtQjtBQUMzQyxRQUFJLElBQUksSUFBSSxJQUFKLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLENBQVI7QUFDQSxNQUFFLFVBQUYsQ0FBYSxPQUFiO0FBQ0EsV0FBTyxDQUFQO0FBQ0gsQ0FKRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge01lZGlhUGxheWVyfSBmcm9tIFwiLi9jb21wb25lbnRzL21lZGlhX3BsYXllclwiO1xuaW1wb3J0IHtNZXNzYWdlc30gZnJvbSBcIi4vY29tcG9uZW50cy9tZXNzYWdlc1wiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyLFxuICAgICAgICBNZXNzYWdlczogTWVzc2FnZXNcbiAgICB9LFxuICAgIHV0aWxzOiB7XG4gICAgICAgIHNlY29uZHNUb0RhdGVUaW1lOiBzZWNvbmRzVG9EYXRlVGltZVxuICAgIH1cbn07XG5cblxuLypcbiAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gd2lkZ2V0c1xuICovXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgJChcIi5kcm9wZG93bi1idXR0b25cIikuZHJvcGRvd24oe1xuICAgICAgICBob3ZlcjogZmFsc2VcbiAgICB9KTtcbiAgICAkKFwiLmJ1dHRvbi1jb2xsYXBzZVwiKS5zaWRlTmF2KCk7XG4gICAgJCgndWwudGFicycpLnRhYnMoKTtcbiAgICAkKCdzZWxlY3QnKS5tYXRlcmlhbF9zZWxlY3QoKTtcblxuICAgIG5ldyB3aW5kb3cuYm0uY29tcG9uZW50cy5NZXNzYWdlcygpO1xufSk7IiwiZXhwb3J0IGNsYXNzIE1lZGlhUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCwgdHJhY2tzLCB0cmFja1JlcXVlc3RzKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwibWVkaWEgcGxheWVyIGluaXRcIiwgJGVsZW1lbnQpO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgc2VsZi50cmFja3MgPSB0cmFja3MgfHwgW107XG4gICAgICAgIHNlbGYudHJhY2tSZXF1ZXN0cyA9IHRyYWNrUmVxdWVzdHMgfHwgW107XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJ0cmFja3NcIiwgc2VsZi50cmFja3MpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInRyYWNrIHJlcXVlc3RzXCIsIHNlbGYudHJhY2tSZXF1ZXN0cyk7XG5cblxuICAgICAgICBzZWxmLmxvYWRUcmFja3MoKTtcblxuICAgICAgICBjb25zdCAkY29udHJvbHMgPSB7XG4gICAgICAgICAgICAnJHJlc3RhcnQnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXJlc3RhcnQnKSxcbiAgICAgICAgICAgICckcGF1c2UnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBhdXNlJyksXG4gICAgICAgICAgICAnJHBsYXknOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBsYXknKVxuICAgICAgICB9O1xuXG4gICAgICAgICRjb250cm9scy4kcGxheS5vbihcImNsaWNrXCIsIHNlbGYucGxheS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRwYXVzZS5vbihcImNsaWNrXCIsIHNlbGYucGF1c2UuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcmVzdGFydC5vbihcImNsaWNrXCIsIHNlbGYucmVzdGFydC5iaW5kKHNlbGYpKTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jb250cm9sLS1tdXRlXCIpLm9uKFwiY2xpY2tcIiwgX19oYW5kbGVUcmFja011dGVDbGljay5iaW5kKHNlbGYpKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY2hhbmdlclwiKS5vbihcImNoYW5nZVwiLCBfX2hhbmRsZVRyYWNrUmVxdWVzdENoYW5nZS5iaW5kKHNlbGYpKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY2hhbmdlclwiKS5jaGFuZ2UoKTtcbiAgICB9XG5cbiAgICBsb2FkVHJhY2tzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwID0ge307XG5cbiAgICAgICAgX19sb2FkVHJhY2tSZXF1ZXN0cy5iaW5kKHNlbGYpKCk7XG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikpO1xuICAgIH1cblxuICAgIHJlcGxhY2VUcmFja0J5SWQodHJhY2tJZCwgbmV3VHJhY2spIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MgPSBzZWxmLnRyYWNrcy5tYXAodHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLnBrID09PSB0cmFja0lkKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmVtcHR5KCk7IC8vIHdpcGUgd2F2ZXN1cmZlciBkYXRhIGFuZCBldmVudHNcbiAgICAgICAgICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjd2F2ZWZvcm0tXCIgKyB0cmFja0lkKS5maW5kKFwid2F2ZVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0cmFjayA9IF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikobmV3VHJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJhY2s7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpbyAmJiAhdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGxheSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIHBhdXNlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgZ2V0TG9hZGluZ1Byb2dyZXNzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBsZXQgdG90YWxQcm9ncmVzcyA9IDAsXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCk7XG5cbiAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICB0b3RhbFByb2dyZXNzICs9IHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG90YWxQcm9ncmVzcyA9IHRvdGFsUHJvZ3Jlc3MgLyBrZXlzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gdG90YWxQcm9ncmVzcztcbiAgICB9XG5cbiAgICBnZXRMb25nZXN0VHJhY2soKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgdHJhY2tzV2l0aE1lZGlhID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+ICEhdHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAgICAgbGV0IGxvbmdlc3RUcmFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0cmFja3NXaXRoTWVkaWEuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBsb25nZXN0VHJhY2sgPSBsb25nZXN0VHJhY2sgfHwgdHJhY2s7XG4gICAgICAgICAgICBsZXQgdHJhY2tEdXJhdGlvbiA9IHRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKTtcblxuICAgICAgICAgICAgaWYgKHRyYWNrRHVyYXRpb24gPiBsb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgbG9uZ2VzdFRyYWNrID0gdHJhY2s7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxvbmdlc3RUcmFjaztcbiAgICB9XG5cbiAgICBhbGxUcmFja3NBcmVMb2FkZWQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5ldmVyeSh0cmFjayA9PiAhIXRyYWNrLl9fbG9hZGVkKTtcbiAgICB9XG5cbiAgICBnZXRUcmFja0J5SWQodHJhY2tJZCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHRyYWNrLnBrID09PSB0cmFja0lkKVswXTtcbiAgICB9XG5cbiAgICB0b2dnbGVUcmFja011dGUodHJhY2spIHtcbiAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnRvZ2dsZU11dGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fY3JlYXRlQXVkaW9XYXZlKHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodHJhY2suZmllbGRzLmF1ZGlvX3VybCkge1xuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IDA7XG4gICAgICAgIHZhciBjdHggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB2YXIgbGluR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCA2NCwgMCwgMjAwKTtcbiAgICAgICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgyMjUsIDIyNSwgMjI1LCAxLjAwMCknKTtcbiAgICAgICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgxODMsIDE4MywgMTgzLCAxLjAwMCknKTtcblxuICAgICAgICB2YXIgd2F2ZXN1cmZlciA9IFdhdmVTdXJmZXIuY3JlYXRlKHtcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJyN3YXZlZm9ybS0nICsgdHJhY2sucGssXG4gICAgICAgICAgICB3YXZlQ29sb3I6IGxpbkdyYWQsXG4gICAgICAgICAgICBwcm9ncmVzc0NvbG9yOiAnaHNsYSgyMDAsIDEwMCUsIDMwJSwgMC41KScsXG4gICAgICAgICAgICBjdXJzb3JDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgaGVpZ2h0OiA2MCxcbiAgICAgICAgICAgIGJhcldpZHRoOiAzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdhdmVzdXJmZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgX19vblRyYWNrUmVhZHlFdmVudC5iaW5kKHNlbGYpKHRyYWNrKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oXCJlcnJvclwiLCBfX29uVHJhY2tFcnJvckV2ZW50KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbignbG9hZGluZycsIHByb2dyZXNzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfX29uVHJhY2tMb2FkaW5nRXZlbnQuYmluZChzZWxmKSh0cmFjaywgcHJvZ3Jlc3MpO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbignc2VlaycsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcblxuICAgICAgICB3YXZlc3VyZmVyLmxvYWQodHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAgICAgdHJhY2suX19hdWRpbyA9IHdhdmVzdXJmZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFjaztcbn1cbi8vIC8vXG4vLyAvLyAgICAgZnVuY3Rpb24gdG9nZ2xlU29sb0ZvclRyYWNrKHRyYWNrLCAkZXZlbnQpIHtcbi8vIC8vICAgICAgICAgdHJhY2suaXNTb2xvID0gIXRyYWNrLmlzU29sbztcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciAkY29udHJvbCA9ICQoJGV2ZW50LnRhcmdldCk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLmlzU29sbyk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suaXNTb2xvKTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciB0cmFja3NBcmVTb2xvZWQgPSBzZWxmLnRyYWNrcy5zb21lKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICByZXR1cm4gdC5pc1NvbG87XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgaWYgKCF0cmFja3NBcmVTb2xvZWQpIHtcbi8vIC8vICAgICAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZShmYWxzZSk7XG4vLyAvLyAgICAgICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgICAgICByZXR1cm47XG4vLyAvLyAgICAgICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKCF0LmlzU29sbyk7XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy8gICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgLy8gUFJJVkFURSBBUElcbi8vIC8vXG4vLyAvL1xuXG5mdW5jdGlvbiBfX2xvYWRUcmFja1JlcXVlc3RzKCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi50cmFja1JlcXVlc3RzLmZvckVhY2godHJhY2tSZXF1ZXN0ID0+IHtcbiAgICAgICAgY29uc3QgbWF0Y2hpbmdUcmFjayA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdHJhY2sucGsgPT09IHRyYWNrUmVxdWVzdC5maWVsZHMudHJhY2tcbiAgICAgICAgfSlbMF07XG5cbiAgICAgICAgaWYgKG1hdGNoaW5nVHJhY2spIHtcbiAgICAgICAgICAgIG1hdGNoaW5nVHJhY2suZmllbGRzLmF1ZGlvX3VybCA9IHRyYWNrUmVxdWVzdC5maWVsZHMuYXVkaW9fdXJsO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja1JlYWR5RXZlbnQodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcblxuICAgIGlmIChzZWxmLmFsbFRyYWNrc0FyZUxvYWRlZCgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiYWxsIHRyYWNrcyBhcmUgbG9hZGVkXCIpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX19sb2FkaW5nLXByb2dyZXNzXCIpLmhpZGUoKTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuXG4gICAgICAgIHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8ub24oXCJwbGF5XCIsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuc2Vla1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZiksIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19vblRyYWNrRXJyb3JFdmVudChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBwcm9jZXNzaW5nIHZpZGVvXCIsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrU2Vla0V2ZW50KHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgLy8gcHJldmVudCBleGNlc3Mgc2VlayBldmVudHMgZnJvbSBmaXJpbmdcbiAgICBsZXQgcHJvbWlzZXMgPSB0cmFja3NXaXRoTWVkaWEubWFwKHRyYWNrID0+IHtcbiAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnVuKFwic2Vla1wiKTtcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgIH0pO1xuXG4gICAgJC53aGVuKHByb21pc2VzKS5kb25lKCgpID0+IHtcbiAgICAgICAgc2VsZi5wYXVzZSgpO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8uc2Vla1RvKHByb2dyZXNzKTtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ub24oXCJzZWVrXCIsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5wbGF5KCk7XG4gICAgfSkuZmFpbChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrTG9hZGluZ0V2ZW50KHRyYWNrLCBwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSBwcm9ncmVzcztcblxuICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiNwcm9ncmVzc1wiKS5jc3Moe1xuICAgICAgICB3aWR0aDogc2VsZi5nZXRMb2FkaW5nUHJvZ3Jlc3MuYmluZChzZWxmKSgpICsgXCIlXCJcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX191cGRhdGVTb25nRHVyYXRpb25zKCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGxldCAkdGltZXIgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX19jb250cm9sLS1kdXJhdGlvblwiKTtcblxuICAgIHNlbGYubG9uZ2VzdFRyYWNrID0gc2VsZi5nZXRMb25nZXN0VHJhY2soKTtcblxuICAgIC8vIG5vIHRyYWNrcyB0byBtZWRpYSBkdXJhdGlvbiBmcm9tXG4gICAgaWYgKCFzZWxmLmxvbmdlc3RUcmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgc2VsZi5zb25nRHVyYXRpb24gPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICBsZXQgZHVyYXRpb25EYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0R1cmF0aW9uKSxcbiAgICAgICAgc2Vla0RhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nQ3VycmVudFNlZWspO1xuXG4gICAgZnVuY3Rpb24gZGF0ZVRpbWVUb01lZGlhVGltZShkYXRlVGltZSkge1xuICAgICAgICByZXR1cm4gZGF0ZVRpbWUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBTdHJpbmcoXCIwMFwiICsgZGF0ZVRpbWUuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gICAgfVxuXG4gICAgJHRpbWVyLnRleHQoZGF0ZVRpbWVUb01lZGlhVGltZShzZWVrRGF0ZVRpbWUpICsgXCIgLyBcIiArIGRhdGVUaW1lVG9NZWRpYVRpbWUoZHVyYXRpb25EYXRlVGltZSkpO1xuXG4gICAgaWYgKHNlbGYuc29uZ0N1cnJlbnRTZWVrID49IHNlbGYuc29uZ0R1cmF0aW9uKSB7XG4gICAgICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5zb25nRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja011dGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suX19hdWRpby5pc011dGVkKTtcbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja1JlcXVlc3RDaGFuZ2UoZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLS1uby1tZWRpYVwiKS5yZW1vdmVDbGFzcyhcIm1lZGlhLXBsYXllcl9fdHJhY2stLW5vLW1lZGlhXCIpO1xuXG4gICAgdHJhY2suZmllbGRzLmF1ZGlvX3VybCA9ICR0cmFja0NvbnRyb2wudmFsKCk7XG4gICAgc2VsZi5yZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIHRyYWNrKTtcbn0iLCJleHBvcnQgY2xhc3MgTWVzc2FnZXMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlcyA9ICQoJy5tZXNzYWdlJyk7XG5cbiAgICAgICAgbWVzc2FnZXMuZWFjaCgoaW5kZXgsIG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIG5ldyBNZXNzYWdlKCQobWVzc2FnZSkpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIE1lc3NhZ2Uge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uID0gdGhpcy4kZWxlbWVudC5maW5kKCcuanMtbWVzc2FnZS1jbG9zZScpO1xuICAgICAgICB0aGlzLiRjbG9zZUljb24ub24oJ2NsaWNrJywgX19jbG9zZU1lc3NhZ2VIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jbG9zZU1lc3NhZ2VIYW5kbGVyKCkge1xuICAgICAgICB0aGlzLiRjbG9zZUljb24ucGFyZW50cygnLm1lc3NhZ2UnKS5yZW1vdmUoKTtcbn0iLCJleHBvcnRzLnNlY29uZHNUb0RhdGVUaW1lID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICB2YXIgZCA9IG5ldyBEYXRlKDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgIGQuc2V0U2Vjb25kcyhzZWNvbmRzKTtcbiAgICByZXR1cm4gZDtcbn07Il19

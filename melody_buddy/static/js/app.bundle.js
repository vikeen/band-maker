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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2FwcC5qcyIsIm1lbG9keV9idWRkeS9zdGF0aWMvanMvY29tcG9uZW50cy9tZWRpYV9wbGF5ZXIuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2NvbXBvbmVudHMvbWVzc2FnZXMuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1IsOENBRFE7QUFFUjtBQUZRLEtBREo7QUFLUixXQUFPO0FBQ0g7QUFERztBQUxDLENBQVo7O0FBV0E7OztBQUdBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBTTtBQUNwQixNQUFFLGtCQUFGLEVBQXNCLFFBQXRCLENBQStCO0FBQzNCLGVBQU87QUFEb0IsS0FBL0I7QUFHQSxNQUFFLGtCQUFGLEVBQXNCLE9BQXRCO0FBQ0EsTUFBRSxTQUFGLEVBQWEsSUFBYjs7QUFFQSxRQUFJLE9BQU8sRUFBUCxDQUFVLFVBQVYsQ0FBcUIsUUFBekI7QUFDSCxDQVJEOzs7Ozs7Ozs7Ozs7O0lDbEJhLFcsV0FBQSxXO0FBQ1QseUJBQVksUUFBWixFQUFzQixNQUF0QixFQUE4QixhQUE5QixFQUE2QztBQUFBOztBQUN6QyxZQUFNLE9BQU8sSUFBYjs7QUFFQSxnQkFBUSxHQUFSLENBQVksbUJBQVosRUFBaUMsUUFBakM7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsYUFBSyxNQUFMLEdBQWMsVUFBVSxFQUF4QjtBQUNBLGFBQUssYUFBTCxHQUFxQixpQkFBaUIsRUFBdEM7O0FBRUEsZ0JBQVEsR0FBUixDQUFZLFFBQVosRUFBc0IsS0FBSyxNQUEzQjtBQUNBLGdCQUFRLEdBQVIsQ0FBWSxnQkFBWixF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Q0EsU0FBSyxnQkFBTCxDQUFzQixPQUF0QixFQUErQixLQUEvQjtBQUNIOzs7Ozs7Ozs7OztJQ3RWWSxRLFdBQUEsUSxHQUNULG9CQUFjO0FBQUE7O0FBQ1YsUUFBTSxXQUFXLEVBQUUsVUFBRixDQUFqQjs7QUFFQSxhQUFTLElBQVQsQ0FBYyxVQUFDLEtBQUQsRUFBUSxPQUFSLEVBQW9CO0FBQzlCLFlBQUksT0FBSixDQUFZLEVBQUUsT0FBRixDQUFaO0FBQ0gsS0FGRDtBQUdILEM7O0lBR0MsTyxHQUNGLGlCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDbEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxVQUFMLEdBQWtCLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsbUJBQW5CLENBQWxCO0FBQ0EsU0FBSyxVQUFMLENBQWdCLEVBQWhCLENBQW1CLE9BQW5CLEVBQTRCLHNCQUFzQixJQUF0QixDQUEyQixJQUEzQixDQUE1QjtBQUNILEM7O0FBR0wsU0FBUyxxQkFBVCxHQUFpQztBQUN6QixTQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBd0IsVUFBeEIsRUFBb0MsTUFBcEM7QUFDUDs7Ozs7QUNwQkQsUUFBUSxpQkFBUixHQUE0QixVQUFVLE9BQVYsRUFBbUI7QUFDM0MsUUFBSSxJQUFJLElBQUksSUFBSixDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixDQUF4QixFQUEyQixDQUEzQixDQUFSO0FBQ0EsTUFBRSxVQUFGLENBQWEsT0FBYjtBQUNBLFdBQU8sQ0FBUDtBQUNILENBSkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtNZWRpYVBsYXllcn0gZnJvbSBcIi4vY29tcG9uZW50cy9tZWRpYV9wbGF5ZXJcIjtcbmltcG9ydCB7TWVzc2FnZXN9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVzc2FnZXNcIjtcbmltcG9ydCB7c2Vjb25kc1RvRGF0ZVRpbWV9IGZyb20gXCIuL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lXCI7XG5cbndpbmRvdy5ibSA9IHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIE1lZGlhUGxheWVyOiBNZWRpYVBsYXllcixcbiAgICAgICAgTWVzc2FnZXM6IE1lc3NhZ2VzXG4gICAgfSxcbiAgICB1dGlsczoge1xuICAgICAgICBzZWNvbmRzVG9EYXRlVGltZTogc2Vjb25kc1RvRGF0ZVRpbWVcbiAgICB9XG59O1xuXG5cbi8qXG4gKiBJbml0aWFsaXplIGFwcGxpY2F0aW9uIHdpZGdldHNcbiAqL1xuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgICQoXCIuZHJvcGRvd24tYnV0dG9uXCIpLmRyb3Bkb3duKHtcbiAgICAgICAgaG92ZXI6IGZhbHNlXG4gICAgfSk7XG4gICAgJChcIi5idXR0b24tY29sbGFwc2VcIikuc2lkZU5hdigpO1xuICAgICQoJ3VsLnRhYnMnKS50YWJzKCk7XG5cbiAgICBuZXcgd2luZG93LmJtLmNvbXBvbmVudHMuTWVzc2FnZXMoKTtcbn0pOyIsImV4cG9ydCBjbGFzcyBNZWRpYVBsYXllciB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrcywgdHJhY2tSZXF1ZXN0cykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLmxvZyhcIm1lZGlhIHBsYXllciBpbml0XCIsICRlbGVtZW50KTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHNlbGYudHJhY2tzID0gdHJhY2tzIHx8IFtdO1xuICAgICAgICBzZWxmLnRyYWNrUmVxdWVzdHMgPSB0cmFja1JlcXVlc3RzIHx8IFtdO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwidHJhY2tzXCIsIHNlbGYudHJhY2tzKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0cmFjayByZXF1ZXN0c1wiLCBzZWxmLnRyYWNrUmVxdWVzdHMpO1xuXG5cbiAgICAgICAgc2VsZi5sb2FkVHJhY2tzKCk7XG5cbiAgICAgICAgY29uc3QgJGNvbnRyb2xzID0ge1xuICAgICAgICAgICAgJyRyZXN0YXJ0Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1yZXN0YXJ0JyksXG4gICAgICAgICAgICAnJHBhdXNlJzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wYXVzZScpLFxuICAgICAgICAgICAgJyRwbGF5Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wbGF5JylcbiAgICAgICAgfTtcblxuICAgICAgICAkY29udHJvbHMuJHBsYXkub24oXCJjbGlja1wiLCBzZWxmLnBsYXkuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcGF1c2Uub24oXCJjbGlja1wiLCBzZWxmLnBhdXNlLmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHJlc3RhcnQub24oXCJjbGlja1wiLCBzZWxmLnJlc3RhcnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY29udHJvbC0tbXV0ZVwiKS5vbihcImNsaWNrXCIsIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2suYmluZChzZWxmKSk7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNoYW5nZXJcIikub24oXCJjaGFuZ2VcIiwgX19oYW5kbGVUcmFja1JlcXVlc3RDaGFuZ2UuYmluZChzZWxmKSk7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNoYW5nZXJcIikuY2hhbmdlKCk7XG4gICAgfVxuXG4gICAgbG9hZFRyYWNrcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCA9IHt9O1xuXG4gICAgICAgIF9fbG9hZFRyYWNrUmVxdWVzdHMuYmluZChzZWxmKSgpO1xuICAgICAgICBzZWxmLnRyYWNrcyA9IHNlbGYudHJhY2tzLm1hcChfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICByZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIG5ld1RyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5wayA9PT0gdHJhY2tJZCkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5lbXB0eSgpOyAvLyB3aXBlIHdhdmVzdXJmZXIgZGF0YSBhbmQgZXZlbnRzXG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3dhdmVmb3JtLVwiICsgdHJhY2tJZCkuZmluZChcIndhdmVcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdHJhY2sgPSBfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKG5ld1RyYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXN0YXJ0KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5wbGF5KDApO1xuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgIXRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIGdldExvYWRpbmdQcm9ncmVzcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHRvdGFsUHJvZ3Jlc3MgPSAwLFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXApO1xuXG4gICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgdG90YWxQcm9ncmVzcyArPSBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW2tleV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRvdGFsUHJvZ3Jlc3MgPSB0b3RhbFByb2dyZXNzIC8ga2V5cy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsUHJvZ3Jlc3M7XG4gICAgfVxuXG4gICAgZ2V0TG9uZ2VzdFRyYWNrKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgICAgIGxldCBsb25nZXN0VHJhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgbG9uZ2VzdFRyYWNrID0gbG9uZ2VzdFRyYWNrIHx8IHRyYWNrO1xuICAgICAgICAgICAgbGV0IHRyYWNrRHVyYXRpb24gPSB0cmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICAgICAgICAgIGlmICh0cmFja0R1cmF0aW9uID4gbG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IHRyYWNrO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsb25nZXN0VHJhY2s7XG4gICAgfVxuXG4gICAgYWxsVHJhY2tzQXJlTG9hZGVkKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZXZlcnkodHJhY2sgPT4gISF0cmFjay5fX2xvYWRlZCk7XG4gICAgfVxuXG4gICAgZ2V0VHJhY2tCeUlkKHRyYWNrSWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiB0cmFjay5wayA9PT0gdHJhY2tJZClbMF07XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhY2tNdXRlKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby50b2dnbGVNdXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2NyZWF0ZUF1ZGlvV2F2ZSh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHRyYWNrLmZpZWxkcy5hdWRpb191cmwpIHtcbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSAwO1xuICAgICAgICB2YXIgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdmFyIGxpbkdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgNjQsIDAsIDIwMCk7XG4gICAgICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMjI1LCAyMjUsIDIyNSwgMS4wMDApJyk7XG4gICAgICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMTgzLCAxODMsIDE4MywgMS4wMDApJyk7XG5cbiAgICAgICAgdmFyIHdhdmVzdXJmZXIgPSBXYXZlU3VyZmVyLmNyZWF0ZSh7XG4gICAgICAgICAgICBjb250YWluZXI6ICcjd2F2ZWZvcm0tJyArIHRyYWNrLnBrLFxuICAgICAgICAgICAgd2F2ZUNvbG9yOiBsaW5HcmFkLFxuICAgICAgICAgICAgcHJvZ3Jlc3NDb2xvcjogJ2hzbGEoMjAwLCAxMDAlLCAzMCUsIDAuNSknLFxuICAgICAgICAgICAgY3Vyc29yQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgIGhlaWdodDogNjAsXG4gICAgICAgICAgICBiYXJXaWR0aDogM1xuICAgICAgICB9KTtcblxuICAgICAgICB3YXZlc3VyZmVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgIF9fb25UcmFja1JlYWR5RXZlbnQuYmluZChzZWxmKSh0cmFjayk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKFwiZXJyb3JcIiwgX19vblRyYWNrRXJyb3JFdmVudCk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oJ2xvYWRpbmcnLCBwcm9ncmVzcyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gX19vblRyYWNrTG9hZGluZ0V2ZW50LmJpbmQoc2VsZikodHJhY2ssIHByb2dyZXNzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oJ3NlZWsnLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5sb2FkKHRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgICAgIHRyYWNrLl9fYXVkaW8gPSB3YXZlc3VyZmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhY2s7XG59XG4vLyAvL1xuLy8gLy8gICAgIGZ1bmN0aW9uIHRvZ2dsZVNvbG9Gb3JUcmFjayh0cmFjaywgJGV2ZW50KSB7XG4vLyAvLyAgICAgICAgIHRyYWNrLmlzU29sbyA9ICF0cmFjay5pc1NvbG87XG4vLyAvL1xuLy8gLy8gICAgICAgICB2YXIgJGNvbnRyb2wgPSAkKCRldmVudC50YXJnZXQpO1xuLy8gLy8gICAgICAgICAkY29udHJvbC50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5pc1NvbG8pO1xuLy8gLy8gICAgICAgICAkY29udHJvbC50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLmlzU29sbyk7XG4vLyAvL1xuLy8gLy8gICAgICAgICB2YXIgdHJhY2tzQXJlU29sb2VkID0gc2VsZi50cmFja3Muc29tZShmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgcmV0dXJuIHQuaXNTb2xvO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIGlmICghdHJhY2tzQXJlU29sb2VkKSB7XG4vLyAvLyAgICAgICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoZmFsc2UpO1xuLy8gLy8gICAgICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICAgICAgcmV0dXJuO1xuLy8gLy8gICAgICAgICB9XG4vLyAvL1xuLy8gLy8gICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZSghdC5pc1NvbG8pO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vICAgICB9XG4vLyAvL1xuLy8gLy8gICAgIC8vIFBSSVZBVEUgQVBJXG4vLyAvL1xuLy8gLy9cblxuZnVuY3Rpb24gX19sb2FkVHJhY2tSZXF1ZXN0cygpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tSZXF1ZXN0cy5mb3JFYWNoKHRyYWNrUmVxdWVzdCA9PiB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nVHJhY2sgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRyYWNrLnBrID09PSB0cmFja1JlcXVlc3QuZmllbGRzLnRyYWNrXG4gICAgICAgIH0pWzBdO1xuXG4gICAgICAgIGlmIChtYXRjaGluZ1RyYWNrKSB7XG4gICAgICAgICAgICBtYXRjaGluZ1RyYWNrLmZpZWxkcy5hdWRpb191cmwgPSB0cmFja1JlcXVlc3QuZmllbGRzLmF1ZGlvX3VybDtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tSZWFkeUV2ZW50KHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG5cbiAgICBpZiAoc2VsZi5hbGxUcmFja3NBcmVMb2FkZWQoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImFsbCB0cmFja3MgYXJlIGxvYWRlZFwiKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuXG4gICAgICAgIHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8ub24oXCJwbGF5XCIsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuc2Vla1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZiksIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19vblRyYWNrRXJyb3JFdmVudChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBwcm9jZXNzaW5nIHZpZGVvXCIsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrU2Vla0V2ZW50KHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5hdWRpb191cmwpO1xuXG4gICAgLy8gcHJldmVudCBleGNlc3Mgc2VlayBldmVudHMgZnJvbSBmaXJpbmdcbiAgICBsZXQgcHJvbWlzZXMgPSB0cmFja3NXaXRoTWVkaWEubWFwKHRyYWNrID0+IHtcbiAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnVuKFwic2Vla1wiKTtcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgIH0pO1xuXG4gICAgJC53aGVuKHByb21pc2VzKS5kb25lKCgpID0+IHtcbiAgICAgICAgc2VsZi5wYXVzZSgpO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8uc2Vla1RvKHByb2dyZXNzKTtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ub24oXCJzZWVrXCIsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5wbGF5KCk7XG4gICAgfSkuZmFpbChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrTG9hZGluZ0V2ZW50KHRyYWNrLCBwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSBwcm9ncmVzcztcblxuICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiNwcm9ncmVzc1wiKS5jc3Moe1xuICAgICAgICB3aWR0aDogc2VsZi5nZXRMb2FkaW5nUHJvZ3Jlc3MuYmluZChzZWxmKSgpICsgXCIlXCJcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX191cGRhdGVTb25nRHVyYXRpb25zKCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGxldCAkdGltZXIgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX19jb250cm9sLS1kdXJhdGlvblwiKTtcblxuICAgIHNlbGYubG9uZ2VzdFRyYWNrID0gc2VsZi5nZXRMb25nZXN0VHJhY2soKTtcblxuICAgIC8vIG5vIHRyYWNrcyB0byBtZWRpYSBkdXJhdGlvbiBmcm9tXG4gICAgaWYgKCFzZWxmLmxvbmdlc3RUcmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgc2VsZi5zb25nRHVyYXRpb24gPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICBsZXQgZHVyYXRpb25EYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0R1cmF0aW9uKSxcbiAgICAgICAgc2Vla0RhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nQ3VycmVudFNlZWspO1xuXG4gICAgZnVuY3Rpb24gZGF0ZVRpbWVUb01lZGlhVGltZShkYXRlVGltZSkge1xuICAgICAgICByZXR1cm4gZGF0ZVRpbWUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBTdHJpbmcoXCIwMFwiICsgZGF0ZVRpbWUuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gICAgfVxuXG4gICAgJHRpbWVyLnRleHQoZGF0ZVRpbWVUb01lZGlhVGltZShzZWVrRGF0ZVRpbWUpICsgXCIgLyBcIiArIGRhdGVUaW1lVG9NZWRpYVRpbWUoZHVyYXRpb25EYXRlVGltZSkpO1xuXG4gICAgaWYgKHNlbGYuc29uZ0N1cnJlbnRTZWVrID49IHNlbGYuc29uZ0R1cmF0aW9uKSB7XG4gICAgICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5zb25nRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja011dGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suX19hdWRpby5pc011dGVkKTtcbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja1JlcXVlc3RDaGFuZ2UoZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLS1uby1tZWRpYVwiKS5yZW1vdmVDbGFzcyhcIm1lZGlhLXBsYXllcl9fdHJhY2stLW5vLW1lZGlhXCIpO1xuXG4gICAgdHJhY2suZmllbGRzLmF1ZGlvX3VybCA9ICR0cmFja0NvbnRyb2wudmFsKCk7XG4gICAgc2VsZi5yZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIHRyYWNrKTtcbn0iLCJleHBvcnQgY2xhc3MgTWVzc2FnZXMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlcyA9ICQoJy5tZXNzYWdlJyk7XG5cbiAgICAgICAgbWVzc2FnZXMuZWFjaCgoaW5kZXgsIG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIG5ldyBNZXNzYWdlKCQobWVzc2FnZSkpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIE1lc3NhZ2Uge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uID0gdGhpcy4kZWxlbWVudC5maW5kKCcuanMtbWVzc2FnZS1jbG9zZScpO1xuICAgICAgICB0aGlzLiRjbG9zZUljb24ub24oJ2NsaWNrJywgX19jbG9zZU1lc3NhZ2VIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jbG9zZU1lc3NhZ2VIYW5kbGVyKCkge1xuICAgICAgICB0aGlzLiRjbG9zZUljb24ucGFyZW50cygnLm1lc3NhZ2UnKS5yZW1vdmUoKTtcbn0iLCJleHBvcnRzLnNlY29uZHNUb0RhdGVUaW1lID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICB2YXIgZCA9IG5ldyBEYXRlKDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgIGQuc2V0U2Vjb25kcyhzZWNvbmRzKTtcbiAgICByZXR1cm4gZDtcbn07Il19

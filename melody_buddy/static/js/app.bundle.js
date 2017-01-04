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
    $('.parallax').parallax();
    $('.scrollspy').scrollSpy();

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2FwcC5qcyIsIm1lbG9keV9idWRkeS9zdGF0aWMvanMvY29tcG9uZW50cy9tZWRpYV9wbGF5ZXIuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2NvbXBvbmVudHMvbWVzc2FnZXMuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1IsOENBRFE7QUFFUjtBQUZRLEtBREo7QUFLUixXQUFPO0FBQ0g7QUFERztBQUxDLENBQVo7O0FBV0E7OztBQUdBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBTTtBQUNwQixNQUFFLGtCQUFGLEVBQXNCLFFBQXRCLENBQStCO0FBQzNCLGVBQU87QUFEb0IsS0FBL0I7QUFHQSxNQUFFLGtCQUFGLEVBQXNCLE9BQXRCO0FBQ0EsTUFBRSxTQUFGLEVBQWEsSUFBYjtBQUNBLE1BQUUsUUFBRixFQUFZLGVBQVo7QUFDQSxNQUFFLFdBQUYsRUFBZSxRQUFmO0FBQ0EsTUFBRSxZQUFGLEVBQWdCLFNBQWhCOztBQUVBLFFBQUksT0FBTyxFQUFQLENBQVUsVUFBVixDQUFxQixRQUF6QjtBQUNILENBWEQ7Ozs7Ozs7Ozs7Ozs7SUNsQmEsVyxXQUFBLFc7QUFDVCx5QkFBWSxRQUFaLEVBQXNCLE1BQXRCLEVBQThCLGFBQTlCLEVBQTZDO0FBQUE7O0FBQ3pDLFlBQU0sT0FBTyxJQUFiOztBQUVBLGdCQUFRLEdBQVIsQ0FBWSxtQkFBWixFQUFpQyxRQUFqQzs7QUFFQSxhQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxhQUFLLE1BQUwsR0FBYyxVQUFVLEVBQXhCO0FBQ0EsYUFBSyxhQUFMLEdBQXFCLGlCQUFpQixF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LENBSkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtNZWRpYVBsYXllcn0gZnJvbSBcIi4vY29tcG9uZW50cy9tZWRpYV9wbGF5ZXJcIjtcbmltcG9ydCB7TWVzc2FnZXN9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVzc2FnZXNcIjtcbmltcG9ydCB7c2Vjb25kc1RvRGF0ZVRpbWV9IGZyb20gXCIuL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lXCI7XG5cbndpbmRvdy5ibSA9IHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIE1lZGlhUGxheWVyOiBNZWRpYVBsYXllcixcbiAgICAgICAgTWVzc2FnZXM6IE1lc3NhZ2VzXG4gICAgfSxcbiAgICB1dGlsczoge1xuICAgICAgICBzZWNvbmRzVG9EYXRlVGltZTogc2Vjb25kc1RvRGF0ZVRpbWVcbiAgICB9XG59O1xuXG5cbi8qXG4gKiBJbml0aWFsaXplIGFwcGxpY2F0aW9uIHdpZGdldHNcbiAqL1xuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgICQoXCIuZHJvcGRvd24tYnV0dG9uXCIpLmRyb3Bkb3duKHtcbiAgICAgICAgaG92ZXI6IGZhbHNlXG4gICAgfSk7XG4gICAgJChcIi5idXR0b24tY29sbGFwc2VcIikuc2lkZU5hdigpO1xuICAgICQoJ3VsLnRhYnMnKS50YWJzKCk7XG4gICAgJCgnc2VsZWN0JykubWF0ZXJpYWxfc2VsZWN0KCk7XG4gICAgJCgnLnBhcmFsbGF4JykucGFyYWxsYXgoKTtcbiAgICAkKCcuc2Nyb2xsc3B5Jykuc2Nyb2xsU3B5KCk7XG5cbiAgICBuZXcgd2luZG93LmJtLmNvbXBvbmVudHMuTWVzc2FnZXMoKTtcbn0pOyIsImV4cG9ydCBjbGFzcyBNZWRpYVBsYXllciB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrcywgdHJhY2tSZXF1ZXN0cykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLmxvZyhcIm1lZGlhIHBsYXllciBpbml0XCIsICRlbGVtZW50KTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHNlbGYudHJhY2tzID0gdHJhY2tzIHx8IFtdO1xuICAgICAgICBzZWxmLnRyYWNrUmVxdWVzdHMgPSB0cmFja1JlcXVlc3RzIHx8IFtdO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwidHJhY2tzXCIsIHNlbGYudHJhY2tzKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0cmFjayByZXF1ZXN0c1wiLCBzZWxmLnRyYWNrUmVxdWVzdHMpO1xuXG5cbiAgICAgICAgc2VsZi5sb2FkVHJhY2tzKCk7XG5cbiAgICAgICAgY29uc3QgJGNvbnRyb2xzID0ge1xuICAgICAgICAgICAgJyRyZXN0YXJ0Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1yZXN0YXJ0JyksXG4gICAgICAgICAgICAnJHBhdXNlJzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wYXVzZScpLFxuICAgICAgICAgICAgJyRwbGF5Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wbGF5JylcbiAgICAgICAgfTtcblxuICAgICAgICAkY29udHJvbHMuJHBsYXkub24oXCJjbGlja1wiLCBzZWxmLnBsYXkuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcGF1c2Uub24oXCJjbGlja1wiLCBzZWxmLnBhdXNlLmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHJlc3RhcnQub24oXCJjbGlja1wiLCBzZWxmLnJlc3RhcnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY29udHJvbC0tbXV0ZVwiKS5vbihcImNsaWNrXCIsIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2suYmluZChzZWxmKSk7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNoYW5nZXJcIikub24oXCJjaGFuZ2VcIiwgX19oYW5kbGVUcmFja1JlcXVlc3RDaGFuZ2UuYmluZChzZWxmKSk7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNoYW5nZXJcIikuY2hhbmdlKCk7XG4gICAgfVxuXG4gICAgbG9hZFRyYWNrcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCA9IHt9O1xuXG4gICAgICAgIF9fbG9hZFRyYWNrUmVxdWVzdHMuYmluZChzZWxmKSgpO1xuICAgICAgICBzZWxmLnRyYWNrcyA9IHNlbGYudHJhY2tzLm1hcChfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICByZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIG5ld1RyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5wayA9PT0gdHJhY2tJZCkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5lbXB0eSgpOyAvLyB3aXBlIHdhdmVzdXJmZXIgZGF0YSBhbmQgZXZlbnRzXG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3dhdmVmb3JtLVwiICsgdHJhY2tJZCkuZmluZChcIndhdmVcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdHJhY2sgPSBfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKG5ld1RyYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXN0YXJ0KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBtaXhwYW5lbC50cmFjayhcIm1lZGlhLXBsYXllcjpyZXN0YXJ0XCIpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbWl4cGFuZWwudHJhY2soXCJtZWRpYS1wbGF5ZXI6cGxheVwiKTtcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmICF0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIG1peHBhbmVsLnRyYWNrKFwibWVkaWEtcGxheWVyOnBhdXNlXCIpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBnZXRMb2FkaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB0b3RhbFByb2dyZXNzID0gMCxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwKTtcblxuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgKz0gc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b3RhbFByb2dyZXNzID0gdG90YWxQcm9ncmVzcyAvIGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFByb2dyZXNzO1xuICAgIH1cblxuICAgIGdldExvbmdlc3RUcmFjaygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICBsZXQgbG9uZ2VzdFRyYWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IGxvbmdlc3RUcmFjayB8fCB0cmFjaztcbiAgICAgICAgICAgIGxldCB0cmFja0R1cmF0aW9uID0gdHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAodHJhY2tEdXJhdGlvbiA+IGxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBsb25nZXN0VHJhY2sgPSB0cmFjaztcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbG9uZ2VzdFRyYWNrO1xuICAgIH1cblxuICAgIGFsbFRyYWNrc0FyZUxvYWRlZCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmV2ZXJ5KHRyYWNrID0+ICEhdHJhY2suX19sb2FkZWQpO1xuICAgIH1cblxuICAgIGdldFRyYWNrQnlJZCh0cmFja0lkKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gdHJhY2sucGsgPT09IHRyYWNrSWQpWzBdO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWNrTXV0ZSh0cmFjaykge1xuICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8udG9nZ2xlTXV0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jcmVhdGVBdWRpb1dhdmUodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGlmICh0cmFjay5maWVsZHMuYXVkaW9fdXJsKSB7XG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gMDtcbiAgICAgICAgdmFyIGN0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciBsaW5HcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDY0LCAwLCAyMDApO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDIyNSwgMjI1LCAyMjUsIDEuMDAwKScpO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDE4MywgMTgzLCAxODMsIDEuMDAwKScpO1xuXG4gICAgICAgIHZhciB3YXZlc3VyZmVyID0gV2F2ZVN1cmZlci5jcmVhdGUoe1xuICAgICAgICAgICAgY29udGFpbmVyOiAnI3dhdmVmb3JtLScgKyB0cmFjay5wayxcbiAgICAgICAgICAgIHdhdmVDb2xvcjogbGluR3JhZCxcbiAgICAgICAgICAgIHByb2dyZXNzQ29sb3I6ICdoc2xhKDIwMCwgMTAwJSwgMzAlLCAwLjUpJyxcbiAgICAgICAgICAgIGN1cnNvckNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICBoZWlnaHQ6IDYwLFxuICAgICAgICAgICAgYmFyV2lkdGg6IDNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICBfX29uVHJhY2tSZWFkeUV2ZW50LmJpbmQoc2VsZikodHJhY2spO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbihcImVycm9yXCIsIF9fb25UcmFja0Vycm9yRXZlbnQpO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdsb2FkaW5nJywgcHJvZ3Jlc3MgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF9fb25UcmFja0xvYWRpbmdFdmVudC5iaW5kKHNlbGYpKHRyYWNrLCBwcm9ncmVzcyk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdzZWVrJywgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHdhdmVzdXJmZXIubG9hZCh0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICB0cmFjay5fX2F1ZGlvID0gd2F2ZXN1cmZlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYWNrO1xufVxuLy8gLy9cbi8vIC8vICAgICBmdW5jdGlvbiB0b2dnbGVTb2xvRm9yVHJhY2sodHJhY2ssICRldmVudCkge1xuLy8gLy8gICAgICAgICB0cmFjay5pc1NvbG8gPSAhdHJhY2suaXNTb2xvO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyICRjb250cm9sID0gJCgkZXZlbnQudGFyZ2V0KTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suaXNTb2xvKTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5pc1NvbG8pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyIHRyYWNrc0FyZVNvbG9lZCA9IHNlbGYudHJhY2tzLnNvbWUoZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHJldHVybiB0LmlzU29sbztcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICBpZiAoIXRyYWNrc0FyZVNvbG9lZCkge1xuLy8gLy8gICAgICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKGZhbHNlKTtcbi8vIC8vICAgICAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgICAgIHJldHVybjtcbi8vIC8vICAgICAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoIXQuaXNTb2xvKTtcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvLyAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAvLyBQUklWQVRFIEFQSVxuLy8gLy9cbi8vIC8vXG5cbmZ1bmN0aW9uIF9fbG9hZFRyYWNrUmVxdWVzdHMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrUmVxdWVzdHMuZm9yRWFjaCh0cmFja1JlcXVlc3QgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaGluZ1RyYWNrID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cmFjay5wayA9PT0gdHJhY2tSZXF1ZXN0LmZpZWxkcy50cmFja1xuICAgICAgICB9KVswXTtcblxuICAgICAgICBpZiAobWF0Y2hpbmdUcmFjaykge1xuICAgICAgICAgICAgbWF0Y2hpbmdUcmFjay5maWVsZHMuYXVkaW9fdXJsID0gdHJhY2tSZXF1ZXN0LmZpZWxkcy5hdWRpb191cmw7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrUmVhZHlFdmVudCh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuXG4gICAgaWYgKHNlbGYuYWxsVHJhY2tzQXJlTG9hZGVkKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJhbGwgdHJhY2tzIGFyZSBsb2FkZWRcIik7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX2xvYWRpbmctcHJvZ3Jlc3NcIikuaGlkZSgpO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG5cbiAgICAgICAgc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5vbihcInBsYXlcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tFcnJvckV2ZW50KGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcImVycm9yIHByb2Nlc3NpbmcgdmlkZW9cIiwgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tTZWVrRXZlbnQocHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+ICEhdHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAvLyBwcmV2ZW50IGV4Y2VzcyBzZWVrIGV2ZW50cyBmcm9tIGZpcmluZ1xuICAgIGxldCBwcm9taXNlcyA9IHRyYWNrc1dpdGhNZWRpYS5tYXAodHJhY2sgPT4ge1xuICAgICAgICB2YXIgZGVmZXIgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8udW4oXCJzZWVrXCIpO1xuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgZGVmZXIucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gICAgfSk7XG5cbiAgICAkLndoZW4ocHJvbWlzZXMpLmRvbmUoKCkgPT4ge1xuICAgICAgICBzZWxmLnBhdXNlKCk7XG5cbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5zZWVrVG8ocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5vbihcInNlZWtcIiwgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICB9KS5mYWlsKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tMb2FkaW5nRXZlbnQodHJhY2ssIHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IHByb2dyZXNzO1xuXG4gICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3Byb2dyZXNzXCIpLmNzcyh7XG4gICAgICAgIHdpZHRoOiBzZWxmLmdldExvYWRpbmdQcm9ncmVzcy5iaW5kKHNlbGYpKCkgKyBcIiVcIlxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgbGV0ICR0aW1lciA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLWR1cmF0aW9uXCIpO1xuXG4gICAgc2VsZi5sb25nZXN0VHJhY2sgPSBzZWxmLmdldExvbmdlc3RUcmFjaygpO1xuXG4gICAgLy8gbm8gdHJhY2tzIHRvIG1lZGlhIGR1cmF0aW9uIGZyb21cbiAgICBpZiAoIXNlbGYubG9uZ2VzdFRyYWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0Q3VycmVudFRpbWUoKTtcbiAgICBzZWxmLnNvbmdEdXJhdGlvbiA9IHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKTtcblxuICAgIGxldCBkdXJhdGlvbkRhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nRHVyYXRpb24pLFxuICAgICAgICBzZWVrRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdDdXJyZW50U2Vlayk7XG5cbiAgICBmdW5jdGlvbiBkYXRlVGltZVRvTWVkaWFUaW1lKGRhdGVUaW1lKSB7XG4gICAgICAgIHJldHVybiBkYXRlVGltZS5nZXRNaW51dGVzKCkgKyBcIjpcIiArIFN0cmluZyhcIjAwXCIgKyBkYXRlVGltZS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKTtcbiAgICB9XG5cbiAgICAkdGltZXIudGV4dChkYXRlVGltZVRvTWVkaWFUaW1lKHNlZWtEYXRlVGltZSkgKyBcIiAvIFwiICsgZGF0ZVRpbWVUb01lZGlhVGltZShkdXJhdGlvbkRhdGVUaW1lKSk7XG5cbiAgICBpZiAoc2VsZi5zb25nQ3VycmVudFNlZWsgPj0gc2VsZi5zb25nRHVyYXRpb24pIHtcbiAgICAgICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLnNvbmdEdXJhdGlvbjtcblxuICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2hhbmRsZVRyYWNrTXV0ZUNsaWNrKGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICR0cmFja0NvbnRyb2wgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICB0cmFja0lkID0gJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2tcIikuZGF0YShcInRyYWNrSWRcIiksXG4gICAgICAgIHRyYWNrID0gc2VsZi5nZXRUcmFja0J5SWQodHJhY2tJZCk7XG5cbiAgICBtaXhwYW5lbC50cmFjayhcIm1lZGlhLXBsYXllcjptdXRlLXRyYWNrXCIsIHRyYWNrKTtcblxuICAgIHNlbGYudG9nZ2xlVHJhY2tNdXRlKHRyYWNrKTtcblxuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tSZXF1ZXN0Q2hhbmdlKGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICR0cmFja0NvbnRyb2wgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICB0cmFja0lkID0gJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2tcIikuZGF0YShcInRyYWNrSWRcIiksXG4gICAgICAgIHRyYWNrID0gc2VsZi5nZXRUcmFja0J5SWQodHJhY2tJZCk7XG5cbiAgICAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFjay0tbm8tbWVkaWFcIikucmVtb3ZlQ2xhc3MoXCJtZWRpYS1wbGF5ZXJfX3RyYWNrLS1uby1tZWRpYVwiKTtcblxuICAgIHRyYWNrLmZpZWxkcy5hdWRpb191cmwgPSAkdHJhY2tDb250cm9sLnZhbCgpO1xuICAgIHNlbGYucmVwbGFjZVRyYWNrQnlJZCh0cmFja0lkLCB0cmFjayk7XG59IiwiZXhwb3J0IGNsYXNzIE1lc3NhZ2VzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSAkKCcubWVzc2FnZScpO1xuXG4gICAgICAgIG1lc3NhZ2VzLmVhY2goKGluZGV4LCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBuZXcgTWVzc2FnZSgkKG1lc3NhZ2UpKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBNZXNzYWdlIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCkge1xuICAgICAgICB0aGlzLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHRoaXMuJGNsb3NlSWNvbiA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmpzLW1lc3NhZ2UtY2xvc2UnKTtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uLm9uKCdjbGljaycsIF9fY2xvc2VNZXNzYWdlSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fY2xvc2VNZXNzYWdlSGFuZGxlcigpIHtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uLnBhcmVudHMoJy5tZXNzYWdlJykucmVtb3ZlKCk7XG59IiwiZXhwb3J0cy5zZWNvbmRzVG9EYXRlVGltZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgICBkLnNldFNlY29uZHMoc2Vjb25kcyk7XG4gICAgcmV0dXJuIGQ7XG59OyJdfQ==

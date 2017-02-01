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
    $('.modal').modal();

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2FwcC5qcyIsIm1lbG9keV9idWRkeS9zdGF0aWMvanMvY29tcG9uZW50cy9tZWRpYV9wbGF5ZXIuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL2NvbXBvbmVudHMvbWVzc2FnZXMuanMiLCJtZWxvZHlfYnVkZHkvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1IsOENBRFE7QUFFUjtBQUZRLEtBREo7QUFLUixXQUFPO0FBQ0g7QUFERztBQUxDLENBQVo7O0FBV0E7OztBQUdBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBTTtBQUNwQixNQUFFLGtCQUFGLEVBQXNCLFFBQXRCLENBQStCO0FBQzNCLGVBQU87QUFEb0IsS0FBL0I7QUFHQSxNQUFFLGtCQUFGLEVBQXNCLE9BQXRCO0FBQ0EsTUFBRSxTQUFGLEVBQWEsSUFBYjtBQUNBLE1BQUUsUUFBRixFQUFZLGVBQVo7QUFDQSxNQUFFLFdBQUYsRUFBZSxRQUFmO0FBQ0EsTUFBRSxZQUFGLEVBQWdCLFNBQWhCO0FBQ0EsTUFBRSxRQUFGLEVBQVksS0FBWjs7QUFFQSxRQUFJLE9BQU8sRUFBUCxDQUFVLFVBQVYsQ0FBcUIsUUFBekI7QUFDSCxDQVpEOzs7Ozs7Ozs7Ozs7O0lDbEJhLFcsV0FBQSxXO0FBQ1QseUJBQVksUUFBWixFQUFzQixNQUF0QixFQUE4QixhQUE5QixFQUE2QztBQUFBOztBQUN6QyxZQUFNLE9BQU8sSUFBYjs7QUFFQSxnQkFBUSxHQUFSLENBQVksbUJBQVosRUFBaUMsUUFBakM7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsYUFBSyxNQUFMLEdBQWMsVUFBVSxFQUF4QjtBQUNB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LE9BQWI7QUFDQSxXQUFPLENBQVA7QUFDSCxDQUpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7TWVkaWFQbGF5ZXJ9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVkaWFfcGxheWVyXCI7XG5pbXBvcnQge01lc3NhZ2VzfSBmcm9tIFwiLi9jb21wb25lbnRzL21lc3NhZ2VzXCI7XG5pbXBvcnQge3NlY29uZHNUb0RhdGVUaW1lfSBmcm9tIFwiLi91dGlscy9zZWNvbmRzX3RvX2RhdGVfdGltZVwiO1xuXG53aW5kb3cuYm0gPSB7XG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBNZWRpYVBsYXllcjogTWVkaWFQbGF5ZXIsXG4gICAgICAgIE1lc3NhZ2VzOiBNZXNzYWdlc1xuICAgIH0sXG4gICAgdXRpbHM6IHtcbiAgICAgICAgc2Vjb25kc1RvRGF0ZVRpbWU6IHNlY29uZHNUb0RhdGVUaW1lXG4gICAgfVxufTtcblxuXG4vKlxuICogSW5pdGlhbGl6ZSBhcHBsaWNhdGlvbiB3aWRnZXRzXG4gKi9cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICAkKFwiLmRyb3Bkb3duLWJ1dHRvblwiKS5kcm9wZG93bih7XG4gICAgICAgIGhvdmVyOiBmYWxzZVxuICAgIH0pO1xuICAgICQoXCIuYnV0dG9uLWNvbGxhcHNlXCIpLnNpZGVOYXYoKTtcbiAgICAkKCd1bC50YWJzJykudGFicygpO1xuICAgICQoJ3NlbGVjdCcpLm1hdGVyaWFsX3NlbGVjdCgpO1xuICAgICQoJy5wYXJhbGxheCcpLnBhcmFsbGF4KCk7XG4gICAgJCgnLnNjcm9sbHNweScpLnNjcm9sbFNweSgpO1xuICAgICQoJy5tb2RhbCcpLm1vZGFsKCk7XG5cbiAgICBuZXcgd2luZG93LmJtLmNvbXBvbmVudHMuTWVzc2FnZXMoKTtcbn0pOyIsImV4cG9ydCBjbGFzcyBNZWRpYVBsYXllciB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrcywgdHJhY2tSZXF1ZXN0cykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLmxvZyhcIm1lZGlhIHBsYXllciBpbml0XCIsICRlbGVtZW50KTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHNlbGYudHJhY2tzID0gdHJhY2tzIHx8IFtdO1xuICAgICAgICBzZWxmLnRyYWNrUmVxdWVzdHMgPSB0cmFja1JlcXVlc3RzIHx8IFtdO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwidHJhY2tzXCIsIHNlbGYudHJhY2tzKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0cmFjayByZXF1ZXN0c1wiLCBzZWxmLnRyYWNrUmVxdWVzdHMpO1xuXG5cbiAgICAgICAgc2VsZi5sb2FkVHJhY2tzKCk7XG5cbiAgICAgICAgY29uc3QgJGNvbnRyb2xzID0ge1xuICAgICAgICAgICAgJyRyZXN0YXJ0Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1yZXN0YXJ0JyksXG4gICAgICAgICAgICAnJHBhdXNlJzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wYXVzZScpLFxuICAgICAgICAgICAgJyRwbGF5Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wbGF5JylcbiAgICAgICAgfTtcblxuICAgICAgICAkY29udHJvbHMuJHBsYXkub24oXCJjbGlja1wiLCBzZWxmLnBsYXkuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcGF1c2Uub24oXCJjbGlja1wiLCBzZWxmLnBhdXNlLmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHJlc3RhcnQub24oXCJjbGlja1wiLCBzZWxmLnJlc3RhcnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stY29udHJvbC0tbXV0ZVwiKS5vbihcImNsaWNrXCIsIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2suYmluZChzZWxmKSk7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNoYW5nZXJcIikub24oXCJjaGFuZ2VcIiwgX19oYW5kbGVUcmFja1JlcXVlc3RDaGFuZ2UuYmluZChzZWxmKSk7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNoYW5nZXJcIikuY2hhbmdlKCk7XG4gICAgfVxuXG4gICAgbG9hZFRyYWNrcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCA9IHt9O1xuXG4gICAgICAgIF9fbG9hZFRyYWNrUmVxdWVzdHMuYmluZChzZWxmKSgpO1xuICAgICAgICBzZWxmLnRyYWNrcyA9IHNlbGYudHJhY2tzLm1hcChfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICByZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIG5ld1RyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5wayA9PT0gdHJhY2tJZCkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5lbXB0eSgpOyAvLyB3aXBlIHdhdmVzdXJmZXIgZGF0YSBhbmQgZXZlbnRzXG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3dhdmVmb3JtLVwiICsgdHJhY2tJZCkuZmluZChcIndhdmVcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdHJhY2sgPSBfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKG5ld1RyYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXN0YXJ0KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBtaXhwYW5lbC50cmFjayhcIm1lZGlhLXBsYXllcjpyZXN0YXJ0XCIpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbWl4cGFuZWwudHJhY2soXCJtZWRpYS1wbGF5ZXI6cGxheVwiKTtcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmICF0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIG1peHBhbmVsLnRyYWNrKFwibWVkaWEtcGxheWVyOnBhdXNlXCIpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBnZXRMb2FkaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB0b3RhbFByb2dyZXNzID0gMCxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwKTtcblxuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgKz0gc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b3RhbFByb2dyZXNzID0gdG90YWxQcm9ncmVzcyAvIGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFByb2dyZXNzO1xuICAgIH1cblxuICAgIGdldExvbmdlc3RUcmFjaygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICBsZXQgbG9uZ2VzdFRyYWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IGxvbmdlc3RUcmFjayB8fCB0cmFjaztcbiAgICAgICAgICAgIGxldCB0cmFja0R1cmF0aW9uID0gdHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAodHJhY2tEdXJhdGlvbiA+IGxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBsb25nZXN0VHJhY2sgPSB0cmFjaztcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbG9uZ2VzdFRyYWNrO1xuICAgIH1cblxuICAgIGFsbFRyYWNrc0FyZUxvYWRlZCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmV2ZXJ5KHRyYWNrID0+ICEhdHJhY2suX19sb2FkZWQpO1xuICAgIH1cblxuICAgIGdldFRyYWNrQnlJZCh0cmFja0lkKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gdHJhY2sucGsgPT09IHRyYWNrSWQpWzBdO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWNrTXV0ZSh0cmFjaykge1xuICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8udG9nZ2xlTXV0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jcmVhdGVBdWRpb1dhdmUodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGlmICh0cmFjay5maWVsZHMuYXVkaW9fdXJsKSB7XG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gMDtcbiAgICAgICAgdmFyIGN0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciBsaW5HcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDY0LCAwLCAyMDApO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDIyNSwgMjI1LCAyMjUsIDEuMDAwKScpO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDE4MywgMTgzLCAxODMsIDEuMDAwKScpO1xuXG4gICAgICAgIHZhciB3YXZlc3VyZmVyID0gV2F2ZVN1cmZlci5jcmVhdGUoe1xuICAgICAgICAgICAgY29udGFpbmVyOiAnI3dhdmVmb3JtLScgKyB0cmFjay5wayxcbiAgICAgICAgICAgIHdhdmVDb2xvcjogbGluR3JhZCxcbiAgICAgICAgICAgIHByb2dyZXNzQ29sb3I6ICdoc2xhKDIwMCwgMTAwJSwgMzAlLCAwLjUpJyxcbiAgICAgICAgICAgIGN1cnNvckNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICBoZWlnaHQ6IDYwLFxuICAgICAgICAgICAgYmFyV2lkdGg6IDNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICBfX29uVHJhY2tSZWFkeUV2ZW50LmJpbmQoc2VsZikodHJhY2spO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbihcImVycm9yXCIsIF9fb25UcmFja0Vycm9yRXZlbnQpO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdsb2FkaW5nJywgcHJvZ3Jlc3MgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF9fb25UcmFja0xvYWRpbmdFdmVudC5iaW5kKHNlbGYpKHRyYWNrLCBwcm9ncmVzcyk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdzZWVrJywgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHdhdmVzdXJmZXIubG9hZCh0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICB0cmFjay5fX2F1ZGlvID0gd2F2ZXN1cmZlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYWNrO1xufVxuLy8gLy9cbi8vIC8vICAgICBmdW5jdGlvbiB0b2dnbGVTb2xvRm9yVHJhY2sodHJhY2ssICRldmVudCkge1xuLy8gLy8gICAgICAgICB0cmFjay5pc1NvbG8gPSAhdHJhY2suaXNTb2xvO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyICRjb250cm9sID0gJCgkZXZlbnQudGFyZ2V0KTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suaXNTb2xvKTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5pc1NvbG8pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyIHRyYWNrc0FyZVNvbG9lZCA9IHNlbGYudHJhY2tzLnNvbWUoZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHJldHVybiB0LmlzU29sbztcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICBpZiAoIXRyYWNrc0FyZVNvbG9lZCkge1xuLy8gLy8gICAgICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKGZhbHNlKTtcbi8vIC8vICAgICAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgICAgIHJldHVybjtcbi8vIC8vICAgICAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoIXQuaXNTb2xvKTtcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvLyAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAvLyBQUklWQVRFIEFQSVxuLy8gLy9cbi8vIC8vXG5cbmZ1bmN0aW9uIF9fbG9hZFRyYWNrUmVxdWVzdHMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrUmVxdWVzdHMuZm9yRWFjaCh0cmFja1JlcXVlc3QgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaGluZ1RyYWNrID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cmFjay5wayA9PT0gdHJhY2tSZXF1ZXN0LmZpZWxkcy50cmFja1xuICAgICAgICB9KVswXTtcblxuICAgICAgICBpZiAobWF0Y2hpbmdUcmFjaykge1xuICAgICAgICAgICAgbWF0Y2hpbmdUcmFjay5maWVsZHMuYXVkaW9fdXJsID0gdHJhY2tSZXF1ZXN0LmZpZWxkcy5hdWRpb191cmw7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrUmVhZHlFdmVudCh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuXG4gICAgaWYgKHNlbGYuYWxsVHJhY2tzQXJlTG9hZGVkKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJhbGwgdHJhY2tzIGFyZSBsb2FkZWRcIik7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX2xvYWRpbmctcHJvZ3Jlc3NcIikuaGlkZSgpO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG5cbiAgICAgICAgc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5vbihcInBsYXlcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tFcnJvckV2ZW50KGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcImVycm9yIHByb2Nlc3NpbmcgdmlkZW9cIiwgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tTZWVrRXZlbnQocHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+ICEhdHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAvLyBwcmV2ZW50IGV4Y2VzcyBzZWVrIGV2ZW50cyBmcm9tIGZpcmluZ1xuICAgIGxldCBwcm9taXNlcyA9IHRyYWNrc1dpdGhNZWRpYS5tYXAodHJhY2sgPT4ge1xuICAgICAgICB2YXIgZGVmZXIgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8udW4oXCJzZWVrXCIpO1xuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgZGVmZXIucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gICAgfSk7XG5cbiAgICAkLndoZW4ocHJvbWlzZXMpLmRvbmUoKCkgPT4ge1xuICAgICAgICBzZWxmLnBhdXNlKCk7XG5cbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5zZWVrVG8ocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5vbihcInNlZWtcIiwgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICB9KS5mYWlsKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tMb2FkaW5nRXZlbnQodHJhY2ssIHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IHByb2dyZXNzO1xuXG4gICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3Byb2dyZXNzXCIpLmNzcyh7XG4gICAgICAgIHdpZHRoOiBzZWxmLmdldExvYWRpbmdQcm9ncmVzcy5iaW5kKHNlbGYpKCkgKyBcIiVcIlxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgbGV0ICR0aW1lciA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLWR1cmF0aW9uXCIpO1xuXG4gICAgc2VsZi5sb25nZXN0VHJhY2sgPSBzZWxmLmdldExvbmdlc3RUcmFjaygpO1xuXG4gICAgLy8gbm8gdHJhY2tzIHRvIG1lZGlhIGR1cmF0aW9uIGZyb21cbiAgICBpZiAoIXNlbGYubG9uZ2VzdFRyYWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0Q3VycmVudFRpbWUoKTtcbiAgICBzZWxmLnNvbmdEdXJhdGlvbiA9IHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKTtcblxuICAgIGxldCBkdXJhdGlvbkRhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nRHVyYXRpb24pLFxuICAgICAgICBzZWVrRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdDdXJyZW50U2Vlayk7XG5cbiAgICBmdW5jdGlvbiBkYXRlVGltZVRvTWVkaWFUaW1lKGRhdGVUaW1lKSB7XG4gICAgICAgIHJldHVybiBkYXRlVGltZS5nZXRNaW51dGVzKCkgKyBcIjpcIiArIFN0cmluZyhcIjAwXCIgKyBkYXRlVGltZS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKTtcbiAgICB9XG5cbiAgICAkdGltZXIudGV4dChkYXRlVGltZVRvTWVkaWFUaW1lKHNlZWtEYXRlVGltZSkgKyBcIiAvIFwiICsgZGF0ZVRpbWVUb01lZGlhVGltZShkdXJhdGlvbkRhdGVUaW1lKSk7XG5cbiAgICBpZiAoc2VsZi5zb25nQ3VycmVudFNlZWsgPj0gc2VsZi5zb25nRHVyYXRpb24pIHtcbiAgICAgICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLnNvbmdEdXJhdGlvbjtcblxuICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2hhbmRsZVRyYWNrTXV0ZUNsaWNrKGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICR0cmFja0NvbnRyb2wgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICB0cmFja0lkID0gJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2tcIikuZGF0YShcInRyYWNrSWRcIiksXG4gICAgICAgIHRyYWNrID0gc2VsZi5nZXRUcmFja0J5SWQodHJhY2tJZCk7XG5cbiAgICBtaXhwYW5lbC50cmFjayhcIm1lZGlhLXBsYXllcjptdXRlLXRyYWNrXCIsIHRyYWNrKTtcblxuICAgIHNlbGYudG9nZ2xlVHJhY2tNdXRlKHRyYWNrKTtcblxuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tSZXF1ZXN0Q2hhbmdlKGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICR0cmFja0NvbnRyb2wgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICB0cmFja0lkID0gJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2tcIikuZGF0YShcInRyYWNrSWRcIiksXG4gICAgICAgIHRyYWNrID0gc2VsZi5nZXRUcmFja0J5SWQodHJhY2tJZCk7XG5cbiAgICAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFjay0tbm8tbWVkaWFcIikucmVtb3ZlQ2xhc3MoXCJtZWRpYS1wbGF5ZXJfX3RyYWNrLS1uby1tZWRpYVwiKTtcblxuICAgIHRyYWNrLmZpZWxkcy5hdWRpb191cmwgPSAkdHJhY2tDb250cm9sLnZhbCgpO1xuICAgIHNlbGYucmVwbGFjZVRyYWNrQnlJZCh0cmFja0lkLCB0cmFjayk7XG59IiwiZXhwb3J0IGNsYXNzIE1lc3NhZ2VzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSAkKCcubWVzc2FnZScpO1xuXG4gICAgICAgIG1lc3NhZ2VzLmVhY2goKGluZGV4LCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBuZXcgTWVzc2FnZSgkKG1lc3NhZ2UpKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBNZXNzYWdlIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCkge1xuICAgICAgICB0aGlzLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHRoaXMuJGNsb3NlSWNvbiA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmpzLW1lc3NhZ2UtY2xvc2UnKTtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uLm9uKCdjbGljaycsIF9fY2xvc2VNZXNzYWdlSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fY2xvc2VNZXNzYWdlSGFuZGxlcigpIHtcbiAgICAgICAgdGhpcy4kY2xvc2VJY29uLnBhcmVudHMoJy5tZXNzYWdlJykucmVtb3ZlKCk7XG59IiwiZXhwb3J0cy5zZWNvbmRzVG9EYXRlVGltZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgICBkLnNldFNlY29uZHMoc2Vjb25kcyk7XG4gICAgcmV0dXJuIGQ7XG59OyJdfQ==

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
    function MediaPlayer($element, tracks, trackRequests) {
        _classCallCheck(this, MediaPlayer);

        var self = this;

        self.$element = $element;
        self.trackRequests = trackRequests;

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
        self.$element.find(".media-player__track-changer").on("change", __handleTrackRequestChange.bind(self));
        self.$element.find(".media-player__track-changer").change();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFFQSxPQUFPLEVBQVAsR0FBWTtBQUNSLGdCQUFZO0FBQ1I7QUFEUSxLQURKO0FBSVIsV0FBTztBQUNIO0FBREc7QUFKQyxDQUFaOztBQVVBOzs7QUFHQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQU0sQ0FDdkIsQ0FERDs7Ozs7Ozs7Ozs7OztJQ2hCYSxXLFdBQUEsVztBQUNULHlCQUFZLFFBQVosRUFBc0IsTUFBdEIsRUFBOEIsYUFBOUIsRUFBNkM7QUFBQTs7QUFDekMsWUFBTSxPQUFPLElBQWI7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsYUFBSyxhQUFMLEdBQXFCLGFBQXJCOztBQUVBLGFBQUssVUFBTCxDQUFnQixNQUFoQjs7QUFFQSxZQUFNLFlBQVk7QUFDZCx3QkFBWSxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLGlDQUFuQixDQURFO0FBRWQsc0JBQVUsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQiwrQkFBbkIsQ0FGSTtBQUdkLHFCQUFTLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsOEJBQW5CO0FBSEssU0FBbEI7O0FBTUEsa0JBQVUsS0FBVixDQUFnQixFQUFoQixDQUFtQixPQUFuQixFQUE0QixLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUE1QjtBQUNBLGtCQUFVLE1BQVYsQ0FBaUIsRUFBakIsQ0FBb0IsT0FBcEIsRUFBNkIsS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFoQixDQUE3QjtBQUNBLGtCQUFV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RUFBOEMsSUFBOUMsQ0FBbUQsU0FBbkQsQ0FGZDtBQUFBLFFBR0ksUUFBUSxLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsQ0FIWjs7QUFLQSxrQkFBYyxPQUFkLENBQXNCLGdDQUF0QixFQUF3RCxXQUF4RCxDQUFvRSwrQkFBcEU7O0FBRUEsVUFBTSxNQUFOLENBQWEsU0FBYixHQUF5QixjQUFjLEdBQWQsRUFBekI7QUFDQSxTQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLEtBQS9CO0FBQ0g7Ozs7O0FDaFVELFFBQVEsaUJBQVIsR0FBNEIsVUFBVSxPQUFWLEVBQW1CO0FBQzNDLFFBQUksSUFBSSxJQUFJLElBQUosQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsQ0FBUjtBQUNBLE1BQUUsVUFBRixDQUFhLE9BQWI7QUFDQSxXQUFPLENBQVA7QUFDSCxDQUpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7TWVkaWFQbGF5ZXJ9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVkaWFfcGxheWVyXCI7XG5pbXBvcnQge3NlY29uZHNUb0RhdGVUaW1lfSBmcm9tIFwiLi91dGlscy9zZWNvbmRzX3RvX2RhdGVfdGltZVwiO1xuXG53aW5kb3cuYm0gPSB7XG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBNZWRpYVBsYXllcjogTWVkaWFQbGF5ZXJcbiAgICB9LFxuICAgIHV0aWxzOiB7XG4gICAgICAgIHNlY29uZHNUb0RhdGVUaW1lOiBzZWNvbmRzVG9EYXRlVGltZVxuICAgIH1cbn07XG5cblxuLypcbiAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gd2lkZ2V0c1xuICovXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG59KTsiLCJleHBvcnQgY2xhc3MgTWVkaWFQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50LCB0cmFja3MsIHRyYWNrUmVxdWVzdHMpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudCA9ICRlbGVtZW50O1xuICAgICAgICBzZWxmLnRyYWNrUmVxdWVzdHMgPSB0cmFja1JlcXVlc3RzO1xuXG4gICAgICAgIHNlbGYubG9hZFRyYWNrcyh0cmFja3MpO1xuXG4gICAgICAgIGNvbnN0ICRjb250cm9scyA9IHtcbiAgICAgICAgICAgICckcmVzdGFydCc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcmVzdGFydCcpLFxuICAgICAgICAgICAgJyRwYXVzZSc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcGF1c2UnKSxcbiAgICAgICAgICAgICckcGxheSc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcGxheScpXG4gICAgICAgIH07XG5cbiAgICAgICAgJGNvbnRyb2xzLiRwbGF5Lm9uKFwiY2xpY2tcIiwgc2VsZi5wbGF5LmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHBhdXNlLm9uKFwiY2xpY2tcIiwgc2VsZi5wYXVzZS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRyZXN0YXJ0Lm9uKFwiY2xpY2tcIiwgc2VsZi5yZXN0YXJ0LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLWNvbnRyb2wtLW11dGVcIikub24oXCJjbGlja1wiLCBfX2hhbmRsZVRyYWNrTXV0ZUNsaWNrLmJpbmQoc2VsZikpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jaGFuZ2VyXCIpLm9uKFwiY2hhbmdlXCIsIF9faGFuZGxlVHJhY2tSZXF1ZXN0Q2hhbmdlLmJpbmQoc2VsZikpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay1jaGFuZ2VyXCIpLmNoYW5nZSgpO1xuICAgIH1cblxuICAgIGxvYWRUcmFja3ModHJhY2tzKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXAgPSB7fTtcblxuICAgICAgICBzZWxmLnRyYWNrcyA9IHRyYWNrcy5tYXAoX19jcmVhdGVBdWRpb1dhdmUuYmluZChzZWxmKSk7XG4gICAgfVxuXG4gICAgcmVwbGFjZVRyYWNrQnlJZCh0cmFja0lkLCBuZXdUcmFjaykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcyA9IHNlbGYudHJhY2tzLm1hcCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2sucGsgPT09IHRyYWNrSWQpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8uZW1wdHkoKTsgLy8gd2lwZSB3YXZlc3VyZmVyIGRhdGEgYW5kIGV2ZW50c1xuICAgICAgICAgICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiN3YXZlZm9ybS1cIiArIHRyYWNrSWQpLmZpbmQoXCJ3YXZlXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRyYWNrID0gX19jcmVhdGVBdWRpb1dhdmUuYmluZChzZWxmKShuZXdUcmFjayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmFjaztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzdGFydCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8ucGxheSgwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmICF0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBnZXRMb2FkaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB0b3RhbFByb2dyZXNzID0gMCxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwKTtcblxuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgKz0gc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b3RhbFByb2dyZXNzID0gdG90YWxQcm9ncmVzcyAvIGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFByb2dyZXNzO1xuICAgIH1cblxuICAgIGdldExvbmdlc3RUcmFjaygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICBsZXQgbG9uZ2VzdFRyYWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IGxvbmdlc3RUcmFjayB8fCB0cmFjaztcbiAgICAgICAgICAgIGxldCB0cmFja0R1cmF0aW9uID0gdHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAodHJhY2tEdXJhdGlvbiA+IGxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBsb25nZXN0VHJhY2sgPSB0cmFjaztcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbG9uZ2VzdFRyYWNrO1xuICAgIH1cblxuICAgIGFsbFRyYWNrc0FyZUxvYWRlZCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmV2ZXJ5KHRyYWNrID0+ICEhdHJhY2suX19sb2FkZWQpO1xuICAgIH1cblxuICAgIGdldFRyYWNrQnlJZCh0cmFja0lkKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gdHJhY2sucGsgPT09IHRyYWNrSWQpWzBdO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWNrTXV0ZSh0cmFjaykge1xuICAgICAgICB0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8udG9nZ2xlTXV0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jcmVhdGVBdWRpb1dhdmUodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGlmICh0cmFjay5maWVsZHMuYXVkaW9fdXJsKSB7XG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gMDtcbiAgICAgICAgdmFyIGN0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciBsaW5HcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDY0LCAwLCAyMDApO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDIyNSwgMjI1LCAyMjUsIDEuMDAwKScpO1xuICAgICAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDE4MywgMTgzLCAxODMsIDEuMDAwKScpO1xuXG4gICAgICAgIHZhciB3YXZlc3VyZmVyID0gV2F2ZVN1cmZlci5jcmVhdGUoe1xuICAgICAgICAgICAgY29udGFpbmVyOiAnI3dhdmVmb3JtLScgKyB0cmFjay5wayxcbiAgICAgICAgICAgIHdhdmVDb2xvcjogbGluR3JhZCxcbiAgICAgICAgICAgIHByb2dyZXNzQ29sb3I6ICdoc2xhKDIwMCwgMTAwJSwgMzAlLCAwLjUpJyxcbiAgICAgICAgICAgIGN1cnNvckNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICBoZWlnaHQ6IDQ1LFxuICAgICAgICAgICAgYmFyV2lkdGg6IDNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICBfX29uVHJhY2tSZWFkeUV2ZW50LmJpbmQoc2VsZikodHJhY2spO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbihcImVycm9yXCIsIF9fb25UcmFja0Vycm9yRXZlbnQpO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdsb2FkaW5nJywgcHJvZ3Jlc3MgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF9fb25UcmFja0xvYWRpbmdFdmVudC5iaW5kKHNlbGYpKHRyYWNrLCBwcm9ncmVzcyk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKCdzZWVrJywgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHdhdmVzdXJmZXIubG9hZCh0cmFjay5maWVsZHMuYXVkaW9fdXJsKTtcblxuICAgICAgICB0cmFjay5fX2F1ZGlvID0gd2F2ZXN1cmZlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYWNrO1xufVxuLy8gLy9cbi8vIC8vICAgICBmdW5jdGlvbiB0b2dnbGVTb2xvRm9yVHJhY2sodHJhY2ssICRldmVudCkge1xuLy8gLy8gICAgICAgICB0cmFjay5pc1NvbG8gPSAhdHJhY2suaXNTb2xvO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyICRjb250cm9sID0gJCgkZXZlbnQudGFyZ2V0KTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suaXNTb2xvKTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5pc1NvbG8pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyIHRyYWNrc0FyZVNvbG9lZCA9IHNlbGYudHJhY2tzLnNvbWUoZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHJldHVybiB0LmlzU29sbztcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICBpZiAoIXRyYWNrc0FyZVNvbG9lZCkge1xuLy8gLy8gICAgICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKGZhbHNlKTtcbi8vIC8vICAgICAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgICAgIHJldHVybjtcbi8vIC8vICAgICAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoIXQuaXNTb2xvKTtcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvLyAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAvLyBQUklWQVRFIEFQSVxuLy8gLy9cbi8vIC8vXG5cbmZ1bmN0aW9uIF9fb25UcmFja1JlYWR5RXZlbnQodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcblxuICAgIGlmIChzZWxmLmFsbFRyYWNrc0FyZUxvYWRlZCgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiYWxsIHRyYWNrcyBhcmUgbG9hZGVkXCIpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG5cbiAgICAgICAgc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5vbihcInBsYXlcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tFcnJvckV2ZW50KGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcImVycm9yIHByb2Nlc3NpbmcgdmlkZW9cIiwgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tTZWVrRXZlbnQocHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+ICEhdHJhY2suZmllbGRzLmF1ZGlvX3VybCk7XG5cbiAgICAvLyBwcmV2ZW50IGV4Y2VzcyBzZWVrIGV2ZW50cyBmcm9tIGZpcmluZ1xuICAgIGxldCBwcm9taXNlcyA9IHRyYWNrc1dpdGhNZWRpYS5tYXAodHJhY2sgPT4ge1xuICAgICAgICB2YXIgZGVmZXIgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8udW4oXCJzZWVrXCIpO1xuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgZGVmZXIucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gICAgfSk7XG5cbiAgICAkLndoZW4ocHJvbWlzZXMpLmRvbmUoKCkgPT4ge1xuICAgICAgICBzZWxmLnBhdXNlKCk7XG5cbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5zZWVrVG8ocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5vbihcInNlZWtcIiwgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICB9KS5mYWlsKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tMb2FkaW5nRXZlbnQodHJhY2ssIHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IHByb2dyZXNzO1xuXG4gICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3Byb2dyZXNzXCIpLmNzcyh7XG4gICAgICAgIHdpZHRoOiBzZWxmLmdldExvYWRpbmdQcm9ncmVzcy5iaW5kKHNlbGYpKCkgKyBcIiVcIlxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgbGV0ICR0aW1lciA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLWR1cmF0aW9uXCIpO1xuXG4gICAgc2VsZi5sb25nZXN0VHJhY2sgPSBzZWxmLmdldExvbmdlc3RUcmFjaygpO1xuXG4gICAgLy8gbm8gdHJhY2tzIHRvIG1lZGlhIGR1cmF0aW9uIGZyb21cbiAgICBpZiAoIXNlbGYubG9uZ2VzdFRyYWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0Q3VycmVudFRpbWUoKTtcbiAgICBzZWxmLnNvbmdEdXJhdGlvbiA9IHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKTtcblxuICAgIGxldCBkdXJhdGlvbkRhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nRHVyYXRpb24pLFxuICAgICAgICBzZWVrRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdDdXJyZW50U2Vlayk7XG5cbiAgICBmdW5jdGlvbiBkYXRlVGltZVRvTWVkaWFUaW1lKGRhdGVUaW1lKSB7XG4gICAgICAgIHJldHVybiBkYXRlVGltZS5nZXRNaW51dGVzKCkgKyBcIjpcIiArIFN0cmluZyhcIjAwXCIgKyBkYXRlVGltZS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKTtcbiAgICB9XG5cbiAgICAkdGltZXIudGV4dChkYXRlVGltZVRvTWVkaWFUaW1lKHNlZWtEYXRlVGltZSkgKyBcIiAvIFwiICsgZGF0ZVRpbWVUb01lZGlhVGltZShkdXJhdGlvbkRhdGVUaW1lKSk7XG5cbiAgICBpZiAoc2VsZi5zb25nQ3VycmVudFNlZWsgPj0gc2VsZi5zb25nRHVyYXRpb24pIHtcbiAgICAgICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLnNvbmdEdXJhdGlvbjtcblxuICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2hhbmRsZVRyYWNrTXV0ZUNsaWNrKGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgICR0cmFja0NvbnRyb2wgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICB0cmFja0lkID0gJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2tcIikuZGF0YShcInRyYWNrSWRcIiksXG4gICAgICAgIHRyYWNrID0gc2VsZi5nZXRUcmFja0J5SWQodHJhY2tJZCk7XG5cbiAgICBzZWxmLnRvZ2dsZVRyYWNrTXV0ZSh0cmFjayk7XG5cbiAgICAkdHJhY2tDb250cm9sLmZpbmQoXCJidXR0b25cIikudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suX19hdWRpby5pc011dGVkKTtcbiAgICAkdHJhY2tDb250cm9sLmZpbmQoXCJidXR0b25cIikudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xufVxuXG5mdW5jdGlvbiBfX2hhbmRsZVRyYWNrUmVxdWVzdENoYW5nZShldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgJHRyYWNrQ29udHJvbC5wYXJlbnRzKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stLW5vLW1lZGlhXCIpLnJlbW92ZUNsYXNzKFwibWVkaWEtcGxheWVyX190cmFjay0tbm8tbWVkaWFcIik7XG5cbiAgICB0cmFjay5maWVsZHMuYXVkaW9fdXJsID0gJHRyYWNrQ29udHJvbC52YWwoKTtcbiAgICBzZWxmLnJlcGxhY2VUcmFja0J5SWQodHJhY2tJZCwgdHJhY2spO1xufSIsImV4cG9ydHMuc2Vjb25kc1RvRGF0ZVRpbWUgPSBmdW5jdGlvbiAoc2Vjb25kcykge1xuICAgIHZhciBkID0gbmV3IERhdGUoMCwgMCwgMCwgMCwgMCwgMCwgMCk7XG4gICAgZC5zZXRTZWNvbmRzKHNlY29uZHMpO1xuICAgIHJldHVybiBkO1xufTsiXX0=

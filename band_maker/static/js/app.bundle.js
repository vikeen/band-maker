(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _media_player = require("./components/media_player");

var _track_upload = require("./components/track_upload");

var _seconds_to_date_time = require("./utils/seconds_to_date_time");

window.bm = {
    components: {
        MediaPlayer: _media_player.MediaPlayer,
        TrackUpload: _track_upload.TrackUpload
    },
    utils: {
        secondsToDateTime: _seconds_to_date_time.secondsToDateTime
    }
};

/*
 * Initialize application widgets
 */
$(document).ready(function () {
    __initializeTrackUpload();
});

function __initializeTrackUpload() {
    $("[data-bm-widget='track-upload']").each(function () {
        var $element = $(this);
        var track = $element.data("bmWidgetTrackUploadTrack");
        track = track ? track[0] : undefined;

        new bm.components.TrackUpload($element, track);
    });
}

},{"./components/media_player":2,"./components/track_upload":3,"./utils/seconds_to_date_time":4}],2:[function(require,module,exports){
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

        self.$element.find(".media-player__track-title-control--mute").on("click", __handleTrackMuteClick.bind(self));
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
                return !!track.fields.media_url;
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

    if (track.fields.media_url) {
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

        wavesurfer.load(track.fields.media_url);

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
        return !!track.fields.media_url;
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

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TrackUpload = exports.TrackUpload = function TrackUpload($element, track) {
    _classCallCheck(this, TrackUpload);

    var self = this;

    self.$element = $element;
    self.$formSubmitBtn = self.$element.parents("form").find("button[type='submit']");
    self.$mediaUrlInput = self.$element.find(".js-track-upload__media-url");
    self.$mediaFileName = self.$element.find(".js-track-upload__media-file-name");
    self.track = track;

    $element.find("input[type='file']").on("change", function () {
        var $element = $(this);

        self.$formSubmitBtn.prop('disabled', true);

        try {
            var file = $element.get(0).files[0];

            if (!file) {
                return console.error("No file selected.");
            }

            __getSignedRequest.bind(self)(file);
        } catch (error) {
            console.error(error);
            self.$formSubmitBtn.prop('disabled', false);
        }
    });
};

function __getSignedRequest(file) {
    var self = this;

    $.ajax({
        url: "/tracks/upload",
        type: "get",
        data: {
            "file_name": file.name,
            "file_type": file.type
        },
        success: function success(response) {
            try {
                __uploadFile.bind(self)(file, response.data, response.url);
            } catch (error) {
                console.error("Failed to parse song upload signed request", error);
            }
        },
        error: function error(xhr) {
            console.error("Could not get signed URL.", xhr);
        }
    });
}

function __uploadFile(file, s3Data, url) {
    var self = this,
        xhr = new XMLHttpRequest();

    var postData = new FormData();

    xhr.open("POST", s3Data.url);

    for (var key in s3Data.fields) {
        postData.append(key, s3Data.fields[key]);
    }
    postData.append('file', file);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 204) {
                __uploadFileSuccess.bind(self)(file, url);
            } else {
                console.error("Could not upload file.");
            }
        }
    };
    xhr.send(postData);
}

function __uploadFileSuccess(file, url) {
    var self = this;

    console.log("file upload success", file, url);

    self.$mediaUrlInput.val(url);
    self.$mediaFileName.val(file.name);
    self.$formSubmitBtn.prop('disabled', false);

    // reinitialize any associated media players
    if (window.bm.mediaPlayer) {
        self.track.fields.media_name = file.name;
        self.track.fields.media_url = url;

        window.bm.mediaPlayer.replaceTrackById(self.track.pk, self.track);
    }
}

},{}],4:[function(require,module,exports){
"use strict";

exports.secondsToDateTime = function (seconds) {
    var d = new Date(0, 0, 0, 0, 0, 0, 0);
    d.setSeconds(seconds);
    return d;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL2NvbXBvbmVudHMvdHJhY2tfdXBsb2FkLmpzIiwiYmFuZF9tYWtlci9zdGF0aWMvanMvdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUVBLE9BQU8sRUFBUCxHQUFZO0FBQ1IsZ0JBQVk7QUFDUiw4Q0FEUTtBQUVSO0FBRlEsS0FESjtBQUtSLFdBQU87QUFDSDtBQURHO0FBTEMsQ0FBWjs7QUFXQTs7O0FBR0EsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFNO0FBQ3BCO0FBQ0gsQ0FGRDs7QUFJQSxTQUFTLHVCQUFULEdBQW1DO0FBQy9CLE1BQUUsaUNBQUYsRUFBcUMsSUFBckMsQ0FBMEMsWUFBWTtBQUNsRCxZQUFNLFdBQVcsRUFBRSxJQUFGLENBQWpCO0FBQ0EsWUFBSSxRQUFRLFNBQVMsSUFBVCxDQUFjLDBCQUFkLENBQVo7QUFDQSxnQkFBUSxRQUFRLE1BQU0sQ0FBTixDQUFSLEdBQW1CLFNBQTNCOztBQUVBLFlBQUksR0FBRyxVQUFILENBQWMsV0FBbEIsQ0FBOEIsUUFBOUIsRUFBd0MsS0FBeEM7QUFDSCxLQU5EO0FBT0g7Ozs7Ozs7Ozs7Ozs7SUM5QlksVyxXQUFBLFc7QUFDVCx5QkFBWSxRQUFaLEVBQXNCLE1BQXRCLEVBQThCO0FBQUE7O0FBQzFCLFlBQU0sT0FBTyxJQUFiOztBQUVBLGFBQUssUUFBTCxHQUFnQixRQUFoQjs7QUFFQSxhQUFLLFVBQUwsQ0FBZ0IsTUFBaEI7O0FBRUEsWUFBTSxZQUFZO0FBQ2Qsd0JBQVksS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixpQ0FBbkIsQ0FE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RCx3QkFBUSxLQUFSLENBQWMsd0JBQWQ7QUFDSDtBQUNKO0FBQ0osS0FURDtBQVVBLFFBQUksSUFBSixDQUFTLFFBQVQ7QUFDSDs7QUFFRCxTQUFTLG1CQUFULENBQTZCLElBQTdCLEVBQW1DLEdBQW5DLEVBQXdDO0FBQ3BDLFFBQU0sT0FBTyxJQUFiOztBQUVBLFlBQVEsR0FBUixDQUFZLHFCQUFaLEVBQW1DLElBQW5DLEVBQXlDLEdBQXpDOztBQUVBLFNBQUssY0FBTCxDQUFvQixHQUFwQixDQUF3QixHQUF4QjtBQUNBLFNBQUssY0FBTCxDQUFvQixHQUFwQixDQUF3QixLQUFLLElBQTdCO0FBQ0EsU0FBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCLFVBQXpCLEVBQXFDLEtBQXJDOztBQUVBO0FBQ0EsUUFBSSxPQUFPLEVBQVAsQ0FBVSxXQUFkLEVBQTJCO0FBQ3ZCLGFBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsVUFBbEIsR0FBK0IsS0FBSyxJQUFwQztBQUNBLGFBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsU0FBbEIsR0FBOEIsR0FBOUI7O0FBRUEsZUFBTyxFQUFQLENBQVUsV0FBVixDQUFzQixnQkFBdEIsQ0FBdUMsS0FBSyxLQUFMLENBQVcsRUFBbEQsRUFBc0QsS0FBSyxLQUEzRDtBQUNIO0FBQ0o7Ozs7O0FDaEdELFFBQVEsaUJBQVIsR0FBNEIsVUFBVSxPQUFWLEVBQW1CO0FBQzNDLFFBQUksSUFBSSxJQUFJLElBQUosQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsQ0FBUjtBQUNBLE1BQUUsVUFBRixDQUFhLE9BQWI7QUFDQSxXQUFPLENBQVA7QUFDSCxDQUpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7TWVkaWFQbGF5ZXJ9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVkaWFfcGxheWVyXCI7XG5pbXBvcnQge1RyYWNrVXBsb2FkfSBmcm9tIFwiLi9jb21wb25lbnRzL3RyYWNrX3VwbG9hZFwiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyLFxuICAgICAgICBUcmFja1VwbG9hZDogVHJhY2tVcGxvYWRcbiAgICB9LFxuICAgIHV0aWxzOiB7XG4gICAgICAgIHNlY29uZHNUb0RhdGVUaW1lOiBzZWNvbmRzVG9EYXRlVGltZVxuICAgIH1cbn07XG5cblxuLypcbiAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gd2lkZ2V0c1xuICovXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgX19pbml0aWFsaXplVHJhY2tVcGxvYWQoKTtcbn0pO1xuXG5mdW5jdGlvbiBfX2luaXRpYWxpemVUcmFja1VwbG9hZCgpIHtcbiAgICAkKFwiW2RhdGEtYm0td2lkZ2V0PSd0cmFjay11cGxvYWQnXVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBsZXQgdHJhY2sgPSAkZWxlbWVudC5kYXRhKFwiYm1XaWRnZXRUcmFja1VwbG9hZFRyYWNrXCIpO1xuICAgICAgICB0cmFjayA9IHRyYWNrID8gdHJhY2tbMF0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgbmV3IGJtLmNvbXBvbmVudHMuVHJhY2tVcGxvYWQoJGVsZW1lbnQsIHRyYWNrKTtcbiAgICB9KVxufSIsImV4cG9ydCBjbGFzcyBNZWRpYVBsYXllciB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrcykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG5cbiAgICAgICAgc2VsZi5sb2FkVHJhY2tzKHRyYWNrcyk7XG5cbiAgICAgICAgY29uc3QgJGNvbnRyb2xzID0ge1xuICAgICAgICAgICAgJyRyZXN0YXJ0Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1yZXN0YXJ0JyksXG4gICAgICAgICAgICAnJHBhdXNlJzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wYXVzZScpLFxuICAgICAgICAgICAgJyRwbGF5Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wbGF5JylcbiAgICAgICAgfTtcblxuICAgICAgICAkY29udHJvbHMuJHBsYXkub24oXCJjbGlja1wiLCBzZWxmLnBsYXkuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcGF1c2Uub24oXCJjbGlja1wiLCBzZWxmLnBhdXNlLmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHJlc3RhcnQub24oXCJjbGlja1wiLCBzZWxmLnJlc3RhcnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stdGl0bGUtY29udHJvbC0tbXV0ZVwiKS5vbihcImNsaWNrXCIsIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2suYmluZChzZWxmKSk7XG4gICAgfVxuXG4gICAgbG9hZFRyYWNrcyh0cmFja3MpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCA9IHt9O1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gdHJhY2tzLm1hcChfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICByZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIG5ld1RyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5wayA9PT0gdHJhY2tJZCkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5lbXB0eSgpOyAvLyB3aXBlIHdhdmVzdXJmZXIgZGF0YSBhbmQgZXZlbnRzXG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3dhdmVmb3JtLVwiICsgdHJhY2tJZCkuZmluZChcIndhdmVcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdHJhY2sgPSBfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKG5ld1RyYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXN0YXJ0KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby5wbGF5KDApO1xuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8gJiYgIXRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIGdldExvYWRpbmdQcm9ncmVzcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHRvdGFsUHJvZ3Jlc3MgPSAwLFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXApO1xuXG4gICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgdG90YWxQcm9ncmVzcyArPSBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW2tleV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRvdGFsUHJvZ3Jlc3MgPSB0b3RhbFByb2dyZXNzIC8ga2V5cy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsUHJvZ3Jlc3M7XG4gICAgfVxuXG4gICAgZ2V0TG9uZ2VzdFRyYWNrKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5tZWRpYV91cmwpO1xuXG4gICAgICAgIGxldCBsb25nZXN0VHJhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdHJhY2tzV2l0aE1lZGlhLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgbG9uZ2VzdFRyYWNrID0gbG9uZ2VzdFRyYWNrIHx8IHRyYWNrO1xuICAgICAgICAgICAgbGV0IHRyYWNrRHVyYXRpb24gPSB0cmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICAgICAgICAgIGlmICh0cmFja0R1cmF0aW9uID4gbG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IHRyYWNrO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsb25nZXN0VHJhY2s7XG4gICAgfVxuXG4gICAgYWxsVHJhY2tzQXJlTG9hZGVkKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZXZlcnkodHJhY2sgPT4gISF0cmFjay5fX2xvYWRlZCk7XG4gICAgfVxuXG4gICAgZ2V0VHJhY2tCeUlkKHRyYWNrSWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiB0cmFjay5wayA9PT0gdHJhY2tJZClbMF07XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhY2tNdXRlKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLl9fYXVkaW8gJiYgdHJhY2suX19hdWRpby50b2dnbGVNdXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2NyZWF0ZUF1ZGlvV2F2ZSh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHRyYWNrLmZpZWxkcy5tZWRpYV91cmwpIHtcbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSAwO1xuICAgICAgICB2YXIgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdmFyIGxpbkdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgNjQsIDAsIDIwMCk7XG4gICAgICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMjI1LCAyMjUsIDIyNSwgMS4wMDApJyk7XG4gICAgICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMTgzLCAxODMsIDE4MywgMS4wMDApJyk7XG5cbiAgICAgICAgdmFyIHdhdmVzdXJmZXIgPSBXYXZlU3VyZmVyLmNyZWF0ZSh7XG4gICAgICAgICAgICBjb250YWluZXI6ICcjd2F2ZWZvcm0tJyArIHRyYWNrLnBrLFxuICAgICAgICAgICAgd2F2ZUNvbG9yOiBsaW5HcmFkLFxuICAgICAgICAgICAgcHJvZ3Jlc3NDb2xvcjogJ2hzbGEoMjAwLCAxMDAlLCAzMCUsIDAuNSknLFxuICAgICAgICAgICAgY3Vyc29yQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgIGhlaWdodDogNDUsXG4gICAgICAgICAgICBiYXJXaWR0aDogM1xuICAgICAgICB9KTtcblxuICAgICAgICB3YXZlc3VyZmVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgIF9fb25UcmFja1JlYWR5RXZlbnQuYmluZChzZWxmKSh0cmFjayk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXZlc3VyZmVyLm9uKFwiZXJyb3JcIiwgX19vblRyYWNrRXJyb3JFdmVudCk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oJ2xvYWRpbmcnLCBwcm9ncmVzcyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gX19vblRyYWNrTG9hZGluZ0V2ZW50LmJpbmQoc2VsZikodHJhY2ssIHByb2dyZXNzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oJ3NlZWsnLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgd2F2ZXN1cmZlci5sb2FkKHRyYWNrLmZpZWxkcy5tZWRpYV91cmwpO1xuXG4gICAgICAgIHRyYWNrLl9fYXVkaW8gPSB3YXZlc3VyZmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhY2s7XG59XG4vLyAvL1xuLy8gLy8gICAgIGZ1bmN0aW9uIHRvZ2dsZVNvbG9Gb3JUcmFjayh0cmFjaywgJGV2ZW50KSB7XG4vLyAvLyAgICAgICAgIHRyYWNrLmlzU29sbyA9ICF0cmFjay5pc1NvbG87XG4vLyAvL1xuLy8gLy8gICAgICAgICB2YXIgJGNvbnRyb2wgPSAkKCRldmVudC50YXJnZXQpO1xuLy8gLy8gICAgICAgICAkY29udHJvbC50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5pc1NvbG8pO1xuLy8gLy8gICAgICAgICAkY29udHJvbC50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLmlzU29sbyk7XG4vLyAvL1xuLy8gLy8gICAgICAgICB2YXIgdHJhY2tzQXJlU29sb2VkID0gc2VsZi50cmFja3Muc29tZShmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgcmV0dXJuIHQuaXNTb2xvO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIGlmICghdHJhY2tzQXJlU29sb2VkKSB7XG4vLyAvLyAgICAgICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoZmFsc2UpO1xuLy8gLy8gICAgICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICAgICAgcmV0dXJuO1xuLy8gLy8gICAgICAgICB9XG4vLyAvL1xuLy8gLy8gICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZSghdC5pc1NvbG8pO1xuLy8gLy8gICAgICAgICB9KTtcbi8vIC8vICAgICB9XG4vLyAvL1xuLy8gLy8gICAgIC8vIFBSSVZBVEUgQVBJXG4vLyAvL1xuLy8gLy9cblxuZnVuY3Rpb24gX19vblRyYWNrUmVhZHlFdmVudCh0cmFjaykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuXG4gICAgaWYgKHNlbGYuYWxsVHJhY2tzQXJlTG9hZGVkKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJhbGwgdHJhY2tzIGFyZSBsb2FkZWRcIik7XG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcblxuICAgICAgICBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLm9uKFwicGxheVwiLCAoKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpLCAyNTApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja0Vycm9yRXZlbnQoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiZXJyb3IgcHJvY2Vzc2luZyB2aWRlb1wiLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja1NlZWtFdmVudChwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICB0cmFja3NXaXRoTWVkaWEgPSBzZWxmLnRyYWNrcy5maWx0ZXIodHJhY2sgPT4gISF0cmFjay5maWVsZHMubWVkaWFfdXJsKTtcblxuICAgIC8vIHByZXZlbnQgZXhjZXNzIHNlZWsgZXZlbnRzIGZyb20gZmlyaW5nXG4gICAgbGV0IHByb21pc2VzID0gdHJhY2tzV2l0aE1lZGlhLm1hcCh0cmFjayA9PiB7XG4gICAgICAgIHZhciBkZWZlciA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby51bihcInNlZWtcIik7XG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICBkZWZlci5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgICB9KTtcblxuICAgICQud2hlbihwcm9taXNlcykuZG9uZSgoKSA9PiB7XG4gICAgICAgIHNlbGYucGF1c2UoKTtcblxuICAgICAgICB0cmFja3NXaXRoTWVkaWEuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnNlZWtUbyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLm9uKFwic2Vla1wiLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYucGxheSgpO1xuICAgIH0pLmZhaWwoZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fb25UcmFja0xvYWRpbmdFdmVudCh0cmFjaywgcHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gcHJvZ3Jlc3M7XG5cbiAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjcHJvZ3Jlc3NcIikuY3NzKHtcbiAgICAgICAgd2lkdGg6IHNlbGYuZ2V0TG9hZGluZ1Byb2dyZXNzLmJpbmQoc2VsZikoKSArIFwiJVwiXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fdXBkYXRlU29uZ0R1cmF0aW9ucygpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBsZXQgJHRpbWVyID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fY29udHJvbC0tZHVyYXRpb25cIik7XG5cbiAgICBzZWxmLmxvbmdlc3RUcmFjayA9IHNlbGYuZ2V0TG9uZ2VzdFRyYWNrKCk7XG5cbiAgICAvLyBubyB0cmFja3MgdG8gbWVkaWEgZHVyYXRpb24gZnJvbVxuICAgIGlmICghc2VsZi5sb25nZXN0VHJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXRDdXJyZW50VGltZSgpO1xuICAgIHNlbGYuc29uZ0R1cmF0aW9uID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgbGV0IGR1cmF0aW9uRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdEdXJhdGlvbiksXG4gICAgICAgIHNlZWtEYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0N1cnJlbnRTZWVrKTtcblxuICAgIGZ1bmN0aW9uIGRhdGVUaW1lVG9NZWRpYVRpbWUoZGF0ZVRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGRhdGVUaW1lLmdldE1pbnV0ZXMoKSArIFwiOlwiICsgU3RyaW5nKFwiMDBcIiArIGRhdGVUaW1lLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuICAgIH1cblxuICAgICR0aW1lci50ZXh0KGRhdGVUaW1lVG9NZWRpYVRpbWUoc2Vla0RhdGVUaW1lKSArIFwiIC8gXCIgKyBkYXRlVGltZVRvTWVkaWFUaW1lKGR1cmF0aW9uRGF0ZVRpbWUpKTtcblxuICAgIGlmIChzZWxmLnNvbmdDdXJyZW50U2VlayA+PSBzZWxmLnNvbmdEdXJhdGlvbikge1xuICAgICAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYuc29uZ0R1cmF0aW9uO1xuXG4gICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2soZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgIHNlbGYudG9nZ2xlVHJhY2tNdXRlKHRyYWNrKTtcblxuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xuICAgICR0cmFja0NvbnRyb2wuZmluZChcImJ1dHRvblwiKS50b2dnbGVDbGFzcyhcImJ0bi1wcmltYXJ5XCIsIHRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG59IiwiZXhwb3J0IGNsYXNzIFRyYWNrVXBsb2FkIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCwgdHJhY2spIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudCA9ICRlbGVtZW50O1xuICAgICAgICBzZWxmLiRmb3JtU3VibWl0QnRuID0gc2VsZi4kZWxlbWVudC5wYXJlbnRzKFwiZm9ybVwiKS5maW5kKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddXCIpO1xuICAgICAgICBzZWxmLiRtZWRpYVVybElucHV0ID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLmpzLXRyYWNrLXVwbG9hZF9fbWVkaWEtdXJsXCIpO1xuICAgICAgICBzZWxmLiRtZWRpYUZpbGVOYW1lID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLmpzLXRyYWNrLXVwbG9hZF9fbWVkaWEtZmlsZS1uYW1lXCIpO1xuICAgICAgICBzZWxmLnRyYWNrID0gdHJhY2s7XG5cbiAgICAgICAgJGVsZW1lbnQuZmluZChcImlucHV0W3R5cGU9J2ZpbGUnXVwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCAkZWxlbWVudCA9ICQodGhpcyk7XG5cbiAgICAgICAgICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4ucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9ICRlbGVtZW50LmdldCgwKS5maWxlc1swXTtcblxuICAgICAgICAgICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvcihcIk5vIGZpbGUgc2VsZWN0ZWQuXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF9fZ2V0U2lnbmVkUmVxdWVzdC5iaW5kKHNlbGYpKGZpbGUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICBzZWxmLiRmb3JtU3VibWl0QnRuLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fZ2V0U2lnbmVkUmVxdWVzdChmaWxlKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL3RyYWNrcy91cGxvYWRcIixcbiAgICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgXCJmaWxlX25hbWVcIjogZmlsZS5uYW1lLFxuICAgICAgICAgICAgXCJmaWxlX3R5cGVcIjogZmlsZS50eXBlXG4gICAgICAgIH0sXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBfX3VwbG9hZEZpbGUuYmluZChzZWxmKShmaWxlLCByZXNwb25zZS5kYXRhLCByZXNwb25zZS51cmwpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlIHNvbmcgdXBsb2FkIHNpZ25lZCByZXF1ZXN0XCIsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgZ2V0IHNpZ25lZCBVUkwuXCIsIHhocik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX191cGxvYWRGaWxlKGZpbGUsIHMzRGF0YSwgdXJsKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgbGV0IHBvc3REYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICB4aHIub3BlbihcIlBPU1RcIiwgczNEYXRhLnVybCk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gczNEYXRhLmZpZWxkcykge1xuICAgICAgICBwb3N0RGF0YS5hcHBlbmQoa2V5LCBzM0RhdGEuZmllbGRzW2tleV0pO1xuICAgIH1cbiAgICBwb3N0RGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCB8fCB4aHIuc3RhdHVzID09PSAyMDQpIHtcbiAgICAgICAgICAgICAgICBfX3VwbG9hZEZpbGVTdWNjZXNzLmJpbmQoc2VsZikoZmlsZSwgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgdXBsb2FkIGZpbGUuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICB4aHIuc2VuZChwb3N0RGF0YSk7XG59XG5cbmZ1bmN0aW9uIF9fdXBsb2FkRmlsZVN1Y2Nlc3MoZmlsZSwgdXJsKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBjb25zb2xlLmxvZyhcImZpbGUgdXBsb2FkIHN1Y2Nlc3NcIiwgZmlsZSwgdXJsKTtcblxuICAgIHNlbGYuJG1lZGlhVXJsSW5wdXQudmFsKHVybCk7XG4gICAgc2VsZi4kbWVkaWFGaWxlTmFtZS52YWwoZmlsZS5uYW1lKTtcbiAgICBzZWxmLiRmb3JtU3VibWl0QnRuLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXG4gICAgLy8gcmVpbml0aWFsaXplIGFueSBhc3NvY2lhdGVkIG1lZGlhIHBsYXllcnNcbiAgICBpZiAod2luZG93LmJtLm1lZGlhUGxheWVyKSB7XG4gICAgICAgIHNlbGYudHJhY2suZmllbGRzLm1lZGlhX25hbWUgPSBmaWxlLm5hbWU7XG4gICAgICAgIHNlbGYudHJhY2suZmllbGRzLm1lZGlhX3VybCA9IHVybDtcblxuICAgICAgICB3aW5kb3cuYm0ubWVkaWFQbGF5ZXIucmVwbGFjZVRyYWNrQnlJZChzZWxmLnRyYWNrLnBrLCBzZWxmLnRyYWNrKTtcbiAgICB9XG59IiwiZXhwb3J0cy5zZWNvbmRzVG9EYXRlVGltZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgICBkLnNldFNlY29uZHMoc2Vjb25kcyk7XG4gICAgcmV0dXJuIGQ7XG59OyJdfQ==

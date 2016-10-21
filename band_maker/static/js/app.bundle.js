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
                    track.__audio.empty(); // wipe wavesurfer data and events
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
                track.__audio.play(0);
            });

            __updateSongDurations.bind(self)();
        }
    }, {
        key: 'play',
        value: function play() {
            var self = this;

            self.tracks.forEach(function (track) {
                if (!track.__audio.isPlaying()) {
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
                if (track.__audio.isPlaying()) {
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
            var longestTrack = this.tracks[0];

            this.tracks.forEach(function (track) {
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
            return this.tracks.every(function (track) {
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
            track.__audio.toggleMute();
        }
    }]);

    return MediaPlayer;
}();

function __createAudioWave(track) {
    var self = this;

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
    var self = this;

    // prevent excess seek events from firing
    var promises = self.tracks.map(function (track) {
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

        self.tracks.forEach(function (track) {
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

    $trackControl.find("a").toggleClass("btn-default", !track.__audio.isMuted);
    $trackControl.find("a").toggleClass("btn-primary", track.__audio.isMuted);
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
    self.track.fields.media_name = file.name;
    self.track.fields.media_url = url;

    window.bm.mediaPlayer.replaceTrackById(self.track.pk, self.track);
}

},{}],4:[function(require,module,exports){
"use strict";

exports.secondsToDateTime = function (seconds) {
    var d = new Date(0, 0, 0, 0, 0, 0, 0);
    d.setSeconds(seconds);
    return d;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL2NvbXBvbmVudHMvdHJhY2tfdXBsb2FkLmpzIiwiYmFuZF9tYWtlci9zdGF0aWMvanMvdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUVBLE9BQU8sRUFBUCxHQUFZO0FBQ1IsZ0JBQVk7QUFDUiw4Q0FEUTtBQUVSO0FBRlEsS0FESjtBQUtSLFdBQU87QUFDSDtBQURHO0FBTEMsQ0FBWjs7QUFXQTs7O0FBR0EsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFNO0FBQ3BCO0FBQ0gsQ0FGRDs7QUFJQSxTQUFTLHVCQUFULEdBQW1DO0FBQy9CLE1BQUUsaUNBQUYsRUFBcUMsSUFBckMsQ0FBMEMsWUFBWTtBQUNsRCxZQUFNLFdBQVcsRUFBRSxJQUFGLENBQWpCO0FBQ0EsWUFBSSxRQUFRLFNBQVMsSUFBVCxDQUFjLDBCQUFkLENBQVo7QUFDQSxnQkFBUSxRQUFRLE1BQU0sQ0FBTixDQUFSLEdBQW1CLFNBQTNCOztBQUVBLFlBQUksR0FBRyxVQUFILENBQWMsV0FBbEIsQ0FBOEIsUUFBOUIsRUFBd0MsS0FBeEM7QUFDSCxLQU5EO0FBT0g7Ozs7Ozs7Ozs7Ozs7SUM5QlksVyxXQUFBLFc7QUFDVCx5QkFBWSxRQUFaLEVBQXNCLE1BQXRCLEVBQThCO0FBQUE7O0FBQzFCLFlBQU0sT0FBTyxJQUFiOztBQUVBLGFBQUssUUFBTCxHQUFnQixRQUFoQjs7QUFFQSxhQUFLLFVBQUwsQ0FBZ0IsTUFBaEI7O0FBRUEsWUFBTSxZQUFZO0FBQ2Qsd0JBQVksS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixpQ0FBbkIsQ0FE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QXNCLGdCQUF0QixDQUF1QyxLQUFLLEtBQUwsQ0FBVyxFQUFsRCxFQUFzRCxLQUFLLEtBQTNEO0FBQ0g7Ozs7O0FDOUZELFFBQVEsaUJBQVIsR0FBNEIsVUFBVSxPQUFWLEVBQW1CO0FBQzNDLFFBQUksSUFBSSxJQUFJLElBQUosQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsQ0FBUjtBQUNBLE1BQUUsVUFBRixDQUFhLE9BQWI7QUFDQSxXQUFPLENBQVA7QUFDSCxDQUpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7TWVkaWFQbGF5ZXJ9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVkaWFfcGxheWVyXCI7XG5pbXBvcnQge1RyYWNrVXBsb2FkfSBmcm9tIFwiLi9jb21wb25lbnRzL3RyYWNrX3VwbG9hZFwiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyLFxuICAgICAgICBUcmFja1VwbG9hZDogVHJhY2tVcGxvYWRcbiAgICB9LFxuICAgIHV0aWxzOiB7XG4gICAgICAgIHNlY29uZHNUb0RhdGVUaW1lOiBzZWNvbmRzVG9EYXRlVGltZVxuICAgIH1cbn07XG5cblxuLypcbiAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gd2lkZ2V0c1xuICovXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgX19pbml0aWFsaXplVHJhY2tVcGxvYWQoKTtcbn0pO1xuXG5mdW5jdGlvbiBfX2luaXRpYWxpemVUcmFja1VwbG9hZCgpIHtcbiAgICAkKFwiW2RhdGEtYm0td2lkZ2V0PSd0cmFjay11cGxvYWQnXVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBsZXQgdHJhY2sgPSAkZWxlbWVudC5kYXRhKFwiYm1XaWRnZXRUcmFja1VwbG9hZFRyYWNrXCIpO1xuICAgICAgICB0cmFjayA9IHRyYWNrID8gdHJhY2tbMF0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgbmV3IGJtLmNvbXBvbmVudHMuVHJhY2tVcGxvYWQoJGVsZW1lbnQsIHRyYWNrKTtcbiAgICB9KVxufSIsImV4cG9ydCBjbGFzcyBNZWRpYVBsYXllciB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrcykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG5cbiAgICAgICAgc2VsZi5sb2FkVHJhY2tzKHRyYWNrcyk7XG5cbiAgICAgICAgY29uc3QgJGNvbnRyb2xzID0ge1xuICAgICAgICAgICAgJyRyZXN0YXJ0Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1yZXN0YXJ0JyksXG4gICAgICAgICAgICAnJHBhdXNlJzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wYXVzZScpLFxuICAgICAgICAgICAgJyRwbGF5Jzogc2VsZi4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wbGF5JylcbiAgICAgICAgfTtcblxuICAgICAgICAkY29udHJvbHMuJHBsYXkub24oXCJjbGlja1wiLCBzZWxmLnBsYXkuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcGF1c2Uub24oXCJjbGlja1wiLCBzZWxmLnBhdXNlLmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHJlc3RhcnQub24oXCJjbGlja1wiLCBzZWxmLnJlc3RhcnQuYmluZChzZWxmKSk7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stdGl0bGUtY29udHJvbC0tbXV0ZVwiKS5vbihcImNsaWNrXCIsIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2suYmluZChzZWxmKSk7XG4gICAgfVxuXG4gICAgbG9hZFRyYWNrcyh0cmFja3MpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCA9IHt9O1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gdHJhY2tzLm1hcChfX2NyZWF0ZUF1ZGlvV2F2ZS5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICByZXBsYWNlVHJhY2tCeUlkKHRyYWNrSWQsIG5ld1RyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5wayA9PT0gdHJhY2tJZCkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8uZW1wdHkoKTsgLy8gd2lwZSB3YXZlc3VyZmVyIGRhdGEgYW5kIGV2ZW50c1xuICAgICAgICAgICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiN3YXZlZm9ybS1cIiArIHRyYWNrSWQpLmZpbmQoXCJ3YXZlXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRyYWNrID0gX19jcmVhdGVBdWRpb1dhdmUuYmluZChzZWxmKShuZXdUcmFjayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmFjaztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzdGFydCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAoIXRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBnZXRMb2FkaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB0b3RhbFByb2dyZXNzID0gMCxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwKTtcblxuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgKz0gc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b3RhbFByb2dyZXNzID0gdG90YWxQcm9ncmVzcyAvIGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFByb2dyZXNzO1xuICAgIH1cblxuICAgIGdldExvbmdlc3RUcmFjaygpIHtcbiAgICAgICAgdmFyIGxvbmdlc3RUcmFjayA9IHRoaXMudHJhY2tzWzBdO1xuXG4gICAgICAgIHRoaXMudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdmFyIHRyYWNrRHVyYXRpb24gPSB0cmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICAgICAgICAgIGlmICh0cmFja0R1cmF0aW9uID4gbG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IHRyYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbG9uZ2VzdFRyYWNrO1xuICAgIH1cblxuICAgIGFsbFRyYWNrc0FyZUxvYWRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhY2tzLmV2ZXJ5KHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIXRyYWNrLl9fbG9hZGVkO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRUcmFja0J5SWQodHJhY2tJZCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cmFjay5wayA9PT0gdHJhY2tJZDtcbiAgICAgICAgfSlbMF07XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhY2tNdXRlKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLl9fYXVkaW8udG9nZ2xlTXV0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jcmVhdGVBdWRpb1dhdmUodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gMDtcbiAgICB2YXIgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgbGluR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCA2NCwgMCwgMjAwKTtcbiAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDIyNSwgMjI1LCAyMjUsIDEuMDAwKScpO1xuICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMTgzLCAxODMsIDE4MywgMS4wMDApJyk7XG5cbiAgICB2YXIgd2F2ZXN1cmZlciA9IFdhdmVTdXJmZXIuY3JlYXRlKHtcbiAgICAgICAgY29udGFpbmVyOiAnI3dhdmVmb3JtLScgKyB0cmFjay5wayxcbiAgICAgICAgd2F2ZUNvbG9yOiBsaW5HcmFkLFxuICAgICAgICBwcm9ncmVzc0NvbG9yOiAnaHNsYSgyMDAsIDEwMCUsIDMwJSwgMC41KScsXG4gICAgICAgIGN1cnNvckNvbG9yOiAnI2ZmZicsXG4gICAgICAgIGhlaWdodDogNDUsXG4gICAgICAgIGJhcldpZHRoOiAzXG4gICAgfSk7XG5cbiAgICB3YXZlc3VyZmVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgX19vblRyYWNrUmVhZHlFdmVudC5iaW5kKHNlbGYpKHRyYWNrKTtcbiAgICB9KTtcbiAgICB3YXZlc3VyZmVyLm9uKFwiZXJyb3JcIiwgX19vblRyYWNrRXJyb3JFdmVudCk7XG4gICAgd2F2ZXN1cmZlci5vbignbG9hZGluZycsIHByb2dyZXNzID0+IHtcbiAgICAgICAgcmV0dXJuIF9fb25UcmFja0xvYWRpbmdFdmVudC5iaW5kKHNlbGYpKHRyYWNrLCBwcm9ncmVzcyk7XG4gICAgfSk7XG4gICAgd2F2ZXN1cmZlci5vbignc2VlaycsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcblxuICAgIHdhdmVzdXJmZXIubG9hZCh0cmFjay5maWVsZHMubWVkaWFfdXJsKTtcblxuICAgIHRyYWNrLl9fYXVkaW8gPSB3YXZlc3VyZmVyO1xuXG4gICAgcmV0dXJuIHRyYWNrO1xufVxuLy8gLy9cbi8vIC8vICAgICBmdW5jdGlvbiB0b2dnbGVTb2xvRm9yVHJhY2sodHJhY2ssICRldmVudCkge1xuLy8gLy8gICAgICAgICB0cmFjay5pc1NvbG8gPSAhdHJhY2suaXNTb2xvO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyICRjb250cm9sID0gJCgkZXZlbnQudGFyZ2V0KTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suaXNTb2xvKTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5pc1NvbG8pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyIHRyYWNrc0FyZVNvbG9lZCA9IHNlbGYudHJhY2tzLnNvbWUoZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHJldHVybiB0LmlzU29sbztcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICBpZiAoIXRyYWNrc0FyZVNvbG9lZCkge1xuLy8gLy8gICAgICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKGZhbHNlKTtcbi8vIC8vICAgICAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgICAgIHJldHVybjtcbi8vIC8vICAgICAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoIXQuaXNTb2xvKTtcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvLyAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAvLyBQUklWQVRFIEFQSVxuLy8gLy9cbi8vIC8vXG5cbmZ1bmN0aW9uIF9fb25UcmFja1JlYWR5RXZlbnQodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcblxuICAgIGlmIChzZWxmLmFsbFRyYWNrc0FyZUxvYWRlZCgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiYWxsIHRyYWNrcyBhcmUgbG9hZGVkXCIpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG5cbiAgICAgICAgc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5vbihcInBsYXlcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tFcnJvckV2ZW50KGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcImVycm9yIHByb2Nlc3NpbmcgdmlkZW9cIiwgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tTZWVrRXZlbnQocHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIC8vIHByZXZlbnQgZXhjZXNzIHNlZWsgZXZlbnRzIGZyb20gZmlyaW5nXG4gICAgdmFyIHByb21pc2VzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnVuKFwic2Vla1wiKTtcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgIH0pO1xuXG4gICAgJC53aGVuKHByb21pc2VzKS5kb25lKCgpID0+IHtcbiAgICAgICAgc2VsZi5wYXVzZSgpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5zZWVrVG8ocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5vbihcInNlZWtcIiwgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICB9KS5mYWlsKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tMb2FkaW5nRXZlbnQodHJhY2ssIHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IHByb2dyZXNzO1xuXG4gICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3Byb2dyZXNzXCIpLmNzcyh7XG4gICAgICAgIHdpZHRoOiBzZWxmLmdldExvYWRpbmdQcm9ncmVzcy5iaW5kKHNlbGYpKCkgKyBcIiVcIlxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgJHRpbWVyID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fY29udHJvbC0tZHVyYXRpb25cIik7XG5cbiAgICBzZWxmLmxvbmdlc3RUcmFjayA9IHNlbGYuZ2V0TG9uZ2VzdFRyYWNrKCk7XG4gICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgc2VsZi5zb25nRHVyYXRpb24gPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICB2YXIgZHVyYXRpb25EYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0R1cmF0aW9uKSxcbiAgICAgICAgc2Vla0RhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nQ3VycmVudFNlZWspO1xuXG4gICAgZnVuY3Rpb24gZGF0ZVRpbWVUb01lZGlhVGltZShkYXRlVGltZSkge1xuICAgICAgICByZXR1cm4gZGF0ZVRpbWUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBTdHJpbmcoXCIwMFwiICsgZGF0ZVRpbWUuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gICAgfVxuXG4gICAgJHRpbWVyLnRleHQoZGF0ZVRpbWVUb01lZGlhVGltZShzZWVrRGF0ZVRpbWUpICsgXCIgLyBcIiArIGRhdGVUaW1lVG9NZWRpYVRpbWUoZHVyYXRpb25EYXRlVGltZSkpO1xuXG4gICAgaWYgKHNlbGYuc29uZ0N1cnJlbnRTZWVrID49IHNlbGYuc29uZ0R1cmF0aW9uKSB7XG4gICAgICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5zb25nRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja011dGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYVwiKS50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xuICAgICR0cmFja0NvbnRyb2wuZmluZChcImFcIikudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xufSIsImV4cG9ydCBjbGFzcyBUcmFja1VwbG9hZCB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgc2VsZi4kZm9ybVN1Ym1pdEJ0biA9IHNlbGYuJGVsZW1lbnQucGFyZW50cyhcImZvcm1cIikuZmluZChcImJ1dHRvblt0eXBlPSdzdWJtaXQnXVwiKTtcbiAgICAgICAgc2VsZi4kbWVkaWFVcmxJbnB1dCA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5qcy10cmFjay11cGxvYWRfX21lZGlhLXVybFwiKTtcbiAgICAgICAgc2VsZi4kbWVkaWFGaWxlTmFtZSA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5qcy10cmFjay11cGxvYWRfX21lZGlhLWZpbGUtbmFtZVwiKTtcbiAgICAgICAgc2VsZi50cmFjayA9IHRyYWNrO1xuXG4gICAgICAgICRlbGVtZW50LmZpbmQoXCJpbnB1dFt0eXBlPSdmaWxlJ11cIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgJGVsZW1lbnQgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICBzZWxmLiRmb3JtU3VibWl0QnRuLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSAkZWxlbWVudC5nZXQoMCkuZmlsZXNbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXCJObyBmaWxlIHNlbGVjdGVkLlwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfX2dldFNpZ25lZFJlcXVlc3QuYmluZChzZWxmKShmaWxlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgc2VsZi4kZm9ybVN1Ym1pdEJ0bi5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX2dldFNpZ25lZFJlcXVlc3QoZmlsZSkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi90cmFja3MvdXBsb2FkXCIsXG4gICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIFwiZmlsZV9uYW1lXCI6IGZpbGUubmFtZSxcbiAgICAgICAgICAgIFwiZmlsZV90eXBlXCI6IGZpbGUudHlwZVxuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX191cGxvYWRGaWxlLmJpbmQoc2VsZikoZmlsZSwgcmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UudXJsKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSBzb25nIHVwbG9hZCBzaWduZWQgcmVxdWVzdFwiLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGdldCBzaWduZWQgVVJMLlwiLCB4aHIpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fdXBsb2FkRmlsZShmaWxlLCBzM0RhdGEsIHVybCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIGxldCBwb3N0RGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgeGhyLm9wZW4oXCJQT1NUXCIsIHMzRGF0YS51cmwpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHMzRGF0YS5maWVsZHMpIHtcbiAgICAgICAgcG9zdERhdGEuYXBwZW5kKGtleSwgczNEYXRhLmZpZWxkc1trZXldKTtcbiAgICB9XG4gICAgcG9zdERhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7XG5cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDAgfHwgeGhyLnN0YXR1cyA9PT0gMjA0KSB7XG4gICAgICAgICAgICAgICAgX191cGxvYWRGaWxlU3VjY2Vzcy5iaW5kKHNlbGYpKGZpbGUsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IHVwbG9hZCBmaWxlLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgeGhyLnNlbmQocG9zdERhdGEpO1xufVxuXG5mdW5jdGlvbiBfX3VwbG9hZEZpbGVTdWNjZXNzKGZpbGUsIHVybCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgY29uc29sZS5sb2coXCJmaWxlIHVwbG9hZCBzdWNjZXNzXCIsIGZpbGUsIHVybCk7XG5cbiAgICBzZWxmLiRtZWRpYVVybElucHV0LnZhbCh1cmwpO1xuICAgIHNlbGYuJG1lZGlhRmlsZU5hbWUudmFsKGZpbGUubmFtZSk7XG4gICAgc2VsZi4kZm9ybVN1Ym1pdEJ0bi5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgIC8vIHJlaW5pdGlhbGl6ZSBhbnkgYXNzb2NpYXRlZCBtZWRpYSBwbGF5ZXJzXG4gICAgc2VsZi50cmFjay5maWVsZHMubWVkaWFfbmFtZSA9IGZpbGUubmFtZTtcbiAgICBzZWxmLnRyYWNrLmZpZWxkcy5tZWRpYV91cmwgPSB1cmw7XG5cbiAgICB3aW5kb3cuYm0ubWVkaWFQbGF5ZXIucmVwbGFjZVRyYWNrQnlJZChzZWxmLnRyYWNrLnBrLCBzZWxmLnRyYWNrKTtcbn0iLCJleHBvcnRzLnNlY29uZHNUb0RhdGVUaW1lID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICB2YXIgZCA9IG5ldyBEYXRlKDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgIGQuc2V0U2Vjb25kcyhzZWNvbmRzKTtcbiAgICByZXR1cm4gZDtcbn07Il19

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

        this.$element = $element;
        this.trackLoadingProgressMap = {};
        this.tracks = tracks.map(__createAudioWave.bind(this));

        var $controls = {
            '$restart': this.$element.find('.media-player__control--restart'),
            '$pause': this.$element.find('.media-player__control--pause'),
            '$play': this.$element.find('.media-player__control--play')
        };

        $controls.$play.on("click", this.play.bind(this));
        $controls.$pause.on("click", this.pause.bind(this));
        $controls.$restart.on("click", this.restart.bind(this));

        this.$element.find(".media-player__track-title-control--mute").on("click", __handleTrackMuteClick.bind(this));
    }

    _createClass(MediaPlayer, [{
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

        // Initialize the jQuery File Upload widget:
        // $('#fileupload').fileupload({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        // url: 'server/php/'
        // });

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
}

},{}],4:[function(require,module,exports){
"use strict";

exports.secondsToDateTime = function (seconds) {
    var d = new Date(0, 0, 0, 0, 0, 0, 0);
    d.setSeconds(seconds);
    return d;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL2NvbXBvbmVudHMvdHJhY2tfdXBsb2FkLmpzIiwiYmFuZF9tYWtlci9zdGF0aWMvanMvdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUVBLE9BQU8sRUFBUCxHQUFZO0FBQ1IsZ0JBQVk7QUFDUiw4Q0FEUTtBQUVSO0FBRlEsS0FESjtBQUtSLFdBQU87QUFDSDtBQURHO0FBTEMsQ0FBWjs7QUFXQTs7O0FBR0EsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFNO0FBQ3BCO0FBQ0gsQ0FGRDs7QUFJQSxTQUFTLHVCQUFULEdBQW1DO0FBQy9CLE1BQUUsaUNBQUYsRUFBcUMsSUFBckMsQ0FBMEMsWUFBWTtBQUNsRCxZQUFNLFdBQVcsRUFBRSxJQUFGLENBQWpCO0FBQ0EsWUFBSSxRQUFRLFNBQVMsSUFBVCxDQUFjLDBCQUFkLENBQVo7QUFDQSxnQkFBUSxRQUFRLE1BQU0sQ0FBTixDQUFSLEdBQW1CLFNBQTNCOztBQUVBLFlBQUksR0FBRyxVQUFILENBQWMsV0FBbEIsQ0FBOEIsUUFBOUIsRUFBd0MsS0FBeEM7QUFDSCxLQU5EO0FBT0g7Ozs7Ozs7Ozs7Ozs7SUM5QlksVyxXQUFBLFc7QUFDVCx5QkFBWSxRQUFaLEVBQXNCLE1BQXRCLEVBQThCO0FBQUE7O0FBQzFCLGFBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBLGFBQUssdUJBQUwsR0FBK0IsRUFBL0I7QUFDQSxhQUFLLE1BQUwsR0FBYyxPQUFPLEdBQVAsQ0FBVyxrQkFBa0IsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBWCxDQUFkOztBQUVBLFlBQU0sWUFB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QztBQUNILGFBRkQsTUFHSztBQUNELHdCQUFRLEtBQVIsQ0FBYyx3QkFBZDtBQUNIO0FBQ0o7QUFDSixLQVREO0FBVUEsUUFBSSxJQUFKLENBQVMsUUFBVDtBQUNIOztBQUVELFNBQVMsbUJBQVQsQ0FBNkIsSUFBN0IsRUFBbUMsR0FBbkMsRUFBd0M7QUFDcEMsUUFBTSxPQUFPLElBQWI7O0FBRUEsWUFBUSxHQUFSLENBQVkscUJBQVosRUFBbUMsSUFBbkMsRUFBeUMsR0FBekM7O0FBRUEsU0FBSyxjQUFMLENBQW9CLEdBQXBCLENBQXdCLEdBQXhCO0FBQ0EsU0FBSyxjQUFMLENBQW9CLEdBQXBCLENBQXdCLEtBQUssSUFBN0I7QUFDQSxTQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsVUFBekIsRUFBcUMsS0FBckM7QUFDSDs7Ozs7QUM5RkQsUUFBUSxpQkFBUixHQUE0QixVQUFVLE9BQVYsRUFBbUI7QUFDM0MsUUFBSSxJQUFJLElBQUksSUFBSixDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixDQUF4QixFQUEyQixDQUEzQixDQUFSO0FBQ0EsTUFBRSxVQUFGLENBQWEsT0FBYjtBQUNBLFdBQU8sQ0FBUDtBQUNILENBSkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtNZWRpYVBsYXllcn0gZnJvbSBcIi4vY29tcG9uZW50cy9tZWRpYV9wbGF5ZXJcIjtcbmltcG9ydCB7VHJhY2tVcGxvYWR9IGZyb20gXCIuL2NvbXBvbmVudHMvdHJhY2tfdXBsb2FkXCI7XG5pbXBvcnQge3NlY29uZHNUb0RhdGVUaW1lfSBmcm9tIFwiLi91dGlscy9zZWNvbmRzX3RvX2RhdGVfdGltZVwiO1xuXG53aW5kb3cuYm0gPSB7XG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBNZWRpYVBsYXllcjogTWVkaWFQbGF5ZXIsXG4gICAgICAgIFRyYWNrVXBsb2FkOiBUcmFja1VwbG9hZFxuICAgIH0sXG4gICAgdXRpbHM6IHtcbiAgICAgICAgc2Vjb25kc1RvRGF0ZVRpbWU6IHNlY29uZHNUb0RhdGVUaW1lXG4gICAgfVxufTtcblxuXG4vKlxuICogSW5pdGlhbGl6ZSBhcHBsaWNhdGlvbiB3aWRnZXRzXG4gKi9cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBfX2luaXRpYWxpemVUcmFja1VwbG9hZCgpO1xufSk7XG5cbmZ1bmN0aW9uIF9faW5pdGlhbGl6ZVRyYWNrVXBsb2FkKCkge1xuICAgICQoXCJbZGF0YS1ibS13aWRnZXQ9J3RyYWNrLXVwbG9hZCddXCIpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIGxldCB0cmFjayA9ICRlbGVtZW50LmRhdGEoXCJibVdpZGdldFRyYWNrVXBsb2FkVHJhY2tcIik7XG4gICAgICAgIHRyYWNrID0gdHJhY2sgPyB0cmFja1swXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICBuZXcgYm0uY29tcG9uZW50cy5UcmFja1VwbG9hZCgkZWxlbWVudCwgdHJhY2spO1xuICAgIH0pXG59IiwiZXhwb3J0IGNsYXNzIE1lZGlhUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCwgdHJhY2tzKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgdGhpcy50cmFja0xvYWRpbmdQcm9ncmVzc01hcCA9IHt9O1xuICAgICAgICB0aGlzLnRyYWNrcyA9IHRyYWNrcy5tYXAoX19jcmVhdGVBdWRpb1dhdmUuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgY29uc3QgJGNvbnRyb2xzID0ge1xuICAgICAgICAgICAgJyRyZXN0YXJ0JzogdGhpcy4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1yZXN0YXJ0JyksXG4gICAgICAgICAgICAnJHBhdXNlJzogdGhpcy4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wYXVzZScpLFxuICAgICAgICAgICAgJyRwbGF5JzogdGhpcy4kZWxlbWVudC5maW5kKCcubWVkaWEtcGxheWVyX19jb250cm9sLS1wbGF5JylcbiAgICAgICAgfTtcblxuICAgICAgICAkY29udHJvbHMuJHBsYXkub24oXCJjbGlja1wiLCB0aGlzLnBsYXkuYmluZCh0aGlzKSk7XG4gICAgICAgICRjb250cm9scy4kcGF1c2Uub24oXCJjbGlja1wiLCB0aGlzLnBhdXNlLmJpbmQodGhpcykpO1xuICAgICAgICAkY29udHJvbHMuJHJlc3RhcnQub24oXCJjbGlja1wiLCB0aGlzLnJlc3RhcnQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fdHJhY2stdGl0bGUtY29udHJvbC0tbXV0ZVwiKS5vbihcImNsaWNrXCIsIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgcmVzdGFydCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAoIXRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZikoKTtcbiAgICB9XG5cbiAgICBnZXRMb2FkaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB0b3RhbFByb2dyZXNzID0gMCxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwKTtcblxuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgKz0gc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b3RhbFByb2dyZXNzID0gdG90YWxQcm9ncmVzcyAvIGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFByb2dyZXNzO1xuICAgIH1cblxuICAgIGdldExvbmdlc3RUcmFjaygpIHtcbiAgICAgICAgdmFyIGxvbmdlc3RUcmFjayA9IHRoaXMudHJhY2tzWzBdO1xuXG4gICAgICAgIHRoaXMudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdmFyIHRyYWNrRHVyYXRpb24gPSB0cmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICAgICAgICAgIGlmICh0cmFja0R1cmF0aW9uID4gbG9uZ2VzdFRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgIGxvbmdlc3RUcmFjayA9IHRyYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbG9uZ2VzdFRyYWNrO1xuICAgIH1cblxuICAgIGFsbFRyYWNrc0FyZUxvYWRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhY2tzLmV2ZXJ5KHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIXRyYWNrLl9fbG9hZGVkO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRUcmFja0J5SWQodHJhY2tJZCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cmFjay5wayA9PT0gdHJhY2tJZDtcbiAgICAgICAgfSlbMF07XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhY2tNdXRlKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLl9fYXVkaW8udG9nZ2xlTXV0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19jcmVhdGVBdWRpb1dhdmUodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBbdHJhY2sucGtdID0gMDtcbiAgICB2YXIgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgbGluR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCA2NCwgMCwgMjAwKTtcbiAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDIyNSwgMjI1LCAyMjUsIDEuMDAwKScpO1xuICAgIGxpbkdyYWQuYWRkQ29sb3JTdG9wKDAuNSwgJ3JnYmEoMTgzLCAxODMsIDE4MywgMS4wMDApJyk7XG5cbiAgICB2YXIgd2F2ZXN1cmZlciA9IFdhdmVTdXJmZXIuY3JlYXRlKHtcbiAgICAgICAgY29udGFpbmVyOiAnI3dhdmVmb3JtLScgKyB0cmFjay5wayxcbiAgICAgICAgd2F2ZUNvbG9yOiBsaW5HcmFkLFxuICAgICAgICBwcm9ncmVzc0NvbG9yOiAnaHNsYSgyMDAsIDEwMCUsIDMwJSwgMC41KScsXG4gICAgICAgIGN1cnNvckNvbG9yOiAnI2ZmZicsXG4gICAgICAgIGhlaWdodDogNDUsXG4gICAgICAgIGJhcldpZHRoOiAzXG4gICAgfSk7XG5cbiAgICB3YXZlc3VyZmVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgX19vblRyYWNrUmVhZHlFdmVudC5iaW5kKHNlbGYpKHRyYWNrKTtcbiAgICB9KTtcbiAgICB3YXZlc3VyZmVyLm9uKFwiZXJyb3JcIiwgX19vblRyYWNrRXJyb3JFdmVudCk7XG4gICAgd2F2ZXN1cmZlci5vbignbG9hZGluZycsIHByb2dyZXNzID0+IHtcbiAgICAgICAgcmV0dXJuIF9fb25UcmFja0xvYWRpbmdFdmVudC5iaW5kKHNlbGYpKHRyYWNrLCBwcm9ncmVzcyk7XG4gICAgfSk7XG4gICAgd2F2ZXN1cmZlci5vbignc2VlaycsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcblxuICAgIHdhdmVzdXJmZXIubG9hZCh0cmFjay5maWVsZHMubWVkaWFfdXJsKTtcblxuICAgIHRyYWNrLl9fYXVkaW8gPSB3YXZlc3VyZmVyO1xuXG4gICAgcmV0dXJuIHRyYWNrO1xufVxuLy8gLy9cbi8vIC8vICAgICBmdW5jdGlvbiB0b2dnbGVTb2xvRm9yVHJhY2sodHJhY2ssICRldmVudCkge1xuLy8gLy8gICAgICAgICB0cmFjay5pc1NvbG8gPSAhdHJhY2suaXNTb2xvO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyICRjb250cm9sID0gJCgkZXZlbnQudGFyZ2V0KTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suaXNTb2xvKTtcbi8vIC8vICAgICAgICAgJGNvbnRyb2wudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5pc1NvbG8pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgdmFyIHRyYWNrc0FyZVNvbG9lZCA9IHNlbGYudHJhY2tzLnNvbWUoZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHJldHVybiB0LmlzU29sbztcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvL1xuLy8gLy8gICAgICAgICBpZiAoIXRyYWNrc0FyZVNvbG9lZCkge1xuLy8gLy8gICAgICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKGZhbHNlKTtcbi8vIC8vICAgICAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgICAgIHJldHVybjtcbi8vIC8vICAgICAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaChmdW5jdGlvbiAodCkge1xuLy8gLy8gICAgICAgICAgICAgdC5fX2F1ZGlvLnNldE11dGUoIXQuaXNTb2xvKTtcbi8vIC8vICAgICAgICAgfSk7XG4vLyAvLyAgICAgfVxuLy8gLy9cbi8vIC8vICAgICAvLyBQUklWQVRFIEFQSVxuLy8gLy9cbi8vIC8vXG5cbmZ1bmN0aW9uIF9fb25UcmFja1JlYWR5RXZlbnQodHJhY2spIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHRyYWNrLl9fbG9hZGVkID0gdHJ1ZTtcblxuICAgIGlmIChzZWxmLmFsbFRyYWNrc0FyZUxvYWRlZCgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiYWxsIHRyYWNrcyBhcmUgbG9hZGVkXCIpO1xuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG5cbiAgICAgICAgc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5vbihcInBsYXlcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5zZWVrVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tFcnJvckV2ZW50KGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcImVycm9yIHByb2Nlc3NpbmcgdmlkZW9cIiwgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tTZWVrRXZlbnQocHJvZ3Jlc3MpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIC8vIHByZXZlbnQgZXhjZXNzIHNlZWsgZXZlbnRzIGZyb20gZmlyaW5nXG4gICAgdmFyIHByb21pc2VzID0gc2VsZi50cmFja3MubWFwKHRyYWNrID0+IHtcbiAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnVuKFwic2Vla1wiKTtcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgIH0pO1xuXG4gICAgJC53aGVuKHByb21pc2VzKS5kb25lKCgpID0+IHtcbiAgICAgICAgc2VsZi5wYXVzZSgpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5zZWVrVG8ocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5vbihcInNlZWtcIiwgX19vblRyYWNrU2Vla0V2ZW50LmJpbmQoc2VsZikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICB9KS5mYWlsKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX29uVHJhY2tMb2FkaW5nRXZlbnQodHJhY2ssIHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IHByb2dyZXNzO1xuXG4gICAgc2VsZi4kZWxlbWVudC5maW5kKFwiI3Byb2dyZXNzXCIpLmNzcyh7XG4gICAgICAgIHdpZHRoOiBzZWxmLmdldExvYWRpbmdQcm9ncmVzcy5iaW5kKHNlbGYpKCkgKyBcIiVcIlxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgJHRpbWVyID0gc2VsZi4kZWxlbWVudC5maW5kKFwiLm1lZGlhLXBsYXllcl9fY29udHJvbC0tZHVyYXRpb25cIik7XG5cbiAgICBzZWxmLmxvbmdlc3RUcmFjayA9IHNlbGYuZ2V0TG9uZ2VzdFRyYWNrKCk7XG4gICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgc2VsZi5zb25nRHVyYXRpb24gPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICB2YXIgZHVyYXRpb25EYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0R1cmF0aW9uKSxcbiAgICAgICAgc2Vla0RhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nQ3VycmVudFNlZWspO1xuXG4gICAgZnVuY3Rpb24gZGF0ZVRpbWVUb01lZGlhVGltZShkYXRlVGltZSkge1xuICAgICAgICByZXR1cm4gZGF0ZVRpbWUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBTdHJpbmcoXCIwMFwiICsgZGF0ZVRpbWUuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gICAgfVxuXG4gICAgJHRpbWVyLnRleHQoZGF0ZVRpbWVUb01lZGlhVGltZShzZWVrRGF0ZVRpbWUpICsgXCIgLyBcIiArIGRhdGVUaW1lVG9NZWRpYVRpbWUoZHVyYXRpb25EYXRlVGltZSkpO1xuXG4gICAgaWYgKHNlbGYuc29uZ0N1cnJlbnRTZWVrID49IHNlbGYuc29uZ0R1cmF0aW9uKSB7XG4gICAgICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5zb25nRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja011dGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYVwiKS50b2dnbGVDbGFzcyhcImJ0bi1kZWZhdWx0XCIsICF0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xuICAgICR0cmFja0NvbnRyb2wuZmluZChcImFcIikudG9nZ2xlQ2xhc3MoXCJidG4tcHJpbWFyeVwiLCB0cmFjay5fX2F1ZGlvLmlzTXV0ZWQpO1xufSIsImV4cG9ydCBjbGFzcyBUcmFja1VwbG9hZCB7XG4gICAgY29uc3RydWN0b3IoJGVsZW1lbnQsIHRyYWNrKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQgPSAkZWxlbWVudDtcbiAgICAgICAgc2VsZi4kZm9ybVN1Ym1pdEJ0biA9IHNlbGYuJGVsZW1lbnQucGFyZW50cyhcImZvcm1cIikuZmluZChcImJ1dHRvblt0eXBlPSdzdWJtaXQnXVwiKTtcbiAgICAgICAgc2VsZi4kbWVkaWFVcmxJbnB1dCA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5qcy10cmFjay11cGxvYWRfX21lZGlhLXVybFwiKTtcbiAgICAgICAgc2VsZi4kbWVkaWFGaWxlTmFtZSA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5qcy10cmFjay11cGxvYWRfX21lZGlhLWZpbGUtbmFtZVwiKTtcbiAgICAgICAgc2VsZi50cmFjayA9IHRyYWNrO1xuXG4gICAgICAgICRlbGVtZW50LmZpbmQoXCJpbnB1dFt0eXBlPSdmaWxlJ11cIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgJGVsZW1lbnQgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICBzZWxmLiRmb3JtU3VibWl0QnRuLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGpRdWVyeSBGaWxlIFVwbG9hZCB3aWRnZXQ6XG4gICAgICAgICAgICAvLyAkKCcjZmlsZXVwbG9hZCcpLmZpbGV1cGxvYWQoe1xuICAgICAgICAgICAgLy8gVW5jb21tZW50IHRoZSBmb2xsb3dpbmcgdG8gc2VuZCBjcm9zcy1kb21haW4gY29va2llczpcbiAgICAgICAgICAgIC8veGhyRmllbGRzOiB7d2l0aENyZWRlbnRpYWxzOiB0cnVlfSxcbiAgICAgICAgICAgIC8vIHVybDogJ3NlcnZlci9waHAvJ1xuICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSAkZWxlbWVudC5nZXQoMCkuZmlsZXNbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXCJObyBmaWxlIHNlbGVjdGVkLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX19nZXRTaWduZWRSZXF1ZXN0LmJpbmQoc2VsZikoZmlsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19nZXRTaWduZWRSZXF1ZXN0KGZpbGUpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvdHJhY2tzL3VwbG9hZFwiLFxuICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBcImZpbGVfbmFtZVwiOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICBcImZpbGVfdHlwZVwiOiBmaWxlLnR5cGVcbiAgICAgICAgfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF9fdXBsb2FkRmlsZS5iaW5kKHNlbGYpKGZpbGUsIHJlc3BvbnNlLmRhdGEsIHJlc3BvbnNlLnVybCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcGFyc2Ugc29uZyB1cGxvYWQgc2lnbmVkIHJlcXVlc3RcIiwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhocikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkIG5vdCBnZXQgc2lnbmVkIFVSTC5cIiwgeGhyKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwbG9hZEZpbGUoZmlsZSwgczNEYXRhLCB1cmwpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICBsZXQgcG9zdERhdGEgPSBuZXcgRm9ybURhdGEoKTtcblxuICAgIHhoci5vcGVuKFwiUE9TVFwiLCBzM0RhdGEudXJsKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBzM0RhdGEuZmllbGRzKSB7XG4gICAgICAgIHBvc3REYXRhLmFwcGVuZChrZXksIHMzRGF0YS5maWVsZHNba2V5XSk7XG4gICAgfVxuICAgIHBvc3REYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUpO1xuXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwIHx8IHhoci5zdGF0dXMgPT09IDIwNCkge1xuICAgICAgICAgICAgICAgIF9fdXBsb2FkRmlsZVN1Y2Nlc3MuYmluZChzZWxmKShmaWxlLCB1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkIG5vdCB1cGxvYWQgZmlsZS5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhoci5zZW5kKHBvc3REYXRhKTtcbn1cblxuZnVuY3Rpb24gX191cGxvYWRGaWxlU3VjY2VzcyhmaWxlLCB1cmwpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGNvbnNvbGUubG9nKFwiZmlsZSB1cGxvYWQgc3VjY2Vzc1wiLCBmaWxlLCB1cmwpO1xuXG4gICAgc2VsZi4kbWVkaWFVcmxJbnB1dC52YWwodXJsKTtcbiAgICBzZWxmLiRtZWRpYUZpbGVOYW1lLnZhbChmaWxlLm5hbWUpO1xuICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG59IiwiZXhwb3J0cy5zZWNvbmRzVG9EYXRlVGltZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgICBkLnNldFNlY29uZHMoc2Vjb25kcyk7XG4gICAgcmV0dXJuIGQ7XG59OyJdfQ==

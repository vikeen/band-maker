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
        var song = $element.data("bmWidgetTrackUploadSong");

        track = track ? track[0] : undefined;
        song = song ? song[0] : undefined;

        new bm.components.TrackUpload($element, track, song);
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

var TrackUpload = exports.TrackUpload = function TrackUpload($element, track, song) {
    _classCallCheck(this, TrackUpload);

    var self = this;

    self.$element = $element;
    self.$formSubmitBtn = self.$element.parents("form").find("button[type='submit']");
    self.$mediaUrlInput = self.$element.find(".js-track-upload__media-url");
    self.$mediaFileName = self.$element.find(".js-track-upload__media-file-name");
    self.track = track;
    self.song = song;

    console.log(self);

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
        url: "/songs/" + self.song.pk + "/tracks/upload",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL2NvbXBvbmVudHMvdHJhY2tfdXBsb2FkLmpzIiwiYmFuZF9tYWtlci9zdGF0aWMvanMvdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUVBLE9BQU8sRUFBUCxHQUFZO0FBQ1IsZ0JBQVk7QUFDUiw4Q0FEUTtBQUVSO0FBRlEsS0FESjtBQUtSLFdBQU87QUFDSDtBQURHO0FBTEMsQ0FBWjs7QUFXQTs7O0FBR0EsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFNO0FBQ3BCO0FBQ0gsQ0FGRDs7QUFJQSxTQUFTLHVCQUFULEdBQW1DO0FBQy9CLE1BQUUsaUNBQUYsRUFBcUMsSUFBckMsQ0FBMEMsWUFBWTtBQUNsRCxZQUFNLFdBQVcsRUFBRSxJQUFGLENBQWpCO0FBQ0EsWUFBSSxRQUFRLFNBQVMsSUFBVCxDQUFjLDBCQUFkLENBQVo7QUFDQSxZQUFJLE9BQU8sU0FBUyxJQUFULENBQWMseUJBQWQsQ0FBWDs7QUFFQSxnQkFBUSxRQUFRLE1BQU0sQ0FBTixDQUFSLEdBQW1CLFNBQTNCO0FBQ0EsZUFBTyxPQUFPLEtBQUssQ0FBTCxDQUFQLEdBQWlCLFNBQXhCOztBQUVBLFlBQUksR0FBRyxVQUFILENBQWMsV0FBbEIsQ0FBOEIsUUFBOUIsRUFBd0MsS0FBeEMsRUFBK0MsSUFBL0M7QUFDSCxLQVREO0FBVUg7Ozs7Ozs7Ozs7Ozs7SUNqQ1ksVyxXQUFBLFc7QUFDVCx5QkFBWSxRQUFaLEVBQXNCLE1BQXRCLEVBQThCO0FBQUE7O0FBQzFCLFlBQU0sT0FBTyxJQUFiOztBQUVBLGFBQUssUUFBTCxHQUFnQixR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Q0FBM0IsQ0FBUjtBQUNBLE1BQUUsVUFBRixDQUFhLE9BQWI7QUFDQSxXQUFPLENBQVA7QUFDSCxDQUpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7TWVkaWFQbGF5ZXJ9IGZyb20gXCIuL2NvbXBvbmVudHMvbWVkaWFfcGxheWVyXCI7XG5pbXBvcnQge1RyYWNrVXBsb2FkfSBmcm9tIFwiLi9jb21wb25lbnRzL3RyYWNrX3VwbG9hZFwiO1xuaW1wb3J0IHtzZWNvbmRzVG9EYXRlVGltZX0gZnJvbSBcIi4vdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWVcIjtcblxud2luZG93LmJtID0ge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgTWVkaWFQbGF5ZXI6IE1lZGlhUGxheWVyLFxuICAgICAgICBUcmFja1VwbG9hZDogVHJhY2tVcGxvYWRcbiAgICB9LFxuICAgIHV0aWxzOiB7XG4gICAgICAgIHNlY29uZHNUb0RhdGVUaW1lOiBzZWNvbmRzVG9EYXRlVGltZVxuICAgIH1cbn07XG5cblxuLypcbiAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gd2lkZ2V0c1xuICovXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgX19pbml0aWFsaXplVHJhY2tVcGxvYWQoKTtcbn0pO1xuXG5mdW5jdGlvbiBfX2luaXRpYWxpemVUcmFja1VwbG9hZCgpIHtcbiAgICAkKFwiW2RhdGEtYm0td2lkZ2V0PSd0cmFjay11cGxvYWQnXVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBsZXQgdHJhY2sgPSAkZWxlbWVudC5kYXRhKFwiYm1XaWRnZXRUcmFja1VwbG9hZFRyYWNrXCIpO1xuICAgICAgICBsZXQgc29uZyA9ICRlbGVtZW50LmRhdGEoXCJibVdpZGdldFRyYWNrVXBsb2FkU29uZ1wiKTtcblxuICAgICAgICB0cmFjayA9IHRyYWNrID8gdHJhY2tbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHNvbmcgPSBzb25nID8gc29uZ1swXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICBuZXcgYm0uY29tcG9uZW50cy5UcmFja1VwbG9hZCgkZWxlbWVudCwgdHJhY2ssIHNvbmcpO1xuICAgIH0pXG59IiwiZXhwb3J0IGNsYXNzIE1lZGlhUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcigkZWxlbWVudCwgdHJhY2tzKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQgPSAkZWxlbWVudDtcblxuICAgICAgICBzZWxmLmxvYWRUcmFja3ModHJhY2tzKTtcblxuICAgICAgICBjb25zdCAkY29udHJvbHMgPSB7XG4gICAgICAgICAgICAnJHJlc3RhcnQnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXJlc3RhcnQnKSxcbiAgICAgICAgICAgICckcGF1c2UnOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBhdXNlJyksXG4gICAgICAgICAgICAnJHBsYXknOiBzZWxmLiRlbGVtZW50LmZpbmQoJy5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLXBsYXknKVxuICAgICAgICB9O1xuXG4gICAgICAgICRjb250cm9scy4kcGxheS5vbihcImNsaWNrXCIsIHNlbGYucGxheS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRwYXVzZS5vbihcImNsaWNrXCIsIHNlbGYucGF1c2UuYmluZChzZWxmKSk7XG4gICAgICAgICRjb250cm9scy4kcmVzdGFydC5vbihcImNsaWNrXCIsIHNlbGYucmVzdGFydC5iaW5kKHNlbGYpKTtcblxuICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX190cmFjay10aXRsZS1jb250cm9sLS1tdXRlXCIpLm9uKFwiY2xpY2tcIiwgX19oYW5kbGVUcmFja011dGVDbGljay5iaW5kKHNlbGYpKTtcbiAgICB9XG5cbiAgICBsb2FkVHJhY2tzKHRyYWNrcykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwID0ge307XG5cbiAgICAgICAgc2VsZi50cmFja3MgPSB0cmFja3MubWFwKF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikpO1xuICAgIH1cblxuICAgIHJlcGxhY2VUcmFja0J5SWQodHJhY2tJZCwgbmV3VHJhY2spIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MgPSBzZWxmLnRyYWNrcy5tYXAodHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLnBrID09PSB0cmFja0lkKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLmVtcHR5KCk7IC8vIHdpcGUgd2F2ZXN1cmZlciBkYXRhIGFuZCBldmVudHNcbiAgICAgICAgICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjd2F2ZWZvcm0tXCIgKyB0cmFja0lkKS5maW5kKFwid2F2ZVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0cmFjayA9IF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikobmV3VHJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJhY2s7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnBsYXkoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi50cmFja3MuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2suX19hdWRpbyAmJiAhdHJhY2suX19hdWRpby5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ucGxheSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIHBhdXNlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjay5fX2F1ZGlvICYmIHRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgZ2V0TG9hZGluZ1Byb2dyZXNzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBsZXQgdG90YWxQcm9ncmVzcyA9IDAsXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCk7XG5cbiAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICB0b3RhbFByb2dyZXNzICs9IHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG90YWxQcm9ncmVzcyA9IHRvdGFsUHJvZ3Jlc3MgLyBrZXlzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gdG90YWxQcm9ncmVzcztcbiAgICB9XG5cbiAgICBnZXRMb25nZXN0VHJhY2soKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgdHJhY2tzV2l0aE1lZGlhID0gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+ICEhdHJhY2suZmllbGRzLm1lZGlhX3VybCk7XG5cbiAgICAgICAgbGV0IGxvbmdlc3RUcmFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0cmFja3NXaXRoTWVkaWEuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgICAgICBsb25nZXN0VHJhY2sgPSBsb25nZXN0VHJhY2sgfHwgdHJhY2s7XG4gICAgICAgICAgICBsZXQgdHJhY2tEdXJhdGlvbiA9IHRyYWNrLl9fYXVkaW8uZ2V0RHVyYXRpb24oKTtcblxuICAgICAgICAgICAgaWYgKHRyYWNrRHVyYXRpb24gPiBsb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgbG9uZ2VzdFRyYWNrID0gdHJhY2s7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxvbmdlc3RUcmFjaztcbiAgICB9XG5cbiAgICBhbGxUcmFja3NBcmVMb2FkZWQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnRyYWNrcy5ldmVyeSh0cmFjayA9PiAhIXRyYWNrLl9fbG9hZGVkKTtcbiAgICB9XG5cbiAgICBnZXRUcmFja0J5SWQodHJhY2tJZCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi50cmFja3MuZmlsdGVyKHRyYWNrID0+IHRyYWNrLnBrID09PSB0cmFja0lkKVswXTtcbiAgICB9XG5cbiAgICB0b2dnbGVUcmFja011dGUodHJhY2spIHtcbiAgICAgICAgdHJhY2suX19hdWRpbyAmJiB0cmFjay5fX2F1ZGlvLnRvZ2dsZU11dGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fY3JlYXRlQXVkaW9XYXZlKHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodHJhY2suZmllbGRzLm1lZGlhX3VybCkge1xuICAgICAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IDA7XG4gICAgICAgIHZhciBjdHggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB2YXIgbGluR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCA2NCwgMCwgMjAwKTtcbiAgICAgICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgyMjUsIDIyNSwgMjI1LCAxLjAwMCknKTtcbiAgICAgICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgxODMsIDE4MywgMTgzLCAxLjAwMCknKTtcblxuICAgICAgICB2YXIgd2F2ZXN1cmZlciA9IFdhdmVTdXJmZXIuY3JlYXRlKHtcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJyN3YXZlZm9ybS0nICsgdHJhY2sucGssXG4gICAgICAgICAgICB3YXZlQ29sb3I6IGxpbkdyYWQsXG4gICAgICAgICAgICBwcm9ncmVzc0NvbG9yOiAnaHNsYSgyMDAsIDEwMCUsIDMwJSwgMC41KScsXG4gICAgICAgICAgICBjdXJzb3JDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgaGVpZ2h0OiA0NSxcbiAgICAgICAgICAgIGJhcldpZHRoOiAzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdhdmVzdXJmZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgX19vblRyYWNrUmVhZHlFdmVudC5iaW5kKHNlbGYpKHRyYWNrKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhdmVzdXJmZXIub24oXCJlcnJvclwiLCBfX29uVHJhY2tFcnJvckV2ZW50KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbignbG9hZGluZycsIHByb2dyZXNzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfX29uVHJhY2tMb2FkaW5nRXZlbnQuYmluZChzZWxmKSh0cmFjaywgcHJvZ3Jlc3MpO1xuICAgICAgICB9KTtcbiAgICAgICAgd2F2ZXN1cmZlci5vbignc2VlaycsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcblxuICAgICAgICB3YXZlc3VyZmVyLmxvYWQodHJhY2suZmllbGRzLm1lZGlhX3VybCk7XG5cbiAgICAgICAgdHJhY2suX19hdWRpbyA9IHdhdmVzdXJmZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJhY2suX19sb2FkZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFjaztcbn1cbi8vIC8vXG4vLyAvLyAgICAgZnVuY3Rpb24gdG9nZ2xlU29sb0ZvclRyYWNrKHRyYWNrLCAkZXZlbnQpIHtcbi8vIC8vICAgICAgICAgdHJhY2suaXNTb2xvID0gIXRyYWNrLmlzU29sbztcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciAkY29udHJvbCA9ICQoJGV2ZW50LnRhcmdldCk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLmlzU29sbyk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suaXNTb2xvKTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciB0cmFja3NBcmVTb2xvZWQgPSBzZWxmLnRyYWNrcy5zb21lKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICByZXR1cm4gdC5pc1NvbG87XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgaWYgKCF0cmFja3NBcmVTb2xvZWQpIHtcbi8vIC8vICAgICAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZShmYWxzZSk7XG4vLyAvLyAgICAgICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgICAgICByZXR1cm47XG4vLyAvLyAgICAgICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKCF0LmlzU29sbyk7XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy8gICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgLy8gUFJJVkFURSBBUElcbi8vIC8vXG4vLyAvL1xuXG5mdW5jdGlvbiBfX29uVHJhY2tSZWFkeUV2ZW50KHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG5cbiAgICBpZiAoc2VsZi5hbGxUcmFja3NBcmVMb2FkZWQoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImFsbCB0cmFja3MgYXJlIGxvYWRlZFwiKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuXG4gICAgICAgIHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8ub24oXCJwbGF5XCIsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuc2Vla1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZiksIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19vblRyYWNrRXJyb3JFdmVudChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBwcm9jZXNzaW5nIHZpZGVvXCIsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrU2Vla0V2ZW50KHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMsXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYSA9IHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiAhIXRyYWNrLmZpZWxkcy5tZWRpYV91cmwpO1xuXG4gICAgLy8gcHJldmVudCBleGNlc3Mgc2VlayBldmVudHMgZnJvbSBmaXJpbmdcbiAgICBsZXQgcHJvbWlzZXMgPSB0cmFja3NXaXRoTWVkaWEubWFwKHRyYWNrID0+IHtcbiAgICAgICAgdmFyIGRlZmVyID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnVuKFwic2Vla1wiKTtcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgIH0pO1xuXG4gICAgJC53aGVuKHByb21pc2VzKS5kb25lKCgpID0+IHtcbiAgICAgICAgc2VsZi5wYXVzZSgpO1xuXG4gICAgICAgIHRyYWNrc1dpdGhNZWRpYS5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8uc2Vla1RvKHByb2dyZXNzKTtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ub24oXCJzZWVrXCIsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5wbGF5KCk7XG4gICAgfSkuZmFpbChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrTG9hZGluZ0V2ZW50KHRyYWNrLCBwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSBwcm9ncmVzcztcblxuICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiNwcm9ncmVzc1wiKS5jc3Moe1xuICAgICAgICB3aWR0aDogc2VsZi5nZXRMb2FkaW5nUHJvZ3Jlc3MuYmluZChzZWxmKSgpICsgXCIlXCJcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX191cGRhdGVTb25nRHVyYXRpb25zKCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGxldCAkdGltZXIgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIubWVkaWEtcGxheWVyX19jb250cm9sLS1kdXJhdGlvblwiKTtcblxuICAgIHNlbGYubG9uZ2VzdFRyYWNrID0gc2VsZi5nZXRMb25nZXN0VHJhY2soKTtcblxuICAgIC8vIG5vIHRyYWNrcyB0byBtZWRpYSBkdXJhdGlvbiBmcm9tXG4gICAgaWYgKCFzZWxmLmxvbmdlc3RUcmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5zb25nQ3VycmVudFNlZWsgPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgc2VsZi5zb25nRHVyYXRpb24gPSBzZWxmLmxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCk7XG5cbiAgICBsZXQgZHVyYXRpb25EYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0R1cmF0aW9uKSxcbiAgICAgICAgc2Vla0RhdGVUaW1lID0gYm0udXRpbHMuc2Vjb25kc1RvRGF0ZVRpbWUoc2VsZi5zb25nQ3VycmVudFNlZWspO1xuXG4gICAgZnVuY3Rpb24gZGF0ZVRpbWVUb01lZGlhVGltZShkYXRlVGltZSkge1xuICAgICAgICByZXR1cm4gZGF0ZVRpbWUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBTdHJpbmcoXCIwMFwiICsgZGF0ZVRpbWUuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gICAgfVxuXG4gICAgJHRpbWVyLnRleHQoZGF0ZVRpbWVUb01lZGlhVGltZShzZWVrRGF0ZVRpbWUpICsgXCIgLyBcIiArIGRhdGVUaW1lVG9NZWRpYVRpbWUoZHVyYXRpb25EYXRlVGltZSkpO1xuXG4gICAgaWYgKHNlbGYuc29uZ0N1cnJlbnRTZWVrID49IHNlbGYuc29uZ0R1cmF0aW9uKSB7XG4gICAgICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5zb25nRHVyYXRpb247XG5cbiAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gX19oYW5kbGVUcmFja011dGVDbGljayhldmVudCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICAkdHJhY2tDb250cm9sID0gJChldmVudC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgdHJhY2tJZCA9ICR0cmFja0NvbnRyb2wucGFyZW50cyhcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrXCIpLmRhdGEoXCJ0cmFja0lkXCIpLFxuICAgICAgICB0cmFjayA9IHNlbGYuZ2V0VHJhY2tCeUlkKHRyYWNrSWQpO1xuXG4gICAgc2VsZi50b2dnbGVUcmFja011dGUodHJhY2spO1xuXG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLl9fYXVkaW8uaXNNdXRlZCk7XG4gICAgJHRyYWNrQ29udHJvbC5maW5kKFwiYnV0dG9uXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suX19hdWRpby5pc011dGVkKTtcbn0iLCJleHBvcnQgY2xhc3MgVHJhY2tVcGxvYWQge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50LCB0cmFjaywgc29uZykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4gPSBzZWxmLiRlbGVtZW50LnBhcmVudHMoXCJmb3JtXCIpLmZpbmQoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgIHNlbGYuJG1lZGlhVXJsSW5wdXQgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIuanMtdHJhY2stdXBsb2FkX19tZWRpYS11cmxcIik7XG4gICAgICAgIHNlbGYuJG1lZGlhRmlsZU5hbWUgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIuanMtdHJhY2stdXBsb2FkX19tZWRpYS1maWxlLW5hbWVcIik7XG4gICAgICAgIHNlbGYudHJhY2sgPSB0cmFjaztcbiAgICAgICAgc2VsZi5zb25nID0gc29uZztcblxuICAgICAgICBjb25zb2xlLmxvZyhzZWxmKTtcblxuICAgICAgICAkZWxlbWVudC5maW5kKFwiaW5wdXRbdHlwZT0nZmlsZSddXCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0ICRlbGVtZW50ID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgc2VsZi4kZm9ybVN1Ym1pdEJ0bi5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gJGVsZW1lbnQuZ2V0KDApLmZpbGVzWzBdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKFwiTm8gZmlsZSBzZWxlY3RlZC5cIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX19nZXRTaWduZWRSZXF1ZXN0LmJpbmQoc2VsZikoZmlsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19nZXRTaWduZWRSZXF1ZXN0KGZpbGUpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvc29uZ3MvXCIgKyBzZWxmLnNvbmcucGsgKyBcIi90cmFja3MvdXBsb2FkXCIsXG4gICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIFwiZmlsZV9uYW1lXCI6IGZpbGUubmFtZSxcbiAgICAgICAgICAgIFwiZmlsZV90eXBlXCI6IGZpbGUudHlwZVxuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX191cGxvYWRGaWxlLmJpbmQoc2VsZikoZmlsZSwgcmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UudXJsKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSBzb25nIHVwbG9hZCBzaWduZWQgcmVxdWVzdFwiLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGdldCBzaWduZWQgVVJMLlwiLCB4aHIpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9fdXBsb2FkRmlsZShmaWxlLCBzM0RhdGEsIHVybCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLFxuICAgICAgICB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIGxldCBwb3N0RGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgeGhyLm9wZW4oXCJQT1NUXCIsIHMzRGF0YS51cmwpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHMzRGF0YS5maWVsZHMpIHtcbiAgICAgICAgcG9zdERhdGEuYXBwZW5kKGtleSwgczNEYXRhLmZpZWxkc1trZXldKTtcbiAgICB9XG4gICAgcG9zdERhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7XG5cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDAgfHwgeGhyLnN0YXR1cyA9PT0gMjA0KSB7XG4gICAgICAgICAgICAgICAgX191cGxvYWRGaWxlU3VjY2Vzcy5iaW5kKHNlbGYpKGZpbGUsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IHVwbG9hZCBmaWxlLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgeGhyLnNlbmQocG9zdERhdGEpO1xufVxuXG5mdW5jdGlvbiBfX3VwbG9hZEZpbGVTdWNjZXNzKGZpbGUsIHVybCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgY29uc29sZS5sb2coXCJmaWxlIHVwbG9hZCBzdWNjZXNzXCIsIGZpbGUsIHVybCk7XG5cbiAgICBzZWxmLiRtZWRpYVVybElucHV0LnZhbCh1cmwpO1xuICAgIHNlbGYuJG1lZGlhRmlsZU5hbWUudmFsKGZpbGUubmFtZSk7XG4gICAgc2VsZi4kZm9ybVN1Ym1pdEJ0bi5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgIC8vIHJlaW5pdGlhbGl6ZSBhbnkgYXNzb2NpYXRlZCBtZWRpYSBwbGF5ZXJzXG4gICAgaWYgKHdpbmRvdy5ibS5tZWRpYVBsYXllcikge1xuICAgICAgICBzZWxmLnRyYWNrLmZpZWxkcy5tZWRpYV9uYW1lID0gZmlsZS5uYW1lO1xuICAgICAgICBzZWxmLnRyYWNrLmZpZWxkcy5tZWRpYV91cmwgPSB1cmw7XG5cbiAgICAgICAgd2luZG93LmJtLm1lZGlhUGxheWVyLnJlcGxhY2VUcmFja0J5SWQoc2VsZi50cmFjay5waywgc2VsZi50cmFjayk7XG4gICAgfVxufSIsImV4cG9ydHMuc2Vjb25kc1RvRGF0ZVRpbWUgPSBmdW5jdGlvbiAoc2Vjb25kcykge1xuICAgIHZhciBkID0gbmV3IERhdGUoMCwgMCwgMCwgMCwgMCwgMCwgMCk7XG4gICAgZC5zZXRTZWNvbmRzKHNlY29uZHMpO1xuICAgIHJldHVybiBkO1xufTsiXX0=

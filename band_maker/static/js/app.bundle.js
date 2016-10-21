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

            console.log(self, arguments);

            self.tracks.map(function (track) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9hcHAuanMiLCJiYW5kX21ha2VyL3N0YXRpYy9qcy9jb21wb25lbnRzL21lZGlhX3BsYXllci5qcyIsImJhbmRfbWFrZXIvc3RhdGljL2pzL2NvbXBvbmVudHMvdHJhY2tfdXBsb2FkLmpzIiwiYmFuZF9tYWtlci9zdGF0aWMvanMvdXRpbHMvc2Vjb25kc190b19kYXRlX3RpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUVBLE9BQU8sRUFBUCxHQUFZO0FBQ1IsZ0JBQVk7QUFDUiw4Q0FEUTtBQUVSO0FBRlEsS0FESjtBQUtSLFdBQU87QUFDSDtBQURHO0FBTEMsQ0FBWjs7QUFXQTs7O0FBR0EsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFNO0FBQ3BCO0FBQ0gsQ0FGRDs7QUFJQSxTQUFTLHVCQUFULEdBQW1DO0FBQy9CLE1BQUUsaUNBQUYsRUFBcUMsSUFBckMsQ0FBMEMsWUFBWTtBQUNsRCxZQUFNLFdBQVcsRUFBRSxJQUFGLENBQWpCO0FBQ0EsWUFBSSxRQUFRLFNBQVMsSUFBVCxDQUFjLDBCQUFkLENBQVo7QUFDQSxnQkFBUSxRQUFRLE1BQU0sQ0FBTixDQUFSLEdBQW1CLFNBQTNCOztBQUVBLFlBQUksR0FBRyxVQUFILENBQWMsV0FBbEIsQ0FBOEIsUUFBOUIsRUFBd0MsS0FBeEM7QUFDSCxLQU5EO0FBT0g7Ozs7Ozs7Ozs7Ozs7SUM5QlksVyxXQUFBLFc7QUFDVCx5QkFBWSxRQUFaLEVBQXNCLE1BQXRCLEVBQThCO0FBQUE7O0FBQzFCLFlBQU0sT0FBTyxJQUFiOztBQUVBLGFBQUssUUFBTCxHQUFnQixRQUFoQjs7QUFFQSxhQUFLLFVBQUwsQ0FBZ0IsTUFBaEI7O0FBRUEsWUFBTSxZQUFZO0FBQ2Qsd0JBQVksS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixpQ0FBbkIsQ0FERTtBQUVkLHNCQUFVLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsK0JBQW5CLENBRkk7QUFHZCxxQkFBUyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLDhCQUFuQjtBQUhLLFNBQWxCOztBQU1BLGtCQUFVLEtBQVYsQ0FBZ0IsRUFBaEIsQ0FBbUIsT0FBbkIsRUFBNEIsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsQ0FBNUI7QUFDQSxrQkFBVSxNQUFWLENBQWlCLEVBQWpCLENBQW9CLE9BQXBCLEVBQTZCLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBN0I7QUFDQSxrQkFBVSxRQUFWLENBQW1CLEVBQW5CLENBQXNCLE9BQXRCLEVBQStCLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEIsQ0FBL0I7O0FBRUEsYUFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQiwwQ0FBbkIsRUFBK0QsRUFBL0QsQ0FBa0UsT0FBbEUsRUFBMkUsdUJBQXVCLElBQXZCLENBQTRCLElBQTVCLENBQTNFO0FBQ0g7Ozs7bUNBRVUsTSxFQUFRO0FBQ2YsZ0JBQU0sT0FBTyxJQUFiOztBQUVBLGlCQUFLLHVCQUFMLEdBQStCLEVBQS9COztBQUVBLGlCQUFLLE1BQUwsR0FBYyxPQUFPLEdBQVAsQ0FBVyxrQkFBa0IsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBWCxDQUFkO0FBQ0g7Ozt5Q0FFZ0IsTyxFQUFTLFEsRUFBVTtBQUNoQyxnQkFBTSxPQUFPLElBQWI7O0FBRUEsb0JBQVEsR0FBUixDQUFZLElBQVosRUFBa0IsU0FBbEI7O0FBRUEsaUJBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsaUJBQVM7QUFDckIsb0JBQUksTUFBTSxFQUFOLEtBQWEsT0FBakIsRUFBMEI7QUFDdEIsMEJBQU0sT0FBTixDQUFjLEtBQWQsR0FEc0IsQ0FDQztBQUN2Qix5QkFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixlQUFlLE9BQWxDLEVBQTJDLElBQTNDLENBQWdELE1BQWhELEVBQXdELE1BQXhEO0FBQ0EsNEJBQVEsa0JBQWtCLElBQWxCLENBQXVCLElBQXZCLEVBQTZCLFFBQTdCLENBQVI7QUFDSDs7QUFFRCx1QkFBTyxLQUFQO0FBQ0gsYUFSRDtBQVNIOzs7a0NBRVM7QUFDTixnQkFBTSxPQUFPLElBQWI7O0FBRUEsaUJBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsaUJBQVM7QUFDekIsc0JBQU0sT0FBTixDQUFjLElBQWQsQ0FBbUIsQ0FBbkI7QUFDSCxhQUZEOztBQUlBLGtDQUFzQixJQUF0QixDQUEyQixJQUEzQjtBQUNIOzs7K0JBRU07QUFDSCxnQkFBTSxPQUFPLElBQWI7O0FBRUEsaUJBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsaUJBQVM7QUFDekIsb0JBQUksQ0FBQyxNQUFNLE9BQU4sQ0FBYyxTQUFkLEVBQUwsRUFBZ0M7QUFDNUIsMEJBQU0sT0FBTixDQUFjLElBQWQ7QUFDSDtBQUNKLGFBSkQ7O0FBTUEsa0NBQXNCLElBQXRCLENBQTJCLElBQTNCO0FBQ0g7OztnQ0FFTztBQUNKLGdCQUFNLE9BQU8sSUFBYjs7QUFFQSxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixpQkFBUztBQUN6QixvQkFBSSxNQUFNLE9BQU4sQ0FBYyxTQUFkLEVBQUosRUFBK0I7QUFDM0IsMEJBQU0sT0FBTixDQUFjLEtBQWQ7QUFDSDtBQUNKLGFBSkQ7O0FBTUEsa0NBQXNCLElBQXRCLENBQTJCLElBQTNCO0FBQ0g7Ozs2Q0FFb0I7QUFDakIsZ0JBQU0sT0FBTyxJQUFiOztBQUVBLGdCQUFJLGdCQUFnQixDQUFwQjtBQUFBLGdCQUNJLE9BQU8sT0FBTyxJQUFQLENBQVksS0FBSyx1QkFBakIsQ0FEWDs7QUFHQSxpQkFBSyxPQUFMLENBQWEsZUFBTztBQUNoQixpQ0FBaUIsS0FBSyx1QkFBTCxDQUE2QixHQUE3QixDQUFqQjtBQUNILGFBRkQ7O0FBSUEsNEJBQWdCLGdCQUFnQixLQUFLLE1BQXJDOztBQUVBLG1CQUFPLGFBQVA7QUFDSDs7OzBDQUVpQjtBQUNkLGdCQUFJLGVBQWUsS0FBSyxNQUFMLENBQVksQ0FBWixDQUFuQjs7QUFFQSxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixpQkFBUztBQUN6QixvQkFBSSxnQkFBZ0IsTUFBTSxPQUFOLENBQWMsV0FBZCxFQUFwQjs7QUFFQSxvQkFBSSxnQkFBZ0IsYUFBYSxPQUFiLENBQXFCLFdBQXJCLEVBQXBCLEVBQXdEO0FBQ3BELG1DQUFlLEtBQWY7QUFDSDtBQUNKLGFBTkQ7O0FBUUEsbUJBQU8sWUFBUDtBQUNIOzs7NkNBRW9CO0FBQ2pCLG1CQUFPLEtBQUssTUFBTCxDQUFZLEtBQVosQ0FBa0IsaUJBQVM7QUFDOUIsdUJBQU8sQ0FBQyxDQUFDLE1BQU0sUUFBZjtBQUNILGFBRk0sQ0FBUDtBQUdIOzs7cUNBRVksTyxFQUFTO0FBQ2xCLGdCQUFNLE9BQU8sSUFBYjs7QUFFQSxtQkFBTyxLQUFLLE1BQUwsQ0FBWSxNQUFaLENBQW1CLGlCQUFTO0FBQy9CLHVCQUFPLE1BQU0sRUFBTixLQUFhLE9BQXBCO0FBQ0gsYUFGTSxFQUVKLENBRkksQ0FBUDtBQUdIOzs7d0NBRWUsSyxFQUFPO0FBQ25CLGtCQUFNLE9BQU4sQ0FBYyxVQUFkO0FBQ0g7Ozs7OztBQUdMLFNBQVMsaUJBQVQsQ0FBMkIsS0FBM0IsRUFBa0M7QUFDOUIsUUFBTSxPQUFPLElBQWI7O0FBRUEsU0FBSyx1QkFBTCxDQUE2QixNQUFNLEVBQW5DLElBQXlDLENBQXpDO0FBQ0EsUUFBSSxNQUFNLFNBQVMsYUFBVCxDQUF1QixRQUF2QixFQUFpQyxVQUFqQyxDQUE0QyxJQUE1QyxDQUFWO0FBQ0EsUUFBSSxVQUFVLElBQUksb0JBQUosQ0FBeUIsQ0FBekIsRUFBNEIsRUFBNUIsRUFBZ0MsQ0FBaEMsRUFBbUMsR0FBbkMsQ0FBZDtBQUNBLFlBQVEsWUFBUixDQUFxQixHQUFyQixFQUEwQiw0QkFBMUI7QUFDQSxZQUFRLFlBQVIsQ0FBcUIsR0FBckIsRUFBMEIsNEJBQTFCOztBQUVBLFFBQUksYUFBYSxXQUFXLE1BQVgsQ0FBa0I7QUFDL0IsbUJBQVcsZUFBZSxNQUFNLEVBREQ7QUFFL0IsbUJBQVcsT0FGb0I7QUFHL0IsdUJBQWUsMkJBSGdCO0FBSS9CLHFCQUFhLE1BSmtCO0FBSy9CLGdCQUFRLEVBTHVCO0FBTS9CLGtCQUFVO0FBTnFCLEtBQWxCLENBQWpCOztBQVNBLGVBQVcsRUFBWCxDQUFjLE9BQWQsRUFBdUIsWUFBTTtBQUN6Qiw0QkFBb0IsSUFBcEIsQ0FBeUIsSUFBekIsRUFBK0IsS0FBL0I7QUFDSCxLQUZEO0FBR0EsZUFBVyxFQUFYLENBQWMsT0FBZCxFQUF1QixtQkFBdkI7QUFDQSxlQUFXLEVBQVgsQ0FBYyxTQUFkLEVBQXlCLG9CQUFZO0FBQ2pDLGVBQU8sc0JBQXNCLElBQXRCLENBQTJCLElBQTNCLEVBQWlDLEtBQWpDLEVBQXdDLFFBQXhDLENBQVA7QUFDSCxLQUZEO0FBR0EsZUFBVyxFQUFYLENBQWMsTUFBZCxFQUFzQixtQkFBbUIsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBdEI7O0FBRUEsZUFBVyxJQUFYLENBQWdCLE1BQU0sTUFBTixDQUFhLFNBQTdCOztBQUVBLFVBQU0sT0FBTixHQUFnQixVQUFoQjs7QUFFQSxXQUFPLEtBQVA7QUFDSDtBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVMsbUJBQVQsQ0FBNkIsS0FBN0IsRUFBb0M7QUFDaEMsUUFBTSxPQUFPLElBQWI7O0FBRUEsVUFBTSxRQUFOLEdBQWlCLElBQWpCOztBQUVBLFFBQUksS0FBSyxrQkFBTCxFQUFKLEVBQStCO0FBQzNCLGdCQUFRLEdBQVIsQ0FBWSx1QkFBWjtBQUNBLGFBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsV0FBbkIsRUFBZ0MsSUFBaEM7O0FBRUEsOEJBQXNCLElBQXRCLENBQTJCLElBQTNCOztBQUVBLGFBQUssWUFBTCxDQUFrQixPQUFsQixDQUEwQixFQUExQixDQUE2QixNQUE3QixFQUFxQyxZQUFNOztBQUV2QyxnQkFBSSxLQUFLLGtCQUFULEVBQTZCO0FBQ3pCLDhCQUFjLEtBQUssa0JBQW5CO0FBQ0g7O0FBRUQsaUJBQUssa0JBQUwsR0FBMEIsWUFBWSxzQkFBc0IsSUFBdEIsQ0FBMkIsSUFBM0IsQ0FBWixFQUE4QyxHQUE5QyxDQUExQjtBQUNILFNBUEQ7QUFRSDtBQUNKOztBQUVELFNBQVMsbUJBQVQsQ0FBNkIsS0FBN0IsRUFBb0M7QUFDaEMsWUFBUSxLQUFSLENBQWMsd0JBQWQsRUFBd0MsS0FBeEM7QUFDSDs7QUFFRCxTQUFTLGtCQUFULENBQTRCLFFBQTVCLEVBQXNDO0FBQ2xDLFFBQU0sT0FBTyxJQUFiOztBQUVBO0FBQ0EsUUFBSSxXQUFXLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsaUJBQVM7QUFDcEMsWUFBSSxRQUFRLEVBQUUsUUFBRixFQUFaOztBQUVBLFlBQUk7QUFDQSxrQkFBTSxPQUFOLENBQWMsRUFBZCxDQUFpQixNQUFqQjtBQUNBLGtCQUFNLE9BQU47QUFDSCxTQUhELENBR0UsT0FBTyxLQUFQLEVBQWM7QUFDWixvQkFBUSxHQUFSLENBQVksS0FBWjtBQUNBLGtCQUFNLE1BQU4sQ0FBYSxLQUFiO0FBQ0g7O0FBRUQsZUFBTyxNQUFNLE9BQU4sRUFBUDtBQUNILEtBWmMsQ0FBZjs7QUFjQSxNQUFFLElBQUYsQ0FBTyxRQUFQLEVBQWlCLElBQWpCLENBQXNCLFlBQU07QUFDeEIsYUFBSyxLQUFMOztBQUVBLGFBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsaUJBQVM7QUFDekIsa0JBQU0sT0FBTixDQUFjLE1BQWQsQ0FBcUIsUUFBckI7QUFDQSxrQkFBTSxPQUFOLENBQWMsRUFBZCxDQUFpQixNQUFqQixFQUF5QixtQkFBbUIsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBekI7QUFDSCxTQUhEOztBQUtBLGFBQUssSUFBTDtBQUNILEtBVEQsRUFTRyxJQVRILENBU1EsaUJBQVM7QUFDYixnQkFBUSxHQUFSLENBQVksS0FBWjtBQUNILEtBWEQ7QUFZSDs7QUFFRCxTQUFTLHFCQUFULENBQStCLEtBQS9CLEVBQXNDLFFBQXRDLEVBQWdEO0FBQzVDLFFBQU0sT0FBTyxJQUFiOztBQUVBLFNBQUssdUJBQUwsQ0FBNkIsTUFBTSxFQUFuQyxJQUF5QyxRQUF6Qzs7QUFFQSxTQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLFdBQW5CLEVBQWdDLEdBQWhDLENBQW9DO0FBQ2hDLGVBQU8sS0FBSyxrQkFBTCxDQUF3QixJQUF4QixDQUE2QixJQUE3QixNQUF1QztBQURkLEtBQXBDO0FBR0g7O0FBRUQsU0FBUyxxQkFBVCxHQUFpQztBQUM3QixRQUFNLE9BQU8sSUFBYjs7QUFFQSxRQUFJLFNBQVMsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixrQ0FBbkIsQ0FBYjs7QUFFQSxTQUFLLFlBQUwsR0FBb0IsS0FBSyxlQUFMLEVBQXBCO0FBQ0EsU0FBSyxlQUFMLEdBQXVCLEtBQUssWUFBTCxDQUFrQixPQUFsQixDQUEwQixjQUExQixFQUF2QjtBQUNBLFNBQUssWUFBTCxHQUFvQixLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsQ0FBMEIsV0FBMUIsRUFBcEI7O0FBRUEsUUFBSSxtQkFBbUIsR0FBRyxLQUFILENBQVMsaUJBQVQsQ0FBMkIsS0FBSyxZQUFoQyxDQUF2QjtBQUFBLFFBQ0ksZUFBZSxHQUFHLEtBQUgsQ0FBUyxpQkFBVCxDQUEyQixLQUFLLGVBQWhDLENBRG5COztBQUdBLGFBQVMsbUJBQVQsQ0FBNkIsUUFBN0IsRUFBdUM7QUFDbkMsZUFBTyxTQUFTLFVBQVQsS0FBd0IsR0FBeEIsR0FBOEIsT0FBTyxPQUFPLFNBQVMsVUFBVCxFQUFkLEVBQXFDLEtBQXJDLENBQTJDLENBQUMsQ0FBNUMsQ0FBckM7QUFDSDs7QUFFRCxXQUFPLElBQVAsQ0FBWSxvQkFBb0IsWUFBcEIsSUFBb0MsS0FBcEMsR0FBNEMsb0JBQW9CLGdCQUFwQixDQUF4RDs7QUFFQSxRQUFJLEtBQUssZUFBTCxJQUF3QixLQUFLLFlBQWpDLEVBQStDO0FBQzNDLGFBQUssZUFBTCxHQUF1QixLQUFLLFlBQTVCOztBQUVBLFlBQUksS0FBSyxrQkFBVCxFQUE2QjtBQUN6QiwwQkFBYyxLQUFLLGtCQUFuQjtBQUNIO0FBQ0o7QUFDSjs7QUFFRCxTQUFTLHNCQUFULENBQWdDLEtBQWhDLEVBQXVDO0FBQ25DLFFBQU0sT0FBTyxJQUFiO0FBQUEsUUFDSSxnQkFBZ0IsRUFBRSxNQUFNLGFBQVIsQ0FEcEI7QUFBQSxRQUVJLFVBQVUsY0FBYyxPQUFkLENBQXNCLHNCQUF0QixFQUE4QyxJQUE5QyxDQUFtRCxTQUFuRCxDQUZkO0FBQUEsUUFHSSxRQUFRLEtBQUssWUFBTCxDQUFrQixPQUFsQixDQUhaOztBQUtBLFNBQUssZUFBTCxDQUFxQixLQUFyQjs7QUFFQSxrQkFBYyxJQUFkLENBQW1CLEdBQW5CLEVBQXdCLFdBQXhCLENBQW9DLGFBQXBDLEVBQW1ELENBQUMsTUFBTSxPQUFOLENBQWMsT0FBbEU7QUFDQSxrQkFBYyxJQUFkLENBQW1CLEdBQW5CLEVBQXdCLFdBQXhCLENBQW9DLGFBQXBDLEVBQW1ELE1BQU0sT0FBTixDQUFjLE9BQWpFO0FBQ0g7Ozs7Ozs7Ozs7O0lDdFNZLFcsV0FBQSxXLEdBQ1QscUJBQVksUUFBWixFQUFzQixLQUF0QixFQUE2QjtBQUFBOztBQUN6QixRQUFNLE9BQU8sSUFBYjs7QUFFQSxTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLGNBQUwsR0FBc0IsS0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixNQUF0QixFQUE4QixJQUE5QixDQUFtQyx1QkFBbkMsQ0FBdEI7QUFDQSxTQUFLLGNBQUwsR0FBc0IsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQiw2QkFBbkIsQ0FBdEI7QUFDQSxTQUFLLGNBQUwsR0FBc0IsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixtQ0FBbkIsQ0FBdEI7QUFDQSxTQUFLLEtBQUwsR0FBYSxLQUFiOztBQUVBLGFBQVMsSUFBVCxDQUFjLG9CQUFkLEVBQW9DLEVBQXBDLENBQXVDLFFBQXZDLEVBQWlELFlBQVk7QUFDekQsWUFBTSxXQUFXLEVBQUUsSUFBRixDQUFqQjs7QUFFQSxhQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsVUFBekIsRUFBcUMsSUFBckM7O0FBRUEsWUFBSTtBQUNBLGdCQUFJLE9BQU8sU0FBUyxHQUFULENBQWEsQ0FBYixFQUFnQixLQUFoQixDQUFzQixDQUF0QixDQUFYOztBQUVBLGdCQUFJLENBQUMsSUFBTCxFQUFXO0FBQ1AsdUJBQU8sUUFBUSxLQUFSLENBQWMsbUJBQWQsQ0FBUDtBQUNIOztBQUVELCtCQUFtQixJQUFuQixDQUF3QixJQUF4QixFQUE4QixJQUE5QjtBQUNILFNBUkQsQ0FRRSxPQUFPLEtBQVAsRUFBYztBQUNaLG9CQUFRLEtBQVIsQ0FBYyxLQUFkO0FBQ0EsaUJBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixVQUF6QixFQUFxQyxLQUFyQztBQUNIO0FBQ0osS0FqQkQ7QUFrQkgsQzs7QUFHTCxTQUFTLGtCQUFULENBQTRCLElBQTVCLEVBQWtDO0FBQzlCLFFBQU0sT0FBTyxJQUFiOztBQUVBLE1BQUUsSUFBRixDQUFPO0FBQ0gsYUFBSyxnQkFERjtBQUVILGNBQU0sS0FGSDtBQUdILGNBQU07QUFDRix5QkFBYSxLQUFLLElBRGhCO0FBRUYseUJBQWEsS0FBSztBQUZoQixTQUhIO0FBT0gsaUJBQVMsaUJBQVUsUUFBVixFQUFvQjtBQUN6QixnQkFBSTtBQUNBLDZCQUFhLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0IsSUFBeEIsRUFBOEIsU0FBUyxJQUF2QyxFQUE2QyxTQUFTLEdBQXREO0FBQ0gsYUFGRCxDQUVFLE9BQU8sS0FBUCxFQUFjO0FBQ1osd0JBQVEsS0FBUixDQUFjLDRDQUFkLEVBQTRELEtBQTVEO0FBQ0g7QUFDSixTQWJFO0FBY0gsZUFBTyxlQUFVLEdBQVYsRUFBZTtBQUNsQixvQkFBUSxLQUFSLENBQWMsMkJBQWQsRUFBMkMsR0FBM0M7QUFDSDtBQWhCRSxLQUFQO0FBa0JIOztBQUVELFNBQVMsWUFBVCxDQUFzQixJQUF0QixFQUE0QixNQUE1QixFQUFvQyxHQUFwQyxFQUF5QztBQUNyQyxRQUFNLE9BQU8sSUFBYjtBQUFBLFFBQ0ksTUFBTSxJQUFJLGNBQUosRUFEVjs7QUFHQSxRQUFJLFdBQVcsSUFBSSxRQUFKLEVBQWY7O0FBRUEsUUFBSSxJQUFKLENBQVMsTUFBVCxFQUFpQixPQUFPLEdBQXhCOztBQUVBLFNBQUssSUFBSSxHQUFULElBQWdCLE9BQU8sTUFBdkIsRUFBK0I7QUFDM0IsaUJBQVMsTUFBVCxDQUFnQixHQUFoQixFQUFxQixPQUFPLE1BQVAsQ0FBYyxHQUFkLENBQXJCO0FBQ0g7QUFDRCxhQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBd0IsSUFBeEI7O0FBRUEsUUFBSSxrQkFBSixHQUF5QixZQUFZO0FBQ2pDLFlBQUksSUFBSSxVQUFKLEtBQW1CLENBQXZCLEVBQTBCO0FBQ3RCLGdCQUFJLElBQUksTUFBSixLQUFlLEdBQWYsSUFBc0IsSUFBSSxNQUFKLEtBQWUsR0FBekMsRUFBOEM7QUFDMUMsb0NBQW9CLElBQXBCLENBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDLEdBQXJDO0FBQ0gsYUFGRCxNQUdLO0FBQ0Qsd0JBQVEsS0FBUixDQUFjLHdCQUFkO0FBQ0g7QUFDSjtBQUNKLEtBVEQ7QUFVQSxRQUFJLElBQUosQ0FBUyxRQUFUO0FBQ0g7O0FBRUQsU0FBUyxtQkFBVCxDQUE2QixJQUE3QixFQUFtQyxHQUFuQyxFQUF3QztBQUNwQyxRQUFNLE9BQU8sSUFBYjs7QUFFQSxZQUFRLEdBQVIsQ0FBWSxxQkFBWixFQUFtQyxJQUFuQyxFQUF5QyxHQUF6Qzs7QUFFQSxTQUFLLGNBQUwsQ0FBb0IsR0FBcEIsQ0FBd0IsR0FBeEI7QUFDQSxTQUFLLGNBQUwsQ0FBb0IsR0FBcEIsQ0FBd0IsS0FBSyxJQUE3QjtBQUNBLFNBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixVQUF6QixFQUFxQyxLQUFyQzs7QUFFQTtBQUNBLFNBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsVUFBbEIsR0FBK0IsS0FBSyxJQUFwQztBQUNBLFNBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsU0FBbEIsR0FBOEIsR0FBOUI7O0FBRUEsV0FBTyxFQUFQLENBQVUsV0FBVixDQUFzQixnQkFBdEIsQ0FBdUMsS0FBSyxLQUFMLENBQVcsRUFBbEQsRUFBc0QsS0FBSyxLQUEzRDtBQUNIOzs7OztBQzlGRCxRQUFRLGlCQUFSLEdBQTRCLFVBQVUsT0FBVixFQUFtQjtBQUMzQyxRQUFJLElBQUksSUFBSSxJQUFKLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLENBQVI7QUFDQSxNQUFFLFVBQUYsQ0FBYSxPQUFiO0FBQ0EsV0FBTyxDQUFQO0FBQ0gsQ0FKRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge01lZGlhUGxheWVyfSBmcm9tIFwiLi9jb21wb25lbnRzL21lZGlhX3BsYXllclwiO1xuaW1wb3J0IHtUcmFja1VwbG9hZH0gZnJvbSBcIi4vY29tcG9uZW50cy90cmFja191cGxvYWRcIjtcbmltcG9ydCB7c2Vjb25kc1RvRGF0ZVRpbWV9IGZyb20gXCIuL3V0aWxzL3NlY29uZHNfdG9fZGF0ZV90aW1lXCI7XG5cbndpbmRvdy5ibSA9IHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIE1lZGlhUGxheWVyOiBNZWRpYVBsYXllcixcbiAgICAgICAgVHJhY2tVcGxvYWQ6IFRyYWNrVXBsb2FkXG4gICAgfSxcbiAgICB1dGlsczoge1xuICAgICAgICBzZWNvbmRzVG9EYXRlVGltZTogc2Vjb25kc1RvRGF0ZVRpbWVcbiAgICB9XG59O1xuXG5cbi8qXG4gKiBJbml0aWFsaXplIGFwcGxpY2F0aW9uIHdpZGdldHNcbiAqL1xuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIF9faW5pdGlhbGl6ZVRyYWNrVXBsb2FkKCk7XG59KTtcblxuZnVuY3Rpb24gX19pbml0aWFsaXplVHJhY2tVcGxvYWQoKSB7XG4gICAgJChcIltkYXRhLWJtLXdpZGdldD0ndHJhY2stdXBsb2FkJ11cIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0ICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgbGV0IHRyYWNrID0gJGVsZW1lbnQuZGF0YShcImJtV2lkZ2V0VHJhY2tVcGxvYWRUcmFja1wiKTtcbiAgICAgICAgdHJhY2sgPSB0cmFjayA/IHRyYWNrWzBdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIG5ldyBibS5jb21wb25lbnRzLlRyYWNrVXBsb2FkKCRlbGVtZW50LCB0cmFjayk7XG4gICAgfSlcbn0iLCJleHBvcnQgY2xhc3MgTWVkaWFQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50LCB0cmFja3MpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi4kZWxlbWVudCA9ICRlbGVtZW50O1xuXG4gICAgICAgIHNlbGYubG9hZFRyYWNrcyh0cmFja3MpO1xuXG4gICAgICAgIGNvbnN0ICRjb250cm9scyA9IHtcbiAgICAgICAgICAgICckcmVzdGFydCc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcmVzdGFydCcpLFxuICAgICAgICAgICAgJyRwYXVzZSc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcGF1c2UnKSxcbiAgICAgICAgICAgICckcGxheSc6IHNlbGYuJGVsZW1lbnQuZmluZCgnLm1lZGlhLXBsYXllcl9fY29udHJvbC0tcGxheScpXG4gICAgICAgIH07XG5cbiAgICAgICAgJGNvbnRyb2xzLiRwbGF5Lm9uKFwiY2xpY2tcIiwgc2VsZi5wbGF5LmJpbmQoc2VsZikpO1xuICAgICAgICAkY29udHJvbHMuJHBhdXNlLm9uKFwiY2xpY2tcIiwgc2VsZi5wYXVzZS5iaW5kKHNlbGYpKTtcbiAgICAgICAgJGNvbnRyb2xzLiRyZXN0YXJ0Lm9uKFwiY2xpY2tcIiwgc2VsZi5yZXN0YXJ0LmJpbmQoc2VsZikpO1xuXG4gICAgICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX3RyYWNrLXRpdGxlLWNvbnRyb2wtLW11dGVcIikub24oXCJjbGlja1wiLCBfX2hhbmRsZVRyYWNrTXV0ZUNsaWNrLmJpbmQoc2VsZikpO1xuICAgIH1cblxuICAgIGxvYWRUcmFja3ModHJhY2tzKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXAgPSB7fTtcblxuICAgICAgICBzZWxmLnRyYWNrcyA9IHRyYWNrcy5tYXAoX19jcmVhdGVBdWRpb1dhdmUuYmluZChzZWxmKSk7XG4gICAgfVxuXG4gICAgcmVwbGFjZVRyYWNrQnlJZCh0cmFja0lkLCBuZXdUcmFjaykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLmxvZyhzZWxmLCBhcmd1bWVudHMpO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLm1hcCh0cmFjayA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2sucGsgPT09IHRyYWNrSWQpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLmVtcHR5KCk7IC8vIHdpcGUgd2F2ZXN1cmZlciBkYXRhIGFuZCBldmVudHNcbiAgICAgICAgICAgICAgICBzZWxmLiRlbGVtZW50LmZpbmQoXCIjd2F2ZWZvcm0tXCIgKyB0cmFja0lkKS5maW5kKFwid2F2ZVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0cmFjayA9IF9fY3JlYXRlQXVkaW9XYXZlLmJpbmQoc2VsZikobmV3VHJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJhY2s7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby5wbGF5KDApO1xuICAgICAgICB9KTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKCF0cmFjay5fX2F1ZGlvLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suX19hdWRpby5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgcGF1c2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNrLl9fYXVkaW8uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5fX2F1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9fdXBkYXRlU29uZ0R1cmF0aW9ucy5iaW5kKHNlbGYpKCk7XG4gICAgfVxuXG4gICAgZ2V0TG9hZGluZ1Byb2dyZXNzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBsZXQgdG90YWxQcm9ncmVzcyA9IDAsXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcCk7XG5cbiAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICB0b3RhbFByb2dyZXNzICs9IHNlbGYudHJhY2tMb2FkaW5nUHJvZ3Jlc3NNYXBba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG90YWxQcm9ncmVzcyA9IHRvdGFsUHJvZ3Jlc3MgLyBrZXlzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gdG90YWxQcm9ncmVzcztcbiAgICB9XG5cbiAgICBnZXRMb25nZXN0VHJhY2soKSB7XG4gICAgICAgIHZhciBsb25nZXN0VHJhY2sgPSB0aGlzLnRyYWNrc1swXTtcblxuICAgICAgICB0aGlzLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHZhciB0cmFja0R1cmF0aW9uID0gdHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAodHJhY2tEdXJhdGlvbiA+IGxvbmdlc3RUcmFjay5fX2F1ZGlvLmdldER1cmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBsb25nZXN0VHJhY2sgPSB0cmFjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxvbmdlc3RUcmFjaztcbiAgICB9XG5cbiAgICBhbGxUcmFja3NBcmVMb2FkZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYWNrcy5ldmVyeSh0cmFjayA9PiB7XG4gICAgICAgICAgICByZXR1cm4gISF0cmFjay5fX2xvYWRlZDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0VHJhY2tCeUlkKHRyYWNrSWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudHJhY2tzLmZpbHRlcih0cmFjayA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdHJhY2sucGsgPT09IHRyYWNrSWQ7XG4gICAgICAgIH0pWzBdO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWNrTXV0ZSh0cmFjaykge1xuICAgICAgICB0cmFjay5fX2F1ZGlvLnRvZ2dsZU11dGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9fY3JlYXRlQXVkaW9XYXZlKHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnRyYWNrTG9hZGluZ1Byb2dyZXNzTWFwW3RyYWNrLnBrXSA9IDA7XG4gICAgdmFyIGN0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgdmFyIGxpbkdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgNjQsIDAsIDIwMCk7XG4gICAgbGluR3JhZC5hZGRDb2xvclN0b3AoMC41LCAncmdiYSgyMjUsIDIyNSwgMjI1LCAxLjAwMCknKTtcbiAgICBsaW5HcmFkLmFkZENvbG9yU3RvcCgwLjUsICdyZ2JhKDE4MywgMTgzLCAxODMsIDEuMDAwKScpO1xuXG4gICAgdmFyIHdhdmVzdXJmZXIgPSBXYXZlU3VyZmVyLmNyZWF0ZSh7XG4gICAgICAgIGNvbnRhaW5lcjogJyN3YXZlZm9ybS0nICsgdHJhY2sucGssXG4gICAgICAgIHdhdmVDb2xvcjogbGluR3JhZCxcbiAgICAgICAgcHJvZ3Jlc3NDb2xvcjogJ2hzbGEoMjAwLCAxMDAlLCAzMCUsIDAuNSknLFxuICAgICAgICBjdXJzb3JDb2xvcjogJyNmZmYnLFxuICAgICAgICBoZWlnaHQ6IDQ1LFxuICAgICAgICBiYXJXaWR0aDogM1xuICAgIH0pO1xuXG4gICAgd2F2ZXN1cmZlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgIF9fb25UcmFja1JlYWR5RXZlbnQuYmluZChzZWxmKSh0cmFjayk7XG4gICAgfSk7XG4gICAgd2F2ZXN1cmZlci5vbihcImVycm9yXCIsIF9fb25UcmFja0Vycm9yRXZlbnQpO1xuICAgIHdhdmVzdXJmZXIub24oJ2xvYWRpbmcnLCBwcm9ncmVzcyA9PiB7XG4gICAgICAgIHJldHVybiBfX29uVHJhY2tMb2FkaW5nRXZlbnQuYmluZChzZWxmKSh0cmFjaywgcHJvZ3Jlc3MpO1xuICAgIH0pO1xuICAgIHdhdmVzdXJmZXIub24oJ3NlZWsnLCBfX29uVHJhY2tTZWVrRXZlbnQuYmluZChzZWxmKSk7XG5cbiAgICB3YXZlc3VyZmVyLmxvYWQodHJhY2suZmllbGRzLm1lZGlhX3VybCk7XG5cbiAgICB0cmFjay5fX2F1ZGlvID0gd2F2ZXN1cmZlcjtcblxuICAgIHJldHVybiB0cmFjaztcbn1cbi8vIC8vXG4vLyAvLyAgICAgZnVuY3Rpb24gdG9nZ2xlU29sb0ZvclRyYWNrKHRyYWNrLCAkZXZlbnQpIHtcbi8vIC8vICAgICAgICAgdHJhY2suaXNTb2xvID0gIXRyYWNrLmlzU29sbztcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciAkY29udHJvbCA9ICQoJGV2ZW50LnRhcmdldCk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLWRlZmF1bHRcIiwgIXRyYWNrLmlzU29sbyk7XG4vLyAvLyAgICAgICAgICRjb250cm9sLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suaXNTb2xvKTtcbi8vIC8vXG4vLyAvLyAgICAgICAgIHZhciB0cmFja3NBcmVTb2xvZWQgPSBzZWxmLnRyYWNrcy5zb21lKGZ1bmN0aW9uICh0KSB7XG4vLyAvLyAgICAgICAgICAgICByZXR1cm4gdC5pc1NvbG87XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy9cbi8vIC8vICAgICAgICAgaWYgKCF0cmFja3NBcmVTb2xvZWQpIHtcbi8vIC8vICAgICAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgICAgICB0Ll9fYXVkaW8uc2V0TXV0ZShmYWxzZSk7XG4vLyAvLyAgICAgICAgICAgICB9KTtcbi8vIC8vXG4vLyAvLyAgICAgICAgICAgICByZXR1cm47XG4vLyAvLyAgICAgICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgICAgIHNlbGYudHJhY2tzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbi8vIC8vICAgICAgICAgICAgIHQuX19hdWRpby5zZXRNdXRlKCF0LmlzU29sbyk7XG4vLyAvLyAgICAgICAgIH0pO1xuLy8gLy8gICAgIH1cbi8vIC8vXG4vLyAvLyAgICAgLy8gUFJJVkFURSBBUElcbi8vIC8vXG4vLyAvL1xuXG5mdW5jdGlvbiBfX29uVHJhY2tSZWFkeUV2ZW50KHRyYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB0cmFjay5fX2xvYWRlZCA9IHRydWU7XG5cbiAgICBpZiAoc2VsZi5hbGxUcmFja3NBcmVMb2FkZWQoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImFsbCB0cmFja3MgYXJlIGxvYWRlZFwiKTtcbiAgICAgICAgc2VsZi4kZWxlbWVudC5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcblxuICAgICAgICBfX3VwZGF0ZVNvbmdEdXJhdGlvbnMuYmluZChzZWxmKSgpO1xuXG4gICAgICAgIHNlbGYubG9uZ2VzdFRyYWNrLl9fYXVkaW8ub24oXCJwbGF5XCIsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNlbGYuc2Vla1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuc2Vla1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoX191cGRhdGVTb25nRHVyYXRpb25zLmJpbmQoc2VsZiksIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19vblRyYWNrRXJyb3JFdmVudChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBwcm9jZXNzaW5nIHZpZGVvXCIsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrU2Vla0V2ZW50KHByb2dyZXNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBwcmV2ZW50IGV4Y2VzcyBzZWVrIGV2ZW50cyBmcm9tIGZpcmluZ1xuICAgIHZhciBwcm9taXNlcyA9IHNlbGYudHJhY2tzLm1hcCh0cmFjayA9PiB7XG4gICAgICAgIHZhciBkZWZlciA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdHJhY2suX19hdWRpby51bihcInNlZWtcIik7XG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICBkZWZlci5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgICB9KTtcblxuICAgICQud2hlbihwcm9taXNlcykuZG9uZSgoKSA9PiB7XG4gICAgICAgIHNlbGYucGF1c2UoKTtcblxuICAgICAgICBzZWxmLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8uc2Vla1RvKHByb2dyZXNzKTtcbiAgICAgICAgICAgIHRyYWNrLl9fYXVkaW8ub24oXCJzZWVrXCIsIF9fb25UcmFja1NlZWtFdmVudC5iaW5kKHNlbGYpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5wbGF5KCk7XG4gICAgfSkuZmFpbChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX19vblRyYWNrTG9hZGluZ0V2ZW50KHRyYWNrLCBwcm9ncmVzcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi50cmFja0xvYWRpbmdQcm9ncmVzc01hcFt0cmFjay5wa10gPSBwcm9ncmVzcztcblxuICAgIHNlbGYuJGVsZW1lbnQuZmluZChcIiNwcm9ncmVzc1wiKS5jc3Moe1xuICAgICAgICB3aWR0aDogc2VsZi5nZXRMb2FkaW5nUHJvZ3Jlc3MuYmluZChzZWxmKSgpICsgXCIlXCJcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX191cGRhdGVTb25nRHVyYXRpb25zKCkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyICR0aW1lciA9IHNlbGYuJGVsZW1lbnQuZmluZChcIi5tZWRpYS1wbGF5ZXJfX2NvbnRyb2wtLWR1cmF0aW9uXCIpO1xuXG4gICAgc2VsZi5sb25nZXN0VHJhY2sgPSBzZWxmLmdldExvbmdlc3RUcmFjaygpO1xuICAgIHNlbGYuc29uZ0N1cnJlbnRTZWVrID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXRDdXJyZW50VGltZSgpO1xuICAgIHNlbGYuc29uZ0R1cmF0aW9uID0gc2VsZi5sb25nZXN0VHJhY2suX19hdWRpby5nZXREdXJhdGlvbigpO1xuXG4gICAgdmFyIGR1cmF0aW9uRGF0ZVRpbWUgPSBibS51dGlscy5zZWNvbmRzVG9EYXRlVGltZShzZWxmLnNvbmdEdXJhdGlvbiksXG4gICAgICAgIHNlZWtEYXRlVGltZSA9IGJtLnV0aWxzLnNlY29uZHNUb0RhdGVUaW1lKHNlbGYuc29uZ0N1cnJlbnRTZWVrKTtcblxuICAgIGZ1bmN0aW9uIGRhdGVUaW1lVG9NZWRpYVRpbWUoZGF0ZVRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGRhdGVUaW1lLmdldE1pbnV0ZXMoKSArIFwiOlwiICsgU3RyaW5nKFwiMDBcIiArIGRhdGVUaW1lLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuICAgIH1cblxuICAgICR0aW1lci50ZXh0KGRhdGVUaW1lVG9NZWRpYVRpbWUoc2Vla0RhdGVUaW1lKSArIFwiIC8gXCIgKyBkYXRlVGltZVRvTWVkaWFUaW1lKGR1cmF0aW9uRGF0ZVRpbWUpKTtcblxuICAgIGlmIChzZWxmLnNvbmdDdXJyZW50U2VlayA+PSBzZWxmLnNvbmdEdXJhdGlvbikge1xuICAgICAgICBzZWxmLnNvbmdDdXJyZW50U2VlayA9IHNlbGYuc29uZ0R1cmF0aW9uO1xuXG4gICAgICAgIGlmIChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnNlZWtVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9faGFuZGxlVHJhY2tNdXRlQ2xpY2soZXZlbnQpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgJHRyYWNrQ29udHJvbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCksXG4gICAgICAgIHRyYWNrSWQgPSAkdHJhY2tDb250cm9sLnBhcmVudHMoXCIubWVkaWEtcGxheWVyX190cmFja1wiKS5kYXRhKFwidHJhY2tJZFwiKSxcbiAgICAgICAgdHJhY2sgPSBzZWxmLmdldFRyYWNrQnlJZCh0cmFja0lkKTtcblxuICAgIHNlbGYudG9nZ2xlVHJhY2tNdXRlKHRyYWNrKTtcblxuICAgICR0cmFja0NvbnRyb2wuZmluZChcImFcIikudG9nZ2xlQ2xhc3MoXCJidG4tZGVmYXVsdFwiLCAhdHJhY2suX19hdWRpby5pc011dGVkKTtcbiAgICAkdHJhY2tDb250cm9sLmZpbmQoXCJhXCIpLnRvZ2dsZUNsYXNzKFwiYnRuLXByaW1hcnlcIiwgdHJhY2suX19hdWRpby5pc011dGVkKTtcbn0iLCJleHBvcnQgY2xhc3MgVHJhY2tVcGxvYWQge1xuICAgIGNvbnN0cnVjdG9yKCRlbGVtZW50LCB0cmFjaykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLiRlbGVtZW50ID0gJGVsZW1lbnQ7XG4gICAgICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4gPSBzZWxmLiRlbGVtZW50LnBhcmVudHMoXCJmb3JtXCIpLmZpbmQoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgIHNlbGYuJG1lZGlhVXJsSW5wdXQgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIuanMtdHJhY2stdXBsb2FkX19tZWRpYS11cmxcIik7XG4gICAgICAgIHNlbGYuJG1lZGlhRmlsZU5hbWUgPSBzZWxmLiRlbGVtZW50LmZpbmQoXCIuanMtdHJhY2stdXBsb2FkX19tZWRpYS1maWxlLW5hbWVcIik7XG4gICAgICAgIHNlbGYudHJhY2sgPSB0cmFjaztcblxuICAgICAgICAkZWxlbWVudC5maW5kKFwiaW5wdXRbdHlwZT0nZmlsZSddXCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0ICRlbGVtZW50ID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgc2VsZi4kZm9ybVN1Ym1pdEJ0bi5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gJGVsZW1lbnQuZ2V0KDApLmZpbGVzWzBdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKFwiTm8gZmlsZSBzZWxlY3RlZC5cIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX19nZXRTaWduZWRSZXF1ZXN0LmJpbmQoc2VsZikoZmlsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX19nZXRTaWduZWRSZXF1ZXN0KGZpbGUpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvdHJhY2tzL3VwbG9hZFwiLFxuICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBcImZpbGVfbmFtZVwiOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICBcImZpbGVfdHlwZVwiOiBmaWxlLnR5cGVcbiAgICAgICAgfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF9fdXBsb2FkRmlsZS5iaW5kKHNlbGYpKGZpbGUsIHJlc3BvbnNlLmRhdGEsIHJlc3BvbnNlLnVybCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcGFyc2Ugc29uZyB1cGxvYWQgc2lnbmVkIHJlcXVlc3RcIiwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhocikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkIG5vdCBnZXQgc2lnbmVkIFVSTC5cIiwgeGhyKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfX3VwbG9hZEZpbGUoZmlsZSwgczNEYXRhLCB1cmwpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgICAgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICBsZXQgcG9zdERhdGEgPSBuZXcgRm9ybURhdGEoKTtcblxuICAgIHhoci5vcGVuKFwiUE9TVFwiLCBzM0RhdGEudXJsKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBzM0RhdGEuZmllbGRzKSB7XG4gICAgICAgIHBvc3REYXRhLmFwcGVuZChrZXksIHMzRGF0YS5maWVsZHNba2V5XSk7XG4gICAgfVxuICAgIHBvc3REYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUpO1xuXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwIHx8IHhoci5zdGF0dXMgPT09IDIwNCkge1xuICAgICAgICAgICAgICAgIF9fdXBsb2FkRmlsZVN1Y2Nlc3MuYmluZChzZWxmKShmaWxlLCB1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkIG5vdCB1cGxvYWQgZmlsZS5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhoci5zZW5kKHBvc3REYXRhKTtcbn1cblxuZnVuY3Rpb24gX191cGxvYWRGaWxlU3VjY2VzcyhmaWxlLCB1cmwpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIGNvbnNvbGUubG9nKFwiZmlsZSB1cGxvYWQgc3VjY2Vzc1wiLCBmaWxlLCB1cmwpO1xuXG4gICAgc2VsZi4kbWVkaWFVcmxJbnB1dC52YWwodXJsKTtcbiAgICBzZWxmLiRtZWRpYUZpbGVOYW1lLnZhbChmaWxlLm5hbWUpO1xuICAgIHNlbGYuJGZvcm1TdWJtaXRCdG4ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAvLyByZWluaXRpYWxpemUgYW55IGFzc29jaWF0ZWQgbWVkaWEgcGxheWVyc1xuICAgIHNlbGYudHJhY2suZmllbGRzLm1lZGlhX25hbWUgPSBmaWxlLm5hbWU7XG4gICAgc2VsZi50cmFjay5maWVsZHMubWVkaWFfdXJsID0gdXJsO1xuXG4gICAgd2luZG93LmJtLm1lZGlhUGxheWVyLnJlcGxhY2VUcmFja0J5SWQoc2VsZi50cmFjay5waywgc2VsZi50cmFjayk7XG59IiwiZXhwb3J0cy5zZWNvbmRzVG9EYXRlVGltZSA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgwLCAwLCAwLCAwLCAwLCAwLCAwKTtcbiAgICBkLnNldFNlY29uZHMoc2Vjb25kcyk7XG4gICAgcmV0dXJuIGQ7XG59OyJdfQ==

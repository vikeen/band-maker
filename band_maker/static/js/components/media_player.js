export class MediaPlayer {
    constructor($element, tracks) {
        this.$element = $element;
        this.trackLoadingProgressMap = {};
        this.tracks = tracks.map(__createAudioWave.bind(this));

        const $controls = {
            '$restart': this.$element.find('.media-player__control--restart'),
            '$pause': this.$element.find('.media-player__control--pause'),
            '$play': this.$element.find('.media-player__control--play')
        };

        $controls.$play.on("click", this.play.bind(this));
        $controls.$pause.on("click", this.pause.bind(this));
        $controls.$restart.on("click", this.restart.bind(this));

        this.$element.find(".media-player__track-title-control--mute").on("click", __handleTrackMuteClick.bind(this));
    }

    restart() {
        const self = this;

        self.tracks.forEach(track => {
            track.__audio.play(0);
        });

        __updateSongDurations.bind(self)();
    }

    play() {
        const self = this;

        self.tracks.forEach(track => {
            if (!track.__audio.isPlaying()) {
                track.__audio.play();
            }
        });

        __updateSongDurations.bind(self)();
    }

    pause() {
        const self = this;

        self.tracks.forEach(track => {
            if (track.__audio.isPlaying()) {
                track.__audio.pause();
            }
        });

        __updateSongDurations.bind(self)();
    }

    getLoadingProgress() {
        const self = this;

        let totalProgress = 0,
            keys = Object.keys(self.trackLoadingProgressMap);

        keys.forEach(key => {
            totalProgress += self.trackLoadingProgressMap[key];
        });

        totalProgress = totalProgress / keys.length;

        return totalProgress;
    }

    getLongestTrack() {
        var longestTrack = this.tracks[0];

        this.tracks.forEach(track => {
            var trackDuration = track.__audio.getDuration();

            if (trackDuration > longestTrack.__audio.getDuration()) {
                longestTrack = track;
            }
        });

        return longestTrack;
    }

    allTracksAreLoaded() {
        return this.tracks.every(track => {
            return !!track.__loaded;
        });
    }

    getTrackById(trackId) {
        const self = this;

        return self.tracks.filter(track => {
            return track.pk === trackId;
        })[0];
    }

    toggleTrackMute(track) {
        track.__audio.toggleMute();
    }
}

function __createAudioWave(track) {
    const self = this;

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

    wavesurfer.on('ready', () => {
        __onTrackReadyEvent.bind(self)(track);
    });
    wavesurfer.on("error", __onTrackErrorEvent);
    wavesurfer.on('loading', progress => {
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
    const self = this;

    track.__loaded = true;

    if (self.allTracksAreLoaded()) {
        console.log("all tracks are loaded");
        self.$element.find(".progress").hide();

        __updateSongDurations.bind(self)();

        self.longestTrack.__audio.on("play", () => {

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
    const self = this;

    // prevent excess seek events from firing
    var promises = self.tracks.map(track => {
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

    $.when(promises).done(() => {
        self.pause();

        self.tracks.forEach(track => {
            track.__audio.seekTo(progress);
            track.__audio.on("seek", __onTrackSeekEvent.bind(self));
        });

        self.play();
    }).fail(error => {
        console.log(error);
    });
}

function __onTrackLoadingEvent(track, progress) {
    const self = this;

    self.trackLoadingProgressMap[track.pk] = progress;

    self.$element.find("#progress").css({
        width: self.getLoadingProgress.bind(self)() + "%"
    });
}

function __updateSongDurations() {
    const self = this;

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
    const self = this,
        $trackControl = $(event.currentTarget),
        trackId = $trackControl.parents(".media-player__track").data("trackId"),
        track = self.getTrackById(trackId);

    self.toggleTrackMute(track);

    $trackControl.find("a").toggleClass("btn-default", !track.__audio.isMuted);
    $trackControl.find("a").toggleClass("btn-primary", track.__audio.isMuted);
}
import {MediaPlayer} from "./components/media_player";
import {TrackUpload} from "./components/track_upload";
import {secondsToDateTime} from "./utils/seconds_to_date_time";

window.bm = {
    components: {
        MediaPlayer: MediaPlayer,
        TrackUpload: TrackUpload
    },
    utils: {
        secondsToDateTime: secondsToDateTime
    }
};


/*
 * Initialize application widgets
 */
$(document).ready(() => {
    __initializeTrackUpload();
});

function __initializeTrackUpload() {
    $("[data-bm-widget='track-upload']").each(function () {
        const $element = $(this);
        let track = $element.data("bmWidgetTrackUploadTrack");
        track = track ? track[0] : undefined;

        new bm.components.TrackUpload($element, track);
    })
}
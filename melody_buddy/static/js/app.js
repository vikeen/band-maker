import {MediaPlayer} from "./components/media_player";
import {secondsToDateTime} from "./utils/seconds_to_date_time";

window.bm = {
    components: {
        MediaPlayer: MediaPlayer
    },
    utils: {
        secondsToDateTime: secondsToDateTime
    }
};


/*
 * Initialize application widgets
 */
$(document).ready(() => {
    $(".dropdown-button").dropdown({
        hover: false
    });
    $(".button-collapse").sideNav();
});
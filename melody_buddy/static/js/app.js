import {MediaPlayer} from "./components/media_player";
import {Messages} from "./components/messages";
import {secondsToDateTime} from "./utils/seconds_to_date_time";

window.bm = {
    components: {
        MediaPlayer: MediaPlayer,
        Messages: Messages
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
    $('ul.tabs').tabs();
    $('select').material_select();
    $('.parallax').parallax();
    $('.scrollspy').scrollSpy();

    new window.bm.components.Messages();
});
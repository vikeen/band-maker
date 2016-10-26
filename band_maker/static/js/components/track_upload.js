export class TrackUpload {
    constructor($element, track, song) {
        const self = this;

        self.$element = $element;
        self.$formSubmitBtn = self.$element.parents("form").find("button[type='submit']");
        self.$mediaUrlInput = self.$element.find(".js-track-upload__media-url");
        self.$mediaFileName = self.$element.find(".js-track-upload__media-file-name");
        self.track = track;
        self.song = song;

        console.log(self);

        $element.find("input[type='file']").on("change", function () {
            const $element = $(this);

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
    }
}

function __getSignedRequest(file) {
    const self = this;

    $.ajax({
        url: "/songs/" + self.song.pk + "/tracks/upload",
        type: "get",
        data: {
            "file_name": file.name,
            "file_type": file.type
        },
        success: function (response) {
            try {
                __uploadFile.bind(self)(file, response.data, response.url);
            } catch (error) {
                console.error("Failed to parse song upload signed request", error);
            }
        },
        error: function (xhr) {
            console.error("Could not get signed URL.", xhr);
        }
    });
}

function __uploadFile(file, s3Data, url) {
    const self = this,
        xhr = new XMLHttpRequest();

    let postData = new FormData();

    xhr.open("POST", s3Data.url);

    for (var key in s3Data.fields) {
        postData.append(key, s3Data.fields[key]);
    }
    postData.append('file', file);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 204) {
                __uploadFileSuccess.bind(self)(file, url);
            }
            else {
                console.error("Could not upload file.");
            }
        }
    };
    xhr.send(postData);
}

function __uploadFileSuccess(file, url) {
    const self = this;

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
const gulp = require("gulp"),
    rename = require("gulp-rename"),
    fs = require("fs"),
    browserify = require("browserify"),
    babelify = require("babelify");

gulp.task("default", ['build', 'watch']);

gulp.task('watch', () => {
    gulp.watch([
        './band_maker/static/js/**/*.js',
        '!./band_maker/static/js/app.bundle.js'
    ], ['build:javascript']);
});

gulp.task('build:javascript', () => {
    return browserify({debug: true})
        .transform(babelify)
        .require("./band_maker/static/js/app.js", {entry: true})
        .bundle()
        .on("error", function (err) {
            console.log("Error: " + err.message);
        })
        .pipe(fs.createWriteStream("./band_maker/static/js/app.bundle.js"));
});

gulp.task('build', [
    'build:javascript'
]);
const gulp = require("gulp"),
    rename = require("gulp-rename"),
    fs = require("fs"),
    browserify = require("browserify"),
    babelify = require("babelify"),
    less = require("gulp-less");

gulp.task("default", ['build', 'watch']);

gulp.task('watch', () => {
    gulp.watch([
        './band_maker/static/js/**/*.js',
        '!./band_maker/static/js/app.bundle.js'
    ], ['build:javascript']);

    gulp.watch([
        './band_maker/static/less/**/*.less'
    ], ['build:less']);
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

gulp.task('build:less', function () {
    return gulp.src([
        './band_maker/static/less/main.less',
    ])
        .pipe(less())
        .pipe(gulp.dest('./band_maker/static/css'));
});

gulp.task('build', [
    'build:javascript',
    'build:less'
]);

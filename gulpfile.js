const gulp = require("gulp"),
    rename = require("gulp-rename"),
    fs = require("fs"),
    browserify = require("browserify"),
    babelify = require("babelify"),
    less = require("gulp-less");

gulp.task("default", ['build', 'watch']);

gulp.task('watch', () => {
    gulp.watch([
        './melody_buddy/static/js/**/*.js',
        '!./melody_buddy/static/js/app.bundle.js'
    ], ['build:javascript']);

    gulp.watch([
        './melody_buddy/static/less/**/*.less'
    ], ['build:less']);
});

gulp.task('build:javascript', () => {
    return browserify({debug: true})
        .transform(babelify)
        .require("./melody_buddy/static/js/app.js", {entry: true})
        .bundle()
        .on("error", function (err) {
            console.log("Error: " + err.message);
        })
        .pipe(fs.createWriteStream("./melody_buddy/static/js/app.bundle.js"));
});

gulp.task('build:less', function () {
    return gulp.src([
        './melody_buddy/static/less/main.less',
    ])
        .pipe(less())
        .pipe(gulp.dest('./melody_buddy/static/css'));
});

gulp.task('build', [
    'build:javascript',
    'build:less'
]);

var gulp = require("gulp");
var rename = require("gulp-rename");
var babel = require("gulp-babel");
var watch = require("gulp-watch");

gulp.task("default", ['build', 'watch']);

gulp.task('watch', function () {
    watch('./band_maker/static/js/**/*.js', ['build:javascript']);
});

gulp.task('build:javascript', function () {
    return gulp.src("./band_maker/static/js/app.js")
        .pipe(babel())
        .pipe(rename("app.bundle.js"))
        .pipe(gulp.dest("./band_maker/static/js"));
});

gulp.task('build', [
    'build:javascript'
]);
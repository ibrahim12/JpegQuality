
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    concat = require('gulp-concat');

gulp.task('build', function(){
    return gulp.src('jpeg_quality.js')
        .pipe(gulp.dest('dist/'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('watch', function() {

    gulp.watch('jpeg_quality.js', ['build']);

});
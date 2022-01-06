/* eslint-disable function-paren-newline */
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const named = require('vinyl-named');
const webpack = require('webpack-stream');
const { data } = require('json-file').read('./package.json');

const webpackconfig = require('./webpack.config');

function getHeader() {
  return `/*!
 * Name    : Video Worker
 * Version : ${data.version}
 * Author  : ${data.author}
 * GitHub  : ${data.homepage}
 */
`;
}

/**
 * Error Handler for gulp-plumber
 */
function errorHandler(err) {
  // eslint-disable-next-line no-console
  console.error(err);
  this.emit('end');
}

/**
 * Clean Task
 */
gulp.task('clean', () => del(['dist']));

/**
 * JS Task
 */
gulp.task('js', () =>
  gulp
    .src(['src/*.js', '!src/*.esm.js'])
    .pipe($.plumber({ errorHandler }))
    .pipe(named())
    .pipe(
      webpack({
        config: webpackconfig,
      })
    )
    .pipe($.header(getHeader()))
    .pipe(gulp.dest('dist'))
    .pipe($.rename({ suffix: '.min' }))
    .pipe(
      $.uglify({
        output: {
          comments: /^!/,
        },
      })
    )
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
);

/**
 * Build (default) Task
 */
gulp.task('build', gulp.series('clean', 'js'));

gulp.task('default', gulp.series('build'));

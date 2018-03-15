const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const named = require('vinyl-named');
const webpack = require('webpack-stream');
const data = require('json-file').read('./package.json').data;

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
gulp.task('js', () => {
    return gulp.src('src/*.js')
        .pipe($.plumber({ errorHandler }))
        .pipe(named())
        .pipe(webpack({
            output: {
                library: 'VideoWorker',
                libraryTarget: 'var'
            },
            module: {
                loaders: [
                    {
                        test: /\.js$/,
                        use: [{
                            loader: 'babel-loader',
                        }],
                    },
                ],
            },
        }))
        .pipe($.header(getHeader()))
        .pipe(gulp.dest('dist'))
        .pipe($.rename({ suffix: '.min' }))
        .pipe($.uglify({
            output: {
                comments: /^!/,
            },
        }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

/**
 * Build (default) Task
 */
gulp.task('build', (cb) => {
    $.sequence('clean', 'js', cb);
});

gulp.task('default', ['build']);

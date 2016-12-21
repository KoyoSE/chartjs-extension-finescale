var gulp = require('gulp');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var eslint = require('gulp-eslint');
var htmlv = require('gulp-html-validator');
var insert = require('gulp-insert');
var replace = require('gulp-replace');
var size = require('gulp-size');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var exec = require('child_process').exec;
var karma = require('gulp-karma');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var collapse = require('bundle-collapser/plugin');
var argv = require('yargs').argv;
var package = require('./package.json');

var srcDir = './src/';
var outDir = './dist/';
var testDir = './test/';

var header = '/* !\n' +
	' * chartjs-extension-finescale.js\n' +
	' *\n' +
	' * Version: {{ version }}\n' +
	' *\n' +
	' * chartjs-extension-finescale.js Copyright 2016 koyoSE\n' +
	' * Released under the MIT license\n' +
	' * https://github.com/KoyoSE/chartjs-extension-finescale.git\n' +
	' *\n' +
	' * Chart.js Copyright 2016 Nick Downie\n' +
	' * Released under the MIT license\n' +
	' * https://github.com/chartjs/Chart.js/blob/master/LICENSE.md\n' +
	' */\n';

var preTestFiles = [
	'./node_modules/chart.js/dist/Chart.bundle.js',
	'./node_modules/moment/min/moment.min.js'
];

var testFiles = [
	'./test/*.js'
];

/**
 * Generates the bower.json manifest file which will be pushed along release tags.
 * Specs: https://github.com/bower/spec/blob/master/json.md
 */
function buildTask() {

	var nonBundled = browserify('./src/chartjs-extension-finescale.js')
		.ignore('chart.js')
		.plugin(collapse)
		.bundle()
		.pipe(source('chartjs-extension-finescale.js'))
		.pipe(insert.prepend(header))
		.pipe(streamify(replace('{{ version }}', package.version)))
		.pipe(gulp.dest(outDir))
		.pipe(streamify(uglify()))
		.pipe(insert.prepend(header))
		.pipe(streamify(replace('{{ version }}', package.version)))
		.pipe(streamify(concat('chartjs-extension-finescale.min.js')))
		.pipe(gulp.dest(outDir));

	return nonBundled;

}

function lintTask() {
	var files = [
		srcDir + '**/*.js',
		testDir + '**/*.js'
	];

	// NOTE(SB) codeclimate has 'complexity' and 'max-statements' eslint rules way too strict
	// compare to what the current codebase can support, and since it's not straightforward
	// to fix, let's turn them as warnings and rewrite code later progressively.
	var options = {
		rules: {
			complexity: [1, 6],
			'max-statements': [1, 30]
		},
		globals: [
			'Chart',
			'acquireChart',
			'afterAll',
			'afterEach',
			'beforeAll',
			'beforeEach',
			'describe',
			'expect',
			'it',
			'jasmine',
			'moment',
			'spyOn',
			'xit'
		]
	};

	return gulp.src(files)
		.pipe(eslint(options))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

function validHTMLTask() {
	return gulp.src('samples/*.html')
		.pipe(htmlv());
}

function startTest() {
	return [].concat(preTestFiles).concat([
		'./src/**/*.js',
		'./test/mockContext.js'
	]).concat(
		argv.inputs ?
			argv.inputs.split(';') :
			testFiles);
}

function unittestTask() {
	return gulp.src(startTest())
		.pipe(karma({
			configFile: 'karma.conf.ci.js',
			action: 'run'
		}));
}

function unittestWatchTask() {
	return gulp.src(startTest())
		.pipe(karma({
			configFile: 'karma.conf.js',
			action: 'watch'
		}));
}

function coverageTask() {
	return gulp.src(startTest())
		.pipe(karma({
			configFile: 'karma.coverage.conf.js',
			action: 'run'
		}));
}

function librarySizeTask() {
	return gulp.src('dist/Chart.bundle.min.js')
		.pipe(size({
			gzip: true
		}));
}

function moduleSizesTask() {
	return gulp.src(srcDir + '**/*.js')
		.pipe(uglify({
			preserveComments: 'some'
		}))
		.pipe(size({
			showFiles: true,
			gzip: true
		}));
}

function watchTask() {
	if (util.env.test) {
		return gulp.watch('./src/**', ['build', 'unittest', 'unittestWatch']);
	}
	return gulp.watch('./src/**', ['build']);
}

function serverTask() {
	connect.server({
		port: 8000
	});
}

// Convenience task for opening the project straight from the command line

function _openTask() {
	exec('open http://localhost:8000');
	exec('subl .');
}


// -----------------------
gulp.task('build', buildTask);
gulp.task('coverage', coverageTask);
gulp.task('watch', watchTask);
gulp.task('lint', lintTask);
gulp.task('test', ['lint', 'validHTML', 'unittest']);
gulp.task('size', ['library-size', 'module-sizes']);
gulp.task('server', serverTask);
gulp.task('validHTML', validHTMLTask);
gulp.task('unittest', unittestTask);
gulp.task('unittestWatch', unittestWatchTask);
gulp.task('library-size', librarySizeTask);
gulp.task('module-sizes', moduleSizesTask);
gulp.task('_open', _openTask);
gulp.task('dev', ['server', 'default']);
gulp.task('default', ['build', 'watch']);
// -----------------------

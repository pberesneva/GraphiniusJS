var gulp = require('gulp');
var clean = require('gulp-clean');
var mocha = require('gulp-mocha');
var ts = require('gulp-typescript');


//----------------------------
// PATHS
//----------------------------
var paths = {
	javascripts: ['src/**/*.js', 'test/**/*.js'],
	typescripts: ['src/**/*.ts', 'test/**/*.ts'],
	distsources: ['src/**/*.ts'],
	clean: ['src/**/*.js', 'test/**/*.js', 'dist'],
	tests: ['test/**/*Tests.js']
};


//----------------------------
// TASKS
//----------------------------
gulp.task('build', function () {
	return gulp.src(paths.typescripts, {base: "."})
						 .pipe(ts({
							 target: "ES5",
							 module: "commonjs",
							 removeComments: true
						 }))
						.pipe(gulp.dest('.'));
});

gulp.task('dist', function () {
	return gulp.src(paths.distsources)
						 .pipe(ts({
							 target: "ES5",
							 module: "commonjs",
							 removeComments: true
						 }))
						 .pipe(gulp.dest('dist'));
});

gulp.task('mocha', ['build'], function () {
	return gulp.src(paths.tests, {read: false})
						 .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('clean', function () {
	return gulp.src(paths.clean, {read: false})
						 .pipe(clean());
});

gulp.task('watch', function () {
	gulp.watch(paths.typescripts, ['mocha']);
});

gulp.task('default', ['watch']);
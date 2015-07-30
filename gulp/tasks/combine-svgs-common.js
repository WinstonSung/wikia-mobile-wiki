/*
 * combine-svgs-common
 * Combines commonly shared svg files into one, and place it in www/
 */

var gulp = require('gulp'),
	svgSymbols = require('gulp-svg-symbols'),
	folders = require('gulp-folders'),
	gulpif = require('gulp-if'),
	rename = require('gulp-rename'),
	piper = require('../utils/piper'),
	paths = require('../paths').symbols.common,
	path = require('path');

gulp.task('combine-svgs-common', folders(paths.src, function (folder) {
	return piper(
		gulp.src(path.join(paths.src, folder, paths.files)),
		gulpif(isNeeded, piper(svgSymbols())),
		gulpif('**/*.svg', piper(
			rename(folder + '.svg'),
			gulp.dest(paths.dest)
		))
	);
}));

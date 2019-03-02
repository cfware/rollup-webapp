import path from 'path';

import gulp from 'gulp';
import gulpBrotli from 'gulp-brotli';
import gulpCleanCSS from 'gulp-clean-css';
import gulpClone from 'gulp-clone';
import gulpGzip from 'gulp-gzip';
import gulpHtmlmin from 'gulp-htmlmin';
import gulpIf from 'gulp-if';
import gulpRename from 'gulp-rename';
import gulpSkipFile from 'gulp-skip-file';
import pump from 'pump';
import merge2 from 'merge2';
import vinylRollup from 'vinyl-rollup';
import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import sourcemapsMapSources from '@gulp-sourcemaps/map-sources';
import sourcemapsSourcesContent from '@gulp-sourcemaps/sources-content';
import sourcemapsMapFile from '@gulp-sourcemaps/map-file';
import {wwwroot, rootPath, babelrc, minifyCSS, htmlMinifier, minifyJS} from './utils';

function renameAssets() {
	const nodeModulesEx = /^node_modules/;

	return gulpRename(p => {
		p.dirname = p.dirname.replace(nodeModulesEx, 'assets');
	});
}

function rollup() {
	const bundleEntry = 'html/index.js';
	const modulePath = rootPath('node_modules');
	const relativeModules = path.relative(path.dirname(bundleEntry), modulePath);

	return pump(
		vinylRollup({
			rollup: {
				input: bundleEntry,
				plugins: [
					babel(babelrc),
					terser(minifyJS)
				],
				output: {
					format: 'esm',
					sourcemap: true,
					file: bundleEntry,
					vinylOpts: {
						base: 'html'
					}
				}
			},
			copyModules: true,
			modulePath
		}),
		renameAssets(),
		sourcemapsMapFile((_, file) => file.basename),
		sourcemapsMapSources(sourcePath => sourcePath.replace(relativeModules, './assets')),
		sourcemapsSourcesContent({
			clear: (filename, mainFile) => filename !== mainFile
		}),
		gulp.dest(wwwroot, {sourcemaps: '.'})
	);
}

function copyFiles() {
	return pump(
		gulp.src(['html/**', '!**/*.js'], {nodir: true}),
		gulpIf('**/*.css', gulpCleanCSS(minifyCSS)),
		gulpIf('**/*.html', gulpHtmlmin(htmlMinifier)),
		gulp.dest(wwwroot, {sourcemaps: '.'})
	);
}

export const build = () => {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = 'production';
	}

	const base = merge2([
		rollup(),
		copyFiles()
	]);

	const gzip = pump(
		base,
		gulpClone(),
		gulpGzip({skipGrowingFiles: true}),
		gulpIf('!**/*.gz', gulpSkipFile())
	);

	const brotli = pump(
		base,
		gulpClone(),
		gulpBrotli.compress({skipLarger: true}),
		gulpIf('!**/*.br', gulpSkipFile())
	);

	return pump(
		merge2([gzip, brotli]),
		gulp.dest(wwwroot)
	);
};

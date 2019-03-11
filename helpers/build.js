import path from 'path';

import pipeline from 'stream.pipeline-shim';
import gulp from 'gulp';
import gulpCleanCSS from 'gulp-clean-css';
import gulpHtmlmin from 'gulp-htmlmin';
import gulpIf from 'gulp-if';
import gulpRename from 'gulp-rename';
import gulpWebCompress from 'gulp-web-compress';
import merge2 from 'merge2';
import vinylRollup from 'vinyl-rollup';
import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import sourcemapsMapSources from '@gulp-sourcemaps/map-sources';
import sourcemapsSourcesContent from '@gulp-sourcemaps/sources-content';
import sourcemapsMapFile from '@gulp-sourcemaps/map-file';
import {wwwroot, rootPath, babelrc, minifyCSS, htmlMinifier, minifyJS, pipelineError} from './utils';

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

	return pipeline(
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
		gulp.dest('/', {sourcemaps: '.'}),
		pipelineError
	);
}

function copyFiles() {
	return pipeline(
		gulp.src(['html/**', '!**/*.js'], {nodir: true}),
		gulpIf('**/*.css', gulpCleanCSS(minifyCSS)),
		gulpIf('**/*.html', gulpHtmlmin(htmlMinifier)),
		gulp.dest('/', {sourcemaps: '.'}),
		pipelineError
	);
}

export const build = () => {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = 'production';
	}

	return pipeline(
		merge2([
			rollup(),
			copyFiles()
		]),
		gulpWebCompress(),
		gulp.dest(wwwroot),
		pipelineError
	);
};

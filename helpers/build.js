import path from 'path';

import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gulpRename from 'gulp-rename';
import pump from 'pump';
import merge2 from 'merge2';
import vinylRollup from 'vinyl-rollup';
import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";
import sourcemapsMapSources from '@gulp-sourcemaps/map-sources';
import sourcemapsSourcesContent from '@gulp-sourcemaps/sources-content';
import sourcemapsMapFile from '@gulp-sourcemaps/map-file';
import {wwwroot, rootPath, babelrc} from './utils';

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
					terser({
						ecma: 8,
						module: true
					})
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
		gulp.dest(wwwroot)
	);
}

export const build = () => {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = 'production';
	}

	return merge2([
		rollup(),
		copyFiles()
	]);
};

import path from 'path';

import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gulpRename from 'gulp-rename';
import pump from 'pump';
import merge2 from 'merge2';
import vinylRollup from 'vinyl-rollup';
import babel from 'rollup-plugin-babel';
import mapSources from '@gulp-sourcemaps/map-sources';
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
				plugins: [babel(babelrc)],
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
		gulpIf(
			file => {
				if (file.sourceMap) {
					file.sourceMap.file = file.basename;
				}

				return true;
			},
			mapSources(sourcePath => sourcePath.replace(relativeModules, './assets'))
		),
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

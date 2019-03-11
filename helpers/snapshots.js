import pipeline from 'stream.pipeline-shim';
import gulp from 'gulp';
import replace from 'gulp-replace';
import markdown from 'gulp-markdown';

import {pipelineError} from './utils';

export const snapshots = () => {
	return pipeline(
		gulp.src('test/snapshots/*.md', {base: '.'}),
		replace(/\n {4}'(!\[]\(data:image[/]png;base64,[^)]*\))'\n/g, '\n$1\n'),
		markdown(),
		gulp.dest('.'),
		pipelineError
	);
};

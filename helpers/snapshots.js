import gulp from 'gulp';
import replace from 'gulp-replace';
import markdown from 'gulp-markdown';
import pump from 'pump';

export const snapshots = () => {
	return pump(
		gulp.src('test/snapshots/*.md', {base: '.'}),
		replace(/\n {4}'(!\[]\(data:image[/]png;base64,[^)]*\))'\n/g, '\n$1\n'),
		markdown(),
		gulp.dest('.')
	);
};

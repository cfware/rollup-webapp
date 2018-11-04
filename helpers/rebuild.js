import gulp from 'gulp';
import {clean} from './clean';
import {build} from './build';

export const rebuild = gulp.series(clean, build);

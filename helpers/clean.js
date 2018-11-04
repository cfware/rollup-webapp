import del from 'del';

import {wwwroot} from './utils';

export function clean() {
	return del(wwwroot);
}

/* The only point of this custom element is to demonstrate import of
 * CommonJS 'camelcase' module. */
import {ShadowElement, html} from '@cfware/shadow-element';
import camelcase from 'camelcase';

class CamelCase extends ShadowElement {
	get template() {
		return html`${camelcase(this.value)}`;
	}
}

CamelCase.define('camel-case', {
	stringProps: {
		value: ''
	}
});

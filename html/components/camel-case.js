/* The only point of this custom element is to demonstrate import of
 * CommonJS 'camelcase' module. */
import {LitElement, html} from '@polymer/lit-element';
import camelcase from 'camelcase';

class CamelCase extends LitElement {
	static get properties() {
		return {
			value: {type: String}
		};
	}

	render() {
		return html`${camelcase(this.value)}`;
	}
}

customElements.define('camel-case', CamelCase);

import {LitElement, html} from '@polymer/lit-element';

const svgFile = import.meta.url.replace(/\.js$/, '.svg');

class WebContent extends LitElement {
	constructor() {
		super();
		this.mood = 'easy';
	}

	static get properties() {
		return {
			mood: {type: String}
		};
	}

	render() {
		return html`
			<style>
				img {
					width: 4rem;
					display: block;
				}
			</style>
			<img src="${svgFile}">
			Web Components are <span class="mood">${this.mood}</span>!
			`;
	}
}

customElements.define('web-content', WebContent);

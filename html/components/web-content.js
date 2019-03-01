import {ShadowElement, html} from '@cfware/shadow-element';

const svgFile = import.meta.url.replace(/\.js$/, '.svg');

class WebContent extends ShadowElement {
	get template() {
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

WebContent.define('web-content', {
	stringProps: {
		mood: 'easy'
	}
});

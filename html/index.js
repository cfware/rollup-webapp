import {LitElement, html} from '@polymer/lit-element';
import './components/web-content';

class WebApp extends LitElement {
	render() {
		return html`
			<style>
				:host {
					background: #aaa;
					position: absolute;
					top: 0;
					bottom: 0;
					left: 0;
					right: 0;
				}
			</style>
			<web-content></web-content>`;
	}
}

customElements.define('web-app', WebApp);

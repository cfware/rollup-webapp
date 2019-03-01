import {ShadowElement, html} from '@cfware/shadow-element';
import './components/web-content';

class WebApp extends ShadowElement {
	get template() {
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
			<web-content></web-content>
		`;
	}
}

WebApp.define('web-app');

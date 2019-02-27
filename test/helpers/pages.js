import {server} from '../../helpers/start';
import {setup, page} from '@cfware/ava-selenium-manager';

page('app.html', async t => {
	const {selenium, grabImage, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'Web Components are easy!');
	await grabImage(ele);
});

page('camel-case.html', async t => {
	const {selenium, grabImage, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'camelCase');
	await grabImage(ele);

	await selenium.executeScript(ele => {
		ele.value = 'new-value';
	}, ele);

	await checkText(ele, 'newValue');
	await grabImage(ele, 'new-value');
});

page('web-content.html', async t => {
	const {selenium, grabImage, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'Web Components are easy!');
	await grabImage(ele, 'easy');

	await selenium.executeScript(ele => {
		ele.setAttribute('mood', 'simple');
	}, ele);
	await checkText(ele, 'Web Components are simple!');
	await grabImage(ele, 'simple');

	await selenium.executeScript(ele => {
		ele.mood = 'happy';
	}, ele);
	await checkText(ele, 'Web Components are happy!');
	await grabImage(ele, 'happy');
});

export function setupTesting(browserBuilder) {
	setup({
		browserBuilder,
		async daemonFactory() {
			const daemon = server();

			await daemon.listen(0);

			return daemon;
		},
		daemonStop(daemon) {
			daemon.server.unref();
		},
		daemonGetURL(daemon, pathname) {
			return `http://localhost:${daemon.server.address().port}/test/${pathname}`;
		}
	});
}

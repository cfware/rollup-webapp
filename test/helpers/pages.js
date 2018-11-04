import {server} from '../../helpers/start';
import {build, daemon, page} from './selenium';

page('app.html', async t => {
	const {selenium, grabImage, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'Web Components are easy!');
	await grabImage(ele);
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

export function setupTesting(file, builder) {
	build(file, builder);
	daemon({
		async factory() {
			const daemon = server();

			await daemon.listen(0);

			return daemon;
		},
		stop(daemon) {
			daemon.server.unref();
		},
		getURL(t, daemon, pathname) {
			return `http://localhost:${daemon.server.address().port}/test/${pathname}`;
		}
	});
}

import {server} from '../../helpers/start';
import {build, daemon, page} from './selenium';

page('app.html', async t => {
	const {selenium, snapshotImage, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'Web Components are easy!');
	await snapshotImage(ele, 'app');
});

page('web-content.html', async t => {
	const {selenium, snapshotImage, checkText} = t.context;
	const ele = await selenium.findElement({id: 'test'});

	await checkText(ele, 'Web Components are easy!');
	await snapshotImage(ele, 'easy');

	await selenium.executeScript(ele => {
		ele.setAttribute('mood', 'simple');
	}, ele);
	await checkText(ele, 'Web Components are simple!');
	await snapshotImage(ele, 'simple');

	await selenium.executeScript(ele => {
		ele.mood = 'happy';
	}, ele);
	await checkText(ele, 'Web Components are happy!');
	await snapshotImage(ele, 'happy');
});

export function setupTesting(builder) {
	build(builder);
	daemon({
		async factory() {
			const daemon = server();

			await daemon.listen(0);

			return daemon;
		},
		getURL(t, daemon, pathname) {
			return `http://localhost:${daemon.server.address().port}/test/${pathname}`;
		}
	});
}

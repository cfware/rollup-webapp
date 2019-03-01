import {setup, page} from '@cfware/ava-selenium-manager';
import {FastifyTestHelper} from '@cfware/fastify-test-helper';
import {serveSource} from '../../helpers/start';

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

	/* Wait for debounce */
	await selenium.sleep(50);

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

	/* Wait for debounce */
	await selenium.sleep(50);

	await checkText(ele, 'Web Components are simple!');
	await grabImage(ele, 'simple');

	await selenium.executeScript(ele => {
		ele.mood = 'happy';
	}, ele);

	/* Wait for debounce */
	await selenium.sleep(50);

	await checkText(ele, 'Web Components are happy!');
	await grabImage(ele, 'happy');
});

export function setupTesting(browserBuilder) {
	setup(new FastifyTestHelper(browserBuilder, {
		testsPrefix: '/test/',
		fastifyPlugin: serveSource
	}));
}

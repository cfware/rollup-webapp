import test from 'ava'; // eslint-disable-line ava/no-ignored-test-files
import {createCoverageMap} from 'istanbul-lib-coverage';

const globalScope = (new Function('return this'))(); // eslint-disable-line no-new-func
const coverageMap = createCoverageMap();

let selenium = null;
let serializer = Promise.resolve();

let daemonFactory = null;
let daemonGetURL = null;

export function build(builder) {
	if (selenium) {
		throw new Error('Already have a selenium session');
	}
	selenium = builder.build();

	test.after.always(() => {
		selenium.quit();
		if (globalScope.__coverage__) {
			coverageMap.merge(globalScope.__coverage__);
		}
		globalScope.__coverage__ = coverageMap.toJSON();
	});
}

export function daemon({factory, getURL}) {
	if (typeof factory !== 'function' || typeof getURL !== 'function') {
		throw new TypeError('Invalid arguments');
	}
	daemonFactory = factory;
	daemonGetURL = getURL;
}

async function mergeCoverage(t) {
	try {
		const coverage = await selenium.executeScript(() => ava.coverage);

		if (coverage && typeof coverage === 'object') {
			/* Merge coverage object from the browser running this test. */
			coverageMap.merge(coverage);
		}
	} catch (error) {
		t.log('No test coverage data found.');
	}
}

async function snapshotImage(t, element, message) {
	const promise = element
		.takeScreenshot()
		.catch(() => 'Element screenshot not supported by this browser.');

	t.snapshot('![](data:image/png;base64,' + (await promise) + ')', message);
}

async function checkErrors(t) {
	const errors = await selenium.executeScript(() => ava.errors);
	errors.forEach(err => {
		t.log(err);
	});
	t.is(errors.length, 0);
}

async function checkText(t, ele, text) {
	/* This works in Chrome only.
	 * https://github.com/mozilla/geckodriver/issues/1417 */
	if (!t.context.isFirefox) {
		t.is(await ele.getText(), text);
	}
}

/* global ava */
export function page(path, impl) {
	async function runTest(t) {
		await serializer;

		if (!selenium) {
			throw new Error('Missing selenium');
		}

		if (!daemonFactory) {
			throw new Error('Missing daemon factory');
		}

		Object.assign(t.context, {
			selenium,
			isFirefox: (await selenium.getCapabilities()).getBrowserName() === 'firefox',
			mergeCoverage: () => mergeCoverage(t),
			snapshotImage: (element, message) => snapshotImage(t, element, message),
			checkText: (ele, text) => checkText(t, ele, text)
		});

		const daemon = await daemonFactory(t);
		await selenium.get(daemonGetURL(t, daemon, path));
		await impl(t);
		await Promise.all([
			mergeCoverage(t),
			checkErrors(t)
		]);

		daemon.server.unref();
	}

	test(path, async t => {
		await (serializer = runTest(t));
	});
}

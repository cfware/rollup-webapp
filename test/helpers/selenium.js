/* eslint ava/no-ignored-test-files: ["off"] */
import path from 'path';
import _fs from 'fs';

import test from 'ava';
import {createCoverageMap} from 'istanbul-lib-coverage';
import pify from 'pify';
import makeDir from 'make-dir';

const fs = pify(_fs);

const globalScope = (new Function('return this'))(); // eslint-disable-line no-new-func
const coverageMap = createCoverageMap();

let selenium = null;
let serializer = Promise.resolve();

let daemonFactory = null;
let daemonGetURL = null;
let daemonStop = null;

let testCWD = null;
let testFile = null;
let testDir = null;

function artifactDir(artifactType) {
	const parts = new Set(path.relative(testCWD, testDir).split(path.sep));
	if (parts.has('__tests__')) {
		return path.join(testDir, `__${artifactType}__`);
	}

	if (parts.has('test')) {
		return path.join(testDir, artifactType);
	}

	return testDir;
}

export function build(file, builder) {
	if (selenium) {
		throw new Error('Already have a selenium session');
	}
	selenium = builder.build();

	testCWD = process.cwd();
	testFile = path.basename(file, '.js');
	testDir = path.dirname(file);

	test.after.always(() => {
		selenium.quit();
		if (globalScope.__coverage__) {
			coverageMap.merge(globalScope.__coverage__);
		}
		globalScope.__coverage__ = coverageMap.toJSON();
	});
}

export function daemon({factory, stop, getURL}) {
	if (typeof factory !== 'function' || typeof getURL !== 'function') {
		throw new TypeError('Invalid arguments');
	}
	daemonFactory = factory;
	daemonStop = stop;
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
	const image64 = await promise;

	t.snapshot(`![](data:image/png;base64,${image64})`, message);
}

async function grabImage(t, element, imageID) {
	const dir = artifactDir('images');
	const parts = [
		testFile,
		path.basename(t.title, '.html')
	];
	if (typeof imageID === 'string') {
		parts.push(imageID);
	}
	const imageFile = path.join(dir, parts.join('-') + '.png');

	let image64 = null;
	try {
		image64 = await element.takeScreenshot();
	} catch (error) {
		/* If the browser doesn't support capture */
		return;
	}

	await makeDir(dir);
	await fs.writeFile(imageFile, Buffer.from(image64, 'base64'));
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
			grabImage: (element, imageID) => grabImage(t, element, imageID),
			checkText: (ele, text) => checkText(t, ele, text)
		});

		const daemon = await daemonFactory(t);
		await selenium.get(daemonGetURL(t, daemon, path));
		await impl(t);
		await Promise.all([
			mergeCoverage(t),
			checkErrors(t)
		]);

		daemonStop(daemon);
	}

	test(path, async t => {
		await (serializer = runTest(t));
	});
}

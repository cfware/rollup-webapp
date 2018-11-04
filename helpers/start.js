import fs from 'fs';

import log from 'gulplog';
import ansi from 'ansi-colors';

import fastify from 'fastify';
import fastifyBabel from 'fastify-babel';
import fastifyStatic from 'fastify-static';

import {rootPath, wwwroot, testRootURL, babelrc} from './utils';

const daemons = [];

function clearDaemons() {
	daemons.forEach(([daemon, resolve]) => {
		daemon.server.unref();
		resolve(daemon);
	});
}

function serveSource(fastify, opts, next) {
	const decorateReply = false;
	const prefix = `${testRootURL}/`;

	fastify
		.register(fastifyStatic, {
			prefix,
			root: rootPath('html')
		})
		.register(fastifyStatic, {
			root: rootPath('node_modules'),
			prefix: `${testRootURL}/assets/`,
			decorateReply
		})
		.register(fastifyStatic, {
			root: rootPath('test/fixtures'),
			prefix: '/test/',
			decorateReply
		})
		.register(fastifyBabel, {babelrc})
		.get(testRootURL, (_, reply) => reply.redirect(301, prefix))
		.get(prefix, (_, reply) => reply.sendFile('index.html'));

	next();
}

function serveBuilt(fastify, opts, next) {
	const rootPrefix = '/wwwroot';
	const prefix = `${rootPrefix}/`;

	try {
		fs.mkdirSync(wwwroot);
	} catch (error) {
		if (error.code !== 'EEXIST') {
			console.log('code:', error.code);
			throw error;
		}
	}

	fastify
		.register(fastifyStatic, {
			prefix,
			root: wwwroot
		})
		.get(rootPrefix, (_, reply) => reply.redirect(301, prefix))
		.get(prefix, (_, reply) => reply.sendFile('index.html'));

	next();
}

export function server(settings = {}) {
	const daemon = fastify(settings);

	daemon.register(serveSource);
	daemon.register(serveBuilt);

	return daemon;
}

function initDaemon(port = 0, settings = {}) {
	const daemon = server(settings);

	return new Promise((resolve, reject) => {
		daemon.listen(port, err => {
			if (err) {
				reject(err);
			}

			daemons.push([daemon, resolve]);
			log.info('Listening at ' + ansi.cyan(`${settings.https ? 'https' : 'http'}://localhost:${port}${testRootURL}`));
		});
	});
}

function loadkeys() {
	try {
		return {
			key: fs.readFileSync('localhost.key.pem'),
			cert: fs.readFileSync('localhost.crt.pem')
		};
	} catch (error) {
		return null;
	}
}

export const start = () => {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = 'development';
	}

	const https = loadkeys();
	const promises = [];

	promises.push(initDaemon(3000));
	if (https) {
		promises.push(initDaemon(3001, {http2: true, https}));
	}

	process.on('SIGINT', () => {
		console.log('\nCtrl-C captured');
		clearDaemons();
	});

	return Promise.all(promises);
};

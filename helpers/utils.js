import path from 'path';
import terser from 'terser';

export const rootPath = (...args) => path.resolve(__dirname, '..', ...args);
export const wwwroot = rootPath('wwwroot');
export const testRootURL = '/app';

function bareImportRewrite(production) {
	return [
		'bare-import-rewrite',
		{
			alwaysRootImport: ['**'],
			/* This must be an absolute URL path because bare imports can
			 * be resolved from sources in multiple directories. */
			modulesDir: production ? rootPath('node_modules') : `${testRootURL}/assets`
		}
	];
}

export const minifyJS = {
	ecma: 8,
	module: true
};

export const minifyCSS = {
	level: 2
};

export const htmlMinifier = {
	collapseWhitespace: true,
	removeComments: true,
	minifyCSS,
	minifyJS: text => terser.minify(text, minifyJS).code,
	keepClosingSlash: true
};

/* Only necessary plugins / presets should be used by development and test env's.
 * Minifying is generally not recommended as this will slow the test web server
 * without much benefit as bandwidth is not an issue when browsing localhost. */
export const babelrc = {
	babelrc: false,
	configFile: false,
	parserOpts: {
		plugins: [
			'objectRestSpread',
			'importMeta'
		]
	},
	plugins: [
		'remove-ungap'
	],
	env: {
		production: {
			plugins: [
				['template-html-minifier', {
					modules: {
						'@cfware/shadow-element': ['html']
					},
					htmlMinifier
				}],
				bareImportRewrite(true),
				['bundled-import-meta', {
					/* This could be done using mappings.html == '.' but using
					 * bundleDir means this plugin will throw an error if we try
					 * to bundle anything from outside html or node_modules. */
					bundleDir: 'html',
					mappings: {
						[rootPath('node_modules')]: './assets'
					}
				}]
			]
		},
		development: {
			plugins: [
				bareImportRewrite()
			]
		},
		test: {
			plugins: [
				bareImportRewrite(),
				'istanbul'
			]
		}
	},
	/* For now target specific modules only, transform-commonjs sometimes makes unwanted changes. */
	overrides: [{
		test: [
			rootPath('node_modules/camelcase/**')
		],
		plugins: ['transform-commonjs']
	}]
};

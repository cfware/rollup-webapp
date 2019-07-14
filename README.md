# @cfware/rollup-webapp

[![Travis CI][travis-image]][travis-url]
[![Greenkeeper badge][gk-image]](https://greenkeeper.io/)
[![MIT][license-image]](LICENSE)

Web Application Template

## This repository is archived

The libraries used here are still maintained but I do not have time to maintain
this template repository.  I recommend checking out [@open-wc/building-rollup].


## Motivation

[polymer-tools] were necessary to work with Polymer 1 and Polymer 2 as nothing else
had proper support for HTML imports.  Now with [Polymer 3], [lit-element] and
[hyperHTML-Element] all being ES module's we can use standard tools.  Even still I
found that custom element based web applications often pushed or even exceeded the
limits of existing tools.

This repository intentionally does not provide a useful web application template.  The
goal here is to demonstrate how to use [gulp@4] and [rollup] to build any web application.
Other web application templates already do a good job demonstrating where you might start
with the actual web application contents.  See:

* [web-padawan/polymer3-webpack-starter]
* [Polymer/pwa-starter-kit]


## Usage

All commands require `npm install` be run first.

|Command|Description|
|-|-|
npm test|Run [automated tests](#running-tests)
npm start|This is an alias to `gulp start`.
npm pack|Rebuild `wwwroot/`, create an npm compatible tarball.
gulp clean|Delete `wwwroot/`
gulp build|Build `wwwroot/`
gulp rebuild|Delete then build `wwwroot/`
gulp snapshots|Process [snapshot files](#snapshot-processing)
gulp start|Start the [development web server](#manual-testing)

Note that if `gulp` is not installed globally you will need to use the `npx` command
to directly run the local copy.  For example `npx gulp rebuild`.


## Features

This build system targets latest browsers only.  Additional steps are required to support
older / less capable browsers.  Specifically the resulting web application requires the
following features:

* ES modules including `import.meta.url`.  Output format can be changed in [helpers/build.js]
to avoid this requirement.
* Custom Elements v1 and Shadow DOM v1.  The work-around is to load [webcomponentsjs]
polyfill from your HTML file.
* Other features of modern JavaScript (ES2015+) are likely used.  Older browsers can be
supported by adding [@babel/preset-env] to `babelrc` in [helpers/utils.js] with the
appropriate `targets` set.


### babel-plugin-bare-import-rewrite [readme](https://github.com/cfware/babel-plugin-bare-import-rewrite#readme)

Source scripts are often written with bare imports.  In the following script
`'@polymer/lit-element'` must be rewritten as a relative or absolute URL that the
browser can understand.

```js
import {LitElement, html} from '@polymer/lit-element';
```

This plugin supports 'flattening' of some or all bare imported modules.  Normally
if `node_modules/component-1` required `@polymer/lit-element@^0.5.0` and
`node_modules/component-2` required `@polymer/lit-element@^0.6.0` you would end up
with multiple versions of `@polymer/lit-element` and dependencies having incompatible
semver versions.  At best this inflates the bundle, at worst it can break the entire
application.

In addition this babel plugin is used during the production build via
[rollup-plugin-babel].  Initially I used rollup-plugin-node-resolve but this did not
provide a powerful enough way to control which modules had to be flatted.


### babel-plugin-bundled-import-meta [readme](https://github.com/cfware/babel-plugin-bundled-import-meta#readme)

This is needed as an intermediate step to translate `import.meta.url`.  Although the output
still includes `import.meta.url`, it is adjusted to return the unbundled URL.  The need for
this is demonstrated by [html/components/web-content.js].  rollup will bundle this source
into `wwwroot/index.js`, thus without adjustment `svgFile` would point to `http://hostname/approot/index.svg`
instead of `http://hostname/approot/components/web-content.svg`.


### babel-plugin-istanbul [readme](https://github.com/istanbuljs/babel-plugin-istanbul#readme)

This is enabled for `npm test` only.  Coverage collection is added to JavaScript before
serving to the browser.  This makes it possible to see if any code is not run.  Coverage
data from each test is merged with [istanbul-lib-coverage] and reported by [nyc].


### babel-plugin-template-html-minifier [readme](https://github.com/goto-bus-stop/babel-plugin-template-html-minifier#readme)

This plugin runs `html-minifier` on specified templates.  [helpers/utils.js] is configured
to minify `lit-html` and `lit-element` templates in the production profile.


### babel-plugin-transform-commonjs [readme](https://github.com/tbranyen/babel-plugin-transform-commonjs#readme)

This plugin is makes it possible for browser scripts to use CommonJS modules.  This can be
useful as most modules on node.js are written in CommonJS and the build system only supports
ES modules.  Note this is a single purpose plugin.  It will not fix browser compatibility
issues that are present in many complex node.js modules.

Although the production build process could use [rollup-plugin-commonjs] this cannot be
used by the test server for live transpilation.


### fastify-babel [readme](https://github.com/cfware/fastify-babel#readme)

This is needed to replicate functionality provided by `polymer serve` so your page can
be previewed without a build step.  At minimum `bare-import-rewrite` must be an included
babel plugin provided to [fastify-babel] because browsers do not allow bare imports.


### @gulp-sourcemaps/map-sources [readme](https://github.com/gulp-sourcemaps/map-sources#readme)

This gulp plugin provides an easy way to rewrite references to sources in source-map files.
[helpers/build.js] uses this to rewrite references to `node_modules` to instead be in `./assets`.
Additionally this is used to strip the prefix from the main source file so `index.js.map` doesn't
point to `html/index.js` is the original source.


### vinyl-rollup [readme](https://github.com/cfware/vinyl-rollup#readme)

It is definitely possible to use rollup directly, this is a helper which initializes a stream
of vinyl objects so additional steps can be performed before using `gulp.dest` to finally
write the files.  `vinyl-rollup` also has the benefit of copying some or all files from
bundled modules.  This can be helpful for license compliance reasons and for simply
documenting the versions of included packages.


## devDependencies vs dependencies

If you look at [package.json] you'll see that this package has only devDependencies.  The
intent is that `dependencies` should only include modules that are needed for node.js
code at runtime.  For example `@polymer/lit-element` is never used by node.js in production,
the build system bundles it and copies to `wwwroot/assets`, then it is used by the browser only.
fastify modules are currently used in development only.  If you decided that you wanted to
use fastify to serve your web-app in production then you would move it to `dependencies`.

Note: this could be a problem for license compliance scanners if they are configured to
ignore `devDependencies`.  In that case licenses of modules in `wwwroot/assets` should be
checked.


## Running tests

Tests are provided by [xo] and [ava].

```sh
npm install
npm test
```

Note that `ava` will run test files in [parallel](https://github.com/avajs/ava#process-isolation).
This could pose issues if multiple test files perform tests using the same browser.  That
is why all HTML tests are declared in [test/helpers/pages.js].  They are executed by
[test/firefox.js] and [test/chrome.js].  This means causes tests for Firefox and Chrome to run
at the same time, but each browser runs a single test at a time.

Note as of now it is important to include `chromedriver` in the testing.  `geckodriver`
returns a blank string when you run `getText` on an element that includes shadow dom.
This has been reported to at https://github.com/mozilla/geckodriver/issues/1417 though
it's unclear what the solution will be.

Test browsers must support ES modules including `import.meta.url`.


### Manual testing

You can start the test web server by running `npm start`.  This will allow you to browse
`./html/` via http://localhost:3000/app.  If NODE_ENV is unset it will be initialized to
`development` to ensure babel performs the correct transformations for live browsing.  This
makes it possible to change sources in `./html` and simply refresh the browser without
the need to `npm run build`.

The test web server will also serve `./wwwroot` via http://localhost:3000/wwwroot.  The wwwroot
folder is not automatically built, you must `gulp rebuild` to see updates.  This allows
manual verification that the `production` babel configuration does not introduce bugs.

HTTP/2 is enabled if `localhost.key.pem` and `localhost.crt.pem` are available.  This will
enable https://localhost:3001, the same paths served from port 3000 are available.

Much like automated testing the pages hosted at `/app` require ES module support including
`import.meta.url`.  Older browsers can only be tested via `/wwwroot`, and then only if
rollup/babel has the proper configuration to enable support of those browsers.


### Snapshot processing

`ava` supports snapshot based testing.  When used this will produce binary `.snap` files
and `.md` files.  HTML files for each snapshot `.md` can be produced by `gulp snapshots`.
This includes special processing for `t.context.snapshotImage` to display the screen
capture instead of the base64 code.  Note that `t.context.snapshotImage` is fragile and
not recommended.  A snapshot image produced by Firefox on Fedora 28 is not identical to
an image produced by the Travis-CI.  A single pixel being different will cause the test
to fail.  It is better to use `t.context.grabImage` and periodically reviewing the images.
The example tests use this function to create PNG files in [tests/images].  These images
are committed so `git status` run after testing will show if they changed.  In situations
where tests are performed on multiple different systems it might be better to `.gitignore`
the grabbed images.


[travis-image]: https://travis-ci.org/cfware/rollup-webapp.svg?branch=master
[travis-url]: https://travis-ci.org/cfware/rollup-webapp
[gk-image]: https://badges.greenkeeper.io/cfware/ava-selenium-manager.svg
[license-image]: https://img.shields.io/github/license/cfware/rollup-webapp.svg

[polymer-tools]: https://github.com/Polymer/tools
[Polymer 3]: https://www.polymer-project.org/3.0/docs/about_30
[lit-element]: https://github.com/Polymer/lit-element/blob/master/README.md
[hyperHTML-Element]: https://github.com/WebReflection/hyperHTML-Element#readme
[fastify-babel]: https://github.com/cfware/fastify-babel#readme
[web-padawan/polymer3-webpack-starter]: https://github.com/web-padawan/polymer3-webpack-starter#readme
[Polymer/pwa-starter-kit]: https://github.com/Polymer/pwa-starter-kit#readme
[webcomponentsjs]: https://github.com/webcomponents/webcomponentsjs#readme
[gulp@4]: https://gulpjs.com/
[rollup]: https://rollupjs.org/guide/en
[rollup-plugin-babel]: https://github.com/rollup/rollup-plugin-babel#readme
[rollup-plugin-commonjs]: https://github.com/rollup/rollup-plugin-commonjs#readme
[xo]: https://github.com/xojs/xo#readme
[ava]: https://github.com/avajs/ava#readme
[@babel/preset-env]: https://babeljs.io/docs/en/babel-preset-env#options
[istanbul-lib-coverage]: https://github.com/istanbuljs/istanbuljs/tree/master/packages/istanbul-lib-coverage#readme
[nyc]: https://github.com/istanbuljs/nyc#readme

[package.json]: https://github.com/cfware/rollup-webapp/blob/master/package.json
[helpers/utils.js]: https://github.com/cfware/rollup-webapp/blob/master/helpers/utils.js
[helpers/build.js]: https://github.com/cfware/rollup-webapp/blob/master/helpers/build.js
[html/components/web-content.js]: https://github.com/cfware/rollup-webapp/blob/master/html/components/web-content.js
[test/firefox.js]: https://github.com/cfware/rollup-webapp/blob/master/test/firefox.js
[test/chrome.js]: https://github.com/cfware/rollup-webapp/blob/master/test/chrome.js
[test/helpers/pages.js]: https://github.com/cfware/rollup-webapp/blob/master/test/helpers/pages.js
[tests/images]: https://github.com/cfware/rollup-webapp/tree/master/test/images/

[@open-wc/building-rollup]: https://www.npmjs.com/package/@open-wc/building-rollup

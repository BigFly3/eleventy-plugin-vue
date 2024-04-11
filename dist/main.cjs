'use strict';

var path = require('node:path');
var pluginVue$1 = require('@vitejs/plugin-vue');
var moduleFromString = require('module-from-string');
var rollup = require('rollup');
var pluginCSS = require('rollup-plugin-css-only');
var vue = require('vue');
var serverRenderer = require('vue/server-renderer');

const DOCTYPE = '<!doctype html>';

/**
 * Add doctype to HTML files.
 *
 * @param {string} content
 * @param {string} outputPath
 * @returns {string}
 */
function doctype(content, outputPath) {
	const isHTMLFile = outputPath.endsWith('.html');
	const hasDoctype = content.trim().toLowerCase().startsWith(DOCTYPE);

	if (isHTMLFile && !hasDoctype) {
		return `${DOCTYPE}${content}`
	}

	return content
}

const CWD = process.cwd();

/**
 * Compile and render Vue component.
 *
 * @param {Object} options
 * @param {string} options.inputPath
 * @param {Object<string, any>} options.data
 * @param {Object<string, function>} options.methods
 * @param {Object} options.rollupOptions
 */
async function render({ inputPath, data, methods, rollupOptions }) {
	const filename = path.join(CWD, inputPath);
	let css = '';

	const rollupConfig = {
		input: filename,
		plugins: [
			pluginVue$1({
				ssr: true
			}),
			pluginCSS({
				output: styles => {
					css = styles;
				}
			})
		],
		external: ['@mvsde/eleventy-plugin-vue', 'vue']
	};

	for (let key in rollupOptions) {
		if (key === 'external' || key === 'plugins') {
			// merge the Array
			rollupConfig[key] = rollupConfig[key].concat(rollupOptions[key]);
		} else {
			rollupConfig[key] = rollupOptions[key];
		}
	}

	const bundle = await rollup.rollup(rollupConfig);

	const template = await bundle.generate({
		format: 'cjs',
		exports: 'default'
	});

	const component = moduleFromString.requireFromString(template.output[0].code, {
		filename: path.basename(filename),
		dirname: path.dirname(filename)
	});

	const app = vue.createSSRApp(component);

	app.config.globalProperties.$data = data;
	app.config.globalProperties.$methods = methods;
	app.config.globalProperties.$css = css;

	return serverRenderer.renderToString(app)
}

/**
 * Workaround for global data and methods in `<script setup>`.
 * Eleventy injects the data into the template. To use it from the script,
 * we need to extract the data from the app instance.
 *
 * Source: https://forum.vuejs.org/t/how-to-use-globalproperties-in-vue-3-setup-method/108387/4
 */

/**
 * @returns {Object}
 */
function useData() {
	const app = vue.getCurrentInstance();
	return app?.appContext.config.globalProperties.$data ?? {}
}

/**
 * @returns {Object<string,function>}
 */
function useMethods() {
	const app = vue.getCurrentInstance();
	return app?.appContext.config.globalProperties.$methods ?? {}
}

/**
 * @returns {string|null}
 */
function useCSS() {
	const app = vue.getCurrentInstance();
	return app?.appContext.config.globalProperties.$css
}

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 */
function pluginVue(eleventyConfig, options) {
	eleventyConfig.addTemplateFormats('vue');

	eleventyConfig.addExtension('vue', {
		compile(_, inputPath) {
			return data =>
				render({
					inputPath,
					data,
					methods: this.config.javascriptFunctions,
					rollupOptions: options.rollupOptions
				})
		},
		read: false
	});

	eleventyConfig.addTransform('doctype', doctype);
}

exports.pluginVue = pluginVue;
exports.useCSS = useCSS;
exports.useData = useData;
exports.useMethods = useMethods;
//# sourceMappingURL=main.cjs.map

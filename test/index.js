import fs from 'fs';
import path from 'path';
import { transformFileSync } from 'babel-core';
import plugin from '../src';

const babelConfig = {
	presets: [],
	plugins: [
		[plugin, {'namespace': 'ym'}]
	]
};

describe('simple plugin test', () => {
	var result = transformFileSync(path.resolve(__dirname, './fixtures/index.js'), babelConfig);
	console.log(result.code);
});

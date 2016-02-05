import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { transformFileSync } from 'babel-core';
import plugin from '../src';

const babelConfig = {
    presets: [],
    plugins: [
        [plugin, {'namespace': 'ym'}]
    ]
};

function testTransform (testName) {
    it(testName, () => {
        const fixtureFilepath = path.resolve(__dirname, 'fixtures', testName, 'fixture.js'),
            actualFilepath = path.resolve(__dirname, 'fixtures', testName, 'actual.js'),
            expectedFilepath = path.resolve(__dirname, 'fixtures', testName, 'expected.js');

        const result = transformFileSync(fixtureFilepath, babelConfig),
            actual = result.code + '\n',
            expected = fs.readFileSync(expectedFilepath, 'utf8');

        fs.writeFileSync(actualFilepath, actual);
        assert.equal(expected, actual);
        // assert.ok(true);
    });
}

describe('babel-plugin-es6-ymodule', () => {
    testTransform('Import');
});

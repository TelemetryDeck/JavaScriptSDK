import replace from '@rollup/plugin-replace';
import fs from 'node:fs';

const package_ = JSON.parse(fs.readFileSync('./package.json'));

const plugins = [
  replace({
    values: {
      __PACKAGE_VERSION__: package_.version,
    },
    preventAssignment: true,
  }),
];

export default [
  // CommonJS build for Node.js
  {
    input: 'src/telemetrydeck.js',
    output: {
      file: 'dist/telemetrydeck.cjs',
      format: 'cjs',
    },
    plugins,
  },
  // ES module build
  {
    input: 'src/telemetrydeck.js',
    output: {
      file: 'dist/telemetrydeck.js',
      format: 'esm',
    },
    plugins,
  },
];

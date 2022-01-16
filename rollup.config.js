import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [
  // CommonJS build for Node.js
  {
    input: 'src/telemetrydeck.mjs',
    output: {
      file: 'dist/telemtrydeck.js',
      format: 'cjs',
    },
    plugins: [json()],
  },
  // ES module build for browsers
  {
    input: 'src/telemetrydeck.mjs',
    output: {
      file: 'dist/telemtrydeck.mjs',
      format: 'module',
    },
    plugins: [json()],
  },
  // minified ES module build
  {
    input: 'src/telemetrydeck.mjs',
    output: {
      file: 'dist/telemtrydeck.min.mjs',
      format: 'module',
    },
    plugins: [json(), terser()],
  },
  // minified UMD build for most browsers
  {
    input: 'src/telemetrydeck.mjs',
    output: {
      file: 'dist/telemtrydeck.min.js',
      format: 'umd',
      name: '@telemetrydeck/sdk',
    },
    plugins: [json(), terser()],
  },
];

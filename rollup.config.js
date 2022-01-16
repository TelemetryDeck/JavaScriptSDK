import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'src/telemetrydeck.mjs',
    output: {
      file: 'dist/telemtrydeck.js',
      format: 'cjs',
    },
    plugins: [json()],
  },
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

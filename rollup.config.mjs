/* eslint-disable import/no-extraneous-dependencies */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import esbuild from 'rollup-plugin-esbuild';
import serve from 'rollup-plugin-serve';

// TODO: Wait once this issue will be fixed before update the terser plugin https://github.com/rollup/plugins/issues/1371
// TODO: Remove this hack once this issue will be resolved https://github.com/rollup/plugins/issues/1366
const __filename = fileURLToPath(import.meta.url);
global.__filename = __filename;

const data = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const year = new Date().getFullYear();

function getHeader() {
  return `/*!
 * Video Worker v${data.version} (${data.homepage})
 * Copyright ${year} ${data.author}
 * Licensed under MIT (https://github.com/nk-o/video-worker/blob/master/LICENSE)
 */
`;
}

const input = './src/video-worker.ts';

const bundles = [
  {
    input,
    output: {
      banner: getHeader(),
      file: './dist/video-worker.esm.js',
      format: 'esm',
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      file: './dist/video-worker.esm.min.js',
      format: 'esm',
      compact: true,
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      name: 'VideoWorker',
      file: './dist/video-worker.js',
      format: 'umd',
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      name: 'VideoWorker',
      file: './dist/video-worker.min.js',
      format: 'umd',
      compact: true,
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      file: './dist/video-worker.cjs',
      format: 'cjs',
      exports: 'default',
    },
  },
];

const isDev = () => process.env.NODE_ENV === 'dev';
const isUMD = (file) => file.includes('video-worker.js');
const isMinEnv = (file) => file.includes('.min.');
const isSpecificEnv = (file) => isMinEnv(file);
const isDebugAlways = (file) => (isDev() || isUMD(file) ? 'true' : 'false');

const configs = bundles.map(({ input: inputPath, output }) => ({
  input: inputPath,
  output,
  plugins: [
    nodeResolve({
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
    }),
    esbuild({
      sourceMap: true,
      target: 'es2018',
      tsconfig: './tsconfig.json',
    }),
    replace({
      __DEV__: isSpecificEnv(output.file)
        ? isDebugAlways(output.file)
        : 'process.env.NODE_ENV !== "production"',
      preventAssignment: true,
    }),
    output.file.includes('.min.') && terser(),
  ],
}));

// Dev server.
if (isDev()) {
  configs[configs.length - 1].plugins.push(
    serve({
      open: true,
      contentBase: ['demo', './'],
      port: 3002,
    })
  );
}

export default configs;

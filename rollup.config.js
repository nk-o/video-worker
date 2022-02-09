import path from 'path';

import { babel } from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import browsersync from 'rollup-plugin-browsersync';

const { data } = require('json-file').read('./package.json');

function getHeader() {
  return `/*!
 * Name    : Video Worker
 * Version : ${data.version}
 * Author  : ${data.author}
 * GitHub  : ${data.homepage}
 */
`;
}

const input = path.join(__dirname, 'src/video-worker.js');

const bundles = [
  {
    input,
    output: {
      banner: getHeader(),
      file: path.join(__dirname, 'dist/video-worker.esm.js'),
      format: 'esm',
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      file: path.join(__dirname, 'dist/video-worker.esm.min.js'),
      format: 'esm',
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      name: 'VideoWorker',
      file: path.join(__dirname, 'dist/video-worker.js'),
      format: 'umd',
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      name: 'VideoWorker',
      file: path.join(__dirname, 'dist/video-worker.min.js'),
      format: 'umd',
    },
  },
  {
    input,
    output: {
      banner: getHeader(),
      file: path.join(__dirname, 'dist/video-worker.cjs'),
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
    babel({
      babelHelpers: 'bundled',
      plugins: ['annotate-pure-calls'],
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
    browsersync({
      server: {
        baseDir: ['demo', './'],
      },
    })
  );
}

export default configs;

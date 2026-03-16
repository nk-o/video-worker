import fs from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const distDir = path.resolve('dist');
const expectedFiles = [
  'video-worker.cjs',
  'video-worker.cjs.map',
  'video-worker.esm.js',
  'video-worker.esm.js.map',
  'video-worker.esm.min.js',
  'video-worker.esm.min.js.map',
  'video-worker.js',
  'video-worker.js.map',
  'video-worker.min.js',
  'video-worker.min.js.map',
  'types/video-worker.d.ts',
  'types/video-worker.d.ts.map',
];

const missingFiles = expectedFiles.filter((file) => !fs.existsSync(path.join(distDir, file)));

if (missingFiles.length > 0) {
  throw new Error(`Missing build artifacts: ${missingFiles.join(', ')}`);
}

const expectedPackageFields = {
  main: 'dist/video-worker.cjs',
  module: 'dist/video-worker.esm.js',
  types: 'dist/types/video-worker.d.ts',
  unpkg: 'dist/video-worker.min.js',
};

for (const [field, expectedValue] of Object.entries(expectedPackageFields)) {
  if (packageJson[field] !== expectedValue) {
    throw new Error(`Expected package.json ${field} to equal "${expectedValue}"`);
  }
}

const rootExport = packageJson.exports?.['.'];

if (!rootExport) {
  throw new Error('Expected package.json exports["."] to be defined');
}

const expectedRootExport = {
  types: './dist/types/video-worker.d.ts',
  import: './dist/video-worker.esm.js',
  require: './dist/video-worker.cjs',
  default: './dist/video-worker.esm.js',
};

for (const [field, expectedValue] of Object.entries(expectedRootExport)) {
  if (rootExport[field] !== expectedValue) {
    throw new Error(`Expected exports["."].${field} to equal "${expectedValue}"`);
  }
}

if (packageJson.exports['./package.json'] !== './package.json') {
  throw new Error('Expected package.json exports["./package.json"] to be defined');
}

console.log('Build artifact validation passed.');

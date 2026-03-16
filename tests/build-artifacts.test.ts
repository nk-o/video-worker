import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const distDir = path.resolve(process.cwd(), 'dist');

describe('distribution artifact baseline', () => {
  it('keeps the expected distribution files in dist', () => {
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
    ];

    expectedFiles.forEach((file) => {
      expect(fs.existsSync(path.join(distDir, file))).toBe(true);
    });
  });

  it('loads the CommonJS bundle', () => {
    const mod = require(path.join(distDir, 'video-worker.cjs')) as {
      default?: { providers?: unknown };
      providers?: unknown;
    };
    const exported = mod?.default ? mod.default : mod;

    expect(exported).toBeTypeOf('function');
    expect(exported.providers).toBeDefined();
  });

  it('loads the ESM bundle', async () => {
    const mod = (await import(path.join(distDir, 'video-worker.esm.js'))) as {
      default: { providers?: unknown };
    };

    expect(mod.default).toBeTypeOf('function');
    expect(mod.default.providers).toBeDefined();
  });

  it('exposes window.VideoWorker from the UMD bundle', () => {
    const source = fs.readFileSync(path.join(distDir, 'video-worker.min.js'), 'utf8');
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      runScripts: 'outside-only',
      url: 'https://example.com',
    });
    const context = dom.getInternalVMContext();
    const windowWithVideoWorker = dom.window as unknown as Window & {
      VideoWorker?: { providers?: unknown };
    };

    vm.runInContext(source, context);

    expect(windowWithVideoWorker.VideoWorker).toBeTypeOf('function');
    expect(windowWithVideoWorker.VideoWorker?.providers).toBeDefined();
  });
});

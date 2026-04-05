import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const repoRoot = process.cwd();

function expectPathExists(relativePath: string) {
  expect(existsSync(join(repoRoot, relativePath)), `${relativePath} should exist`).toBe(true);
}

describe('T01 engineering baseline', () => {
  test('declares the frozen command matrix in package.json', () => {
    const packageJsonPath = join(repoRoot, 'package.json');

    expect(existsSync(packageJsonPath), 'package.json should exist').toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.lint).toBeTruthy();
    expect(packageJson.scripts?.typecheck).toBeTruthy();
    expect(packageJson.scripts?.test).toBeTruthy();
    expect(packageJson.scripts?.build).toBeTruthy();
  });

  test('creates the root toolchain config files for the extension scaffold', () => {
    expectPathExists('tsconfig.json');
    expectPathExists('tsconfig.node.json');
    expectPathExists('vite.config.ts');
    expectPathExists('vitest.config.ts');
    expectPathExists('eslint.config.mjs');
  });

  test('creates the minimal directory skeleton required by the frontend spec', () => {
    expectPathExists('public');
    expectPathExists('src/app');
    expectPathExists('src/features');
    expectPathExists('src/domain');
    expectPathExists('src/adapters');
    expectPathExists('src/shared');
    expectPathExists('test');
  });
});

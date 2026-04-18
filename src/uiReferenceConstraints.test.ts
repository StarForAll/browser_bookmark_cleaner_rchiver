import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const repoRoot = process.cwd();
const taskSlug = '04-02-workflow-e2e-bookmark-cleaner';

function listTaskRootCandidates() {
  const activeTaskRoot = join(repoRoot, '.trellis/tasks', taskSlug);
  const archiveRoot = join(repoRoot, '.trellis/tasks/archive');
  const archivedTaskRoots = existsSync(archiveRoot)
    ? readdirSync(archiveRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(archiveRoot, entry.name, taskSlug))
    : [];

  return [activeTaskRoot, ...archivedTaskRoots];
}

function readDoc(relativePath: string) {
  for (const taskRoot of listTaskRootCandidates()) {
    const filePath = join(taskRoot, relativePath);
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf8');
    }
  }

  throw new Error(`Unable to resolve design doc for ${relativePath}.`);
}

describe('T02 ui reference constraints', () => {
  test('freezes the allowed inheritance boundary in the visual system spec', () => {
    const visualSystem = readDoc('design/specs/visual-system.md');

    expect(visualSystem).toContain('atmosphere');
    expect(visualSystem).toContain('spacing rhythm');
    expect(visualSystem).toContain('surface hierarchy');
    expect(visualSystem).toContain('typography tone');
    expect(visualSystem).toContain('control prominence ordering');
  });

  test('freezes explicit forbidden tmp/ui reuse paths', () => {
    const visualSystem = readDoc('design/specs/visual-system.md');

    expect(visualSystem).toContain('tmp/ui/src/**');
    expect(visualSystem).toContain('tmp/ui/package.json');
    expect(visualSystem).toContain('tmp/ui/vite.config.ts');
    expect(visualSystem).toContain('tmp/ui/tsconfig.json');
    expect(visualSystem).toContain('tmp/ui/src/lib/utils.ts');
  });

  test('freezes the five-region workspace hierarchy and seven explicit actions', () => {
    const visualDirection = readDoc('design/pages/visual-direction.md');
    const workspacePage = readDoc('design/pages/workspace.md');

    expect(visualDirection).toContain('Top-right operation hint area');
    expect(visualDirection).toContain('Bottom-right status popup/history');

    expect(workspacePage).toContain('1. overwrite current draft from browser bookmarks');
    expect(workspacePage).toContain('2. sync current draft to browser bookmarks');
    expect(workspacePage).toContain('3. upload current draft to WebDAV');
    expect(workspacePage).toContain('4. upload current browser bookmarks to WebDAV');
    expect(workspacePage).toContain('5. restore a WebDAV draft version to the current draft');
    expect(workspacePage).toContain('6. restore a WebDAV bookmark version to browser bookmarks');
    expect(workspacePage).toContain('7. undo overwrite operation');
  });
});

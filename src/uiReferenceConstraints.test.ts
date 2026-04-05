import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const repoRoot = process.cwd();

function readDoc(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

describe('T02 ui reference constraints', () => {
  test('freezes the allowed inheritance boundary in the visual system spec', () => {
    const visualSystem = readDoc(
      '.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/visual-system.md',
    );

    expect(visualSystem).toContain('atmosphere');
    expect(visualSystem).toContain('spacing rhythm');
    expect(visualSystem).toContain('surface hierarchy');
    expect(visualSystem).toContain('typography tone');
    expect(visualSystem).toContain('control prominence ordering');
  });

  test('freezes explicit forbidden tmp/ui reuse paths', () => {
    const visualSystem = readDoc(
      '.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/visual-system.md',
    );

    expect(visualSystem).toContain('tmp/ui/src/**');
    expect(visualSystem).toContain('tmp/ui/package.json');
    expect(visualSystem).toContain('tmp/ui/vite.config.ts');
    expect(visualSystem).toContain('tmp/ui/tsconfig.json');
    expect(visualSystem).toContain('tmp/ui/src/lib/utils.ts');
  });

  test('freezes the five-region workspace hierarchy and seven explicit actions', () => {
    const visualDirection = readDoc(
      '.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/visual-direction.md',
    );
    const workspacePage = readDoc(
      '.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md',
    );

    expect(visualDirection).toContain('Bottom-left operation hint area');
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

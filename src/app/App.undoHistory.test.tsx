import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { App, resolveHintOverlayPosition, resolveStatusOverlayPosition } from './App';

const repoRoot = process.cwd();

function createDeepHierarchyDraftSnapshot(depth = 5): DraftGraphSnapshot {
  const rootId = 'folder-root-deep';
  const nodesById: DraftGraphSnapshot['nodesById'] = {
    [rootId]: {
      internalId: rootId,
      sourceType: 'draft',
      nodeType: 'folder',
      title: '深层根目录',
      url: null,
      parentId: null,
      childIds: ['folder-depth-1'],
      pathTokens: ['深层根目录'],
    },
  };

  for (let level = 1; level <= depth; level += 1) {
    const folderId = `folder-depth-${level}`;
    const isTerminalLevel = level === depth;
    const childId = isTerminalLevel ? 'bookmark-depth-terminal' : `folder-depth-${level + 1}`;
    nodesById[folderId] = {
      internalId: folderId,
      sourceType: 'draft',
      nodeType: 'folder',
      title: `第 ${level} 层目录`,
      url: null,
      parentId: level === 1 ? rootId : `folder-depth-${level - 1}`,
      childIds: [childId],
      pathTokens: ['深层根目录', ...Array.from({ length: level }, (_, index) => `第 ${index + 1} 层目录`)],
    };
  }

  nodesById['bookmark-depth-terminal'] = {
    internalId: 'bookmark-depth-terminal',
    sourceType: 'draft',
    nodeType: 'bookmark',
    title: '最深层书签',
    url: 'https://deep.example.com',
    parentId: `folder-depth-${depth}`,
    childIds: [],
    pathTokens: [
      '深层根目录',
      ...Array.from({ length: depth }, (_, index) => `第 ${index + 1} 层目录`),
      '最深层书签',
    ],
  };

  return {
    schemaVersion: 'draft-graph/v1',
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById,
    rootIds: [rootId],
  };
}

beforeEach(() => {
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T07B app undo-history hint gate', () => {
  test('surfaces a Ctrl+Z operation hint for draft-only undo', () => {
    render(<App />);

    const hintRegion = document.body.querySelector('.hint-overlay') as HTMLElement | null;

    expect(hintRegion).not.toBeNull();
    expect(within(hintRegion as HTMLElement).getByText(/Ctrl\+Z/)).toBeInTheDocument();
  });

  test('renders the hint overlay outside the canvas side rail so viewport-fixed positioning is not clipped by canvas layout', () => {
    render(<App />);

    const hintRegion = document.body.querySelector('.hint-overlay') as HTMLElement | null;

    expect(hintRegion).not.toBeNull();
    expect((hintRegion as HTMLElement).closest('.canvas-side-rail')).toBeNull();
  });

  test('keeps the operation hint always visible instead of collapsing into a minimized anchor', () => {
    render(<App />);

    expect(document.body.querySelector('.hint-minimize')).toBeNull();
    expect(document.body.querySelector('.hint-anchor')).toBeNull();
    expect(document.body.querySelector('.hint-overlay')).not.toBeNull();
  });

  test('renders the status popover outside the canvas side rail so it can float against the visible canvas bottom-right', () => {
    render(<App />);

    const statusRegion = document.body.querySelector('.status-popover') as HTMLElement | null;

    expect(statusRegion).not.toBeNull();
    expect((statusRegion as HTMLElement).closest('.canvas-side-rail')).toBeNull();
    expect(within(statusRegion as HTMLElement).getByText('最近记录')).toBeInTheDocument();
    expect((statusRegion as HTMLElement).querySelector('.status-close')?.textContent).toBe('x');
    expect((statusRegion as HTMLElement).querySelector('.status-close')).toHaveAttribute('aria-label', '关闭状态弹窗');
  });

  test('renders the closed status anchor outside the canvas side rail so reopen stays on the floating layer', async () => {
    const storageState: Record<string, unknown> = {
      'workspace-status-popover-open': false,
    };
    (globalThis as typeof globalThis & {
      chrome?: { storage: { local: { get: (keys: string[]) => Promise<Record<string, unknown>>; set: (items: Record<string, unknown>) => Promise<void> } } };
    }).chrome = {
      storage: {
        local: {
          get: async (keys) =>
            Object.fromEntries(keys.map((key) => [key, storageState[key]])),
          set: async (items) => {
            Object.assign(storageState, items);
          },
        },
      },
    };

    render(<App />);

    await waitFor(() => {
      expect(document.body.querySelector('.status-anchor')).not.toBeNull();
    });

    const statusAnchor = document.body.querySelector('.status-anchor') as HTMLElement | null;

    expect(statusAnchor).not.toBeNull();
    expect((statusAnchor as HTMLElement).closest('.canvas-side-rail')).toBeNull();
  });

  test('positions the hint overlay against the visible canvas top-right and sticks to the viewport when the canvas reaches the top edge', () => {
    expect(
      resolveHintOverlayPosition({
        stageRect: {
          top: 280,
          right: 1180,
          bottom: 920,
        },
        overlayWidth: 320,
        overlayHeight: 220,
        viewportWidth: 1440,
        viewportHeight: 900,
      }),
    ).toEqual({
      left: 836,
      top: 304,
    });

    expect(
      resolveHintOverlayPosition({
        stageRect: {
          top: -10,
          right: 1180,
          bottom: 920,
        },
        overlayWidth: 320,
        overlayHeight: 220,
        viewportWidth: 1440,
        viewportHeight: 900,
      }),
    ).toEqual({
      left: 836,
      top: 24,
    });
  });

  test('positions the status overlay against the visible canvas bottom-right and sticks to the viewport bottom when the canvas extends below the fold', () => {
    expect(
      resolveStatusOverlayPosition({
        stageRect: {
          top: 280,
          right: 1180,
          bottom: 920,
        },
        overlayWidth: 320,
        overlayHeight: 220,
        viewportWidth: 1440,
        viewportHeight: 900,
      }),
    ).toEqual({
      left: 836,
      top: 656,
    });

    expect(
      resolveStatusOverlayPosition({
        stageRect: {
          top: 280,
          right: 1180,
          bottom: 760,
        },
        overlayWidth: 320,
        overlayHeight: 220,
        viewportWidth: 1440,
        viewportHeight: 900,
      }),
    ).toEqual({
      left: 836,
      top: 516,
    });
  });

  test('keeps the hint overlay on a fixed layer while runtime positioning comes from inline canvas-aware coordinates', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(/\.hint-overlay\s*\{[^}]*position:\s*fixed;/s);
    expect(appCss).toMatch(/\.status-popover,\s*\.status-anchor\s*\{[^}]*position:\s*fixed;/s);
  });

  test('keeps the hint overlay and minimized status anchor truly see-through so draft text can still show beneath them', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(
      /\.hint-overlay\s*\{[^}]*background:\s*rgba\(255,\s*252,\s*246,\s*0\.24\);/s,
    );
    expect(appCss).toMatch(
      /\.hint-overlay\s*\{[^}]*backdrop-filter:\s*none;/s,
    );
    expect(appCss).toMatch(
      /\.status-anchor\s*\{[^}]*background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*252,\s*246,\s*0\.24\),\s*rgba\(255,\s*252,\s*246,\s*0\.08\)\);/s,
    );
    expect(appCss).toMatch(
      /\.status-anchor\s*\{[^}]*backdrop-filter:\s*none;/s,
    );
  });

  test('renders the draft viewport hint text with the same subdued transparent effect as the operation hint area', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(
      /\.draft-layout-popover\s+strong,\s*\.draft-layout-popover\s+p\s*\{[^}]*color:\s*rgba\(126,\s*136,\s*141,\s*0\.86\);/s,
    );
    expect(appCss).toMatch(
      /\.draft-layout-popover\s+strong,\s*\.draft-layout-popover\s+p\s*\{[^}]*font-weight:\s*400;/s,
    );
    expect(appCss).toMatch(
      /\.draft-layout-popover\s+strong,\s*\.draft-layout-popover\s+p\s*\{[^}]*text-shadow:\s*none;/s,
    );
  });

  test('keeps the deep-hierarchy viewport popover and the operation hint on separate fixed viewport slots', async () => {
    const stageRect = {
      x: 80,
      y: 180,
      left: 80,
      top: 180,
      right: 1180,
      bottom: 920,
      width: 1100,
      height: 740,
      toJSON: () => ({}),
    } as DOMRect;
    const treeRect = {
      x: 120,
      y: 180,
      left: 120,
      top: 180,
      right: 1080,
      bottom: 760,
      width: 960,
      height: 580,
      toJSON: () => ({}),
    } as DOMRect;
    const defaultRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect;

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function mockClientWidth(this: HTMLElement) {
      return this.classList.contains('draft-graph-tree') ? 960 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function mockOffsetWidth(this: HTMLElement) {
      if (this.classList.contains('hint-overlay')) {
        return 320;
      }

      if (this.classList.contains('draft-layout-popover')) {
        return 320;
      }

      return 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function mockOffsetHeight(this: HTMLElement) {
      if (this.classList.contains('hint-overlay')) {
        return 220;
      }

      if (this.classList.contains('draft-layout-popover')) {
        return 144;
      }

      return 0;
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(this: HTMLElement) {
      if (this.classList.contains('canvas-stage')) {
        return stageRect;
      }

      if (this.classList.contains('draft-graph-tree')) {
        return treeRect;
      }

      return defaultRect;
    });
    let nextFrameId = 0;
    vi.stubGlobal('requestAnimationFrame', ((callback: FrameRequestCallback) => {
      nextFrameId += 1;
      const frameId = nextFrameId;
      queueMicrotask(() => {
        callback(0);
      });
      return frameId;
    }) as typeof requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createDeepHierarchyDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-09T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(document.body.querySelector('.hint-overlay')).not.toBeNull();
      expect(document.body.querySelector('.draft-layout-popover')).not.toBeNull();
    });

    const hintOverlay = document.body.querySelector('.hint-overlay') as HTMLElement | null;
    const viewportHintPopover = document.body.querySelector('.draft-layout-popover') as HTMLElement | null;

    expect(hintOverlay).not.toBeNull();
    expect(viewportHintPopover).not.toBeNull();

    await waitFor(() => {
      expect(hintOverlay).toHaveStyle({
        left: '836px',
        top: '204px',
      });
      expect(viewportHintPopover).toHaveStyle({
        left: '144px',
        top: '204px',
      });
    });
  });

  test('renders the status close control as a plain x without a framed button shell', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(/\.status-close\s*\{[^}]*border:\s*none;/s);
    expect(appCss).toMatch(/\.status-close\s*\{[^}]*background:\s*transparent;/s);
  });

  test('shows a page-level back-to-top button after scrolling down and scrolls the whole page to the top when clicked', async () => {
    const originalScrollTo = window.scrollTo;
    const scrollToSpy = vi.fn();

    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 260,
      writable: true,
    });

    try {
      render(<App />);

      fireEvent.scroll(window);

      const backToTopButton = await screen.findByRole('button', { name: '回到顶部' });
      fireEvent.click(backToTopButton);

      expect(scrollToSpy).toHaveBeenCalledWith({
        left: 0,
        top: 0,
      });
    } finally {
      Object.defineProperty(window, 'scrollTo', {
        configurable: true,
        value: originalScrollTo,
      });
    }
  });

  test('keeps the page-level back-to-top button hidden before the page scroll threshold is crossed', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 100,
      writable: true,
    });

    render(<App />);

    expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull();
  });

  test('hides the page-level back-to-top button immediately after it is clicked to jump to the page top', async () => {
    const originalScrollTo = window.scrollTo;
    const scrollToSpy = vi.fn();

    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 260,
      writable: true,
    });

    try {
      render(<App />);

      fireEvent.scroll(window);

      const backToTopButton = await screen.findByRole('button', { name: '回到顶部' });
      fireEvent.click(backToTopButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull();
      });
      expect(scrollToSpy).toHaveBeenCalledWith({
        left: 0,
        top: 0,
      });
    } finally {
      Object.defineProperty(window, 'scrollTo', {
        configurable: true,
        value: originalScrollTo,
      });
    }
  });

  test('keeps the page-level back-to-top control on a fixed left-bottom layer with a visible keyboard focus ring', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(/\.page-back-to-top-button\s*\{[^}]*position:\s*fixed;/s);
    expect(appCss).toMatch(/\.page-back-to-top-button\s*\{[^}]*left:\s*32px;/s);
    expect(appCss).toMatch(/\.page-back-to-top-button\s*\{[^}]*bottom:\s*32px;/s);
    expect(appCss).toMatch(/\.page-back-to-top-button:focus-visible\s*\{[^}]*box-shadow:/s);
  });
});

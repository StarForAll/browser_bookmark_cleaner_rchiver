import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { App, resolveHintOverlayPosition, resolveStatusOverlayPosition } from './App';

const repoRoot = process.cwd();

afterEach(() => {
  cleanup();
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
    expect(within(statusRegion as HTMLElement).getByText('最新结果')).toBeInTheDocument();
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

  test('renders the status close control as a plain x without a framed button shell', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(/\.status-close\s*\{[^}]*border:\s*none;/s);
    expect(appCss).toMatch(/\.status-close\s*\{[^}]*background:\s*transparent;/s);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  DRAFT_GRAPH_SCHEMA_VERSION,
  type DraftGraphSnapshot,
} from '@/domain/draft-graph/contracts';
import { writePersistedDraftSession } from '@/adapters/local-persistence/writePersistedDraftSession';
import { App } from './App';

const repoRoot = process.cwd();

vi.mock('@/adapters/local-persistence/writePersistedDraftSession', () => ({
  writePersistedDraftSession: vi.fn(async () => ({ kind: 'unavailable' })),
}));

function createSearchableDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: DRAFT_GRAPH_SCHEMA_VERSION,
    snapshotVersion: 0,
    selectedNodeId: null,
    nodesById: {
      'folder-root': {
        internalId: 'folder-root',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '工作资料',
        url: null,
        parentId: null,
        childIds: ['bookmark-docs', 'bookmark-docs-archive', 'bookmark-help', 'bookmark-start'],
        pathTokens: ['工作资料'],
      },
      'bookmark-docs': {
        internalId: 'bookmark-docs',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Docs Hub',
        url: 'https://portal.example.com/docs',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Hub'],
      },
      'bookmark-docs-archive': {
        internalId: 'bookmark-docs-archive',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Docs Archive',
        url: 'https://archive.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Archive'],
      },
      'bookmark-help': {
        internalId: 'bookmark-help',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '帮助中心',
        url: 'https://portal.example.com/docs/help',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '帮助中心'],
      },
      'bookmark-start': {
        internalId: 'bookmark-start',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '起始页',
        url: 'https://start.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', '起始页'],
      },
    },
    rootIds: ['folder-root'],
  };
}

afterEach(() => {
  cleanup();
  vi.mocked(writePersistedDraftSession).mockClear();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T08A app search and duplicate controls gate', () => {
  test('enables the search input and duplicate-only toggle once a draft graph is available', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createSearchableDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-07T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('搜索标题或 URL')).toBeEnabled();
    expect(screen.getByRole('button', { name: '仅看重复项' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '仅看重复项' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('uses Enter plus ArrowUp or ArrowDown to cycle normal-search focus and resets to the first result after the query changes', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createSearchableDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-07T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Docs Archive' })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索标题或 URL');
    const docsHub = screen.getByRole('button', { name: '书签节点：Docs Hub' });
    const docsArchive = screen.getByRole('button', { name: '书签节点：Docs Archive' });
    const helpCenter = screen.getByRole('button', { name: '书签节点：帮助中心' });

    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'docs' } });

    expect(docsHub.className).toContain('is-search-match');
    expect(docsHub.className).not.toContain('is-search-focus');
    expect(docsArchive.className).toContain('is-search-match');
    expect(docsArchive.className).not.toContain('is-search-focus');

    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(docsHub.className).toContain('is-search-focus');
    expect(docsArchive.className).not.toContain('is-search-focus');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(docsArchive.className).toContain('is-search-focus');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(helpCenter.className).toContain('is-search-focus');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(docsHub.className).toContain('is-search-focus');

    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    expect(helpCenter.className).toContain('is-search-focus');

    fireEvent.change(searchInput, { target: { value: 'archive' } });
    expect(docsArchive.className).toContain('is-search-focus');
    expect(docsHub.className).not.toContain('is-search-focus');
  });

  test('accepts an immediate ArrowDown right after Enter without waiting for an intermediate render pass', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createSearchableDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-07T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Docs Archive' })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索标题或 URL');
    const docsArchive = screen.getByRole('button', { name: '书签节点：Docs Archive' });

    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'docs' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(docsArchive.className).toContain('is-search-focus');
    });
  });

  test('scrolls the currently focused normal-search result into view when Enter navigation activates and advances', async () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    try {
      render(
        <App
          bootstrapWorkspace={async () => ({
            policy: {
              action: 'restore-local-draft',
              reason: 'persisted-draft-session-exists',
            },
            draftSnapshot: createSearchableDraftSnapshot(),
            statusKey: 'restored-local-draft',
            occurredAt: '2026-04-07T11:00:00',
          })}
          enableStartupBootstrap
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '书签节点：Docs Archive' })).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜索标题或 URL');

      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'docs' } });

      expect(scrollIntoViewSpy).not.toHaveBeenCalled();

      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        expect(scrollIntoViewSpy).toHaveBeenCalled();
      });

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(scrollIntoViewSpy.mock.calls.length).toBeGreaterThan(1);
      });
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
          configurable: true,
          value: originalScrollIntoView,
        });
      } else {
        delete (HTMLElement.prototype as Partial<typeof HTMLElement.prototype>).scrollIntoView;
      }
    }
  });

  test('keeps selected, search-match, and search-focus states distinct during normal-search navigation', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createSearchableDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-07T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：起始页' })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索标题或 URL');
    const startNode = screen.getByRole('button', { name: '书签节点：起始页' });
    const docsHub = screen.getByRole('button', { name: '书签节点：Docs Hub' });
    const docsArchive = screen.getByRole('button', { name: '书签节点：Docs Archive' });

    fireEvent.click(startNode);
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'docs' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(startNode).toHaveAttribute('aria-pressed', 'true');
    expect(startNode.className).toContain('is-selected');
    expect(startNode.className).not.toContain('is-search-match');
    expect(startNode.className).not.toContain('is-search-focus');

    expect(docsHub.className).toContain('is-search-match');
    expect(docsHub.className).toContain('is-search-focus');
    expect(docsHub.className).not.toContain('is-selected');

    expect(docsArchive.className).toContain('is-search-match');
    expect(docsArchive.className).not.toContain('is-search-focus');
    expect(docsArchive.className).not.toContain('is-selected');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    expect(startNode).toHaveAttribute('aria-pressed', 'true');
    expect(startNode.className).toContain('is-selected');
    expect(docsHub.className).not.toContain('is-search-focus');
    expect(docsArchive.className).toContain('is-search-focus');
  });

  test('does not persist the draft session while Enter navigation cycles search focus', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createSearchableDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-07T11:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Docs Archive' })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索标题或 URL');
    const startNode = screen.getByRole('button', { name: '书签节点：起始页' });
    const docsArchive = screen.getByRole('button', { name: '书签节点：Docs Archive' });

    fireEvent.click(startNode);
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'docs' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(docsArchive.className).toContain('is-search-focus');
    });

    expect(startNode).toHaveAttribute('aria-pressed', 'true');
    expect(vi.mocked(writePersistedDraftSession)).not.toHaveBeenCalled();
  });

  test('keeps duplicate-only layout changes isolated inside the canvas scroll container', () => {
    const appCss = readFileSync(join(repoRoot, 'src/app/app.css'), 'utf8');

    expect(appCss).toMatch(/\.canvas-main\s*\{[^}]*height:\s*100%;/s);
    expect(appCss).toMatch(/\.canvas-main\s*\{[^}]*overflow:\s*hidden;/s);
    expect(appCss).toMatch(/\.draft-graph-workspace\s*\{[^}]*min-height:\s*0;/s);
    expect(appCss).toMatch(/\.duplicate-focus-view\s*\{[^}]*min-height:\s*0;/s);
  });
});

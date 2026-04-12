import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { App } from './App';

function createDraftSnapshot(): DraftGraphSnapshot {
  return {
    schemaVersion: 'draft-graph/v1',
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
        childIds: ['bookmark-docs'],
        pathTokens: ['工作资料'],
      },
      'bookmark-docs': {
        internalId: 'bookmark-docs',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: 'Docs Hub',
        url: 'https://docs.example.com',
        parentId: 'folder-root',
        childIds: [],
        pathTokens: ['工作资料', 'Docs Hub'],
      },
    },
    rootIds: ['folder-root'],
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T09A browser overwrite and sync confirmation gate', () => {
  test('keeps overwrite-from-browser available before a draft exists and opens the shared confirmation dialog with browser-to-draft wording', async () => {
    const bookmarksApi = {
      getTree: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      removeTree: vi.fn(),
    };
    (globalThis as typeof globalThis & {
      chrome?: { bookmarks: typeof bookmarksApi };
    }).chrome = {
      bookmarks: bookmarksApi,
    };

    render(<App />);

    const overwriteButton = screen.getByRole('button', { name: '从浏览器覆盖当前草稿' });
    expect(overwriteButton).toBeEnabled();

    fireEvent.click(overwriteButton);

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent ?? '').toMatch(/浏览器书签.*覆盖.*当前草稿/);
    expect(dialog.textContent ?? '').toMatch(/当前草稿.*结构.*内容.*替换/);
    expect(dialog.textContent ?? '').toMatch(/浏览器书签.*不会.*修改/);
    expect(within(dialog).queryByRole('button', { name: '关闭' })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(bookmarksApi.getTree).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('keeps sync-to-browser disabled while there is no editable draft', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' })).toBeDisabled();
  });

  test('enables sync-to-browser once a draft exists and opens the same confirmation surface with browser-write wording', async () => {
    const bookmarksApi = {
      getTree: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      removeTree: vi.fn(),
    };
    (globalThis as typeof globalThis & {
      chrome?: { bookmarks: typeof bookmarksApi };
    }).chrome = {
      bookmarks: bookmarksApi,
    };

    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'restore-local-draft',
            reason: 'persisted-draft-session-exists',
          },
          draftSnapshot: createDraftSnapshot(),
          statusKey: 'restored-local-draft',
          occurredAt: '2026-04-11T19:00:00',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '书签节点：Docs Hub' })).toBeInTheDocument();
    });

    const syncButton = screen.getByRole('button', { name: '同步当前草稿到浏览器书签' });
    expect(syncButton).toBeEnabled();

    fireEvent.click(syncButton);

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent ?? '').toMatch(/当前草稿.*覆盖.*浏览器书签/);
    expect(dialog.textContent ?? '').toMatch(/当前草稿.*不会.*清空|当前草稿.*不会.*重建/);
    expect(dialog.textContent ?? '').toMatch(/Ctrl\+Z.*不会.*撤销.*浏览器/);
    expect(within(dialog).queryByRole('button', { name: '关闭' })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(bookmarksApi.getTree).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });
});

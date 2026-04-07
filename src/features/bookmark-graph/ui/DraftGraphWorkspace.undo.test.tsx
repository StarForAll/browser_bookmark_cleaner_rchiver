import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { PersistedDraftSession } from '@/adapters/local-persistence/contracts';
import { createDraftGraphFixture } from '../../../../test/fixtures/draftGraph';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T07B draft graph undo interaction gate', () => {
  test('records a draft-only undo entry for rename and reverts it on document-level Ctrl+Z without touching browser bookmarks', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const bookmarksApi = {
      update: vi.fn(),
      create: vi.fn(),
      removeTree: vi.fn(),
    };

    (globalThis as typeof globalThis & { chrome?: { bookmarks: typeof bookmarksApi } }).chrome = {
      bookmarks: bookmarksApi,
    };

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const rootNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    fireEvent.doubleClick(rootNode);
    fireEvent.change(screen.getByLabelText(/标题/i), {
      target: {
        value: '工作资料（已整理）',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });

    const renamePersistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(renamePersistedSession?.undoHistory).toHaveLength(1);
    expect(renamePersistedSession?.undoHistory[0]).toEqual(
      expect.objectContaining({
        mutationType: 'rename-node',
        affectedNodeIds: ['folder-root'],
        storageMode: 'patch',
      }),
    );
    expect(renamePersistedSession?.checkpoints).toEqual([]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '目录节点：工作资料（已整理）' })).toBeInTheDocument();
    });

    fireEvent.keyDown(document, {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(2);
    });

    const undoPersistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[1]?.[0];

    expect(screen.getByRole('button', { name: '目录节点：工作资料' })).toBeInTheDocument();
    expect(undoPersistedSession?.draftSnapshot.nodesById['folder-root']?.title).toBe('工作资料');
    expect(undoPersistedSession?.undoHistory).toEqual([]);
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('reverts a same-parent reorder on document-level Ctrl+Z and restores the original sibling order', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const archiveNode = screen.getByRole('button', { name: '目录节点：归档' });
    fireEvent.click(archiveNode);
    fireEvent.keyDown(archiveNode, {
      key: 'ArrowUp',
      code: 'ArrowUp',
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });

    const reorderPersistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];
    expect(reorderPersistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'folder-archive',
      'bookmark-docs',
    ]);

    fireEvent.keyDown(document, {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(2);
    });

    const undoPersistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[1]?.[0];
    expect(undoPersistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'bookmark-docs',
      'folder-archive',
    ]);
  });

  test('reverts a create on document-level Ctrl+Z and removes the newly added node', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const rootNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    fireEvent.click(rootNode);
    fireEvent.keyDown(rootNode, {
      key: 'Enter',
      code: 'Enter',
    });
    fireEvent.change(screen.getByLabelText(/标题/i), {
      target: {
        value: '新增资料',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '目录节点：新增资料' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });

    fireEvent.keyDown(document, {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(2);
    });

    expect(screen.queryByRole('button', { name: '目录节点：新增资料' })).not.toBeInTheDocument();
  });

  test('reverts a delete on document-level Ctrl+Z and restores the removed subtree', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const legacyNode = screen.getByRole('button', { name: '书签节点：旧系统' });
    fireEvent.click(legacyNode);
    fireEvent.keyDown(legacyNode, {
      key: 'Delete',
      code: 'Delete',
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole('button', { name: '书签节点：旧系统' })).not.toBeInTheDocument();

    fireEvent.keyDown(document, {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
    });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole('button', { name: '书签节点：旧系统' })).toBeInTheDocument();
  });

  test('ignores Ctrl+Z when no draft undo history exists', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const bookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    fireEvent.click(bookmarkNode);
    fireEvent.keyDown(document, {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
    });

    expect(persistDraftSession).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '书签节点：产品文档' })).toHaveAttribute('aria-pressed', 'true');
  });
});

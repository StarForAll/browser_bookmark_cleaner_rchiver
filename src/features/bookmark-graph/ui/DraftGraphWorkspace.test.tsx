import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { PersistedDraftSession } from '@/adapters/local-persistence/contracts';
import type { DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { createDraftGraphFixture, createLargeDraftGraphFixture } from '../../../../test/fixtures/draftGraph';

function createNodeDragDataTransfer(sourceNodeId: string): DataTransfer {
  const payload = new Map<string, string>([
    ['text/plain', sourceNodeId],
    ['application/x-draft-node-id', sourceNodeId],
  ]);

  return {
    clearData: vi.fn((format?: string) => {
      if (format) {
        payload.delete(format);
        return;
      }
      payload.clear();
    }),
    dropEffect: 'move',
    effectAllowed: 'move',
    files: [] as unknown as FileList,
    getData: vi.fn((format: string) => payload.get(format) ?? ''),
    items: [] as unknown as DataTransferItemList,
    setData: vi.fn((format: string, value: string) => {
      payload.set(format, value);
    }),
    setDragImage: vi.fn(),
    types: ['text/plain', 'application/x-draft-node-id'],
  } as unknown as DataTransfer;
}

function createMultiRootDraftGraphFixture(): DraftGraphSnapshot {
  const snapshot = createDraftGraphFixture();

  return {
    ...snapshot,
    nodesById: {
      ...snapshot.nodesById,
      'folder-personal': {
        internalId: 'folder-personal',
        sourceType: 'draft',
        nodeType: 'folder',
        title: '个人收藏',
        url: null,
        parentId: null,
        childIds: ['bookmark-start'],
        pathTokens: ['个人收藏'],
      },
      'bookmark-start': {
        internalId: 'bookmark-start',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '起始页',
        url: 'https://start.example.com',
        parentId: 'folder-personal',
        childIds: [],
        pathTokens: ['个人收藏', '起始页'],
      },
    },
    rootIds: ['folder-root', 'folder-personal'],
  };
}

function createTopLevelBookmarkDraftGraphFixture(): DraftGraphSnapshot {
  const snapshot = createDraftGraphFixture();

  return {
    ...snapshot,
    nodesById: {
      ...snapshot.nodesById,
      'bookmark-top-level': {
        internalId: 'bookmark-top-level',
        sourceType: 'draft',
        nodeType: 'bookmark',
        title: '顶级入口',
        url: 'https://portal.example.com',
        parentId: null,
        childIds: [],
        pathTokens: ['顶级入口'],
      },
    },
    rootIds: ['bookmark-top-level', ...snapshot.rootIds],
  };
}

function parseTranslateY(transform: string): number {
  const match = transform.match(/translate\([^,]+,\s*([^)]+)\)/);
  return match ? Number.parseFloat(match[1].replace('px', '')) : 0;
}

function parsePixelValue(value: string | null | undefined): number {
  return value ? Number.parseFloat(value.replace('px', '')) : 0;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T06 draft graph workspace interaction gate', () => {
  test('derives a viewport-scoped subset of mindmap nodes and branches for large graphs', async () => {
    const { deriveVisibleMindmapElements } = await import('./DraftGraphWorkspace');

    const visibleSubset = deriveVisibleMindmapElements(
      {
        width: 1200,
        height: 900,
        nodes: [
          { nodeId: '__virtual_root__', x: 32, y: 180, height: 46, branchColor: '#7a9d95', depth: -1, isVirtualRoot: true },
          { nodeId: 'near-node', x: 360, y: 120, height: 40, branchColor: '#7a9d95', depth: 0 },
          { nodeId: 'far-node', x: 360, y: 1900, height: 40, branchColor: '#7a9d95', depth: 0 },
        ],
        branches: [
          { fromId: '__virtual_root__', toId: 'near-node', branchColor: '#7a9d95', depth: -1 },
          { fromId: '__virtual_root__', toId: 'far-node', branchColor: '#7a9d95', depth: -1 },
        ],
      },
      {
        left: 0,
        top: 0,
        right: 900,
        bottom: 700,
      },
    );

    expect(visibleSubset.nodes.map((node) => node.nodeId)).toEqual(['__virtual_root__', 'near-node']);
    expect(visibleSubset.branches).toEqual([
      { fromId: '__virtual_root__', toId: 'near-node', branchColor: '#7a9d95', depth: -1 },
    ]);
  });

  test('keeps nodes and branches that sit exactly on the viewport overscan boundary', async () => {
    const { deriveVisibleMindmapElements } = await import('./DraftGraphWorkspace');

    const visibleSubset = deriveVisibleMindmapElements(
      {
        width: 2000,
        height: 1400,
        nodes: [
          { nodeId: '__virtual_root__', x: 32, y: 180, height: 46, branchColor: '#7a9d95', depth: -1, isVirtualRoot: true },
          { nodeId: 'overscan-left-edge', x: -500, y: 120, height: 40, branchColor: '#7a9d95', depth: 0 },
          { nodeId: 'overscan-top-edge', x: 360, y: -200, height: 40, branchColor: '#7a9d95', depth: 1 },
          { nodeId: 'outside-overscan', x: -501, y: 1200, height: 40, branchColor: '#7a9d95', depth: 0 },
        ],
        branches: [
          { fromId: '__virtual_root__', toId: 'overscan-left-edge', branchColor: '#7a9d95', depth: -1 },
          { fromId: 'overscan-left-edge', toId: 'overscan-top-edge', branchColor: '#7a9d95', depth: 0 },
          { fromId: '__virtual_root__', toId: 'outside-overscan', branchColor: '#7a9d95', depth: -1 },
        ],
      },
      {
        left: 0,
        top: 0,
        right: 900,
        bottom: 700,
      },
    );

    expect(visibleSubset.nodes.map((node) => node.nodeId)).toEqual([
      '__virtual_root__',
      'overscan-left-edge',
      'overscan-top-edge',
    ]);
    expect(visibleSubset.branches).toEqual([
      { fromId: '__virtual_root__', toId: 'overscan-left-edge', branchColor: '#7a9d95', depth: -1 },
      { fromId: 'overscan-left-edge', toId: 'overscan-top-edge', branchColor: '#7a9d95', depth: 0 },
    ]);
  });

  test('double click opens the draft-only node editor and never writes browser bookmarks directly', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const recordStatusEntry = vi.fn();
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

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    fireEvent.doubleClick(within(tree).getByText('工作资料'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('工作资料')).toBeInTheDocument();
    expect(screen.queryByLabelText(/URL/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/标题/i), {
      target: {
        value: '工作资料（已整理）',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(await within(tree).findByText('工作资料（已整理）')).toBeInTheDocument();
    expect(persistDraftSession).toHaveBeenCalledTimes(1);
    expect(recordStatusEntry).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('renders the virtual root as a visible non-focusable anchor with a separate drag-only top-level drop zone', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });

    expect(within(tree).getByText('虚拟根节点')).toBeInTheDocument();
    expect(within(tree).getByText('书签图谱')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '虚拟根节点：书签图谱' })).not.toBeInTheDocument();
    expect(document.querySelector('.draft-virtual-root-drop-zone')).toBeInTheDocument();
  });

  test('keeps the virtual root button vertically centered across top-level branches while preserving a full-height drop zone', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createMultiRootDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const virtualRootButton = within(tree).getByText('书签图谱').closest('.draft-node-button') as HTMLElement | null;
    const virtualRootShell = virtualRootButton?.closest('.xmind-node-shell') as HTMLElement | null;
    const workRootShell = screen
      .getByRole('button', { name: '目录节点：工作资料' })
      .closest('.xmind-node-shell') as HTMLElement | null;
    const personalRootShell = screen
      .getByRole('button', { name: '目录节点：个人收藏' })
      .closest('.xmind-node-shell') as HTMLElement | null;

    expect(virtualRootButton).toBeInTheDocument();
    expect(virtualRootShell).toBeInTheDocument();
    expect(workRootShell).toBeInTheDocument();
    expect(personalRootShell).toBeInTheDocument();

    const virtualRootCenter =
      parseTranslateY(virtualRootShell?.style.transform ?? '') +
      parsePixelValue(virtualRootButton?.style.top) +
      23;
    const rootsMidpoint =
      (parseTranslateY(workRootShell?.style.transform ?? '') +
        23 +
        parseTranslateY(personalRootShell?.style.transform ?? '') +
        23) / 2;

    expect(virtualRootCenter).toBeCloseTo(rootsMidpoint, 0);
    expect(parsePixelValue(virtualRootShell?.style.height)).toBeGreaterThan(46);
  });

  test('renders bookmark nodes taller than folder nodes so URL previews fit without bloating folders', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const bookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    const bookmarkShell = bookmarkNode.closest('.xmind-node-shell') as HTMLElement | null;
    const folderNode = screen.getByRole('button', { name: '目录节点：归档' });
    const folderShell = folderNode.closest('.xmind-node-shell') as HTMLElement | null;

    expect(bookmarkNode).toHaveTextContent('docs.example.com');
    expect(bookmarkShell?.style.height).toBe('56px');
    expect(Number.parseFloat(folderShell?.style.height ?? '0')).toBeLessThan(56);
  });

  test('renders top-level bookmark nodes with a taller shell so the root card border is not clipped', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createTopLevelBookmarkDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const topLevelBookmark = screen.getByRole('button', { name: '书签节点：顶级入口' });
    const topLevelBookmarkShell = topLevelBookmark.closest('.xmind-node-shell') as HTMLElement | null;
    const nestedBookmark = screen.getByRole('button', { name: '书签节点：产品文档' });
    const nestedBookmarkShell = nestedBookmark.closest('.xmind-node-shell') as HTMLElement | null;

    expect(topLevelBookmark).toHaveTextContent('portal.example.com');
    expect(topLevelBookmarkShell?.style.height).toBe('66px');
    expect(nestedBookmarkShell?.style.height).toBe('56px');
  });

  test('editing and create-child inputs keep focus while typing instead of being refocused by dialog state updates', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const folderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    fireEvent.doubleClick(folderNode);

    const editTitleInput = screen.getByLabelText(/标题/i);
    editTitleInput.focus();
    expect(editTitleInput).toHaveFocus();
    fireEvent.change(editTitleInput, { target: { value: '工' } });
    expect(editTitleInput).toHaveFocus();
    fireEvent.change(editTitleInput, { target: { value: '工作' } });
    expect(editTitleInput).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.keyDown(folderNode, { key: 'Enter' });
    fireEvent.click(screen.getByLabelText('书签'));

    const createUrlInput = screen.getByLabelText(/URL/i);
    createUrlInput.focus();
    expect(createUrlInput).toHaveFocus();
    fireEvent.change(createUrlInput, { target: { value: 'h' } });
    expect(createUrlInput).toHaveFocus();
    fireEvent.change(createUrlInput, { target: { value: 'ht' } });
    expect(createUrlInput).toHaveFocus();
  });

  test('edit dialog traps focus at both modal boundaries and restores focus on close', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const folderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    const backgroundBookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });

    folderNode.focus();
    fireEvent.doubleClick(folderNode);

    const titleInput = screen.getByLabelText(/标题/i);
    const saveButton = screen.getByRole('button', { name: '保存' });

    expect(titleInput).toHaveFocus();
    expect(backgroundBookmarkNode).toBeDisabled();

    saveButton.focus();
    fireEvent.keyDown(saveButton, { key: 'Tab' });

    expect(titleInput).toHaveFocus();
    expect(backgroundBookmarkNode).not.toHaveFocus();

    fireEvent.keyDown(titleInput, { key: 'Tab', shiftKey: true });

    expect(saveButton).toHaveFocus();
    expect(backgroundBookmarkNode).not.toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(folderNode).toHaveFocus();
    });
  });

  test('Enter opens the create-child flow with bookmark-url validation and draft-only creation', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const recordStatusEntry = vi.fn();
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

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const rootNode = within(tree).getByText('工作资料');
    fireEvent.click(rootNode);
    fireEvent.keyDown(rootNode, { key: 'Enter' });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('父节点：工作资料')).toBeInTheDocument();
    expect(within(dialog).getByText('当前路径：工作资料')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('书签'));
    fireEvent.change(screen.getByLabelText(/标题/i), {
      target: {
        value: '设计稿',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    expect(screen.getByText(/URL.*必填|请输入 URL/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/URL/i), {
      target: {
        value: 'https://figma.example.com',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    expect(await within(tree).findByText('设计稿')).toBeInTheDocument();
    expect(persistDraftSession).toHaveBeenCalledTimes(1);
    expect(recordStatusEntry).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('Shift+Enter opens same-level creation so a top-level node can create a new root sibling without relying on virtual root interactions', async () => {
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
    fireEvent.keyDown(rootNode, { key: 'Enter', shiftKey: true });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('参考节点：工作资料')).toBeInTheDocument();
    expect(within(dialog).getByText('当前层级：顶层根节点')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/标题/i), {
      target: {
        value: '个人资料',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    expect(await screen.findByRole('button', { name: '目录节点：个人资料' })).toBeInTheDocument();
    expect(persistDraftSession).toHaveBeenCalledTimes(1);
  });

  test('creating a new top-level sibling does not force-scroll the canvas back to the top-left corner', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const scrollToSpy = vi.fn();

    Object.assign(tree, {
      scrollLeft: 240,
      scrollTop: 180,
      scrollTo: scrollToSpy,
    });

    const rootNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    fireEvent.click(rootNode);
    fireEvent.keyDown(rootNode, { key: 'Enter', shiftKey: true });
    fireEvent.change(screen.getByLabelText(/标题/i), {
      target: {
        value: '新的顶层节点',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    expect(await screen.findByRole('button', { name: '目录节点：新的顶层节点' })).toBeInTheDocument();
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  test('create-child dialog traps focus at both modal boundaries and restores focus on close', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const folderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    folderNode.focus();
    fireEvent.keyDown(folderNode, { key: 'Enter' });

    const folderRadio = screen.getByLabelText('目录');
    const bookmarkRadio = screen.getByLabelText('书签');
    const cancelButton = screen.getByRole('button', { name: '取消' });
    const createButton = screen.getByRole('button', { name: '创建' });

    expect(folderRadio).toHaveFocus();

    fireEvent.keyDown(createButton, { key: 'Tab' });
    expect(folderRadio).toHaveFocus();

    folderRadio.focus();
    fireEvent.keyDown(folderRadio, { key: 'Tab', shiftKey: true });
    expect(createButton).toHaveFocus();

    fireEvent.click(bookmarkRadio);
    screen.getByLabelText(/URL/i);

    fireEvent.keyDown(createButton, { key: 'Tab' });
    expect(folderRadio).toHaveFocus();

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(folderNode).toHaveFocus();
    });
  });

  test('Enter on a bookmark node does not open the create-child dialog', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const recordStatusEntry = vi.fn();

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const bookmarkNode = within(tree).getByText('产品文档');
    fireEvent.click(bookmarkNode);
    fireEvent.keyDown(bookmarkNode, { key: 'Enter' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(persistDraftSession).not.toHaveBeenCalled();
    expect(recordStatusEntry).not.toHaveBeenCalled();
  });

  test('Delete asks for confirmation before removing a folder with multiple direct child nodes', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const recordStatusEntry = vi.fn();

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const rootNode = within(tree).getByText('工作资料');
    fireEvent.click(rootNode);
    fireEvent.keyDown(rootNode, { key: 'Delete' });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('确认删除当前目录节点')).toBeInTheDocument();
    expect(within(dialog).getByText('确定要删除目录“工作资料”及其 2 个子节点吗？')).toBeInTheDocument();
    expect(within(tree).getByText('工作资料')).toBeInTheDocument();
    expect(within(tree).getByText('产品文档')).toBeInTheDocument();
    expect(persistDraftSession).not.toHaveBeenCalled();

    fireEvent.keyDown(rootNode, { key: 'Enter' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('在当前草稿下创建子节点')).not.toBeInTheDocument();
    expect(persistDraftSession).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(tree).getByText('工作资料')).toBeInTheDocument();
    expect(persistDraftSession).not.toHaveBeenCalled();

    fireEvent.keyDown(rootNode, { key: 'Delete' });

    const reopenedDialog = screen.getByRole('dialog');
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: '确认删除' }));

    expect(within(tree).queryByText('工作资料')).not.toBeInTheDocument();
    expect(within(tree).queryByText('产品文档')).not.toBeInTheDocument();
    expect(within(tree).queryByText('归档')).not.toBeInTheDocument();
    expect(persistDraftSession).toHaveBeenCalledTimes(1);
    expect(recordStatusEntry).not.toHaveBeenCalled();
  });

  test('delete-confirm dialog traps focus between its boundary buttons and restores focus on cancel', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const folderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    folderNode.focus();
    fireEvent.keyDown(folderNode, { key: 'Delete' });

    const cancelButton = screen.getByRole('button', { name: '取消' });
    const confirmButton = screen.getByRole('button', { name: '确认删除' });

    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(confirmButton, { key: 'Tab' });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(cancelButton, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(folderNode).toHaveFocus();
    });
  });

  test('Delete removes the selected subtree without confirmation side effects or browser writes when confirmation is not required', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const recordStatusEntry = vi.fn();
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

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const archiveNode = within(tree).getByText('归档');
    fireEvent.click(archiveNode);
    fireEvent.keyDown(archiveNode, { key: 'Delete' });

    expect(within(tree).queryByText('归档')).not.toBeInTheDocument();
    expect(within(tree).queryByText('旧系统')).not.toBeInTheDocument();
    expect(persistDraftSession).toHaveBeenCalledTimes(1);
    expect(recordStatusEntry).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
  });

  test('ArrowUp reorders a selected top-level node within rootIds without writing to browser bookmarks', async () => {
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
        initialSnapshot={createMultiRootDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const personalRootNode = screen.getByRole('button', { name: '目录节点：个人收藏' });
    fireEvent.click(personalRootNode);
    fireEvent.keyDown(personalRootNode, { key: 'ArrowUp' });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.rootIds).toEqual(['folder-personal', 'folder-root']);
    expect(persistedSession?.draftSnapshot.selectedNodeId).toBe('folder-personal');
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('ArrowUp and ArrowDown reorder the selected node inside its current parent at the current layer position', async () => {
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

    const archiveNode = screen.getByRole('button', { name: '目录节点：归档' });
    fireEvent.click(archiveNode);
    fireEvent.keyDown(archiveNode, { key: 'ArrowUp' });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const movedUpSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(movedUpSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'folder-archive',
      'bookmark-docs',
    ]);
    expect(movedUpSession?.draftSnapshot.selectedNodeId).toBe('folder-archive');

    const archiveNodeAfterMove = screen.getByRole('button', { name: '目录节点：归档' });
    fireEvent.keyDown(archiveNodeAfterMove, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(2);
    });
    const movedDownSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[1]?.[0];

    expect(movedDownSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'bookmark-docs',
      'folder-archive',
    ]);
    expect(movedDownSession?.draftSnapshot.selectedNodeId).toBe('folder-archive');
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('ArrowLeft promotes a selected nested node to its parent layer top without writing to browser bookmarks', async () => {
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

    const legacyNode = screen.getByRole('button', { name: '书签节点：旧系统' });
    fireEvent.click(legacyNode);
    fireEvent.keyDown(legacyNode, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.nodesById['bookmark-legacy']?.parentId).toBe('folder-root');
    expect(persistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'bookmark-legacy',
      'bookmark-docs',
      'folder-archive',
    ]);
    expect(persistedSession?.draftSnapshot.nodesById['folder-archive']?.childIds).toEqual([]);
    expect(persistedSession?.draftSnapshot.nodesById['bookmark-legacy']?.pathTokens).toEqual([
      '工作资料',
      '旧系统',
    ]);
    expect(persistedSession?.draftSnapshot.selectedNodeId).toBe('bookmark-legacy');
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('repeated ArrowLeft promotes the selected node one level at a time until it becomes top-level', async () => {
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

    const legacyNode = screen.getByRole('button', { name: '书签节点：旧系统' });
    fireEvent.click(legacyNode);
    fireEvent.keyDown(legacyNode, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });

    const legacyNodeAfterFirstPromote = screen.getByRole('button', { name: '书签节点：旧系统' });
    fireEvent.keyDown(legacyNodeAfterFirstPromote, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(2);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[1]?.[0];

    expect(persistedSession?.draftSnapshot.rootIds).toEqual(['bookmark-legacy', 'folder-root']);
    expect(persistedSession?.draftSnapshot.nodesById['bookmark-legacy']?.parentId).toBeNull();
    expect(persistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'bookmark-docs',
      'folder-archive',
    ]);
    expect(persistedSession?.draftSnapshot.nodesById['bookmark-legacy']?.pathTokens).toEqual(['旧系统']);
    expect(persistedSession?.draftSnapshot.selectedNodeId).toBe('bookmark-legacy');
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('repeated ArrowLeft never mutates a selected top-level node', async () => {
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
        initialSnapshot={createMultiRootDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const personalRootNode = screen.getByRole('button', { name: '目录节点：个人收藏' });
    fireEvent.click(personalRootNode);
    fireEvent.keyDown(personalRootNode, { key: 'ArrowLeft' });
    fireEvent.keyDown(personalRootNode, { key: 'ArrowLeft' });
    fireEvent.keyDown(personalRootNode, { key: 'ArrowLeft' });

    expect(persistDraftSession).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('hover exposes detailed node info while the node button keeps an explicit accessible type label', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const bookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    fireEvent.mouseEnter(bookmarkNode);

    expect(screen.getByText('书签节点')).toBeInTheDocument();
    expect(screen.getByText('当前路径：工作资料 / 产品文档')).toBeInTheDocument();
    expect(screen.getByText('https://docs.example.com')).toBeInTheDocument();

    fireEvent.mouseLeave(bookmarkNode);

    expect(screen.queryByText('当前路径：工作资料 / 产品文档')).not.toBeInTheDocument();
  });

  test('renders a 1000-node draft graph and keeps selection responsive', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);
    const recordStatusEntry = vi.fn();

    render(
      <DraftGraphWorkspace
        initialSnapshot={createLargeDraftGraphFixture(1000)}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const rootNode = screen.getByRole('button', { name: '目录节点：大草稿根目录' });
    const tailNode = screen.getByRole('button', { name: '书签节点：节点 999' });

    fireEvent.click(tailNode);

    expect(rootNode).toBeInTheDocument();
    expect(tailNode).toHaveAttribute('aria-pressed', 'true');
    expect(persistDraftSession).not.toHaveBeenCalled();
    expect(recordStatusEntry).not.toHaveBeenCalled();
  });
});

describe('T07A draft graph drag-move interaction gate', () => {
  test('dragging a top-level root node into another folder removes it from the root branch list', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createMultiRootDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedRootNode = screen.getByRole('button', { name: '目录节点：个人收藏' });
    const targetFolderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    const targetFolderShell = targetFolderNode.closest('.xmind-node-shell');
    const dataTransfer = createNodeDragDataTransfer('folder-personal');

    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 700,
      width: 900,
      height: 700,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedRootNode, { dataTransfer });
    fireEvent.dragOver(targetFolderShell?.querySelector('.draft-node-drop-zone') as Element, { dataTransfer, clientY: 220 });
    fireEvent.drop(targetFolderShell?.querySelector('.draft-node-drop-zone') as Element, { dataTransfer, clientY: 220 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.rootIds).toEqual(['folder-root']);
    expect(persistedSession?.draftSnapshot.nodesById['folder-personal']?.parentId).toBe('folder-root');
    expect(persistedSession?.draftSnapshot.nodesById['bookmark-start']?.pathTokens).toEqual([
      '工作资料',
      '个人收藏',
      '起始页',
    ]);
  });

  test('dragging a nested node onto the virtual root makes it a top-level node', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const draggedBookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    const virtualRootDropZone = document.querySelector('.draft-virtual-root-drop-zone');
    const dataTransfer = createNodeDragDataTransfer('bookmark-docs');

    expect(virtualRootDropZone).toBeInTheDocument();

    fireEvent.dragStart(draggedBookmarkNode, { dataTransfer });
    fireEvent.dragOver(virtualRootDropZone as Element, { dataTransfer, clientY: 20 });
    fireEvent.drop(virtualRootDropZone as Element, { dataTransfer, clientY: 20 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.rootIds).toContain('bookmark-docs');
    expect(persistedSession?.draftSnapshot.rootIds).toContain('folder-root');
    expect(persistedSession?.draftSnapshot.nodesById['bookmark-docs']).toEqual(
      expect.objectContaining({
        parentId: null,
        pathTokens: ['产品文档'],
      }),
    );
    expect(persistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual(['folder-archive']);
  });

  test('dragging a top-level node onto the virtual root reorders it within rootIds without leaving the top layer', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createMultiRootDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedRootNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    const virtualRootDropZone = document.querySelector('.draft-virtual-root-drop-zone');
    const dataTransfer = createNodeDragDataTransfer('folder-root');

    expect(virtualRootDropZone).toBeInTheDocument();
    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 700,
      width: 900,
      height: 700,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedRootNode, { dataTransfer });
    fireEvent.dragOver(virtualRootDropZone as Element, { dataTransfer, clientY: 520 });
    fireEvent.drop(virtualRootDropZone as Element, { dataTransfer, clientY: 520 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.rootIds).toEqual(['folder-personal', 'folder-root']);
    expect(persistedSession?.draftSnapshot.nodesById['folder-root']?.parentId).toBeNull();
    expect(persistedSession?.draftSnapshot.nodesById['folder-personal']?.parentId).toBeNull();
  });

  test('dragging over a valid folder tail drop zone highlights the folder and preserves draft-only move behavior', async () => {
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

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedBookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    const targetFolderNode = screen.getByRole('button', { name: '目录节点：归档' });
    const targetFolderShell = targetFolderNode.closest('.xmind-node-shell');
    const dataTransfer = createNodeDragDataTransfer('bookmark-docs');

    expect(draggedBookmarkNode).toHaveAttribute('draggable', 'true');
    expect(targetFolderShell?.querySelector('.draft-node-drop-zone')).toBeInTheDocument();
    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedBookmarkNode, { dataTransfer });
    fireEvent.dragOver(targetFolderShell?.querySelector('.draft-node-drop-zone') as Element, { dataTransfer, clientY: 40 });

    expect(targetFolderNode).toHaveClass('is-drop-target');

    fireEvent.drop(targetFolderShell?.querySelector('.draft-node-drop-zone') as Element, { dataTransfer, clientY: 40 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    fireEvent.mouseEnter(screen.getByRole('button', { name: '书签节点：产品文档' }));

    expect(screen.getByText('当前路径：工作资料 / 归档 / 产品文档')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '书签节点：产品文档' })).toBeInTheDocument();
    expect(persistedSession?.draftSnapshot.nodesById['folder-archive']).toBeDefined();
    expect(bookmarksApi.create).not.toHaveBeenCalled();
    expect(bookmarksApi.update).not.toHaveBeenCalled();
    expect(bookmarksApi.removeTree).not.toHaveBeenCalled();
  });

  test('dragging across parent levels onto a folder body does not nest into that folder', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedBookmarkNode = screen.getByRole('button', { name: '书签节点：旧系统' });
    const targetFolderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    const dataTransfer = createNodeDragDataTransfer('bookmark-legacy');

    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 700,
      width: 900,
      height: 700,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedBookmarkNode, { dataTransfer });
    fireEvent.dragOver(targetFolderNode, { dataTransfer, clientY: 40 });

    expect(targetFolderNode).not.toHaveClass('is-drop-target');

    fireEvent.drop(targetFolderNode, { dataTransfer, clientY: 40 });

    await waitFor(() => {
      expect(persistDraftSession).not.toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: '书签节点：旧系统' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '目录节点：工作资料' })).toBeInTheDocument();
  });

  test('dropping lower inside the same folder inserts after the existing child instead of forcing top or tail defaults', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedBookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    const targetFolderNode = screen.getByRole('button', { name: '目录节点：归档' });
    const targetFolderShell = targetFolderNode.closest('.xmind-node-shell');
    const dataTransfer = createNodeDragDataTransfer('bookmark-docs');

    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedBookmarkNode, { dataTransfer });
    fireEvent.dragOver(targetFolderShell?.querySelector('.draft-node-drop-zone') as Element, { dataTransfer, clientY: 240 });
    fireEvent.drop(targetFolderShell?.querySelector('.draft-node-drop-zone') as Element, { dataTransfer, clientY: 240 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.nodesById['folder-archive']?.childIds).toEqual([
      'bookmark-legacy',
      'bookmark-docs',
    ]);
  });

  test('dragging onto a folder body in the same level reorders beside that folder instead of nesting into it', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createMultiRootDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedRootNode = screen.getByRole('button', { name: '目录节点：个人收藏' });
    const targetFolderNode = screen.getByRole('button', { name: '目录节点：工作资料' });
    const dataTransfer = createNodeDragDataTransfer('folder-personal');

    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 700,
      width: 900,
      height: 700,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedRootNode, { dataTransfer });
    fireEvent.dragOver(targetFolderNode, { dataTransfer, clientY: 40 });

    expect(targetFolderNode).toHaveClass('is-drop-target');

    fireEvent.drop(targetFolderNode, { dataTransfer, clientY: 40 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.rootIds).toEqual(['folder-personal', 'folder-root']);
    expect(persistedSession?.draftSnapshot.nodesById['folder-personal']?.parentId).toBeNull();
    expect(persistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'bookmark-docs',
      'folder-archive',
    ]);
  });

  test('dragging onto a sibling node inside the same parent reorders the sibling sequence at the mouse release position', async () => {
    const { DraftGraphWorkspace } = await import('./DraftGraphWorkspace');
    const persistDraftSession = vi.fn(async () => undefined);

    render(
      <DraftGraphWorkspace
        initialSnapshot={createDraftGraphFixture()}
        onPersistDraftSession={persistDraftSession}
      />,
    );

    const tree = screen.getByRole('region', { name: '当前草稿节点列表' });
    const draggedFolderNode = screen.getByRole('button', { name: '目录节点：归档' });
    const targetBookmarkNode = screen.getByRole('button', { name: '书签节点：产品文档' });
    const dataTransfer = createNodeDragDataTransfer('folder-archive');

    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => ({}),
    });

    fireEvent.dragStart(draggedFolderNode, { dataTransfer });
    fireEvent.dragOver(targetBookmarkNode, { dataTransfer, clientY: 40 });

    expect(targetBookmarkNode).toHaveClass('is-drop-target');

    fireEvent.drop(targetBookmarkNode, { dataTransfer, clientY: 40 });

    await waitFor(() => {
      expect(persistDraftSession).toHaveBeenCalledTimes(1);
    });
    const persistedSession = ((persistDraftSession.mock.calls as unknown) as Array<[PersistedDraftSession]>)[0]?.[0];

    expect(persistedSession?.draftSnapshot.nodesById['folder-root']?.childIds).toEqual([
      'folder-archive',
      'bookmark-docs',
    ]);
    expect(persistedSession?.draftSnapshot.nodesById['folder-archive']?.parentId).toBe('folder-root');
  });
});

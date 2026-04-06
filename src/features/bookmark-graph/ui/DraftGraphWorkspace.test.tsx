import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDraftGraphFixture, createLargeDraftGraphFixture } from '../../../../test/fixtures/draftGraph';

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
          { nodeId: '__virtual_root__', x: 32, y: 180, branchColor: '#7a9d95', depth: -1, isVirtualRoot: true },
          { nodeId: 'near-node', x: 360, y: 120, branchColor: '#7a9d95', depth: 0 },
          { nodeId: 'far-node', x: 360, y: 1900, branchColor: '#7a9d95', depth: 0 },
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
          { nodeId: '__virtual_root__', x: 32, y: 180, branchColor: '#7a9d95', depth: -1, isVirtualRoot: true },
          { nodeId: 'overscan-left-edge', x: -500, y: 120, branchColor: '#7a9d95', depth: 0 },
          { nodeId: 'overscan-top-edge', x: 360, y: -200, branchColor: '#7a9d95', depth: 1 },
          { nodeId: 'outside-overscan', x: -501, y: 1200, branchColor: '#7a9d95', depth: 0 },
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

  test('shows the virtual root node as a visible but non-interactive mindmap anchor', async () => {
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

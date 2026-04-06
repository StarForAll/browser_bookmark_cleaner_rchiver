import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDraftGraphFixture } from '../../../../test/fixtures/draftGraph';

afterEach(() => {
  cleanup();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T06 draft graph workspace interaction gate', () => {
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
        onRecordStatusEntry={recordStatusEntry}
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
        onRecordStatusEntry={recordStatusEntry}
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

  test('Delete removes the selected subtree without confirmation side effects or browser writes', async () => {
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
        onRecordStatusEntry={recordStatusEntry}
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
});

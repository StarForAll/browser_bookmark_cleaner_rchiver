import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
});

describe('T05 app startup integration', () => {
  test('updates the status area after importing the browser tree on first startup', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'import-browser-tree',
            reason: 'no-persisted-draft-session',
          },
          draftSnapshot: {
            schemaVersion: 'draft-graph/v1',
            snapshotVersion: 0,
            selectedNodeId: null,
            nodesById: {
              'browser-10': {
                internalId: 'browser-10',
                sourceType: 'browser',
                nodeType: 'bookmark',
                title: 'Docs',
                url: 'https://docs.example.com',
                parentId: null,
                childIds: [],
                pathTokens: ['Docs'],
              },
            },
            rootIds: ['browser-10'],
          },
          statusKey: 'imported-browser-tree',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('首次启动已从浏览器导入当前书签树', { selector: '.status-entry dd' })).toBeInTheDocument();
    });

    expect(screen.getByText('当前草稿包含 1 个节点，已可进入后续编辑。')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('书签')).toBeInTheDocument();
  });

  test('surfaces an unsaved import warning when startup import cannot be persisted locally', async () => {
    render(
      <App
        bootstrapWorkspace={async () => ({
          policy: {
            action: 'import-browser-tree',
            reason: 'no-persisted-draft-session',
          },
          draftSnapshot: {
            schemaVersion: 'draft-graph/v1',
            snapshotVersion: 0,
            selectedNodeId: null,
            nodesById: {
              'browser-10': {
                internalId: 'browser-10',
                sourceType: 'browser',
                nodeType: 'bookmark',
                title: 'Docs',
                url: 'https://docs.example.com',
                parentId: null,
                childIds: [],
                pathTokens: ['Docs'],
              },
            },
            rootIds: ['browser-10'],
          },
          statusKey: 'imported-browser-tree-unsaved',
          errorDetail: 'Storage quota exceeded.',
        })}
        enableStartupBootstrap
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('已导入浏览器书签，但本地草稿保存失败', { selector: '.status-entry dd' })).toBeInTheDocument();
    });

    expect(screen.getByText('Storage quota exceeded.')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });
});

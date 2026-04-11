import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { App } from './app/App';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

afterEach(() => {
  cleanup();
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

describe('T03 extension shell and page entry', () => {
  test('defines an MV3 extension page entry in the manifest and html shell', () => {
    const manifest = JSON.parse(
      readFileSync(join(repoRoot, 'public/manifest.json'), 'utf8'),
    ) as {
      manifest_version: number;
      permissions?: string[];
      options_ui?: { page?: string; open_in_tab?: boolean };
    };
    const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(expect.arrayContaining(['bookmarks', 'storage']));
    expect(manifest.options_ui?.page).toBe('index.html');
    expect(manifest.options_ui?.open_in_tab).toBe(true);
    expect(indexHtml).toContain('/src/main.tsx');
  });

  test('renders the fixed workspace shell with five regions', async () => {
    render(<App />);

    const topShell = screen.getByRole('region', { name: '顶部动作区' });
    const searchRegion = screen.getByRole('search', { name: '搜索与聚焦区' });
    const canvasRegion = screen.getByRole('region', { name: '图谱画布区' });

    await waitFor(() => {
      expect(document.body.querySelector('.hint-overlay')).not.toBeNull();
      expect(document.body.querySelector('.status-popover')).not.toBeNull();
    });

    const hintRegion = document.body.querySelector('.hint-overlay') as HTMLElement | null;
    const statusRegion = document.body.querySelector('.status-popover') as HTMLElement | null;

    expect(within(topShell).getByRole('heading', { level: 1, name: '书签清理与归档工作区' })).toBeInTheDocument();
    expect(within(topShell).getByRole('heading', { level: 2, name: '顶部动作区' })).toBeInTheDocument();
    expect(searchRegion).toBeInTheDocument();
    expect(canvasRegion).toBeInTheDocument();
    expect(hintRegion).not.toBeNull();
    expect(statusRegion).not.toBeNull();
    expect(hintRegion).toHaveAttribute('role', 'complementary');
    expect(hintRegion).toHaveAttribute('aria-label', '操作提示区');
    expect(statusRegion).toHaveAttribute('role', 'complementary');
    expect(statusRegion).toHaveAttribute('aria-label', '状态结果区');
    expect(screen.queryByText('Chrome MV3 Extension Workspace')).not.toBeInTheDocument();
    expect((hintRegion as HTMLElement).closest('.canvas-side-rail')).toBeNull();
    expect((statusRegion as HTMLElement).closest('.canvas-side-rail')).toBeNull();
    expect(document.body.querySelector('.status-anchor')).toBeNull();
  });

  test('exposes the seven explicit top action buttons with Chinese-first copy', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: '从浏览器覆盖当前草稿' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '上传当前草稿到 WebDAV' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '上传当前浏览器书签到 WebDAV' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '恢复 WebDAV 草稿到当前草稿' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '恢复 WebDAV 书签到浏览器书签' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '撤销覆盖操作' })).toBeDisabled();
    expect(
      screen.getByText('当前没有进行覆盖操作，不能进行撤销覆盖操作。启用后会先打开撤销目标选择。'),
    ).toBeInTheDocument();
  });

  test('keeps the status area as a closable popup with a reopen anchor', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.body.querySelector('.status-popover')).not.toBeNull();
    });

    const statusPopover = document.body.querySelector('.status-popover') as HTMLElement | null;

    expect(statusPopover).not.toBeNull();
    expect(within(statusPopover as HTMLElement).getByText('启动初始化', { selector: '.status-history-list li strong' })).toBeInTheDocument();
    expect(within(statusPopover as HTMLElement).getByText('—', { selector: '.status-history-list li dd' })).toBeInTheDocument();
    expect(
      within(statusPopover as HTMLElement).getByText('正在确认本地草稿与浏览器书签状态', { selector: '.status-history-list li dd' }),
    ).toBeInTheDocument();
    expect((statusPopover as HTMLElement).querySelector('.status-history-list li')).not.toBeNull();
    fireEvent.click((statusPopover as HTMLElement).querySelector('.status-close') as HTMLButtonElement);
    await waitFor(() => {
      expect(document.body.querySelector('.status-popover')).toBeNull();
    });
  });

  test('restores the previous status popup visibility after a refresh-like remount', async () => {
    const storageState: Record<string, unknown> = {};
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

    const firstRender = render(<App />);

    await waitFor(() => {
      expect(document.body.querySelector('.status-popover')).not.toBeNull();
    });
    fireEvent.click(document.body.querySelector('.status-popover .status-close') as HTMLButtonElement);
    expect(storageState['workspace-status-popover-open']).toBe(false);
    firstRender.unmount();

    render(<App />);

    await waitFor(() => {
      expect(document.body.querySelector('.status-anchor')).not.toBeNull();
    });
    expect((document.body.querySelector('.status-anchor') as HTMLElement | null)?.getAttribute('aria-label')).toBe(
      '重新打开最近记录弹窗',
    );
    expect(document.body.querySelector('.status-popover')).toBeNull();
  });
  test('surfaces concise disabled-state explanations for the current system actions', () => {
    render(<App />);

    const topShell = screen.getByRole('region', { name: '顶部动作区' });

    expect(within(topShell).getByText('当前不可用说明')).toBeInTheDocument();
    expect(within(topShell).getByText('当前还没有可同步的草稿内容。')).toBeInTheDocument();
    expect(within(topShell).getByText('请先完成 WebDAV 设置与可用性检测。')).toBeInTheDocument();
    expect(
      within(topShell).getByText('当前没有进行覆盖操作，不能进行撤销覆盖操作。启用后会先打开撤销目标选择。'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '同步当前草稿到浏览器书签' })).toHaveAttribute(
      'title',
      '当前还没有可同步的草稿内容。',
    );
  });

});

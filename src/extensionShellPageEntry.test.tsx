import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { App } from './app/App';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

afterEach(() => {
  cleanup();
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

  test('renders the fixed workspace shell with five regions', () => {
    const { container } = render(<App />);

    const topShell = screen.getByRole('region', { name: '顶部动作区' });
    const searchRegion = screen.getByRole('search', { name: '搜索与聚焦区' });
    const canvasRegion = screen.getByRole('region', { name: '图谱画布区' });
    const hintRegion = screen.getByRole('complementary', { name: '操作提示区' });
    const statusRegion = screen.getByRole('complementary', { name: '状态结果区' });

    expect(within(topShell).getByRole('heading', { level: 1, name: '书签清理与归档工作区' })).toBeInTheDocument();
    expect(within(topShell).getByRole('heading', { level: 2, name: '顶部动作区' })).toBeInTheDocument();
    expect(searchRegion).toBeInTheDocument();
    expect(canvasRegion).toBeInTheDocument();
    expect(hintRegion).toBeInTheDocument();
    expect(statusRegion).toBeInTheDocument();
    expect(screen.queryByText('Chrome MV3 Extension Workspace')).not.toBeInTheDocument();
    expect(canvasRegion.contains(hintRegion)).toBe(true);
    expect(container.querySelector('.status-popover')).not.toBeNull();
    expect(container.querySelector('.status-anchor')).toBeNull();
  });

  test('exposes the seven explicit top action buttons with Chinese-first copy', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: '从浏览器覆盖当前草稿' })).toBeDisabled();
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

  test('keeps the status area as a closable popup with a reopen anchor', () => {
    render(<App />);

    const statusPopover = screen.getByRole('complementary', { name: '状态结果区' });
    expect(statusPopover).toBeInTheDocument();
    expect(within(statusPopover).getByText('启动初始化', { selector: '.status-entry strong' })).toBeInTheDocument();
    expect(within(statusPopover).getByText('—', { selector: '.status-entry dd' })).toBeInTheDocument();
    expect(
      within(statusPopover).getByText('正在确认本地草稿与浏览器书签状态', { selector: '.status-entry dd' }),
    ).toBeInTheDocument();
    expect(statusPopover.querySelector('.status-history-list li')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '关闭状态弹窗' }));
    expect(screen.queryByRole('complementary', { name: '状态结果区' })).not.toBeInTheDocument();

    const anchor = screen.getByRole('button', { name: '重新打开最新结果弹窗' });
    expect(anchor).toHaveTextContent('启动初始化 · 正在确认本地草稿与浏览器书签状态');

    fireEvent.click(anchor);
    expect(screen.getByRole('complementary', { name: '状态结果区' })).toBeInTheDocument();
  });
});

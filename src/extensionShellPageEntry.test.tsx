import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { App } from './app/App';

const repoRoot = process.cwd();

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
    render(<App />);

    expect(
      screen.getByRole('heading', { name: '书签清理与归档工作区' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '顶部动作区' })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: '搜索与聚焦区' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '图谱画布区' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '操作提示区' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '状态结果区' })).toBeInTheDocument();
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
  });
});

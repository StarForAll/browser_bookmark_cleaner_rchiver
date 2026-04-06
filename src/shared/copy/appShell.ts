export const appShellCopy = {
  title: '书签清理与归档工作区',
  subtitle: '当前草稿工作区已经接入基础编辑，后续任务继续补拖拽、撤销、搜索与同步能力。',
  topShellLabel: '顶部动作区',
  searchLabel: '搜索与聚焦区',
  canvasLabel: '图谱画布区',
  hintLabel: '操作提示区',
  statusLabel: '状态结果区',
  topShellSummary: '高风险动作入口保持显式可见，真正执行逻辑会按后续任务逐步接入。',
  searchSummary: '标题或 URL 搜索与重复聚焦会在后续任务接入；当前先保留入口位置。',
  searchInputPlaceholder: '搜索标题或 URL',
  searchToggleLabel: '仅看重复项',
  canvasPlaceholder: '当前区域承载可编辑的草稿图谱；后续任务会继续补拖拽、撤销与聚焦能力。',
  canvasDraftTitle: '当前草稿画布',
  canvasDraftSummary: '这里承载当前草稿节点列表与基础编辑；后续节点拖拽、悬浮信息与同步动作会继续挂接在当前草稿之上。',
  statusSummary: '结果历史以右下角弹窗呈现，关闭后仍可从锚点重新打开。',
  statusPopupTitle: '最新结果',
  statusLatestEntry: {
    action: '浏览器书签读取',
    time: '—',
    result: '当前浏览器书签数据为空',
    detail: '当前没有可导入的浏览器书签，但草稿编辑、节点创建和后续图谱操作仍可继续。真实动作完成后，这里会写入实际时间。',
  },
  statusRetainedTitle: '保留历史',
  statusRetainedEntries: [
    {
      action: '浏览器书签读取',
      time: '—',
      result: '当前浏览器书签数据为空',
    },
  ],
  statusAnchorLabel: '最新结果',
  statusAnchorAriaLabel: '重新打开最新结果弹窗',
  statusAnchorHint: '浏览器书签读取 · 当前浏览器书签数据为空',
  actionLabels: [
    '从浏览器覆盖当前草稿',
    '同步当前草稿到浏览器书签',
    '上传当前草稿到 WebDAV',
    '上传当前浏览器书签到 WebDAV',
    '恢复 WebDAV 草稿到当前草稿',
    '恢复 WebDAV 书签到浏览器书签',
    '撤销覆盖操作',
  ],
  secondaryLabels: ['重新整理布局', 'WebDAV 设置'],
  hintItems: [
    '单击：选择节点',
    '双击：编辑节点',
    '拖拽：移动节点',
    'Enter：创建子节点',
    'Delete / Backspace：删除节点',
    'Ctrl+Z：撤销一次草稿编辑',
  ],
  hintSummary: '透明悬浮提示区固定在画布左下角，仅提供操作提示，不遮挡节点视图。',
  undoUnavailableReason: '当前没有进行覆盖操作，不能进行撤销覆盖操作。启用后会先打开撤销目标选择。',
} as const;

type StartupStatusCopy = {
  action: string;
  time: string;
  result: string;
  detail: string;
  canvasSummary: string;
};

export function getStartupStatusCopy(input?: {
  statusKey:
    | 'restored-local-draft'
    | 'imported-browser-tree'
    | 'imported-browser-tree-unsaved'
    | 'await-browser-import'
    | 'restore-error'
    | 'browser-read-error';
  nodeCount: number;
  errorDetail?: string;
}): StartupStatusCopy {
  if (!input) {
    return {
      action: '启动初始化',
      time: '—',
      result: '正在确认本地草稿与浏览器书签状态',
      detail: '启动结果确认后，这里会展示本地恢复、首次导入或错误诊断信息。',
      canvasSummary: appShellCopy.canvasDraftSummary,
    };
  }

  if (input.statusKey === 'restored-local-draft') {
    return {
      action: '本地草稿恢复',
      time: '刚刚',
      result: '已恢复上次保存的本地草稿会话',
      detail: `启动时优先恢复了本地草稿，会话包含 ${input.nodeCount} 个节点，本次未自动读取浏览器书签。`,
      canvasSummary: `当前草稿已从本地会话恢复，共 ${input.nodeCount} 个节点，可继续编辑与后续同步。`,
    };
  }

  if (input.statusKey === 'imported-browser-tree') {
    return {
      action: '浏览器书签读取',
      time: '刚刚',
      result: '首次启动已从浏览器导入当前书签树',
      detail: `当前草稿包含 ${input.nodeCount} 个节点，已可进入后续编辑。`,
      canvasSummary: `当前草稿包含 ${input.nodeCount} 个节点，已可进入后续编辑。`,
    };
  }

  if (input.statusKey === 'imported-browser-tree-unsaved') {
    return {
      action: '浏览器书签读取',
      time: '刚刚',
      result: '已导入浏览器书签，但本地草稿保存失败',
      detail: input.errorDetail ?? '当前草稿已导入，但保存到本地会话时失败，刷新后可能丢失。',
      canvasSummary: `当前草稿已导入 ${input.nodeCount} 个节点，但尚未成功保存到本地；刷新后可能丢失。`,
    };
  }

  if (input.statusKey === 'restore-error') {
    return {
      action: '本地草稿恢复',
      time: '刚刚',
      result: '本地草稿恢复失败',
      detail: input.errorDetail ?? '本地草稿数据无法恢复，请检查持久化数据后再继续。',
      canvasSummary: '当前检测到本地草稿数据异常，尚未自动恢复或重新导入。',
    };
  }

  if (input.statusKey === 'browser-read-error') {
    return {
      action: '浏览器书签读取',
      time: '刚刚',
      result: '浏览器书签读取失败',
      detail: input.errorDetail ?? '浏览器书签读取发生错误，请检查扩展权限与运行时状态。',
      canvasSummary: '当前无法完成浏览器书签读取，请先处理读取错误后再继续。',
    };
  }

  return {
    action: '浏览器书签读取',
    time: '刚刚',
    result: '当前还不能自动读取浏览器书签',
    detail: '本地草稿为空，且当前无法读取浏览器书签。请确认扩展权限后再执行导入。',
    canvasSummary: '当前尚未导入浏览器书签；确认权限后即可读取并生成第一份草稿。',
  };
}

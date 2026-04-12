export type OverwriteConfirmationAction =
  | 'overwrite-draft-from-browser'
  | 'sync-draft-to-browser';

export type LocalRecoveryTarget = 'browser' | 'draft';

type OverwriteConfirmationCopy = {
  title: string;
  sourceSummary: string;
  targetSummary: string;
  overwriteStatement: string;
  replaceSummary: string;
  preserveSummary: string;
  backupReminder: string;
  caution: string | null;
  confirmLabel: string;
  blockedStatusKey: 'overwrite-draft-blocked' | 'sync-draft-blocked';
  blockedStatusAction: string;
  blockedStatusResult: string;
  blockedStatusDetail: string;
  backupBlockedStatusResult: string;
  backupBlockedStatusDetail: string;
  successStatusResult: string;
  successStatusDetail: string;
};

type LocalRecoveryTargetCopy = {
  label: string;
  missingReason: string;
  invalidReason: string;
  confirmationTitle: string;
  confirmationSummary: string;
  confirmationWarning: string | null;
  successStatusAction: string;
  successStatusResult: string;
  successStatusDetail: string;
};

export const appShellCopy = {
  title: '书签清理与归档工作区',
  subtitle: '当前草稿工作区已经接入基础编辑、拖拽、草稿撤销、浏览器覆盖/同步与本地撤销覆盖；后续任务继续补 WebDAV 能力。',
  topShellLabel: '顶部动作区',
  searchLabel: '搜索与聚焦区',
  canvasLabel: '图谱画布区',
  hintLabel: '操作提示区',
  statusLabel: '状态结果区',
  topShellSummary: '高风险动作入口保持显式可见；当前浏览器覆盖、同步和本地撤销覆盖已经接入显式确认与本地备份边界，后续任务继续补 WebDAV 能力。',
  searchSummary: '标题或 URL 搜索会基于当前草稿实时更新命中结果；普通搜索在按下 Enter 后才会聚焦首个结果，并可用 ↑ / ↓ 循环切换；仅看重复项会切换到重复 URL 聚焦视图。',
  searchInputPlaceholder: '搜索标题或 URL',
  searchToggleLabel: '仅看重复项',
  searchModeAll: '当前范围：全部草稿',
  searchModeDuplicateOnly: '当前范围：仅看重复项',
  pageBackToTopLabel: '回到顶部',
  canvasPlaceholder: '当前区域承载可编辑的草稿图谱；搜索、重复聚焦与草稿撤销已经可用，后续任务会继续补同步能力。',
  canvasDraftTitle: '当前草稿画布',
  canvasDraftSummary: '这里承载当前草稿节点列表、基础编辑、拖拽、草稿撤销与基础悬浮信息；后续同步与聚焦能力会继续挂接在当前草稿之上。',
  statusSummary: '最近三条操作记录按时间倒序贴住当前可视画布右下角展示；最小化后会以半透明锚点保留在同一位置，减少对草稿内容的遮挡。',
  statusPopupTitle: '最近记录',
  statusAnchorLabel: '最近记录',
  statusAnchorAriaLabel: '重新打开最近记录弹窗',
  statusAnchorHint: '浏览器书签读取 · 当前浏览器书签数据为空',
  statusCloseLabel: 'x',
  statusCloseAriaLabel: '关闭状态弹窗',
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
  disabledSummaryTitle: '当前不可用说明',
  primaryActionItems: [
    { key: 'overwrite-draft-from-browser', label: '从浏览器覆盖当前草稿' },
    { key: 'sync-draft-to-browser', label: '同步当前草稿到浏览器书签' },
    { key: 'upload-draft-to-webdav', label: '上传当前草稿到 WebDAV' },
    { key: 'upload-browser-to-webdav', label: '上传当前浏览器书签到 WebDAV' },
    { key: 'restore-webdav-draft', label: '恢复 WebDAV 草稿到当前草稿' },
    { key: 'restore-webdav-browser', label: '恢复 WebDAV 书签到浏览器书签' },
    { key: 'undo-overwrite', label: '撤销覆盖操作' },
  ],
  secondaryActionItems: [
    { key: 'relayout', label: '重新整理布局' },
    { key: 'webdav-settings', label: 'WebDAV 设置' },
  ],
  syncWithoutDraftReason: '当前还没有可同步的草稿内容。',
  webdavUnavailableReason: '请先完成 WebDAV 设置与可用性检测。',
  relayoutWithoutDraftReason: '当前还没有可重新整理的草稿图谱。',
  relayoutUnavailableReason: '当前自动重排能力将在后续任务接入。',
  webdavSettingsUnavailableReason: '当前设置面板将在后续任务接入。',
  externalActionRunningReason: '当前有覆盖、同步或恢复操作正在执行，请等待完成后再继续。',
  hintItems: [
    '单击：选择节点',
    '双击：编辑节点',
    'Enter：创建子节点',
    'Shift + Enter：新增同级节点',
    '↑ / ↓：调整当前层级顺序',
    '←：提升一级目录层级',
    'Delete / Backspace：删除节点',
    'Ctrl+Z：撤销上一步草稿修改',
    '搜索框 Enter：进入结果导航',
    '搜索框 ↑ / ↓：循环切换聚焦结果',
    '悬浮：查看节点详情',
  ],
  hintSummary: '操作提示贴住当前可视画布右上角，并保持半透明低干扰样式；滚动画布区域时会继续保持可见。',
  undoUnavailableReason: '当前没有进行覆盖操作，不能进行撤销覆盖操作。启用后会先打开撤销目标选择。',
  overwriteConfirmationCancelLabel: '取消',
  localRecoveryChooserTitle: '选择要撤销的覆盖目标',
  localRecoveryChooserSummary: '撤销覆盖操作只针对最新的一份本地备份，不会替代 Ctrl+Z 草稿撤销。',
  localRecoveryChooserCancelLabel: '取消',
  localRecoveryChooserContinueLabel: '继续',
  localRecoverySummaryCreatedAtLabel: '备份时间',
  localRecoverySummaryOriginLabel: '备份来源',
  localRecoverySummaryVersionLabel: '来源版本',
  localRecoveryConfirmLabel: '确认恢复',
} as const;

const overwriteConfirmationCopy: Record<OverwriteConfirmationAction, OverwriteConfirmationCopy> = {
  'overwrite-draft-from-browser': {
    title: '确认从浏览器覆盖当前草稿',
    sourceSummary: '来源：当前浏览器书签',
    targetSummary: '目标：当前草稿',
    overwriteStatement: '当前浏览器书签将覆盖当前草稿。',
    replaceSummary: '当前草稿的结构和内容将被替换，包括当前草稿相关的搜索、重复过滤和撤销上下文。',
    preserveSummary: '保持不变：浏览器书签本身不会被这个动作修改。',
    backupReminder: '执行前应先生成一份草稿本地备份；该备份与恢复入口将在下一任务接入。',
    caution: null,
    confirmLabel: '确认继续',
    blockedStatusKey: 'overwrite-draft-blocked',
    blockedStatusAction: '从浏览器覆盖当前草稿',
    blockedStatusResult: '确认已记录，但当前尚未接入浏览器覆盖执行链路',
    blockedStatusDetail: '本次只完成了覆盖确认门禁；当前草稿和浏览器书签都没有发生变化。',
    backupBlockedStatusResult: '未能生成草稿本地备份，已阻止从浏览器覆盖当前草稿',
    backupBlockedStatusDetail: '当前草稿保持不变；请先处理本地备份失败后再重试覆盖。',
    successStatusResult: '已根据当前浏览器书签重建当前草稿',
    successStatusDetail: '覆盖前的草稿已写入本地备份；如需回退，可使用“撤销覆盖操作”恢复之前的草稿。',
  },
  'sync-draft-to-browser': {
    title: '确认同步当前草稿到浏览器书签',
    sourceSummary: '来源：当前草稿',
    targetSummary: '目标：当前浏览器书签',
    overwriteStatement: '当前草稿将覆盖当前浏览器书签。',
    replaceSummary: '将替换：受管范围内的浏览器书签结构和内容。',
    preserveSummary: '保持不变：当前草稿本身不会被这个动作清空或重建。',
    backupReminder: '执行前应先生成一份浏览器本地备份；该备份与恢复入口将在下一任务接入。',
    caution: '提醒：Ctrl+Z 不会撤销已经完成的浏览器写入。',
    confirmLabel: '确认同步',
    blockedStatusKey: 'sync-draft-blocked',
    blockedStatusAction: '同步当前草稿到浏览器书签',
    blockedStatusResult: '确认已记录，但当前尚未接入浏览器写回执行链路',
    blockedStatusDetail: '本次只完成了同步确认门禁；当前草稿和浏览器书签都没有发生变化。',
    backupBlockedStatusResult: '未能生成浏览器本地备份，已阻止同步当前草稿到浏览器书签',
    backupBlockedStatusDetail: '当前草稿和浏览器书签都保持不变；请先处理本地备份失败后再重试同步。',
    successStatusResult: '已将当前草稿同步到浏览器书签',
    successStatusDetail: '同步前的浏览器书签已写入本地备份；如需回退，可使用“撤销覆盖操作”恢复之前的浏览器书签。',
  },
};

const localRecoveryTargetCopy: Record<LocalRecoveryTarget, LocalRecoveryTargetCopy> = {
  browser: {
    label: '撤销对浏览器书签的覆盖',
    missingReason: '当前没有对浏览器书签进行覆盖操作，不能撤销对浏览器书签的覆盖',
    invalidReason: '当前浏览器书签备份无效，不能撤销对浏览器书签的覆盖',
    confirmationTitle: '确认撤销对浏览器书签的覆盖',
    confirmationSummary: '当前浏览器书签将被最新的本地浏览器备份覆盖恢复。',
    confirmationWarning: '提醒：Ctrl+Z 不会撤销已经完成的浏览器写入，请确认后再继续。',
    successStatusAction: '撤销对浏览器书签的覆盖',
    successStatusResult: '已使用本地浏览器备份恢复浏览器书签',
    successStatusDetail: '浏览器书签已按最新的本地备份恢复；本次恢复不会生成新的持久化本地备份。',
  },
  draft: {
    label: '撤销对当前草稿的覆盖',
    missingReason: '当前没有对当前草稿进行覆盖操作，不能撤销对当前草稿的覆盖',
    invalidReason: '当前草稿备份无效，不能撤销对当前草稿的覆盖',
    confirmationTitle: '确认撤销对当前草稿的覆盖',
    confirmationSummary: '当前草稿将被最新的本地草稿备份覆盖恢复。',
    confirmationWarning: null,
    successStatusAction: '撤销对当前草稿的覆盖',
    successStatusResult: '已使用本地草稿备份恢复当前草稿',
    successStatusDetail: '当前草稿已按最新的本地备份恢复；浏览器书签保持不变，本次恢复不会生成新的持久化本地备份。',
  },
};

export function getOverwriteConfirmationCopy(
  action: OverwriteConfirmationAction,
): OverwriteConfirmationCopy {
  return overwriteConfirmationCopy[action];
}

export function getLocalRecoveryTargetCopy(
  target: LocalRecoveryTarget,
): LocalRecoveryTargetCopy {
  return localRecoveryTargetCopy[target];
}

export function formatLocalBackupOrigin(
  origin: 'webdav-bookmark-version' | 'webdav-draft-version' | 'draft-sync' | 'browser-current-tree',
): string {
  switch (origin) {
    case 'browser-current-tree':
      return '当前浏览器书签';
    case 'draft-sync':
      return '当前草稿同步前状态';
    case 'webdav-bookmark-version':
      return 'WebDAV 书签版本';
    case 'webdav-draft-version':
      return 'WebDAV 草稿版本';
    default:
      return origin;
  }
}

type StartupStatusCopy = {
  action: string;
  time: string;
  result: string;
  detail: string;
  canvasSummary: string;
};

export function formatStatusTimestamp(occurredAt?: string): string {
  if (!occurredAt) {
    return '—';
  }

  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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
  occurredAt?: string;
}): StartupStatusCopy {
  const formattedTime = formatStatusTimestamp(input?.occurredAt);

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
      time: formattedTime,
      result: '已恢复上次保存的本地草稿会话',
      detail: `启动时优先恢复了本地草稿，会话包含 ${input.nodeCount} 个节点，本次未自动读取浏览器书签。`,
      canvasSummary: `当前草稿已从本地会话恢复，共 ${input.nodeCount} 个节点，可继续编辑与后续同步。`,
    };
  }

  if (input.statusKey === 'imported-browser-tree') {
    return {
      action: '浏览器书签读取',
      time: formattedTime,
      result: '首次启动已从浏览器导入当前书签树',
      detail: `当前草稿包含 ${input.nodeCount} 个节点，已可进入后续编辑。`,
      canvasSummary: `当前草稿包含 ${input.nodeCount} 个节点，已可进入后续编辑。`,
    };
  }

  if (input.statusKey === 'imported-browser-tree-unsaved') {
    return {
      action: '浏览器书签读取',
      time: formattedTime,
      result: '已导入浏览器书签，但本地草稿保存失败',
      detail: input.errorDetail ?? '当前草稿已导入，但保存到本地会话时失败，刷新后可能丢失。',
      canvasSummary: `当前草稿已导入 ${input.nodeCount} 个节点，但尚未成功保存到本地；刷新后可能丢失。`,
    };
  }

  if (input.statusKey === 'restore-error') {
    return {
      action: '本地草稿恢复',
      time: formattedTime,
      result: '本地草稿恢复失败',
      detail: input.errorDetail ?? '本地草稿数据无法恢复，请检查持久化数据后再继续。',
      canvasSummary: '当前检测到本地草稿数据异常，尚未自动恢复或重新导入。',
    };
  }

  if (input.statusKey === 'browser-read-error') {
    return {
      action: '浏览器书签读取',
      time: formattedTime,
      result: '浏览器书签读取失败',
      detail: input.errorDetail ?? '浏览器书签读取发生错误，请检查扩展权限与运行时状态。',
      canvasSummary: '当前无法完成浏览器书签读取，请先处理读取错误后再继续。',
    };
  }

  return {
    action: '浏览器书签读取',
    time: formattedTime,
    result: '当前还不能自动读取浏览器书签',
    detail: '本地草稿为空，且当前无法读取浏览器书签。请确认扩展权限后再执行导入。',
    canvasSummary: '当前尚未导入浏览器书签；确认权限后即可读取并生成第一份草稿。',
  };
}

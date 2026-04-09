export const draftGraphWorkspaceCopy = {
  treeLabel: '当前草稿节点列表',
  emptyCanvasTitle: '当前草稿为空',
  emptyCanvasDetail: '导入或创建首个根节点后，就可以在这里继续编辑当前草稿。',
  editorDialogTitle: '编辑当前草稿节点',
  createChildDialogTitle: '在当前草稿下创建子节点',
  createSiblingDialogTitle: '在当前层级新增同级节点',
  deleteDialogTitle: '确认删除当前目录节点',
  nodeTypeLabel: '节点类型',
  folderOption: '目录',
  bookmarkOption: '书签',
  titleLabel: '标题',
  urlLabel: 'URL',
  cancelLabel: '取消',
  deleteLabel: '确认删除',
  saveLabel: '保存',
  createLabel: '创建',
  parentPrefix: '父节点',
  siblingReferencePrefix: '参考节点',
  levelPrefix: '当前层级',
  rootLevelLabel: '顶层根节点',
  pathPrefix: '当前路径',
  deleteFolderSubtreeConfirm: '确定要删除目录“{title}”及其 {count} 个子节点吗？',
  dragMoveErrorPrefix: '当前拖拽未生效',
  searchNoMatchTitle: '当前草稿中没有匹配结果',
  searchNoMatchDetail: '请尝试其他标题关键词或 URL 片段。',
  deepHierarchyViewportHintTitle: '当前层级较深，建议增大页面显示窗口',
  deepHierarchyViewportHintDetail: '窗口过窄时，右侧更深层的子节点可能超出当前可视范围。若需完整查看深层书签，请尽量拉宽当前网页显示窗口。',
  dismissViewportHintLabel: '关闭窗口提示',
  duplicateNoMatchTitle: '在重复 URL 范围内没有匹配结果',
  duplicateNoMatchDetail: '当前搜索只会在重复 URL 书签里匹配标题或 URL。',
  duplicateEmptyTitle: '当前还没有重复 URL 书签',
  duplicateEmptyDetail: '开启仅看重复项后，这里只会显示存在重复 URL 的书签。',
  duplicateOnlyHeading: '重复 URL 聚焦视图',
  duplicateOnlySummary: '当前按相同 URL 分组展示重复书签，便于集中查看和后续操作。',
  duplicateGroupTitle: '同 URL 重复组',
  duplicateHoverPrefix: '重复 URL',
  duplicatePathLabel: '完整路径',
  duplicateExpandLabel: '展开更多',
  validation: {
    titleRequired: '标题必填',
    urlRequired: 'URL 必填',
    folderUrlForbidden: '目录节点不能设置 URL',
    folderOnlyCreateChild: '只有目录节点可以创建子节点',
  },
} as const;

export function formatDuplicateHoverSummary(count: number): string {
  return `${draftGraphWorkspaceCopy.duplicateHoverPrefix}：共 ${count} 项`;
}

export function formatDuplicateBadge(count: number): string {
  return `重复 ${count} 项`;
}

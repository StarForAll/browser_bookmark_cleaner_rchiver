import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  type PersistedDraftSession,
} from '@/adapters/local-persistence/contracts';
import {
  createDraftChildNode,
  createDraftSiblingNode,
  deleteDraftNodeSubtree,
  editDraftNode,
  moveDraftNode,
  selectDraftNode,
} from '@/domain/draft-graph/editing';
import {
  type DraftGraphNode,
  type DraftGraphSnapshot,
  type DraftUndoMutationType,
} from '@/domain/draft-graph/contracts';
import {
  applyLatestDraftUndo,
  createDraftUndoEntry,
} from '@/features/bookmark-graph/state/draftUndo';
import {
  deriveDuplicateFocusGroups,
  deriveDuplicateHoverDetails,
  deriveDuplicateNodeIds,
  deriveSearchResults,
} from '@/features/bookmark-graph/state/searchAndFocus';
import {
  draftGraphWorkspaceCopy,
  formatDuplicateBadge,
  formatDuplicateHoverSummary,
} from '@/shared/copy/draftGraphWorkspace';

type DraftGraphWorkspaceProps = {
  duplicateOnly?: boolean;
  initialSnapshot: DraftGraphSnapshot;
  initialUndoHistory?: PersistedDraftSession['undoHistory'];
  initialCheckpoints?: PersistedDraftSession['checkpoints'];
  onPersistDraftSession: (session: PersistedDraftSession) => Promise<unknown>;
  onExitSearchNavigation?: () => void;
  searchNavigationActive?: boolean;
  searchNavigationIndex?: number;
  searchQuery?: string;
};

type DialogState =
  | {
      kind: 'edit';
      nodeId: string;
      title: string;
      url: string;
      error: string | null;
    }
  | {
      kind: 'create-child';
      parentId: string;
      nodeType: 'folder' | 'bookmark';
      title: string;
      url: string;
      error: string | null;
    }
  | {
      kind: 'create-sibling';
      referenceNodeId: string;
      parentId: string | null;
      nodeType: 'folder' | 'bookmark';
      title: string;
      url: string;
      error: string | null;
    }
  | {
      kind: 'delete-confirm';
      nodeId: string;
      title: string;
      childCount: number;
      message: string;
    }
  | null;

type DialogKind = NonNullable<DialogState>['kind'];

type MindmapLayoutNode = {
  nodeId: string;
  x: number;
  y: number;
  height: number;
  branchColor: string;
  depth: number;
  isVirtualRoot?: boolean;
  shellTop?: number;
  shellHeight?: number;
};

type MindmapLayoutBranch = {
  fromId: string;
  toId: string;
  branchColor: string;
  depth: number;
};

type MindmapLayoutResult = {
  nodes: MindmapLayoutNode[];
  branches: MindmapLayoutBranch[];
  width: number;
  height: number;
  metrics?: MindmapLayoutMetrics;
};

type MindmapLayoutMetrics = {
  nodeWidth: number;
  horizontalGap: number;
  paddingX: number;
  paddingY: number;
  dropZoneWidth: number;
  shellWidth: number;
  hoverCardWidth: number;
};

type LayoutNodeMeta = {
  nodeId: string;
  entry: number;
  exit: number;
  depth: number;
  parentId: string | null;
  baseY: number;
  height: number;
};

type CanvasViewport = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const MINDMAP_NODE_WIDTH = 220;
const BOOKMARK_NODE_HEIGHT = 56;
const ROOT_BOOKMARK_NODE_HEIGHT = 66;
const ROOT_FOLDER_NODE_HEIGHT = 46;
const FOLDER_NODE_HEIGHT = 40;
const VIRTUAL_ROOT_NODE_HEIGHT = 46;
const MINDMAP_HORIZONTAL_GAP = 80;
const MIN_MINDMAP_NODE_WIDTH = 176;
const MIN_MINDMAP_HORIZONTAL_GAP = 56;
const MINDMAP_VERTICAL_GAP = 16;
const MINDMAP_PADDING_X = 32;
const MINDMAP_PADDING_Y = 32;
const DROP_ZONE_WIDTH = 72;
const MIN_DROP_ZONE_WIDTH = 44;
const HOVER_CARD_WIDTH = 280;
const HOVER_CARD_GAP = 16;
const LAYOUT_TAIL_SLACK = 80;
const VIEWPORT_HINT_POPOVER_MAX_WIDTH = 360;
const DIALOG_CARD_MAX_WIDTH = 460;
const DIALOG_CARD_GAP = 20;
const DIALOG_CARD_VIEWPORT_MARGIN = 16;
const DIALOG_ANCHORED_MIN_VIEWPORT_WIDTH = 721;
const ROOT_BRANCH_COLORS = ['#7a9d95', '#8aa6c0', '#b59677', '#8d9a76'] as const;
const LARGE_GRAPH_NODE_THRESHOLD = 400;
const VIEWPORT_OVERSCAN_X = 280;
const VIEWPORT_OVERSCAN_Y = 160;
const TREE_CONTENT_PADDING = 24;
const FOCUSABLE_DIALOG_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const DEFAULT_MINDMAP_LAYOUT_METRICS: MindmapLayoutMetrics = {
  nodeWidth: MINDMAP_NODE_WIDTH,
  horizontalGap: MINDMAP_HORIZONTAL_GAP,
  paddingX: MINDMAP_PADDING_X,
  paddingY: MINDMAP_PADDING_Y,
  dropZoneWidth: DROP_ZONE_WIDTH,
  shellWidth: MINDMAP_NODE_WIDTH + DROP_ZONE_WIDTH,
  hoverCardWidth: HOVER_CARD_WIDTH,
};

type HoverState = {
  nodeId: string;
} | null;

type HoverCardPosition = {
  left: number;
  top: number;
};

type DragPreviewState = {
  highlightNodeId: string;
  targetParentId: string | null;
  targetIndex: number;
} | null;

type DialogCardPosition = {
  left: number;
  top: number;
};

type DialogAnchorRect = Pick<DOMRect, 'left' | 'right' | 'top' | 'height'>;
type ViewportHintPopoverPosition = {
  left: number;
  top: number;
};

function buildPersistedDraftSession(
  snapshot: DraftGraphSnapshot,
  undoHistory: PersistedDraftSession['undoHistory'],
  checkpoints: PersistedDraftSession['checkpoints'],
): PersistedDraftSession {
  return {
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    draftSnapshot: snapshot,
    expandedStateById: {},
    nodePositionsById: {},
    undoHistory,
    checkpoints,
  };
}

function resolveEditUndoMutationType(
  previousSnapshot: DraftGraphSnapshot,
  nextSnapshot: DraftGraphSnapshot,
  nodeId: string,
): DraftUndoMutationType {
  const previousNode = previousSnapshot.nodesById[nodeId];
  const nextNode = nextSnapshot.nodesById[nodeId];

  if (
    previousNode?.nodeType === 'bookmark' &&
    nextNode?.nodeType === 'bookmark' &&
    previousNode.title === nextNode.title &&
    previousNode.url !== nextNode.url
  ) {
    return 'edit-bookmark-url';
  }

  return 'rename-node';
}

function resolveViewportOverlayMargin(viewportWidth: number): number {
  if (viewportWidth <= 720) {
    return 16;
  }

  if (viewportWidth <= 1024) {
    return 18;
  }

  return 24;
}

export function resolveViewportHintPopoverPosition(input: {
  treeRect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>;
  overlayWidth: number;
  overlayHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): ViewportHintPopoverPosition | null {
  const margin = resolveViewportOverlayMargin(input.viewportWidth);

  if (input.treeRect.bottom <= margin || input.treeRect.top >= input.viewportHeight - margin) {
    return null;
  }

  const preferredLeft = Math.max(margin, input.treeRect.left + margin);
  const maxLeft = Math.max(margin, input.viewportWidth - input.overlayWidth - margin);
  const preferredTop = Math.max(margin, input.treeRect.top + margin);
  const maxTop = Math.max(
    margin,
    Math.min(
      input.viewportHeight - input.overlayHeight - margin,
      input.treeRect.bottom - input.overlayHeight - margin,
    ),
  );

  return {
    left: Math.min(preferredLeft, maxLeft),
    top: Math.min(preferredTop, maxTop),
  };
}

export function resolveDialogCardPosition(input: {
  anchorRect: DialogAnchorRect;
  dialogKind: DialogKind;
  viewportWidth: number;
  viewportHeight: number;
}): DialogCardPosition {
  const availableWidth = Math.max(280, input.viewportWidth - DIALOG_CARD_VIEWPORT_MARGIN * 2);
  const cardWidth = Math.min(DIALOG_CARD_MAX_WIDTH, availableWidth);
  const estimatedHeight =
    input.dialogKind === 'delete-confirm'
      ? 240
      : input.dialogKind === 'edit'
        ? 320
        : 420;
  const preferredLeft = input.anchorRect.right + DIALOG_CARD_GAP;
  const fallbackLeft = input.anchorRect.left - cardWidth - DIALOG_CARD_GAP;
  const left =
    preferredLeft + cardWidth <= input.viewportWidth - DIALOG_CARD_VIEWPORT_MARGIN
      ? preferredLeft
      : Math.max(DIALOG_CARD_VIEWPORT_MARGIN, fallbackLeft);
  const centeredTop = input.anchorRect.top + input.anchorRect.height / 2 - estimatedHeight / 2;
  const maxTop = Math.max(
    DIALOG_CARD_VIEWPORT_MARGIN,
    input.viewportHeight - estimatedHeight - DIALOG_CARD_VIEWPORT_MARGIN,
  );

  return {
    left,
    top: Math.max(DIALOG_CARD_VIEWPORT_MARGIN, Math.min(centeredTop, maxTop)),
  };
}

function resolveDialogAnchorNodeId(dialogState: NonNullable<DialogState>): string {
  switch (dialogState.kind) {
    case 'edit':
    case 'delete-confirm':
      return dialogState.nodeId;
    case 'create-child':
      return dialogState.parentId;
    case 'create-sibling':
      return dialogState.referenceNodeId;
  }
}

function resolveDialogPositionFromAnchorRect(
  anchorRect: DialogAnchorRect,
  dialogKind: DialogKind,
): DialogCardPosition | null {
  if (window.innerWidth < DIALOG_ANCHORED_MIN_VIEWPORT_WIDTH) {
    return null;
  }

  return resolveDialogCardPosition({
    anchorRect,
    dialogKind,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
}

function getDraftNodeLayoutHeight(node: DraftGraphNode, depth: number): number {
  if (node.nodeType === 'bookmark') {
    return depth === 0 ? ROOT_BOOKMARK_NODE_HEIGHT : BOOKMARK_NODE_HEIGHT;
  }

  return depth === 0 ? ROOT_FOLDER_NODE_HEIGHT : FOLDER_NODE_HEIGHT;
}

function getMindmapLayoutMetrics(layout: Pick<MindmapLayoutResult, 'metrics'> | null | undefined): MindmapLayoutMetrics {
  return layout?.metrics ?? DEFAULT_MINDMAP_LAYOUT_METRICS;
}

function deriveSnapshotMaxDepth(snapshot: DraftGraphSnapshot): number {
  let maxDepth = 0;

  const visitNode = (nodeId: string, depth: number): void => {
    const node = snapshot.nodesById[nodeId];
    if (!node) {
      return;
    }

    maxDepth = Math.max(maxDepth, depth);
    node.childIds.forEach((childId) => {
      visitNode(childId, depth + 1);
    });
  };

  snapshot.rootIds.forEach((rootId) => {
    visitNode(rootId, 0);
  });

  return maxDepth;
}

function resolveMindmapLayoutMetrics(
  maxDepth: number,
  treeContainerWidth: number | null,
): MindmapLayoutMetrics {
  if (treeContainerWidth === null) {
    return DEFAULT_MINDMAP_LAYOUT_METRICS;
  }

  const columnCount = maxDepth + 2;
  const gapCount = maxDepth + 1;
  const availableCanvasWidth = Math.max(0, treeContainerWidth - TREE_CONTENT_PADDING * 2);
  const availableContentWidth =
    availableCanvasWidth -
    DEFAULT_MINDMAP_LAYOUT_METRICS.paddingX * 2 -
    LAYOUT_TAIL_SLACK;

  if (availableContentWidth <= 0) {
    return {
      ...DEFAULT_MINDMAP_LAYOUT_METRICS,
      nodeWidth: MIN_MINDMAP_NODE_WIDTH,
      horizontalGap: MIN_MINDMAP_HORIZONTAL_GAP,
      dropZoneWidth: MIN_DROP_ZONE_WIDTH,
      shellWidth: MIN_MINDMAP_NODE_WIDTH + MIN_DROP_ZONE_WIDTH,
    };
  }

  const defaultRequiredWidth =
    columnCount * DEFAULT_MINDMAP_LAYOUT_METRICS.nodeWidth +
    gapCount * DEFAULT_MINDMAP_LAYOUT_METRICS.horizontalGap;
  if (availableContentWidth >= defaultRequiredWidth) {
    return DEFAULT_MINDMAP_LAYOUT_METRICS;
  }

  const minGapRequiredWidth =
    columnCount * DEFAULT_MINDMAP_LAYOUT_METRICS.nodeWidth +
    gapCount * MIN_MINDMAP_HORIZONTAL_GAP;

  let nextNodeWidth = DEFAULT_MINDMAP_LAYOUT_METRICS.nodeWidth;
  let nextHorizontalGap = DEFAULT_MINDMAP_LAYOUT_METRICS.horizontalGap;

  if (availableContentWidth >= minGapRequiredWidth) {
    nextHorizontalGap = Math.max(
      MIN_MINDMAP_HORIZONTAL_GAP,
      Math.floor(
        (availableContentWidth - columnCount * DEFAULT_MINDMAP_LAYOUT_METRICS.nodeWidth) / gapCount,
      ),
    );
  } else {
    nextHorizontalGap = MIN_MINDMAP_HORIZONTAL_GAP;
    nextNodeWidth = Math.max(
      MIN_MINDMAP_NODE_WIDTH,
      Math.floor((availableContentWidth - gapCount * nextHorizontalGap) / columnCount),
    );
  }

  const nextDropZoneWidth = Math.max(
    MIN_DROP_ZONE_WIDTH,
    Math.min(DROP_ZONE_WIDTH, nextHorizontalGap - 8),
  );

  return {
    ...DEFAULT_MINDMAP_LAYOUT_METRICS,
    nodeWidth: nextNodeWidth,
    horizontalGap: nextHorizontalGap,
    dropZoneWidth: nextDropZoneWidth,
    shellWidth: nextNodeWidth + nextDropZoneWidth,
  };
}

const VIRTUAL_ROOT_ID = '__virtual_root__';
const VIRTUAL_ROOT_TITLE = '书签图谱';

class RangeOffsetTree {
  private readonly bit: number[];

  constructor(size: number) {
    this.bit = new Array(size + 2).fill(0);
  }

  rangeAdd(start: number, endExclusive: number, delta: number): void {
    this.add(start, delta);
    this.add(endExclusive, -delta);
  }

  pointQuery(index: number): number {
    let sum = 0;
    for (let cursor = index + 1; cursor > 0; cursor -= cursor & -cursor) {
      sum += this.bit[cursor] ?? 0;
    }
    return sum;
  }

  private add(index: number, delta: number): void {
    for (let cursor = index + 1; cursor < this.bit.length; cursor += cursor & -cursor) {
      this.bit[cursor] += delta;
    }
  }
}

function buildMindmapLayout(
  snapshot: DraftGraphSnapshot,
  treeContainerWidth: number | null,
): MindmapLayoutResult {
  const nodes: MindmapLayoutNode[] = [];
  const branches: MindmapLayoutBranch[] = [];
  const nodeById = new Map<string, MindmapLayoutNode>();
  const layoutMetaById = new Map<string, LayoutNodeMeta>();
  const maxDepth = deriveSnapshotMaxDepth(snapshot);
  const metrics = resolveMindmapLayoutMetrics(maxDepth, treeContainerWidth);
  let traversalIndex = 0;

  const leafStride = ROOT_BOOKMARK_NODE_HEIGHT + MINDMAP_VERTICAL_GAP;

  function placeNode(
    nodeId: string,
    depth: number,
    branchColor: string,
    leafIndex: number,
  ): { centerY: number; nextLeafIndex: number } {
    const node = snapshot.nodesById[nodeId] as DraftGraphNode;
    const nodeHeight = getDraftNodeLayoutHeight(node, depth);
    const entry = traversalIndex;
    traversalIndex += 1;

    if (node.childIds.length === 0) {
      const centerY = MINDMAP_PADDING_Y + leafIndex * leafStride + nodeHeight / 2;
      const layoutNode = {
        nodeId,
        x: metrics.paddingX + depth * (metrics.nodeWidth + metrics.horizontalGap),
        y: centerY - nodeHeight / 2,
        height: nodeHeight,
        branchColor,
        depth,
      };
      nodes.push(layoutNode);
      nodeById.set(nodeId, layoutNode);
      layoutMetaById.set(nodeId, {
        nodeId,
        entry,
        exit: traversalIndex,
        depth,
        parentId: node.parentId,
        baseY: layoutNode.y,
        height: nodeHeight,
      });
      return {
        centerY,
        nextLeafIndex: leafIndex + 1,
      };
    }

    let cursor = leafIndex;
    const childCenters: number[] = [];

    for (const childId of node.childIds) {
      const childPlacement = placeNode(childId, depth + 1, branchColor, cursor);
      cursor = childPlacement.nextLeafIndex;
      childCenters.push(childPlacement.centerY);
      branches.push({
        fromId: nodeId,
        toId: childId,
        branchColor,
        depth,
      });
    }

    const centerY = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
    const layoutNode = {
      nodeId,
      x: metrics.paddingX + depth * (metrics.nodeWidth + metrics.horizontalGap),
      y: centerY - nodeHeight / 2,
      height: nodeHeight,
      branchColor,
      depth,
    };
    nodes.push(layoutNode);
    nodeById.set(nodeId, layoutNode);
    layoutMetaById.set(nodeId, {
      nodeId,
      entry,
      exit: traversalIndex,
      depth,
      parentId: node.parentId,
      baseY: layoutNode.y,
      height: nodeHeight,
    });

    return {
      centerY,
      nextLeafIndex: cursor,
    };
  }

  let leafIndex = 0;
  const rootCenters: number[] = [];
  snapshot.rootIds.forEach((rootId, index) => {
    const placement = placeNode(rootId, 0, ROOT_BRANCH_COLORS[index % ROOT_BRANCH_COLORS.length], leafIndex);
    rootCenters.push(placement.centerY);
    leafIndex = placement.nextLeafIndex + 1;
  });

  // Add a visible virtual root at depth -1. The button itself should sit in the
  // vertical middle of the root cluster, while the drop zone still spans the
  // whole root band so nested nodes can be dropped back to top level anywhere
  // along that band.
  if (snapshot.rootIds.length > 0 && rootCenters.length > 0) {
    const virtualRootX = metrics.paddingX;
    const rootMidpoint = (rootCenters[0] + rootCenters[rootCenters.length - 1]) / 2;

    const virtualRootNode = {
      nodeId: VIRTUAL_ROOT_ID,
      x: virtualRootX,
      y: rootMidpoint - VIRTUAL_ROOT_NODE_HEIGHT / 2,
      height: VIRTUAL_ROOT_NODE_HEIGHT,
      branchColor: ROOT_BRANCH_COLORS[0],
      depth: -1,
      isVirtualRoot: true,
      shellTop: rootMidpoint - VIRTUAL_ROOT_NODE_HEIGHT / 2,
      shellHeight: VIRTUAL_ROOT_NODE_HEIGHT,
    };
    nodes.push(virtualRootNode);
    nodeById.set(VIRTUAL_ROOT_ID, virtualRootNode);

    // Add branches from virtual root to each actual root
    snapshot.rootIds.forEach((rootId, index) => {
      branches.push({
        fromId: VIRTUAL_ROOT_ID,
        toId: rootId,
        branchColor: ROOT_BRANCH_COLORS[index % ROOT_BRANCH_COLORS.length],
        depth: -1,
      });
    });

    // Shift all real nodes right to make room for virtual root
    const shiftX = metrics.nodeWidth + metrics.horizontalGap;
    for (const n of nodes) {
      if (!n.isVirtualRoot) {
        n.x += shiftX;
      }
    }
  }

  // Post-processing: resolve overlaps at each depth level.
  // Intermediate nodes (with children) are centered on their children's Y range,
  // which can cause them to overlap with sibling leaf nodes at the same depth.
  // We push overlapping subtrees down to resolve this.
  resolveOverlaps(nodeById, layoutMetaById);

  // After resolving overlaps, keep the virtual root button centered on the
  // visible root band and expand its shell so the virtual-root drop zone still
  // covers the whole root layer.
  const virtualRootNode = nodeById.get(VIRTUAL_ROOT_ID);
  if (virtualRootNode) {
    const rootLayouts = snapshot.rootIds
      .map((rootId) => nodeById.get(rootId))
      .filter((node): node is MindmapLayoutNode => node !== undefined);

    if (rootLayouts.length > 0) {
      const rootTop = rootLayouts.reduce(
        (currentTop, node) => Math.min(currentTop, node.y),
        rootLayouts[0].y,
      );
      const rootBottom = rootLayouts.reduce(
        (currentBottom, node) => Math.max(currentBottom, node.y + node.height),
        rootLayouts[0].y + rootLayouts[0].height,
      );
      const rootMidpoint =
        ((rootLayouts[0].y + rootLayouts[0].height / 2) +
          (rootLayouts[rootLayouts.length - 1].y + rootLayouts[rootLayouts.length - 1].height / 2)) / 2;

      virtualRootNode.y = rootMidpoint - virtualRootNode.height / 2;
      virtualRootNode.shellTop = rootTop;
      virtualRootNode.shellHeight = Math.max(virtualRootNode.height, rootBottom - rootTop);
    }
  }

  const maxBottom = nodes.reduce(
    (currentMax, node) => Math.max(currentMax, node.y + node.height),
    MINDMAP_PADDING_Y + BOOKMARK_NODE_HEIGHT,
  );

  return {
    nodes,
    branches,
    metrics,
    width:
      metrics.paddingX * 2 +
      (maxDepth + 2) * metrics.nodeWidth +
      (maxDepth + 1) * metrics.horizontalGap +
      LAYOUT_TAIL_SLACK,
    height: Math.max(280, maxBottom + metrics.paddingY),
  };
}

/**
 * Resolve vertical overlaps between nodes at the same depth.
 * When two nodes overlap, push the lower one (and its entire subtree) down.
 * Also adds extra gap between nodes from different parents for visual clarity.
 */
function resolveOverlaps(
  nodeById: Map<string, MindmapLayoutNode>,
  layoutMetaById: Map<string, LayoutNodeMeta>,
): void {
  const minGap = MINDMAP_VERTICAL_GAP;
  const siblingGroupGap = MINDMAP_VERTICAL_GAP + 12; // extra gap between different-parent siblings

  // Group nodes by depth (skip virtual root at depth -1)
  const byDepth = new Map<number, LayoutNodeMeta[]>();
  for (const layoutMeta of layoutMetaById.values()) {
    if (layoutMeta.depth < 0) {
      continue;
    }
    if (!byDepth.has(layoutMeta.depth)) {
      byDepth.set(layoutMeta.depth, []);
    }
    byDepth.get(layoutMeta.depth)?.push(layoutMeta);
  }

  const offsetTree = new RangeOffsetTree(layoutMetaById.size + 1);

  // For each depth, sort by Y and resolve overlaps
  for (const [, depthNodes] of byDepth) {
    depthNodes.sort((left, right) => left.baseY - right.baseY);
    let previousBottom = Number.NEGATIVE_INFINITY;
    let previousParentId: string | null = null;

    for (const currentNode of depthNodes) {
      const currentOffset = offsetTree.pointQuery(currentNode.entry);
      let currentTop = currentNode.baseY + currentOffset;
      const requiredGap =
        previousParentId !== null && previousParentId === currentNode.parentId ? minGap : siblingGroupGap;

      if (currentTop < previousBottom + requiredGap) {
        const pushDown = previousBottom + requiredGap - currentTop;
        offsetTree.rangeAdd(currentNode.entry, currentNode.exit, pushDown);
        currentTop += pushDown;
      }

      previousBottom = currentTop + currentNode.height;
      previousParentId = currentNode.parentId;
    }
  }

  for (const layoutMeta of layoutMetaById.values()) {
    const layoutNode = nodeById.get(layoutMeta.nodeId);
    if (!layoutNode) {
      continue;
    }
    layoutNode.y = layoutMeta.baseY + offsetTree.pointQuery(layoutMeta.entry);
  }
}

function buildNodeAriaLabel(node: DraftGraphNode): string {
  return `${node.nodeType === 'folder' ? '目录节点' : '书签节点'}：${node.title || '（无标题）'}`;
}

function getHoverCardPosition(layout: MindmapLayoutNode, canvas: MindmapLayoutResult): HoverCardPosition {
  const metrics = getMindmapLayoutMetrics(canvas);
  const preferredLeft = layout.x + metrics.nodeWidth + HOVER_CARD_GAP;
  const fallbackLeft = Math.max(metrics.paddingX, layout.x - metrics.hoverCardWidth - HOVER_CARD_GAP);
  const maxLeft = Math.max(metrics.paddingX, canvas.width - metrics.hoverCardWidth - metrics.paddingX);
  const left = preferredLeft + metrics.hoverCardWidth <= canvas.width - metrics.paddingX ? preferredLeft : fallbackLeft;
  const clampedTop = Math.max(metrics.paddingY, Math.min(layout.y, canvas.height - 180));

  return {
    left: Math.min(left, maxLeft),
    top: clampedTop,
  };
}

function resolveDropTargetIndex(
  snapshot: DraftGraphSnapshot,
  layoutByNodeId: Record<string, MindmapLayoutNode>,
  targetParentId: string,
  clientY: number,
  treeContainer: HTMLElement | null,
): number {
  const targetParent = snapshot.nodesById[targetParentId];
  if (!targetParent || targetParent.childIds.length === 0 || treeContainer === null) {
    return 0;
  }

  const treeRect = treeContainer.getBoundingClientRect();
  const canvasY = clientY - treeRect.top + treeContainer.scrollTop - TREE_CONTENT_PADDING;
  const targetParentLayout = layoutByNodeId[targetParentId];
  if (targetParentLayout && canvasY <= targetParentLayout.y + targetParentLayout.height / 2) {
    return 0;
  }
  const childCenters = targetParent.childIds
    .map((childId) => layoutByNodeId[childId])
    .filter((layoutNode): layoutNode is MindmapLayoutNode => layoutNode !== undefined)
    .map((layoutNode) => layoutNode.y + layoutNode.height / 2);

  for (let index = 0; index < childCenters.length; index += 1) {
    if (canvasY < childCenters[index]) {
      return index;
    }
  }

  return childCenters.length;
}

function resolveRootDropTargetIndex(
  snapshot: DraftGraphSnapshot,
  layoutByNodeId: Record<string, MindmapLayoutNode>,
  clientY: number,
  treeContainer: HTMLElement | null,
): number {
  if (snapshot.rootIds.length === 0 || treeContainer === null) {
    return 0;
  }

  const treeRect = treeContainer.getBoundingClientRect();
  const canvasY = clientY - treeRect.top + treeContainer.scrollTop - TREE_CONTENT_PADDING;
  const rootCenters = snapshot.rootIds
    .map((rootId) => layoutByNodeId[rootId])
    .filter((layoutNode): layoutNode is MindmapLayoutNode => layoutNode !== undefined)
    .map((layoutNode) => layoutNode.y + layoutNode.height / 2);

  for (let index = 0; index < rootCenters.length; index += 1) {
    if (canvasY < rootCenters[index]) {
      return index;
    }
  }

  return rootCenters.length;
}

function resolveSiblingReorderTarget(
  snapshot: DraftGraphSnapshot,
  layoutByNodeId: Record<string, MindmapLayoutNode>,
  sourceNodeId: string,
  targetNodeId: string,
  clientY: number,
  treeContainer: HTMLElement | null,
): DragPreviewState {
  const sourceNode = snapshot.nodesById[sourceNodeId];
  const targetNode = snapshot.nodesById[targetNodeId];
  if (!sourceNode || !targetNode || sourceNode.internalId === targetNode.internalId) {
    return null;
  }

  if (sourceNode.parentId !== targetNode.parentId) {
    return null;
  }

  const siblingIds = sourceNode.parentId === null
    ? snapshot.rootIds.filter((childId) => childId !== sourceNodeId)
    : snapshot.nodesById[sourceNode.parentId]?.childIds.filter((childId) => childId !== sourceNodeId);
  const targetLayout = layoutByNodeId[targetNodeId];
  if (!siblingIds || !targetLayout) {
    return null;
  }

  const targetIndexBase = siblingIds.indexOf(targetNodeId);
  if (targetIndexBase < 0) {
    return null;
  }

  const treeRect = treeContainer?.getBoundingClientRect();
  const canvasY = treeRect
    ? clientY - treeRect.top + (treeContainer?.scrollTop ?? 0) - TREE_CONTENT_PADDING
    : targetLayout.y;
  const targetMidpoint = targetLayout.y + targetLayout.height / 2;
  const insertAfterTarget = canvasY >= targetMidpoint;

  return {
    highlightNodeId: targetNodeId,
    targetParentId: sourceNode.parentId,
    targetIndex: targetIndexBase + (insertAfterTarget ? 1 : 0),
  };
}

function resolveKeyboardReorderTarget(
  snapshot: DraftGraphSnapshot,
  nodeId: string,
  direction: -1 | 1,
): { targetParentId: string | null; targetIndex: number } | null {
  const node = snapshot.nodesById[nodeId];
  if (!node) {
    return null;
  }

  const siblingIds =
    node.parentId === null
      ? snapshot.rootIds
      : snapshot.nodesById[node.parentId]?.childIds;
  if (!siblingIds) {
    return null;
  }

  const currentIndex = siblingIds.indexOf(nodeId);
  if (currentIndex < 0) {
    return null;
  }

  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= siblingIds.length) {
    return null;
  }

  return {
    targetParentId: node.parentId,
    targetIndex,
  };
}

function resolveKeyboardPromoteTarget(
  snapshot: DraftGraphSnapshot,
  nodeId: string,
): { targetParentId: string | null; targetIndex: number } | null {
  const node = snapshot.nodesById[nodeId];
  if (!node || node.parentId === null) {
    return null;
  }

  const currentParent = snapshot.nodesById[node.parentId];
  if (!currentParent) {
    return null;
  }

  return {
    targetParentId: currentParent.parentId,
    targetIndex: 0,
  };
}

function resolveDragPreviewState(
  snapshot: DraftGraphSnapshot,
  layoutByNodeId: Record<string, MindmapLayoutNode>,
  sourceNodeId: string,
  targetNodeId: string,
  clientY: number,
  treeContainer: HTMLElement | null,
  preferIntoFolder: boolean,
): DragPreviewState {
  if (targetNodeId === VIRTUAL_ROOT_ID) {
    return {
      highlightNodeId: VIRTUAL_ROOT_ID,
      targetParentId: null,
      targetIndex: resolveRootDropTargetIndex(
        snapshot,
        layoutByNodeId,
        clientY,
        treeContainer,
      ),
    };
  }

  const targetNode = snapshot.nodesById[targetNodeId];
  if (!targetNode || targetNode.nodeType !== 'folder') {
    return resolveSiblingReorderTarget(
      snapshot,
      layoutByNodeId,
      sourceNodeId,
      targetNodeId,
      clientY,
      treeContainer,
    );
  }

  if (!preferIntoFolder) {
    return resolveSiblingReorderTarget(
      snapshot,
      layoutByNodeId,
      sourceNodeId,
      targetNodeId,
      clientY,
      treeContainer,
    );
  }

  return {
    highlightNodeId: targetNodeId,
    targetParentId: targetNodeId,
    targetIndex: resolveDropTargetIndex(
      snapshot,
      layoutByNodeId,
      targetNodeId,
      clientY,
      treeContainer,
    ),
  };
}

function buildDeleteConfirmationMessage(node: DraftGraphNode): string {
  return draftGraphWorkspaceCopy.deleteFolderSubtreeConfirm
    .replace('{title}', node.title || '（无标题）')
    .replace('{count}', `${node.childIds.length}`);
}

function getFocusableDialogElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_DIALOG_SELECTOR))
    .filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);
}

function focusBoundaryDialogElement(container: HTMLElement | null, target: 'first' | 'last'): void {
  const focusableElements = getFocusableDialogElements(container);
  if (focusableElements.length === 0) {
    return;
  }

  const nextTarget = target === 'first' ? focusableElements[0] : focusableElements[focusableElements.length - 1];
  nextTarget.focus();
}

function getCurrentActiveElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

function shouldIgnoreGlobalUndoShortcut(activeElement: HTMLElement | null): boolean {
  if (!activeElement) {
    return false;
  }

  const tagName = activeElement.tagName;
  return (
    activeElement.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
}

function isLayoutNodeVisible(
  layoutNode: MindmapLayoutNode,
  viewport: CanvasViewport,
  nodeWidth: number,
): boolean {
  const nodeLeft = layoutNode.x;
  const nodeTop = layoutNode.y;
  const nodeRight = nodeLeft + nodeWidth;
  const nodeBottom = nodeTop + layoutNode.height;

  return (
    nodeRight >= viewport.left - VIEWPORT_OVERSCAN_X &&
    nodeLeft <= viewport.right + VIEWPORT_OVERSCAN_X &&
    nodeBottom >= viewport.top - VIEWPORT_OVERSCAN_Y &&
    nodeTop <= viewport.bottom + VIEWPORT_OVERSCAN_Y
  );
}

export function deriveVisibleMindmapElements(
  layout: MindmapLayoutResult,
  viewport: CanvasViewport | null,
): {
  nodes: MindmapLayoutNode[];
  branches: MindmapLayoutBranch[];
} {
  const metrics = getMindmapLayoutMetrics(layout);
  if (!viewport) {
    return {
      nodes: layout.nodes,
      branches: layout.branches,
    };
  }

  // Collect nodes that are visible in the viewport
  const visibleNodeIds = new Set(
    layout.nodes
      .filter(
        (layoutNode) =>
          layoutNode.isVirtualRoot || isLayoutNodeVisible(layoutNode, viewport, metrics.nodeWidth),
      )
      .map((layoutNode) => layoutNode.nodeId),
  );

  // Collect branches
  const visibleBranches = layout.branches.filter((branch) => {
    if (branch.fromId === VIRTUAL_ROOT_ID) {
      // Virtual root to real root branches: keep if the target root is visible OR on viewport boundary
      // This ensures virtual root connections are shown when root nodes are visible
      return visibleNodeIds.has(branch.toId);
    }
    // Regular branches: keep if at least one endpoint is visible
    return visibleNodeIds.has(branch.fromId) || visibleNodeIds.has(branch.toId);
  });

  // Ensure virtual root is included if any virtual root branch is visible
  if (visibleBranches.some((branch) => branch.fromId === VIRTUAL_ROOT_ID)) {
    visibleNodeIds.add(VIRTUAL_ROOT_ID);
  }

  return {
    nodes: layout.nodes.filter((layoutNode) => visibleNodeIds.has(layoutNode.nodeId)),
    branches: visibleBranches,
  };
}

export function DraftGraphWorkspace({
  duplicateOnly = false,
  initialSnapshot,
  initialUndoHistory = [],
  initialCheckpoints = [],
  onPersistDraftSession,
  onExitSearchNavigation,
  searchNavigationActive = false,
  searchNavigationIndex = 0,
  searchQuery = '',
}: DraftGraphWorkspaceProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [undoHistory, setUndoHistory] = useState<PersistedDraftSession['undoHistory']>(() => [...initialUndoHistory]);
  const [checkpoints, setCheckpoints] = useState<PersistedDraftSession['checkpoints']>(() => [...initialCheckpoints]);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [dialogCardPosition, setDialogCardPosition] = useState<DialogCardPosition | null>(null);
  const [hoverState, setHoverState] = useState<HoverState>(null);
  const [isDuplicateHoverExpanded, setIsDuplicateHoverExpanded] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragPreviewState, setDragPreviewState] = useState<DragPreviewState>(null);
  const [dragMoveError, setDragMoveError] = useState<string | null>(null);
  const treeContainerRef = useRef<HTMLElement | null>(null);
  const dialogBackdropRef = useRef<HTMLDivElement | null>(null);
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const viewportHintPopoverRef = useRef<HTMLDivElement | null>(null);
  const nodeButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousTreeContainerWidthRef = useRef<number | null>(null);
  const [treeContainerWidth, setTreeContainerWidth] = useState<number | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport | null>(null);
  const [isViewportHintDismissed, setIsViewportHintDismissed] = useState(false);
  const [viewportHintPopoverPosition, setViewportHintPopoverPosition] =
    useState<ViewportHintPopoverPosition | null>(null);

  const hasRootNodes = snapshot.rootIds.length > 0;
  const nodeCount = useMemo(() => Object.keys(snapshot.nodesById).length, [snapshot.nodesById]);
  const isLargeGraph = nodeCount >= LARGE_GRAPH_NODE_THRESHOLD;
  const isDialogOpen = dialogState !== null;
  const normalizedSearchQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const duplicateNodeIds = useMemo(() => deriveDuplicateNodeIds(snapshot), [snapshot]);
  const searchResults = useMemo(
    () => deriveSearchResults(snapshot, { searchQuery, duplicateOnly }),
    [duplicateOnly, searchQuery, snapshot],
  );
  const duplicateFocusGroups = useMemo(
    () => deriveDuplicateFocusGroups(snapshot, { searchQuery, duplicateOnly }),
    [duplicateOnly, searchQuery, snapshot],
  );
  const searchResultIds = useMemo(
    () => new Set(searchResults.map((result) => result.nodeId)),
    [searchResults],
  );
  const focusedSearchNodeId = useMemo(() => {
    if (duplicateOnly || normalizedSearchQuery === '') {
      return null;
    }

    if (!searchNavigationActive) {
      return null;
    }

    // Keep focus stable on the first result if the active result index goes out of bounds while matches shrink.
    return searchResults[searchNavigationIndex]?.nodeId ?? searchResults[0]?.nodeId ?? null;
  }, [duplicateOnly, normalizedSearchQuery, searchNavigationActive, searchNavigationIndex, searchResults]);
  const snapshotMaxDepth = useMemo(
    () => deriveSnapshotMaxDepth(snapshot),
    [snapshot.nodesById, snapshot.rootIds],
  );
  const mindmapLayout = useMemo(
    () => buildMindmapLayout(snapshot, treeContainerWidth),
    [snapshot.nodesById, snapshot.rootIds, treeContainerWidth],
  );
  const mindmapMetrics = useMemo(() => getMindmapLayoutMetrics(mindmapLayout), [mindmapLayout]);
  const visibleMindmap = useMemo(
    () => (isLargeGraph ? deriveVisibleMindmapElements(mindmapLayout, canvasViewport) : {
      nodes: mindmapLayout.nodes,
      branches: mindmapLayout.branches,
    }),
    [canvasViewport, isLargeGraph, mindmapLayout],
  );
  const layoutByNodeId = useMemo(
    () =>
      Object.fromEntries(mindmapLayout.nodes.map((node) => [node.nodeId, node])),
    [mindmapLayout.nodes],
  );
  const shouldShowViewportSizeHint =
    !duplicateOnly &&
    hasRootNodes &&
    snapshotMaxDepth >= 4 &&
    treeContainerWidth !== null &&
    treeContainerWidth > 0 &&
    treeContainerWidth < mindmapLayout.width;
  const shouldRenderViewportHintPopover =
    shouldShowViewportSizeHint && !isViewportHintDismissed;

  useLayoutEffect(() => {
    const element = treeContainerRef.current;
    if (!element) {
      return;
    }

    let frameId = 0;

    const updateTreeContainerWidth = (): void => {
      frameId = 0;
      const nextWidth = element.clientWidth;
      setTreeContainerWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    const scheduleTreeContainerWidthUpdate = (): void => {
      if (frameId !== 0) {
        return;
      }

      frameId = globalThis.requestAnimationFrame(updateTreeContainerWidth);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleTreeContainerWidthUpdate();
          })
        : null;

    resizeObserver?.observe(element);
    window.addEventListener('resize', scheduleTreeContainerWidthUpdate);
    updateTreeContainerWidth();

    return () => {
      if (frameId !== 0) {
        globalThis.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', scheduleTreeContainerWidthUpdate);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const previousWidth = previousTreeContainerWidthRef.current;
    previousTreeContainerWidthRef.current = treeContainerWidth;

    if (
      !isViewportHintDismissed ||
      !shouldShowViewportSizeHint ||
      treeContainerWidth === null ||
      previousWidth === null
    ) {
      return;
    }

    if (treeContainerWidth < previousWidth) {
      setIsViewportHintDismissed(false);
    }
  }, [isViewportHintDismissed, shouldShowViewportSizeHint, treeContainerWidth]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!shouldRenderViewportHintPopover) {
      setViewportHintPopoverPosition(null);
      return;
    }

    let frameId = 0;

    const updateViewportHintPopoverPosition = (): void => {
      frameId = 0;

      const treeContainer = treeContainerRef.current;
      const viewportHintPopover = viewportHintPopoverRef.current;
      if (!treeContainer || !viewportHintPopover) {
        setViewportHintPopoverPosition(null);
        return;
      }

      const margin = resolveViewportOverlayMargin(window.innerWidth);
      const overlayWidth =
        viewportHintPopover.offsetWidth || Math.min(VIEWPORT_HINT_POPOVER_MAX_WIDTH, window.innerWidth - margin * 2);
      const overlayHeight = viewportHintPopover.offsetHeight;
      const nextPosition = resolveViewportHintPopoverPosition({
        treeRect: treeContainer.getBoundingClientRect(),
        overlayWidth,
        overlayHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });

      setViewportHintPopoverPosition((currentPosition) => {
        if (
          currentPosition?.left === nextPosition?.left &&
          currentPosition?.top === nextPosition?.top
        ) {
          return currentPosition;
        }

        return nextPosition;
      });
    };

    const scheduleViewportHintPopoverPositionUpdate = (): void => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateViewportHintPopoverPosition);
    };

    scheduleViewportHintPopoverPositionUpdate();
    window.addEventListener('scroll', scheduleViewportHintPopoverPositionUpdate, { passive: true });
    window.addEventListener('resize', scheduleViewportHintPopoverPositionUpdate);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleViewportHintPopoverPositionUpdate();
          })
        : null;

    if (resizeObserver && treeContainerRef.current) {
      resizeObserver.observe(treeContainerRef.current);
    }
    if (resizeObserver && viewportHintPopoverRef.current) {
      resizeObserver.observe(viewportHintPopoverRef.current);
    }

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', scheduleViewportHintPopoverPositionUpdate);
      window.removeEventListener('resize', scheduleViewportHintPopoverPositionUpdate);
      resizeObserver?.disconnect();
    };
  }, [shouldRenderViewportHintPopover]);

  useEffect(() => {
    if (!duplicateOnly) {
      return;
    }

    setHoverState(null);
  }, [duplicateOnly]);

  useEffect(() => {
    setIsDuplicateHoverExpanded(false);
  }, [hoverState?.nodeId]);

  useEffect(() => {
    if (!focusedSearchNodeId || duplicateOnly) {
      return;
    }

    const focusedNodeButton = nodeButtonRefs.current.get(focusedSearchNodeId);
    if (focusedNodeButton && typeof focusedNodeButton.scrollIntoView === 'function') {
      focusedNodeButton.scrollIntoView({
        block: 'center',
        inline: 'center',
      });
      return;
    }

    const layoutNode = layoutByNodeId[focusedSearchNodeId];
    const treeContainer = treeContainerRef.current;
    if (!layoutNode || !treeContainer) {
      return;
    }

    const maxScrollLeft = Math.max(0, treeContainer.scrollWidth - treeContainer.clientWidth);
    const maxScrollTop = Math.max(0, treeContainer.scrollHeight - treeContainer.clientHeight);
    const nextScrollLeft = Math.max(
      0,
      Math.min(
        layoutNode.x - (treeContainer.clientWidth - mindmapMetrics.nodeWidth) / 2,
        maxScrollLeft,
      ),
    );
    const nextScrollTop = Math.max(
      0,
      Math.min(
        layoutNode.y - (treeContainer.clientHeight - layoutNode.height) / 2,
        maxScrollTop,
      ),
    );

    treeContainer.scrollLeft = nextScrollLeft;
    treeContainer.scrollTop = nextScrollTop;
  }, [
    duplicateOnly,
    focusedSearchNodeId,
    layoutByNodeId,
    mindmapMetrics.nodeWidth,
    searchNavigationActive,
    searchNavigationIndex,
  ]);

  useEffect(() => {
    if (!isLargeGraph) {
      setCanvasViewport(null);
      return;
    }

    const element = treeContainerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    let frameId = 0;

    const updateViewport = (): void => {
      frameId = 0;
      setCanvasViewport({
        left: Math.max(0, element.scrollLeft - TREE_CONTENT_PADDING),
        top: Math.max(0, element.scrollTop - TREE_CONTENT_PADDING),
        right: Math.max(0, element.scrollLeft - TREE_CONTENT_PADDING) + element.clientWidth,
        bottom: Math.max(0, element.scrollTop - TREE_CONTENT_PADDING) + element.clientHeight,
      });
    };

    const scheduleViewportUpdate = (): void => {
      if (frameId !== 0) {
        return;
      }
      frameId = globalThis.requestAnimationFrame(updateViewport);
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleViewportUpdate();
    });

    resizeObserver.observe(element);
    element.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
    updateViewport();

    return () => {
      if (frameId !== 0) {
        globalThis.cancelAnimationFrame(frameId);
      }
      element.removeEventListener('scroll', scheduleViewportUpdate);
      resizeObserver.disconnect();
    };
  }, [isLargeGraph]);

  useLayoutEffect(() => {
    if (!isDialogOpen) {
      const previousFocus = previousFocusRef.current;
      if (
        previousFocus !== null &&
        previousFocus.isConnected &&
        !previousFocus.hasAttribute('disabled')
      ) {
        previousFocus.focus();
      }
      previousFocusRef.current = null;
      return;
    }

    focusBoundaryDialogElement(dialogBackdropRef.current, 'first');
  }, [isDialogOpen]);

  const persistWorkspaceSession = useCallback(async (
    nextSnapshot: DraftGraphSnapshot,
    nextUndoHistory: PersistedDraftSession['undoHistory'],
    nextCheckpoints: PersistedDraftSession['checkpoints'],
  ): Promise<void> => {
    setSnapshot(nextSnapshot);
    setUndoHistory(nextUndoHistory);
    setCheckpoints(nextCheckpoints);
    await onPersistDraftSession(buildPersistedDraftSession(nextSnapshot, nextUndoHistory, nextCheckpoints));
  }, [onPersistDraftSession]);

  const commitDraftMutation = useCallback(async (
    nextSnapshot: DraftGraphSnapshot,
    mutationType: DraftUndoMutationType,
    affectedNodeIds: string[],
  ): Promise<void> => {
    const nextUndoHistory = [
      ...undoHistory,
      createDraftUndoEntry({
        previousSnapshot: snapshot,
        nextSnapshot,
        mutationType,
        affectedNodeIds,
        timestamp: new Date().toISOString(),
      }),
    ];

    await persistWorkspaceSession(nextSnapshot, nextUndoHistory, checkpoints);
  }, [checkpoints, persistWorkspaceSession, snapshot, undoHistory]);

  const undoLatestDraftMutation = useCallback(async (): Promise<void> => {
    const undoResult = applyLatestDraftUndo({
      currentSnapshot: snapshot,
      undoHistory,
    });
    if (!undoResult.ok) {
      return;
    }

    setDragMoveError(null);
    await persistWorkspaceSession(undoResult.snapshot, undoResult.undoHistory, checkpoints);
  }, [checkpoints, persistWorkspaceSession, snapshot, undoHistory]);

  const setNodeButtonRef = useCallback((nodeId: string, element: HTMLButtonElement | null): void => {
    if (element) {
      nodeButtonRefs.current.set(nodeId, element);
      return;
    }

    nodeButtonRefs.current.delete(nodeId);
  }, []);

  const resolveDialogCardPositionFromElement = useCallback((element: HTMLElement | null, dialogKind: DialogKind): DialogCardPosition | null => {
    if (!element) {
      return null;
    }

    return resolveDialogPositionFromAnchorRect(element.getBoundingClientRect(), dialogKind);
  }, []);

  const resolveNodeDialogCardPosition = useCallback((nodeId: string, dialogKind: DialogKind): DialogCardPosition | null => {
    const anchorElement = nodeButtonRefs.current.get(nodeId);
    if (!anchorElement) {
      return null;
    }

    return resolveDialogCardPositionFromElement(anchorElement, dialogKind);
  }, [resolveDialogCardPositionFromElement]);

  useEffect(() => {
    if (!dialogState) {
      return;
    }

    const anchorNodeId = resolveDialogAnchorNodeId(dialogState);
    const updateDialogCardPosition = (): void => {
      setDialogCardPosition(resolveNodeDialogCardPosition(anchorNodeId, dialogState.kind));
    };

    const treeElement = treeContainerRef.current;

    updateDialogCardPosition();
    window.addEventListener('resize', updateDialogCardPosition);
    treeElement?.addEventListener('scroll', updateDialogCardPosition, { passive: true });

    return () => {
      window.removeEventListener('resize', updateDialogCardPosition);
      treeElement?.removeEventListener('scroll', updateDialogCardPosition);
    };
  }, [dialogState, resolveNodeDialogCardPosition, treeContainerWidth]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (isDialogOpen || event.defaultPrevented) {
        return;
      }

      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
        return;
      }

      if (shouldIgnoreGlobalUndoShortcut(getCurrentActiveElement())) {
        return;
      }

      event.preventDefault();
      void undoLatestDraftMutation();
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isDialogOpen, undoLatestDraftMutation]);

  const openEditDialog = useCallback((nodeId: string, anchorElement?: HTMLElement | null): void => {
    const node = snapshot.nodesById[nodeId];
    if (!node) {
      return;
    }

    setDragMoveError(null);
    previousFocusRef.current = getCurrentActiveElement();
    setDialogCardPosition(
      anchorElement
        ? resolveDialogCardPositionFromElement(anchorElement, 'edit')
        : resolveNodeDialogCardPosition(nodeId, 'edit'),
    );
    setDialogState({
      kind: 'edit',
      nodeId,
      title: node.title,
      url: node.url ?? '',
      error: null,
    });
  }, [resolveDialogCardPositionFromElement, resolveNodeDialogCardPosition, snapshot.nodesById]);

  const openCreateChildDialog = useCallback((parentId: string, anchorElement?: HTMLElement | null): void => {
    const parent = snapshot.nodesById[parentId];
    if (!parent || parent.nodeType !== 'folder') {
      return;
    }

    setDragMoveError(null);
    previousFocusRef.current = getCurrentActiveElement();
    setDialogCardPosition(
      anchorElement
        ? resolveDialogCardPositionFromElement(anchorElement, 'create-child')
        : resolveNodeDialogCardPosition(parentId, 'create-child'),
    );
    setDialogState({
      kind: 'create-child',
      parentId,
      nodeType: 'folder',
      title: '',
      url: '',
      error: null,
    });
  }, [resolveDialogCardPositionFromElement, resolveNodeDialogCardPosition, snapshot.nodesById]);

  const openCreateSiblingDialog = useCallback((referenceNodeId: string, anchorElement?: HTMLElement | null): void => {
    const referenceNode = snapshot.nodesById[referenceNodeId];
    if (!referenceNode) {
      return;
    }

    setDragMoveError(null);
    previousFocusRef.current = getCurrentActiveElement();
    setDialogCardPosition(
      anchorElement
        ? resolveDialogCardPositionFromElement(anchorElement, 'create-sibling')
        : resolveNodeDialogCardPosition(referenceNodeId, 'create-sibling'),
    );
    setDialogState({
      kind: 'create-sibling',
      referenceNodeId,
      parentId: referenceNode.parentId,
      nodeType: 'folder',
      title: '',
      url: '',
      error: null,
    });
  }, [resolveDialogCardPositionFromElement, resolveNodeDialogCardPosition, snapshot.nodesById]);

  const openDeleteConfirmDialog = useCallback((node: DraftGraphNode, anchorElement?: HTMLElement | null): void => {
    setDragMoveError(null);
    previousFocusRef.current = getCurrentActiveElement();
    setDialogCardPosition(
      anchorElement
        ? resolveDialogCardPositionFromElement(anchorElement, 'delete-confirm')
        : resolveNodeDialogCardPosition(node.internalId, 'delete-confirm'),
    );
    setDialogState({
      kind: 'delete-confirm',
      nodeId: node.internalId,
      title: node.title,
      childCount: node.childIds.length,
      message: buildDeleteConfirmationMessage(node),
    });
  }, [resolveDialogCardPositionFromElement, resolveNodeDialogCardPosition]);

  const commitDelete = useCallback(async (nodeId: string): Promise<void> => {
    const result = deleteDraftNodeSubtree(snapshot, nodeId);
    if (!result.ok) {
      return;
    }
    await commitDraftMutation(result.snapshot, 'delete-subtree', result.deletedNodeIds);
  }, [commitDraftMutation, snapshot]);

  const handleDelete = useCallback(async (nodeId: string, anchorElement?: HTMLElement | null): Promise<void> => {
    const targetNode = snapshot.nodesById[nodeId];
    if (!targetNode) {
      return;
    }

    if (targetNode.nodeType === 'folder' && targetNode.childIds.length > 1) {
      openDeleteConfirmDialog(targetNode, anchorElement);
      return;
    }

    await commitDelete(nodeId);
  }, [commitDelete, openDeleteConfirmDialog, snapshot.nodesById]);

  const closeDialog = useCallback((): void => {
    setDialogCardPosition(null);
    setDialogState(null);
  }, []);

  const handleDialogKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>): void => {
    // Keep modal keyboard navigation closed inside the dialog. When focus is
    // already at one boundary, wrap to the opposite edge instead of letting
    // Tab escape back into the draft canvas.
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialogElement = dialogBackdropRef.current;
    const focusableElements = getFocusableDialogElements(dialogElement);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const isInsideDialog = activeElement !== null && dialogElement?.contains(activeElement);

    if (event.shiftKey) {
      if (!isInsideDialog || activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (!isInsideDialog || activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, [closeDialog]);

  const submitDeleteConfirmDialog = useCallback(async (): Promise<void> => {
    if (dialogState?.kind !== 'delete-confirm') {
      return;
    }

    const targetNodeId = dialogState.nodeId;
    closeDialog();
    await commitDelete(targetNodeId);
  }, [closeDialog, commitDelete, dialogState]);

  const reorderNodeWithinCurrentLevel = useCallback(async (
    nodeId: string,
    direction: -1 | 1,
  ): Promise<void> => {
    const reorderTarget = resolveKeyboardReorderTarget(snapshot, nodeId, direction);
    if (!reorderTarget) {
      return;
    }

    const moveResult = moveDraftNode(snapshot, {
      nodeId,
      targetParentId: reorderTarget.targetParentId,
      targetIndex: reorderTarget.targetIndex,
    });
    if (!moveResult.ok) {
      setDragMoveError(moveResult.error);
      return;
    }

    setDragMoveError(null);
    await commitDraftMutation(moveResult.snapshot, 'move-node', [nodeId]);
  }, [commitDraftMutation, snapshot]);

  const promoteNodeOneLevel = useCallback(async (nodeId: string): Promise<void> => {
    const promoteTarget = resolveKeyboardPromoteTarget(snapshot, nodeId);
    if (!promoteTarget) {
      return;
    }

    const moveResult = moveDraftNode(snapshot, {
      nodeId,
      targetParentId: promoteTarget.targetParentId,
      targetIndex: promoteTarget.targetIndex,
    });
    if (!moveResult.ok) {
      setDragMoveError(moveResult.error);
      return;
    }

    setDragMoveError(null);
    await commitDraftMutation(moveResult.snapshot, 'move-node', [nodeId]);
  }, [commitDraftMutation, snapshot]);

  const handleNodeKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, nodeId: string): void => {
    if (isDialogOpen) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter') {
      if (event.shiftKey) {
        event.preventDefault();
        openCreateSiblingDialog(nodeId, event.currentTarget);
        return;
      }

      const targetNode = snapshot.nodesById[nodeId];
      if (targetNode?.nodeType !== 'folder') {
        return;
      }
      event.preventDefault();
      openCreateChildDialog(nodeId, event.currentTarget);
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      void handleDelete(nodeId, event.currentTarget);
      return;
    }

    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && snapshot.selectedNodeId === nodeId) {
      event.preventDefault();
      void reorderNodeWithinCurrentLevel(nodeId, event.key === 'ArrowUp' ? -1 : 1);
      return;
    }

    if (event.key === 'ArrowLeft' && snapshot.selectedNodeId === nodeId) {
      event.preventDefault();
      void promoteNodeOneLevel(nodeId);
    }
  }, [
    handleDelete,
    isDialogOpen,
    openCreateChildDialog,
    openCreateSiblingDialog,
    promoteNodeOneLevel,
    reorderNodeWithinCurrentLevel,
    snapshot.nodesById,
    snapshot.selectedNodeId,
  ]);

  const handleNodeMouseEnter = useCallback((_event: ReactMouseEvent<HTMLButtonElement>, nodeId: string): void => {
    setHoverState({ nodeId });
  }, []);

  const handleNodeMouseLeave = useCallback((event: ReactMouseEvent<HTMLButtonElement>): void => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && hoverCardRef.current?.contains(nextTarget)) {
      return;
    }

    setHoverState(null);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string): void => {
    setDragMoveError(null);
    // Node clicks should always exit search navigation, even if the input blur path does not run first.
    onExitSearchNavigation?.();
    setSnapshot((current) => selectDraftNode(current, nodeId));
    setHoverState(null);
  }, [onExitSearchNavigation]);

  const handleNodeDragStart = useCallback((event: ReactDragEvent<HTMLElement>): void => {
    if (isDialogOpen) {
      event.preventDefault();
      return;
    }

    const nodeId = event.currentTarget.dataset.nodeId;
    if (!nodeId) {
      event.preventDefault();
      return;
    }

    setDragMoveError(null);
    setDraggedNodeId(nodeId);
    setDragPreviewState(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', nodeId);
    event.dataTransfer.setData('application/x-draft-node-id', nodeId);
  }, [isDialogOpen]);

  const handleNodeDragEnd = useCallback((): void => {
    setDraggedNodeId(null);
    setDragPreviewState(null);
  }, []);

  const handleNodeDragOver = useCallback((event: ReactDragEvent<HTMLElement>): void => {
    const targetNodeId = event.currentTarget.dataset.nodeId;
    if (!targetNodeId) {
      return;
    }

    const sourceNodeId = draggedNodeId ?? event.dataTransfer.getData('application/x-draft-node-id');
    if (!sourceNodeId) {
      return;
    }

    const preferIntoFolder = event.currentTarget.classList.contains('draft-node-drop-zone');
    const nextPreviewState = resolveDragPreviewState(
      snapshot,
      layoutByNodeId,
      sourceNodeId,
      targetNodeId,
      event.clientY,
      treeContainerRef.current,
      preferIntoFolder,
    );
    if (!nextPreviewState) {
      return;
    }

    const movePreview = moveDraftNode(snapshot, {
      nodeId: sourceNodeId,
      targetParentId: nextPreviewState.targetParentId,
      targetIndex: nextPreviewState.targetIndex,
    });
    if (!movePreview.ok) {
      setDragPreviewState((current) => (current?.highlightNodeId === targetNodeId ? null : current));
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragPreviewState(nextPreviewState);
  }, [draggedNodeId, layoutByNodeId, snapshot, snapshot.nodesById]);

  const handleNodeDragLeave = useCallback((event: ReactDragEvent<HTMLElement>): void => {
    const currentTargetNodeId = event.currentTarget.dataset.nodeId;
    if (!currentTargetNodeId) {
      return;
    }

    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDragPreviewState((current) => (current?.highlightNodeId === currentTargetNodeId ? null : current));
  }, []);

  const handleNodeDrop = useCallback(async (event: ReactDragEvent<HTMLElement>): Promise<void> => {
    event.preventDefault();

    const targetNodeId = event.currentTarget.dataset.nodeId;
    if (!targetNodeId) {
      setDraggedNodeId(null);
      return;
    }

    const sourceNodeId =
      draggedNodeId ??
      event.dataTransfer.getData('application/x-draft-node-id') ??
      event.dataTransfer.getData('text/plain');
    setDraggedNodeId(null);
    setDragPreviewState(null);

    if (!sourceNodeId) {
      return;
    }

    const preferIntoFolder = event.currentTarget.classList.contains('draft-node-drop-zone');
    const nextPreviewState =
      dragPreviewState?.highlightNodeId === targetNodeId
        ? dragPreviewState
        : resolveDragPreviewState(
            snapshot,
            layoutByNodeId,
            sourceNodeId,
            targetNodeId,
            event.clientY,
            treeContainerRef.current,
            preferIntoFolder,
          );
    if (!nextPreviewState) {
      return;
    }

    const moveResult = moveDraftNode(snapshot, {
      nodeId: sourceNodeId,
      targetParentId: nextPreviewState.targetParentId,
      targetIndex: nextPreviewState.targetIndex,
    });

    if (!moveResult.ok) {
      setDragMoveError(moveResult.error);
      return;
    }

    setDragMoveError(null);
    await commitDraftMutation(moveResult.snapshot, 'move-node', [sourceNodeId]);
  }, [commitDraftMutation, dragPreviewState, draggedNodeId, layoutByNodeId, snapshot]);

  const submitEditDialog = useCallback(async (): Promise<void> => {
    if (dialogState?.kind !== 'edit') {
      return;
    }

    const result = editDraftNode(snapshot, {
      nodeId: dialogState.nodeId,
      title: dialogState.title,
      url: dialogState.url,
    });

    if (!result.ok) {
      setDialogState({
        ...dialogState,
        error: result.error,
      });
      return;
    }

    await commitDraftMutation(
      result.snapshot,
      resolveEditUndoMutationType(snapshot, result.snapshot, dialogState.nodeId),
      [dialogState.nodeId],
    );
    setDialogState(null);
  }, [commitDraftMutation, dialogState, snapshot]);

  const submitCreateChildDialog = useCallback(async (): Promise<void> => {
    if (dialogState?.kind !== 'create-child') {
      return;
    }

    const result = createDraftChildNode(snapshot, {
      parentId: dialogState.parentId,
      nodeType: dialogState.nodeType,
      title: dialogState.title,
      url: dialogState.url,
    });

    if (!result.ok) {
      setDialogState({
        ...dialogState,
        error: result.error,
      });
      return;
    }

    await commitDraftMutation(result.snapshot, 'create-node', [result.createdNodeId]);
    setDialogState(null);
  }, [commitDraftMutation, dialogState, snapshot]);

  const submitCreateSiblingDialog = useCallback(async (): Promise<void> => {
    if (dialogState?.kind !== 'create-sibling') {
      return;
    }

    const result = createDraftSiblingNode(snapshot, {
      referenceNodeId: dialogState.referenceNodeId,
      nodeType: dialogState.nodeType,
      title: dialogState.title,
      url: dialogState.url,
    });

    if (!result.ok) {
      setDialogState({
        ...dialogState,
        error: result.error,
      });
      return;
    }

    await commitDraftMutation(result.snapshot, 'create-node', [result.createdNodeId]);
    setDialogState(null);
  }, [commitDraftMutation, dialogState, snapshot]);

  const handleNodeButtonClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>): void => {
    const nodeId = event.currentTarget.dataset.nodeId;
    if (!nodeId) {
      return;
    }
    handleNodeSelect(nodeId);
  }, [handleNodeSelect]);

  const handleNodeButtonDoubleClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>): void => {
    const nodeId = event.currentTarget.dataset.nodeId;
    if (!nodeId) {
      return;
    }
    openEditDialog(nodeId, event.currentTarget);
  }, [openEditDialog]);

  const handleNodeButtonKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>): void => {
    const nodeId = event.currentTarget.dataset.nodeId;
    if (!nodeId) {
      return;
    }
    handleNodeKeyDown(event, nodeId);
  }, [handleNodeKeyDown]);

  const handleNodeButtonMouseEnter = useCallback((event: ReactMouseEvent<HTMLButtonElement>): void => {
    const nodeId = event.currentTarget.dataset.nodeId;
    if (!nodeId) {
      return;
    }
    handleNodeMouseEnter(event, nodeId);
  }, [handleNodeMouseEnter]);

  const handleNodeButtonDragStart = useCallback((event: ReactDragEvent<HTMLButtonElement>): void => {
    handleNodeDragStart(event);
  }, [handleNodeDragStart]);

  const handleNodeButtonDragEnd = useCallback((): void => {
    handleNodeDragEnd();
  }, [handleNodeDragEnd]);

  const handleNodeButtonDragOver = useCallback((event: ReactDragEvent<HTMLElement>): void => {
    void handleNodeDragOver(event);
  }, [handleNodeDragOver]);

  const handleNodeButtonDragLeave = useCallback((event: ReactDragEvent<HTMLElement>): void => {
    handleNodeDragLeave(event);
  }, [handleNodeDragLeave]);

  const handleNodeButtonDrop = useCallback((event: ReactDragEvent<HTMLElement>): void => {
    void handleNodeDrop(event);
  }, [handleNodeDrop]);

  const branchElements = useMemo(() => visibleMindmap.branches.map((branch) => {
    const fromNode = layoutByNodeId[branch.fromId];
    const toNode = layoutByNodeId[branch.toId];

    if (!fromNode || !toNode) {
      return null;
    }

    const startX = fromNode.x + mindmapMetrics.nodeWidth;
    const startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x;
    const endY = toNode.y + toNode.height / 2;
    const curveOffset = mindmapMetrics.horizontalGap * 0.45;
    const path = `M ${startX} ${startY} C ${startX + curveOffset} ${startY}, ${endX - curveOffset} ${endY}, ${endX} ${endY}`;
    const colorIndex = ROOT_BRANCH_COLORS.indexOf(branch.branchColor as typeof ROOT_BRANCH_COLORS[number]);
    const gradId = branch.depth <= 0 ? `branch-grad-root-${colorIndex}` : `branch-grad-deep-${colorIndex}`;

    return (
      <g key={`${branch.fromId}-${branch.toId}`}>
        <path
          d={path}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeWidth={branch.depth === 0 ? 4 : branch.depth === 1 ? 3 : 2}
        />
        {!isLargeGraph ? (
          <path
            d={path}
            fill="none"
            stroke={branch.branchColor}
            strokeLinecap="round"
            strokeOpacity={branch.depth === 0 ? 0.12 : 0.06}
            strokeWidth={branch.depth === 0 ? 10 : branch.depth === 1 ? 8 : 5}
          />
        ) : null}
      </g>
    );
  }), [isLargeGraph, layoutByNodeId, mindmapMetrics.horizontalGap, mindmapMetrics.nodeWidth, visibleMindmap.branches]);

  const nodeElements = useMemo(() => visibleMindmap.nodes.map((layoutNode) => {
    if (layoutNode.isVirtualRoot) {
      const virtualRootShellTop = layoutNode.shellTop ?? layoutNode.y;
      const virtualRootShellHeight = layoutNode.shellHeight ?? layoutNode.height;
      const virtualRootStyle = {
        '--branch-color': layoutNode.branchColor,
        height: `${virtualRootShellHeight}px`,
        transform: `translate(${layoutNode.x}px, ${virtualRootShellTop}px)`,
      } as CSSProperties;
      const virtualRootButtonStyle = {
        top: `${layoutNode.y - virtualRootShellTop}px`,
      } as CSSProperties;

      return (
        <div
          className="xmind-node-shell is-virtual-root"
          key={layoutNode.nodeId}
          style={virtualRootStyle}
        >
          <div
            aria-label={`虚拟根节点：${VIRTUAL_ROOT_TITLE}`}
            className={`draft-node-button is-virtual-root${dragPreviewState?.highlightNodeId === VIRTUAL_ROOT_ID ? ' is-drop-target' : ''}`}
            style={virtualRootButtonStyle}
          >
            <span className="draft-node-icon" aria-hidden="true">🌳</span>
            <span className="draft-node-eyebrow">虚拟根节点</span>
            <span className="draft-node-title">{VIRTUAL_ROOT_TITLE}</span>
          </div>
          <div
            aria-hidden="true"
            className="draft-virtual-root-drop-zone"
            data-node-id={VIRTUAL_ROOT_ID}
            onDragLeave={handleNodeButtonDragLeave}
            onDragOver={handleNodeButtonDragOver}
            onDrop={handleNodeButtonDrop}
          />
        </div>
      );
    }

    const node = snapshot.nodesById[layoutNode.nodeId] as DraftGraphNode;
    const depthClassName =
      layoutNode.depth === 0
        ? 'is-root'
        : layoutNode.depth === 1
          ? 'is-primary-child'
          : 'is-deep-child';
    const directChildBottom = node.childIds
      .map((childId) => layoutByNodeId[childId])
      .filter((childLayout): childLayout is MindmapLayoutNode => childLayout !== undefined)
      .reduce(
        (currentBottom, childLayout) => Math.max(currentBottom, childLayout.y + childLayout.height),
        layoutNode.y + layoutNode.height,
      );
    const nodeStyle = {
      '--branch-color': layoutNode.branchColor,
      height: `${Math.max(layoutNode.height, directChildBottom - layoutNode.y)}px`,
      transform: `translate(${layoutNode.x}px, ${layoutNode.y}px)`,
    } as CSSProperties;

    return (
      <div className={`xmind-node-shell ${depthClassName}`} key={layoutNode.nodeId} style={nodeStyle}>
        <button
          aria-label={buildNodeAriaLabel(node)}
          aria-pressed={snapshot.selectedNodeId === node.internalId}
          className={`draft-node-button is-${node.nodeType}${snapshot.selectedNodeId === node.internalId ? ' is-selected' : ''}${
            draggedNodeId === node.internalId ? ' is-dragging' : ''
          }${
            dragPreviewState?.highlightNodeId === node.internalId ? ' is-drop-target' : ''
          }${
            !duplicateOnly && normalizedSearchQuery !== '' && searchResultIds.has(node.internalId) ? ' is-search-match' : ''
          }${
            !duplicateOnly && focusedSearchNodeId === node.internalId ? ' is-search-focus' : ''
          }`}
          data-node-id={node.internalId}
          disabled={isDialogOpen}
          draggable={!isDialogOpen}
          ref={(element) => {
            setNodeButtonRef(node.internalId, element);
          }}
          onClick={handleNodeButtonClick}
          onDragEnd={handleNodeButtonDragEnd}
          onDragLeave={handleNodeButtonDragLeave}
          onDragOver={handleNodeButtonDragOver}
          onDragStart={handleNodeButtonDragStart}
          onDrop={handleNodeButtonDrop}
          onDoubleClick={handleNodeButtonDoubleClick}
          onKeyDown={handleNodeButtonKeyDown}
          onMouseEnter={handleNodeButtonMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
          type="button"
        >
          <span className="draft-node-icon" aria-hidden="true">
            {node.nodeType === 'folder' ? '📁' : '🔖'}
          </span>
          <span className="draft-node-title">{node.title || '（无标题）'}</span>
          {node.nodeType === 'bookmark' && node.url ? (
            <span className="draft-node-url-preview" title={node.url}>
              {node.url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 30)}
              {node.url.replace(/^https?:\/\//, '').replace(/\/$/, '').length > 30 ? '…' : ''}
            </span>
          ) : null}
          {node.childIds.length > 0 ? (
            <span className="draft-node-child-count">{node.childIds.length}</span>
          ) : null}
        </button>
        {node.nodeType === 'folder' ? (
          <div
            aria-hidden="true"
            className={`draft-node-drop-zone${dragPreviewState?.highlightNodeId === node.internalId ? ' is-active' : ''}`}
            data-node-id={node.internalId}
            onDragLeave={handleNodeButtonDragLeave}
            onDragOver={handleNodeButtonDragOver}
            onDrop={handleNodeButtonDrop}
          />
        ) : null}
      </div>
    );
  }), [
    duplicateOnly,
    handleNodeButtonClick,
    handleNodeButtonDragEnd,
    handleNodeButtonDragLeave,
    handleNodeButtonDragOver,
    handleNodeButtonDragStart,
    handleNodeButtonDrop,
    handleNodeButtonDoubleClick,
    handleNodeButtonKeyDown,
    handleNodeButtonMouseEnter,
    handleNodeMouseLeave,
    dragPreviewState,
    draggedNodeId,
    focusedSearchNodeId,
    isDialogOpen,
    normalizedSearchQuery,
    searchResultIds,
    snapshot.nodesById,
    snapshot.selectedNodeId,
    setNodeButtonRef,
    visibleMindmap.nodes,
  ]);

  const hoverCardElement = useMemo(() => {
    if (!hoverState || duplicateOnly) {
      return null;
    }

    const hoveredNode = snapshot.nodesById[hoverState.nodeId];
    if (!hoveredNode) {
      return null;
    }
    const layout = layoutByNodeId[hoverState.nodeId];
    if (!layout) {
      return null;
    }

    const hoverCardPosition = getHoverCardPosition(layout, mindmapLayout);
    const duplicateHoverDetails = deriveDuplicateHoverDetails(snapshot, hoverState.nodeId);
    const duplicatePaths = duplicateHoverDetails
      ? (isDuplicateHoverExpanded ? duplicateHoverDetails.allPaths : duplicateHoverDetails.initialVisiblePaths)
      : [];

    return (
      <div
        className="draft-hover-card"
        onMouseLeave={(event) => {
          const nextTarget = event.relatedTarget;
          const hoveredNodeButton = nodeButtonRefs.current.get(hoverState.nodeId);
          if (nextTarget instanceof Node && hoveredNodeButton?.contains(nextTarget)) {
            return;
          }

          setHoverState(null);
        }}
        ref={hoverCardRef}
        style={{ left: hoverCardPosition.left, top: hoverCardPosition.top }}
      >
        <div className="draft-hover-card-header">
          <span className="draft-hover-card-icon" aria-hidden="true">
            {hoveredNode.nodeType === 'folder' ? '📁' : '🔖'}
          </span>
          <strong className="draft-hover-card-title">{hoveredNode.title || '（无标题）'}</strong>
        </div>
        <div className="draft-hover-card-type">
          {hoveredNode.nodeType === 'folder' ? '目录节点' : '书签节点'}
        </div>
        <div className="draft-hover-card-path">
          {draftGraphWorkspaceCopy.pathPrefix}：{hoveredNode.pathTokens.join(' / ')}
        </div>
        {hoveredNode.nodeType === 'bookmark' && hoveredNode.url ? (
          <div className="draft-hover-card-url" title={hoveredNode.url}>
            {hoveredNode.url}
          </div>
        ) : null}
        {duplicateHoverDetails ? (
          <div className="draft-hover-duplicates">
            <div className="draft-hover-duplicates-summary">
              {formatDuplicateHoverSummary(duplicateHoverDetails.duplicateCount)}
            </div>
            <div className="draft-hover-duplicates-list">
              {duplicatePaths.map((pathLabel) => (
                <div className="draft-hover-duplicates-path" key={pathLabel}>
                  {pathLabel}
                </div>
              ))}
            </div>
            {duplicateHoverDetails.hasMore && !isDuplicateHoverExpanded ? (
              <button
                className="draft-hover-expand-button"
                onClick={() => {
                  setIsDuplicateHoverExpanded(true);
                }}
                type="button"
              >
                {draftGraphWorkspaceCopy.duplicateExpandLabel}
              </button>
            ) : null}
          </div>
        ) : null}
        {hoveredNode.childIds.length > 0 ? (
          <div className="draft-hover-card-children">
            子节点：{hoveredNode.childIds.length} 个
          </div>
        ) : null}
      </div>
    );
  }, [duplicateOnly, hoverState, isDuplicateHoverExpanded, layoutByNodeId, mindmapLayout, snapshot]);

  const dialogCardStyle = useMemo(() => {
    if (!dialogCardPosition) {
      return undefined;
    }

    return {
      left: `${dialogCardPosition.left}px`,
      top: `${dialogCardPosition.top}px`,
    } satisfies CSSProperties;
  }, [dialogCardPosition]);
  const viewportHintPopoverStyle = useMemo(() => {
    if (!viewportHintPopoverPosition) {
      return {
        visibility: 'hidden',
      } as const;
    }

    return {
      left: `${viewportHintPopoverPosition.left}px`,
      top: `${viewportHintPopoverPosition.top}px`,
    } satisfies CSSProperties;
  }, [viewportHintPopoverPosition]);
  const canvasStyle = useMemo(() => ({
    '--mindmap-drop-zone-width': `${mindmapMetrics.dropZoneWidth}px`,
    '--mindmap-node-width': `${mindmapMetrics.nodeWidth}px`,
    '--mindmap-shell-width': `${mindmapMetrics.shellWidth}px`,
    height: mindmapLayout.height,
    width: mindmapLayout.width,
  }) as CSSProperties, [
    mindmapLayout.height,
    mindmapLayout.width,
    mindmapMetrics.dropZoneWidth,
    mindmapMetrics.nodeWidth,
    mindmapMetrics.shellWidth,
  ]);
  const dialogPortalTarget = typeof document !== 'undefined' ? document.body : null;
  const renderDialogOverlay = useCallback((overlay: ReactNode): ReactNode => {
    return dialogPortalTarget ? createPortal(overlay, dialogPortalTarget) : overlay;
  }, [dialogPortalTarget]);
  const viewportHintPopover = shouldRenderViewportHintPopover ? (
    <div
      className="draft-layout-popover"
      ref={viewportHintPopoverRef}
      role="note"
      style={viewportHintPopoverStyle}
    >
      <div className="draft-layout-popover-header">
        <strong>{draftGraphWorkspaceCopy.deepHierarchyViewportHintTitle}</strong>
        <button
          aria-label={draftGraphWorkspaceCopy.dismissViewportHintLabel}
          className="draft-layout-popover-close"
          onClick={() => {
            setIsViewportHintDismissed(true);
          }}
          type="button"
        >
          ×
        </button>
      </div>
      <p>{draftGraphWorkspaceCopy.deepHierarchyViewportHintDetail}</p>
    </div>
  ) : null;

  return (
    <div className={`draft-graph-workspace${isLargeGraph ? ' is-large-graph' : ''}`}>
      <section aria-label={draftGraphWorkspaceCopy.treeLabel} className="draft-graph-tree" ref={treeContainerRef}>
        {dragMoveError ? (
          <p className="draft-form-error">
            {draftGraphWorkspaceCopy.dragMoveErrorPrefix}：{dragMoveError}
          </p>
        ) : null}
        {duplicateOnly ? (
          <div className="duplicate-focus-view">
            <div className="duplicate-focus-header">
              <strong>{draftGraphWorkspaceCopy.duplicateOnlyHeading}</strong>
              <p>{draftGraphWorkspaceCopy.duplicateOnlySummary}</p>
            </div>
            {duplicateFocusGroups.length > 0 ? (
              <div className="duplicate-focus-list">
                {duplicateFocusGroups.map((group) => (
                  <article className="duplicate-focus-card" key={group.url}>
                    <div className="duplicate-focus-card-header">
                      <strong>{draftGraphWorkspaceCopy.duplicateGroupTitle}</strong>
                      <span className="duplicate-focus-badge">{formatDuplicateBadge(group.duplicateCount)}</span>
                    </div>
                    <div className="duplicate-focus-url" title={group.url}>{group.url}</div>
                    <div className="duplicate-focus-group-list">
                      {group.entries.map((entry) => (
                        <section className="duplicate-focus-group-item" key={entry.nodeId}>
                          <strong className="duplicate-focus-item-title">{entry.title || '（无标题）'}</strong>
                          <div className="duplicate-focus-path-label">{draftGraphWorkspaceCopy.duplicatePathLabel}</div>
                          <div className="duplicate-focus-path">{entry.pathLabel}</div>
                        </section>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="draft-search-empty-state" role="status">
                <strong>
                  {duplicateNodeIds.length === 0 && normalizedSearchQuery === ''
                    ? draftGraphWorkspaceCopy.duplicateEmptyTitle
                    : draftGraphWorkspaceCopy.duplicateNoMatchTitle}
                </strong>
                <p>
                  {duplicateNodeIds.length === 0 && normalizedSearchQuery === ''
                    ? draftGraphWorkspaceCopy.duplicateEmptyDetail
                    : draftGraphWorkspaceCopy.duplicateNoMatchDetail}
                </p>
              </div>
            )}
          </div>
        ) : hasRootNodes ? (
          <div className="xmind-canvas" style={canvasStyle}>
            {normalizedSearchQuery !== '' && searchResults.length === 0 ? (
              <div className="draft-search-empty-state is-overlay" role="status">
                <strong>{draftGraphWorkspaceCopy.searchNoMatchTitle}</strong>
                <p>{draftGraphWorkspaceCopy.searchNoMatchDetail}</p>
              </div>
            ) : null}
            <svg
              aria-hidden="true"
              className="xmind-branch-svg"
              height={mindmapLayout.height}
              viewBox={`0 0 ${mindmapLayout.width} ${mindmapLayout.height}`}
              width={mindmapLayout.width}
            >
              <defs>
                {/* Pre-defined gradients for each root branch color - fixed count, reused across branches */}
                {ROOT_BRANCH_COLORS.map((color, idx) => (
                  <linearGradient
                    gradientUnits="userSpaceOnUse"
                    id={`branch-grad-root-${idx}`}
                    key={`branch-grad-root-${idx}`}
                    x1="0"
                    x2="1"
                    y1="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity="0.65" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.35" />
                  </linearGradient>
                ))}
                {ROOT_BRANCH_COLORS.map((color, idx) => (
                  <linearGradient
                    gradientUnits="userSpaceOnUse"
                    id={`branch-grad-deep-${idx}`}
                    key={`branch-grad-deep-${idx}`}
                    x1="0"
                    x2="1"
                    y1="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                  </linearGradient>
                ))}
              </defs>
              {branchElements}
            </svg>

            <div className="xmind-node-layer">
              {nodeElements}
              {hoverCardElement}
            </div>
          </div>
        ) : (
          <div className="draft-empty-state">
            <strong>{draftGraphWorkspaceCopy.emptyCanvasTitle}</strong>
            <p>{draftGraphWorkspaceCopy.emptyCanvasDetail}</p>
          </div>
        )}
      </section>
      {viewportHintPopover ? renderDialogOverlay(viewportHintPopover) : null}

      {dialogState?.kind === 'edit' ? renderDialogOverlay(
        <div
          aria-modal="true"
          className="draft-dialog-backdrop"
          onKeyDown={handleDialogKeyDown}
          ref={dialogBackdropRef}
          role="dialog"
        >
          <div
            className={`draft-dialog-card${dialogCardStyle ? ' is-anchored' : ''}`}
            data-anchor-node-id={dialogState.nodeId}
            style={dialogCardStyle}
          >
            <h3>{draftGraphWorkspaceCopy.editorDialogTitle}</h3>
            <p>{`${draftGraphWorkspaceCopy.pathPrefix}：${snapshot.nodesById[dialogState.nodeId]?.pathTokens.join(' / ') ?? ''}`}</p>
            <label className="draft-field">
              <span>{draftGraphWorkspaceCopy.titleLabel}</span>
              <input
                onChange={(event) =>
                  setDialogState({
                    ...dialogState,
                    title: event.target.value,
                    error: null,
                  })
                }
                value={dialogState.title}
              />
            </label>
            {snapshot.nodesById[dialogState.nodeId]?.nodeType === 'bookmark' ? (
              <label className="draft-field">
                <span>{draftGraphWorkspaceCopy.urlLabel}</span>
                <input
                  aria-label={draftGraphWorkspaceCopy.urlLabel}
                  onChange={(event) =>
                    setDialogState({
                      ...dialogState,
                      url: event.target.value,
                      error: null,
                    })
                  }
                  value={dialogState.url}
                />
              </label>
            ) : null}
            {dialogState.error ? <p className="draft-form-error">{dialogState.error}</p> : null}
            <div className="draft-dialog-actions">
              <button className="draft-dialog-button" onClick={closeDialog} type="button">
                {draftGraphWorkspaceCopy.cancelLabel}
              </button>
              <button className="draft-dialog-button is-primary" onClick={() => void submitEditDialog()} type="button">
                {draftGraphWorkspaceCopy.saveLabel}
              </button>
            </div>
          </div>
        </div>,
      ) : null}

      {dialogState?.kind === 'create-child' || dialogState?.kind === 'create-sibling' ? renderDialogOverlay(
        <div
          aria-modal="true"
          className="draft-dialog-backdrop"
          onKeyDown={handleDialogKeyDown}
          ref={dialogBackdropRef}
          role="dialog"
        >
          <div
            className={`draft-dialog-card${dialogCardStyle ? ' is-anchored' : ''}`}
            data-anchor-node-id={dialogState.kind === 'create-child' ? dialogState.parentId : dialogState.referenceNodeId}
            style={dialogCardStyle}
          >
            <h3>
              {dialogState.kind === 'create-child'
                ? draftGraphWorkspaceCopy.createChildDialogTitle
                : draftGraphWorkspaceCopy.createSiblingDialogTitle}
            </h3>
            {dialogState.kind === 'create-child' ? (
              <>
                <p>{`${draftGraphWorkspaceCopy.parentPrefix}：${snapshot.nodesById[dialogState.parentId]?.title ?? ''}`}</p>
                <p>{`${draftGraphWorkspaceCopy.pathPrefix}：${snapshot.nodesById[dialogState.parentId]?.pathTokens.join(' / ') ?? ''}`}</p>
              </>
            ) : (
              <>
                <p>{`${draftGraphWorkspaceCopy.siblingReferencePrefix}：${snapshot.nodesById[dialogState.referenceNodeId]?.title ?? ''}`}</p>
                <p>
                  {`${draftGraphWorkspaceCopy.levelPrefix}：${
                    dialogState.parentId === null
                      ? draftGraphWorkspaceCopy.rootLevelLabel
                      : (snapshot.nodesById[dialogState.parentId]?.pathTokens.join(' / ') ?? '')
                  }`}
                </p>
              </>
            )}
            <fieldset className="draft-type-switch">
              <legend>{draftGraphWorkspaceCopy.nodeTypeLabel}</legend>
              <label>
                <input
                  checked={dialogState.nodeType === 'folder'}
                  name="draft-node-type"
                  onChange={() =>
                    setDialogState({
                      ...dialogState,
                      nodeType: 'folder',
                      url: '',
                      error: null,
                    })
                  }
                  type="radio"
                />
                {draftGraphWorkspaceCopy.folderOption}
              </label>
              <label>
                <input
                  checked={dialogState.nodeType === 'bookmark'}
                  name="draft-node-type"
                  onChange={() =>
                    setDialogState({
                      ...dialogState,
                      nodeType: 'bookmark',
                      error: null,
                    })
                  }
                  type="radio"
                />
                {draftGraphWorkspaceCopy.bookmarkOption}
              </label>
            </fieldset>
            <label className="draft-field">
              <span>{draftGraphWorkspaceCopy.titleLabel}</span>
              <input
                onChange={(event) =>
                  setDialogState({
                    ...dialogState,
                    title: event.target.value,
                    error: null,
                  })
                }
                value={dialogState.title}
              />
            </label>
            {dialogState.nodeType === 'bookmark' ? (
              <label className="draft-field">
                <span>{draftGraphWorkspaceCopy.urlLabel}</span>
                <input
                  aria-label={draftGraphWorkspaceCopy.urlLabel}
                  onChange={(event) =>
                    setDialogState({
                      ...dialogState,
                      url: event.target.value,
                      error: null,
                    })
                  }
                  value={dialogState.url}
                />
              </label>
            ) : null}
            {dialogState.error ? <p className="draft-form-error">{dialogState.error}</p> : null}
            <div className="draft-dialog-actions">
              <button className="draft-dialog-button" onClick={closeDialog} type="button">
                {draftGraphWorkspaceCopy.cancelLabel}
              </button>
              <button
                className="draft-dialog-button is-primary"
                onClick={() =>
                  void (
                    dialogState.kind === 'create-child'
                      ? submitCreateChildDialog()
                      : submitCreateSiblingDialog()
                  )
                }
                type="button"
              >
                {draftGraphWorkspaceCopy.createLabel}
              </button>
            </div>
          </div>
        </div>,
      ) : null}

      {dialogState?.kind === 'delete-confirm' ? renderDialogOverlay(
        <div
          aria-modal="true"
          className="draft-dialog-backdrop"
          onKeyDown={handleDialogKeyDown}
          ref={dialogBackdropRef}
          role="dialog"
        >
          <div
            className={`draft-dialog-card${dialogCardStyle ? ' is-anchored' : ''}`}
            data-anchor-node-id={dialogState.nodeId}
            style={dialogCardStyle}
          >
            <h3>{draftGraphWorkspaceCopy.deleteDialogTitle}</h3>
            <p>{`${draftGraphWorkspaceCopy.parentPrefix}：${dialogState.title || '（无标题）'}`}</p>
            <p className="draft-dialog-warning">{dialogState.message}</p>
            <p className="draft-dialog-note">{`删除后会一并移除该目录下的 ${dialogState.childCount} 个直接子节点及其后续子树。`}</p>
            <div className="draft-dialog-actions">
              <button className="draft-dialog-button" onClick={closeDialog} type="button">
                {draftGraphWorkspaceCopy.cancelLabel}
              </button>
              <button
                autoFocus
                className="draft-dialog-button is-primary is-danger"
                onClick={() => void submitDeleteConfirmDialog()}
                type="button"
              >
                {draftGraphWorkspaceCopy.deleteLabel}
              </button>
            </div>
          </div>
        </div>,
      ) : null}
    </div>
  );
}

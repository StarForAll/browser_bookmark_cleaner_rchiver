import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  type PersistedDraftSession,
} from '@/adapters/local-persistence/contracts';
import {
  createDraftChildNode,
  createDraftSiblingNode,
  deleteDraftNodeSubtree,
  editDraftNode,
  selectDraftNode,
} from '@/domain/draft-graph/editing';
import { type DraftGraphNode, type DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { draftGraphWorkspaceCopy } from '@/shared/copy/draftGraphWorkspace';

type DraftGraphWorkspaceProps = {
  initialSnapshot: DraftGraphSnapshot;
  onPersistDraftSession: (session: PersistedDraftSession) => Promise<unknown>;
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

type MindmapLayoutNode = {
  nodeId: string;
  x: number;
  y: number;
  branchColor: string;
  depth: number;
  isVirtualRoot?: boolean;
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
};

type LayoutNodeMeta = {
  nodeId: string;
  entry: number;
  exit: number;
  depth: number;
  parentId: string | null;
  baseY: number;
};

type CanvasViewport = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const MINDMAP_NODE_WIDTH = 220;
const MINDMAP_NODE_HEIGHT = 40;
const MINDMAP_HORIZONTAL_GAP = 80;
const MINDMAP_VERTICAL_GAP = 16;
const MINDMAP_PADDING_X = 32;
const MINDMAP_PADDING_Y = 32;
const HOVER_CARD_WIDTH = 280;
const HOVER_CARD_GAP = 16;
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

type HoverState = {
  nodeId: string;
} | null;

type HoverCardPosition = {
  left: number;
  top: number;
};

function buildPersistedDraftSession(snapshot: DraftGraphSnapshot): PersistedDraftSession {
  return {
    schemaVersion: LOCAL_PERSISTENCE_SCHEMA_VERSION,
    draftSnapshot: snapshot,
    expandedStateById: {},
    nodePositionsById: {},
    undoHistory: [],
    checkpoints: [],
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

function buildMindmapLayout(snapshot: DraftGraphSnapshot): MindmapLayoutResult {
  const nodes: MindmapLayoutNode[] = [];
  const branches: MindmapLayoutBranch[] = [];
  const nodeById = new Map<string, MindmapLayoutNode>();
  const layoutMetaById = new Map<string, LayoutNodeMeta>();
  let maxDepth = 0;
  let traversalIndex = 0;

  const leafStride = MINDMAP_NODE_HEIGHT + MINDMAP_VERTICAL_GAP;

  function placeNode(
    nodeId: string,
    depth: number,
    branchColor: string,
    leafIndex: number,
  ): { centerY: number; nextLeafIndex: number } {
    const node = snapshot.nodesById[nodeId] as DraftGraphNode;
    const entry = traversalIndex;
    traversalIndex += 1;
    maxDepth = Math.max(maxDepth, depth);

    if (node.childIds.length === 0) {
      const centerY = MINDMAP_PADDING_Y + leafIndex * leafStride + MINDMAP_NODE_HEIGHT / 2;
      const layoutNode = {
        nodeId,
        x: MINDMAP_PADDING_X + depth * (MINDMAP_NODE_WIDTH + MINDMAP_HORIZONTAL_GAP),
        y: centerY - MINDMAP_NODE_HEIGHT / 2,
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
      x: MINDMAP_PADDING_X + depth * (MINDMAP_NODE_WIDTH + MINDMAP_HORIZONTAL_GAP),
      y: centerY - MINDMAP_NODE_HEIGHT / 2,
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

  // Add virtual root node at depth -1, aligned with the first root node's top
  // This ensures the virtual root is always visible near the top of the canvas
  if (snapshot.rootIds.length > 0 && rootCenters.length > 0) {
    const virtualRootX = MINDMAP_PADDING_X;
    // Align virtual root with the first root node's top edge (not centered on all roots)
    const firstRootTop = rootCenters[0] - MINDMAP_NODE_HEIGHT / 2;

    const virtualRootNode = {
      nodeId: VIRTUAL_ROOT_ID,
      x: virtualRootX,
      y: firstRootTop,
      branchColor: ROOT_BRANCH_COLORS[0],
      depth: -1,
      isVirtualRoot: true,
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
    const shiftX = MINDMAP_NODE_WIDTH + MINDMAP_HORIZONTAL_GAP;
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

  // After resolving overlaps, keep the virtual root aligned with the first visible root.
  const virtualRootNode = nodeById.get(VIRTUAL_ROOT_ID);
  if (virtualRootNode) {
    const rootCenters = snapshot.rootIds
      .map((rootId) => nodeById.get(rootId))
      .filter((node): node is MindmapLayoutNode => node !== undefined)
      .map((node) => node.y + MINDMAP_NODE_HEIGHT / 2);

    if (rootCenters.length > 0) {
      // Keep virtual root aligned with the first root's top (not centered)
      // This ensures it stays near the top of the canvas regardless of graph size
      virtualRootNode.y = rootCenters[0] - MINDMAP_NODE_HEIGHT / 2;
    }
  }

  const maxBottom = nodes.reduce(
    (currentMax, node) => Math.max(currentMax, node.y + MINDMAP_NODE_HEIGHT),
    MINDMAP_PADDING_Y + MINDMAP_NODE_HEIGHT,
  );

  return {
    nodes,
    branches,
    width:
      MINDMAP_PADDING_X * 2 +
      (maxDepth + 2) * MINDMAP_NODE_WIDTH +
      (maxDepth + 1) * MINDMAP_HORIZONTAL_GAP +
      80,
    height: Math.max(280, maxBottom + MINDMAP_PADDING_Y),
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

      previousBottom = currentTop + MINDMAP_NODE_HEIGHT;
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
  const preferredLeft = layout.x + MINDMAP_NODE_WIDTH + HOVER_CARD_GAP;
  const fallbackLeft = Math.max(MINDMAP_PADDING_X, layout.x - HOVER_CARD_WIDTH - HOVER_CARD_GAP);
  const maxLeft = Math.max(MINDMAP_PADDING_X, canvas.width - HOVER_CARD_WIDTH - MINDMAP_PADDING_X);
  const left = preferredLeft + HOVER_CARD_WIDTH <= canvas.width - MINDMAP_PADDING_X ? preferredLeft : fallbackLeft;
  const clampedTop = Math.max(MINDMAP_PADDING_Y, Math.min(layout.y, canvas.height - 180));

  return {
    left: Math.min(left, maxLeft),
    top: clampedTop,
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

function isLayoutNodeVisible(layoutNode: MindmapLayoutNode, viewport: CanvasViewport): boolean {
  const nodeLeft = layoutNode.x;
  const nodeTop = layoutNode.y;
  const nodeRight = nodeLeft + MINDMAP_NODE_WIDTH;
  const nodeBottom = nodeTop + MINDMAP_NODE_HEIGHT;

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
  if (!viewport) {
    return {
      nodes: layout.nodes,
      branches: layout.branches,
    };
  }

  // Collect nodes that are visible in the viewport
  const visibleNodeIds = new Set(
    layout.nodes
      .filter((layoutNode) => layoutNode.isVirtualRoot || isLayoutNodeVisible(layoutNode, viewport))
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
  initialSnapshot,
  onPersistDraftSession,
}: DraftGraphWorkspaceProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [hoverState, setHoverState] = useState<HoverState>(null);
  const treeContainerRef = useRef<HTMLElement | null>(null);
  const dialogBackdropRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport | null>(null);

  const hasRootNodes = snapshot.rootIds.length > 0;
  const nodeCount = useMemo(() => Object.keys(snapshot.nodesById).length, [snapshot.nodesById]);
  const isLargeGraph = nodeCount >= LARGE_GRAPH_NODE_THRESHOLD;
  const isDialogOpen = dialogState !== null;
  const mindmapLayout = useMemo(
    () => buildMindmapLayout(snapshot),
    [snapshot.nodesById, snapshot.rootIds],
  );
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

  const commitSnapshot = useCallback(async (nextSnapshot: DraftGraphSnapshot): Promise<void> => {
    setSnapshot(nextSnapshot);
    await onPersistDraftSession(buildPersistedDraftSession(nextSnapshot));
  }, [onPersistDraftSession]);

  const openEditDialog = useCallback((nodeId: string): void => {
    const node = snapshot.nodesById[nodeId];
    if (!node) {
      return;
    }

    previousFocusRef.current = getCurrentActiveElement();
    setDialogState({
      kind: 'edit',
      nodeId,
      title: node.title,
      url: node.url ?? '',
      error: null,
    });
  }, [snapshot.nodesById]);

  const openCreateChildDialog = useCallback((parentId: string): void => {
    const parent = snapshot.nodesById[parentId];
    if (!parent || parent.nodeType !== 'folder') {
      return;
    }

    previousFocusRef.current = getCurrentActiveElement();
    setDialogState({
      kind: 'create-child',
      parentId,
      nodeType: 'folder',
      title: '',
      url: '',
      error: null,
    });
  }, [snapshot.nodesById]);

  const openCreateSiblingDialog = useCallback((referenceNodeId: string): void => {
    const referenceNode = snapshot.nodesById[referenceNodeId];
    if (!referenceNode) {
      return;
    }

    previousFocusRef.current = getCurrentActiveElement();
    setDialogState({
      kind: 'create-sibling',
      referenceNodeId,
      parentId: referenceNode.parentId,
      nodeType: 'folder',
      title: '',
      url: '',
      error: null,
    });
  }, [snapshot.nodesById]);

  const openDeleteConfirmDialog = useCallback((node: DraftGraphNode): void => {
    previousFocusRef.current = getCurrentActiveElement();
    setDialogState({
      kind: 'delete-confirm',
      nodeId: node.internalId,
      title: node.title,
      childCount: node.childIds.length,
      message: buildDeleteConfirmationMessage(node),
    });
  }, []);

  const commitDelete = useCallback(async (nodeId: string): Promise<void> => {
    const result = deleteDraftNodeSubtree(snapshot, nodeId);
    if (!result.ok) {
      return;
    }
    await commitSnapshot(result.snapshot);
  }, [commitSnapshot, snapshot]);

  const handleDelete = useCallback(async (nodeId: string): Promise<void> => {
    const targetNode = snapshot.nodesById[nodeId];
    if (!targetNode) {
      return;
    }

    if (targetNode.nodeType === 'folder' && targetNode.childIds.length > 1) {
      openDeleteConfirmDialog(targetNode);
      return;
    }

    await commitDelete(nodeId);
  }, [commitDelete, openDeleteConfirmDialog, snapshot.nodesById]);

  const closeDialog = useCallback((): void => {
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

  const handleNodeKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, nodeId: string): void => {
    if (isDialogOpen) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter') {
      if (event.shiftKey) {
        event.preventDefault();
        openCreateSiblingDialog(nodeId);
        return;
      }

      const targetNode = snapshot.nodesById[nodeId];
      if (targetNode?.nodeType !== 'folder') {
        return;
      }
      event.preventDefault();
      openCreateChildDialog(nodeId);
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      void handleDelete(nodeId);
    }
  }, [handleDelete, isDialogOpen, openCreateChildDialog, openCreateSiblingDialog, snapshot.nodesById]);

  const handleNodeMouseEnter = useCallback((_event: ReactMouseEvent<HTMLButtonElement>, nodeId: string): void => {
    setHoverState({ nodeId });
  }, []);

  const handleNodeMouseLeave = useCallback((): void => {
    setHoverState(null);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string): void => {
    setSnapshot((current) => selectDraftNode(current, nodeId));
    setHoverState(null);
  }, []);

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

    await commitSnapshot(result.snapshot);
    setDialogState(null);
  }, [commitSnapshot, dialogState, snapshot]);

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

    await commitSnapshot(result.snapshot);
    setDialogState(null);
  }, [commitSnapshot, dialogState, snapshot]);

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

    await commitSnapshot(result.snapshot);
    setDialogState(null);
  }, [commitSnapshot, dialogState, snapshot]);

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
    openEditDialog(nodeId);
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

  const branchElements = useMemo(() => visibleMindmap.branches.map((branch) => {
    const fromNode = layoutByNodeId[branch.fromId];
    const toNode = layoutByNodeId[branch.toId];

    if (!fromNode || !toNode) {
      return null;
    }

    const startX = fromNode.x + MINDMAP_NODE_WIDTH;
    const startY = fromNode.y + MINDMAP_NODE_HEIGHT / 2;
    const endX = toNode.x;
    const endY = toNode.y + MINDMAP_NODE_HEIGHT / 2;
    const curveOffset = MINDMAP_HORIZONTAL_GAP * 0.45;
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
  }), [isLargeGraph, layoutByNodeId, visibleMindmap.branches]);

  const nodeElements = useMemo(() => visibleMindmap.nodes.map((layoutNode) => {
    if (layoutNode.isVirtualRoot) {
      return (
        <div
          className="xmind-node-shell is-virtual-root"
          key={layoutNode.nodeId}
          style={{
            '--branch-color': layoutNode.branchColor,
            transform: `translate(${layoutNode.x}px, ${layoutNode.y}px)`,
          } as CSSProperties}
        >
          <div
            aria-label={`虚拟根节点：${VIRTUAL_ROOT_TITLE}`}
            className="draft-node-button is-virtual-root"
          >
            <span className="draft-node-icon" aria-hidden="true">🌳</span>
            <span className="draft-node-eyebrow">虚拟根节点</span>
            <span className="draft-node-title">{VIRTUAL_ROOT_TITLE}</span>
          </div>
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
    const nodeStyle = {
      '--branch-color': layoutNode.branchColor,
      transform: `translate(${layoutNode.x}px, ${layoutNode.y}px)`,
    } as CSSProperties;

    return (
      <div className={`xmind-node-shell ${depthClassName}`} key={layoutNode.nodeId} style={nodeStyle}>
        <button
          aria-label={buildNodeAriaLabel(node)}
          aria-pressed={snapshot.selectedNodeId === node.internalId}
          className={`draft-node-button${snapshot.selectedNodeId === node.internalId ? ' is-selected' : ''}`}
          data-node-id={node.internalId}
          disabled={isDialogOpen}
          onClick={handleNodeButtonClick}
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
      </div>
    );
  }), [
    handleNodeButtonClick,
    handleNodeButtonDoubleClick,
    handleNodeButtonKeyDown,
    handleNodeButtonMouseEnter,
    handleNodeMouseLeave,
    isDialogOpen,
    snapshot.nodesById,
    snapshot.selectedNodeId,
    visibleMindmap.nodes,
  ]);

  const hoverCardElement = useMemo(() => {
    if (!hoverState) {
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

    return (
      <div
        className="draft-hover-card"
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
        {hoveredNode.childIds.length > 0 ? (
          <div className="draft-hover-card-children">
            子节点：{hoveredNode.childIds.length} 个
          </div>
        ) : null}
      </div>
    );
  }, [hoverState, layoutByNodeId, mindmapLayout, snapshot.nodesById]);

  return (
    <div className={`draft-graph-workspace${isLargeGraph ? ' is-large-graph' : ''}`}>
      <section aria-label={draftGraphWorkspaceCopy.treeLabel} className="draft-graph-tree" ref={treeContainerRef}>
        {hasRootNodes ? (
          <div className="xmind-canvas" style={{ height: mindmapLayout.height, width: mindmapLayout.width }}>
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

      {dialogState?.kind === 'edit' ? (
        <div
          aria-modal="true"
          className="draft-dialog-backdrop"
          onKeyDown={handleDialogKeyDown}
          ref={dialogBackdropRef}
          role="dialog"
        >
          <div className="draft-dialog-card">
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
        </div>
      ) : null}

      {dialogState?.kind === 'create-child' || dialogState?.kind === 'create-sibling' ? (
        <div
          aria-modal="true"
          className="draft-dialog-backdrop"
          onKeyDown={handleDialogKeyDown}
          ref={dialogBackdropRef}
          role="dialog"
        >
          <div className="draft-dialog-card">
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
        </div>
      ) : null}

      {dialogState?.kind === 'delete-confirm' ? (
        <div
          aria-modal="true"
          className="draft-dialog-backdrop"
          onKeyDown={handleDialogKeyDown}
          ref={dialogBackdropRef}
          role="dialog"
        >
          <div className="draft-dialog-card">
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
        </div>
      ) : null}
    </div>
  );
}

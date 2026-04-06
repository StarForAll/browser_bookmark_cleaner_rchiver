import { useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  LOCAL_PERSISTENCE_SCHEMA_VERSION,
  type PersistedDraftSession,
} from '@/adapters/local-persistence/contracts';
import {
  createDraftChildNode,
  deleteDraftNodeSubtree,
  editDraftNode,
  selectDraftNode,
} from '@/domain/draft-graph/editing';
import { type DraftGraphNode, type DraftGraphSnapshot } from '@/domain/draft-graph/contracts';
import { draftGraphWorkspaceCopy } from '@/shared/copy/draftGraphWorkspace';

type DraftGraphWorkspaceProps = {
  initialSnapshot: DraftGraphSnapshot;
  onPersistDraftSession: (session: PersistedDraftSession) => Promise<unknown>;
  onRecordStatusEntry: (entry: unknown) => void;
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

const MINDMAP_NODE_WIDTH = 220;
const MINDMAP_NODE_HEIGHT = 40;
const MINDMAP_HORIZONTAL_GAP = 80;
const MINDMAP_VERTICAL_GAP = 16;
const MINDMAP_PADDING_X = 32;
const MINDMAP_PADDING_Y = 32;
const ROOT_BRANCH_COLORS = ['#7a9d95', '#8aa6c0', '#b59677', '#8d9a76'] as const;

type HoverState = {
  nodeId: string;
} | null;

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

function buildMindmapLayout(snapshot: DraftGraphSnapshot): MindmapLayoutResult {
  const nodes: MindmapLayoutNode[] = [];
  const branches: MindmapLayoutBranch[] = [];
  let maxDepth = 0;

  const leafStride = MINDMAP_NODE_HEIGHT + MINDMAP_VERTICAL_GAP;

  function placeNode(
    nodeId: string,
    depth: number,
    branchColor: string,
    leafIndex: number,
  ): { centerY: number; nextLeafIndex: number } {
    const node = snapshot.nodesById[nodeId] as DraftGraphNode;
    maxDepth = Math.max(maxDepth, depth);

    if (node.childIds.length === 0) {
      const centerY = MINDMAP_PADDING_Y + leafIndex * leafStride + MINDMAP_NODE_HEIGHT / 2;
      nodes.push({
        nodeId,
        x: MINDMAP_PADDING_X + depth * (MINDMAP_NODE_WIDTH + MINDMAP_HORIZONTAL_GAP),
        y: centerY - MINDMAP_NODE_HEIGHT / 2,
        branchColor,
        depth,
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
    nodes.push({
      nodeId,
      x: MINDMAP_PADDING_X + depth * (MINDMAP_NODE_WIDTH + MINDMAP_HORIZONTAL_GAP),
      y: centerY - MINDMAP_NODE_HEIGHT / 2,
      branchColor,
      depth,
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

  // Add virtual root node at depth -1, centered on all root branches
  if (snapshot.rootIds.length > 0 && rootCenters.length > 0) {
    const virtualRootCenterY = (rootCenters[0] + rootCenters[rootCenters.length - 1]) / 2;
    const virtualRootX = MINDMAP_PADDING_X;

    nodes.push({
      nodeId: VIRTUAL_ROOT_ID,
      x: virtualRootX,
      y: virtualRootCenterY - MINDMAP_NODE_HEIGHT / 2,
      branchColor: ROOT_BRANCH_COLORS[0],
      depth: -1,
      isVirtualRoot: true,
    });

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
  resolveOverlaps(nodes, snapshot);

  return {
    nodes,
    branches,
    width:
      MINDMAP_PADDING_X * 2 +
      (maxDepth + 2) * MINDMAP_NODE_WIDTH +
      (maxDepth + 1) * MINDMAP_HORIZONTAL_GAP +
      80,
    height: Math.max(280, MINDMAP_PADDING_Y * 2 + Math.max(1, leafIndex) * leafStride),
  };
}

/**
 * Resolve vertical overlaps between nodes at the same depth.
 * When two nodes overlap, push the lower one (and its entire subtree) down.
 * Also adds extra gap between nodes from different parents for visual clarity.
 */
function resolveOverlaps(
  nodes: MindmapLayoutNode[],
  snapshot: DraftGraphSnapshot,
): void {
  const minGap = MINDMAP_VERTICAL_GAP;
  const siblingGroupGap = MINDMAP_VERTICAL_GAP + 12; // extra gap between different-parent siblings

  // Build a map of nodeId -> parentId for quick lookup
  const parentIdOf = new Map<string, string | null>();
  for (const [id, node] of Object.entries(snapshot.nodesById)) {
    parentIdOf.set(id, (node as DraftGraphNode).parentId ?? null);
  }

  // Build a map of nodeId -> all descendant nodeIds (for subtree shifting)
  // Skip virtual root node which is not in snapshot.nodesById
  const descendants = new Map<string, Set<string>>();
  function collectDescendants(nodeId: string): Set<string> {
    if (descendants.has(nodeId)) return descendants.get(nodeId)!;
    const node = snapshot.nodesById[nodeId] as DraftGraphNode;
    if (!node) {
      // Virtual root or unknown node — no descendants
      descendants.set(nodeId, new Set());
      return new Set();
    }
    const desc = new Set<string>();
    for (const childId of node.childIds) {
      desc.add(childId);
      for (const d of collectDescendants(childId)) {
        desc.add(d);
      }
    }
    descendants.set(nodeId, desc);
    return desc;
  }
  for (const n of nodes) {
    collectDescendants(n.nodeId);
  }

  // Group nodes by depth (skip virtual root at depth -1)
  const byDepth = new Map<number, MindmapLayoutNode[]>();
  for (const n of nodes) {
    if (n.isVirtualRoot) continue; // Skip virtual root
    if (!byDepth.has(n.depth)) byDepth.set(n.depth, []);
    byDepth.get(n.depth)!.push(n);
  }

  // For each depth, sort by Y and resolve overlaps
  for (const [, depthNodes] of byDepth) {
    depthNodes.sort((a, b) => a.y - b.y);

    for (let i = 1; i < depthNodes.length; i++) {
      const prev = depthNodes[i - 1];
      const curr = depthNodes[i];
      const prevBottom = prev.y + MINDMAP_NODE_HEIGHT;
      const currTop = curr.y;

      // Determine required gap based on whether nodes share the same parent
      const prevParent = parentIdOf.get(prev.nodeId) ?? null;
      const currParent = parentIdOf.get(curr.nodeId) ?? null;
      const requiredGap = prevParent !== null && prevParent === currParent ? minGap : siblingGroupGap;

      if (currTop < prevBottom + requiredGap) {
        const pushDown = prevBottom + requiredGap - currTop;
        // Push current node and its entire subtree down
        const toShift = new Set([curr.nodeId, ...(descendants.get(curr.nodeId) ?? [])]);
        for (const n of nodes) {
          if (toShift.has(n.nodeId)) {
            n.y += pushDown;
          }
        }
      }
    }
  }
}

export function DraftGraphWorkspace({
  initialSnapshot,
  onPersistDraftSession,
  onRecordStatusEntry: _onRecordStatusEntry,
}: DraftGraphWorkspaceProps) {
  void _onRecordStatusEntry;
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [hoverState, setHoverState] = useState<HoverState>(null);

  const rootNodes = useMemo(
    () => snapshot.rootIds.map((rootId) => snapshot.nodesById[rootId]).filter(Boolean),
    [snapshot],
  );
  const mindmapLayout = useMemo(() => buildMindmapLayout(snapshot), [snapshot]);
  const layoutByNodeId = useMemo(
    () =>
      Object.fromEntries(mindmapLayout.nodes.map((node) => [node.nodeId, node])),
    [mindmapLayout.nodes],
  );

  async function commitSnapshot(nextSnapshot: DraftGraphSnapshot): Promise<void> {
    setSnapshot(nextSnapshot);
    await onPersistDraftSession(buildPersistedDraftSession(nextSnapshot));
  }

  function openEditDialog(nodeId: string): void {
    const node = snapshot.nodesById[nodeId];
    if (!node) {
      return;
    }

    setDialogState({
      kind: 'edit',
      nodeId,
      title: node.title,
      url: node.url ?? '',
      error: null,
    });
  }

  function openCreateChildDialog(parentId: string): void {
    const parent = snapshot.nodesById[parentId];
    if (!parent) {
      return;
    }

    setDialogState({
      kind: 'create-child',
      parentId,
      nodeType: 'folder',
      title: '',
      url: '',
      error: null,
    });
  }

  async function handleDelete(nodeId: string): Promise<void> {
    const result = deleteDraftNodeSubtree(snapshot, nodeId);
    if (!result.ok) {
      return;
    }
    await commitSnapshot(result.snapshot);
  }

  function handleNodeKeyDown(event: KeyboardEvent<HTMLButtonElement>, nodeId: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      openCreateChildDialog(nodeId);
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      void handleDelete(nodeId);
    }
  }

  function handleNodeMouseEnter(_event: ReactMouseEvent<HTMLButtonElement>, nodeId: string): void {
    setHoverState({ nodeId });
  }

  function handleNodeMouseLeave(): void {
    setHoverState(null);
  }

  function handleNodeSelect(nodeId: string): void {
    setSnapshot((current) => selectDraftNode(current, nodeId));
    setHoverState(null);
  }

  async function submitEditDialog(): Promise<void> {
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
  }

  async function submitCreateChildDialog(): Promise<void> {
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
  }

  return (
    <div className="draft-graph-workspace">
      <section aria-label={draftGraphWorkspaceCopy.treeLabel} className="draft-graph-tree">
        {rootNodes.length > 0 ? (
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
              {mindmapLayout.branches.map((branch) => {
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
                    <path
                      d={path}
                      fill="none"
                      stroke={branch.branchColor}
                      strokeLinecap="round"
                      strokeOpacity={branch.depth === 0 ? 0.12 : 0.06}
                      strokeWidth={branch.depth === 0 ? 10 : branch.depth === 1 ? 8 : 5}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="xmind-node-layer">
              {mindmapLayout.nodes.map((layoutNode) => {
                // Virtual root node: purely visual, no interactions
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
                      <div className="draft-node-button is-virtual-root">
                        <span className="draft-node-icon" aria-hidden="true">🌳</span>
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
                      aria-pressed={snapshot.selectedNodeId === node.internalId}
                      className={`draft-node-button${snapshot.selectedNodeId === node.internalId ? ' is-selected' : ''}`}
                      onClick={() => handleNodeSelect(node.internalId)}
                      onDoubleClick={() => openEditDialog(node.internalId)}
                      onKeyDown={(event) => handleNodeKeyDown(event, node.internalId)}
                      onMouseEnter={(event) => handleNodeMouseEnter(event, node.internalId)}
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
              })}

              {hoverState ? (() => {
                const hoveredNode = snapshot.nodesById[hoverState.nodeId];
                if (!hoveredNode) return null;
                const layout = layoutByNodeId[hoverState.nodeId];
                if (!layout) return null;

                const cardX = layout.x + MINDMAP_NODE_WIDTH + 16;
                const cardY = layout.y;

                return (
                  <div
                    className="draft-hover-card"
                    style={{ left: cardX, top: cardY }}
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
              })() : null}
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
        <div aria-modal="true" className="draft-dialog-backdrop" role="dialog">
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
              <button className="draft-dialog-button" onClick={() => setDialogState(null)} type="button">
                {draftGraphWorkspaceCopy.cancelLabel}
              </button>
              <button className="draft-dialog-button is-primary" onClick={() => void submitEditDialog()} type="button">
                {draftGraphWorkspaceCopy.saveLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialogState?.kind === 'create-child' ? (
        <div aria-modal="true" className="draft-dialog-backdrop" role="dialog">
          <div className="draft-dialog-card">
            <h3>{draftGraphWorkspaceCopy.createChildDialogTitle}</h3>
            <p>{`${draftGraphWorkspaceCopy.parentPrefix}：${snapshot.nodesById[dialogState.parentId]?.title ?? ''}`}</p>
            <p>{`${draftGraphWorkspaceCopy.pathPrefix}：${snapshot.nodesById[dialogState.parentId]?.pathTokens.join(' / ') ?? ''}`}</p>
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
              <button className="draft-dialog-button" onClick={() => setDialogState(null)} type="button">
                {draftGraphWorkspaceCopy.cancelLabel}
              </button>
              <button
                className="draft-dialog-button is-primary"
                onClick={() => void submitCreateChildDialog()}
                type="button"
              >
                {draftGraphWorkspaceCopy.createLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

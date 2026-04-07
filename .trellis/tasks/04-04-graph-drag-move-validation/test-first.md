# T07A Test-First Gate

## Goal

Freeze the first executable test gate for `T07A` before implementation.

## Scope

- Drag a draft node onto a folder node to move it within the current draft graph
- Block illegal drop targets before mutating draft state
- Keep browser bookmarks untouched during drag-move

## Planned Contract

Domain mutation entrypoint to implement:

```ts
moveDraftNode(snapshot, {
  nodeId,
  targetParentId,
  targetIndex?,
})
```

Expected result shape:

```ts
{ ok: true, snapshot }
```

or

```ts
{ ok: false, error }
```

## Gate Cases

### Domain gate

1. Good: moving a bookmark into a folder updates `parentId`, source/target `childIds`, and descendant `pathTokens`
2. Bad: dropping onto a bookmark node is rejected with a non-empty error and no mutation
3. Bad: moving a folder into its own descendant is rejected with a non-empty error and no mutation

### Workspace interaction gate

1. Good: node buttons expose drag affordance for movable draft nodes
2. Good: dragging `产品文档` onto `归档` updates the visible draft path to `工作资料 / 归档 / 产品文档`
3. Good: successful drag persists the draft session exactly once
4. Bad boundary: drag-move never calls `chrome.bookmarks.create/update/removeTree`

## Verification

- Automated gate command: `pnpm test`
- Expected current phase result after writing tests only: `fail`
- Manual verification remains deferred until implementation exists

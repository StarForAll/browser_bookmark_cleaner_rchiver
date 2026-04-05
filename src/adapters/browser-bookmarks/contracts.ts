import { isNonEmptyString, isRecord, validationFailure, validationSuccess, type ValidationResult } from '@/shared/contracts/validation';

export type BrowserBookmarkTreeNode = {
  id: string;
  parentId: string | null;
  title: string;
  url?: string;
  children?: BrowserBookmarkTreeNode[];
};

function validateBookmarkTreeNode(
  value: unknown,
  path: string,
): ValidationResult<BrowserBookmarkTreeNode> {
  if (!isRecord(value)) {
    return validationFailure(`${path} must be an object.`);
  }

  const { id, parentId, title, url, children } = value;

  if (!isNonEmptyString(id)) {
    return validationFailure(`${path}.id must be a non-empty string.`);
  }

  if (parentId !== undefined && parentId !== null && !isNonEmptyString(parentId)) {
    return validationFailure(`${path}.parentId must be a non-empty string when present.`);
  }

  if (typeof title !== 'string') {
    return validationFailure(`${path}.title must be a string.`);
  }

  if (url !== undefined && typeof url !== 'string') {
    return validationFailure(`${path}.url must be a string when present.`);
  }

  if (children !== undefined && !Array.isArray(children)) {
    return validationFailure(`${path}.children must be an array when present.`);
  }

  const isFolderNode = Array.isArray(children);
  if (!isFolderNode && !isNonEmptyString(url)) {
    return validationFailure(`${path}.url must be a non-empty string for bookmark leaves.`);
  }

  const normalizedChildren: BrowserBookmarkTreeNode[] | undefined = children
    ? children.map((child, index) => {
        const childValidation = validateBookmarkTreeNode(child, `${path}.children[${index}]`);
        if (!childValidation.ok) {
          throw new Error(childValidation.error);
        }
        return childValidation.value;
      })
    : undefined;

  return validationSuccess({
    id,
    parentId: parentId ?? null,
    title,
    url,
    children: normalizedChildren,
  });
}

export function validateBrowserBookmarkTree(
  value: unknown,
): ValidationResult<BrowserBookmarkTreeNode[]> {
  if (!Array.isArray(value)) {
    return validationFailure('Browser bookmark tree must be an array.');
  }

  const normalized: BrowserBookmarkTreeNode[] = [];

  for (const [index, node] of value.entries()) {
    try {
      const nodeValidation = validateBookmarkTreeNode(node, `tree[${index}]`);
      if (!nodeValidation.ok) {
        return nodeValidation;
      }
      normalized.push(nodeValidation.value);
    } catch (error) {
      return validationFailure(error instanceof Error ? error.message : 'Invalid browser tree node.');
    }
  }

  return validationSuccess(normalized);
}

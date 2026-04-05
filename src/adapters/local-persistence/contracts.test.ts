import { describe, expect, test } from 'vitest';

describe('T04 local persistence contracts', () => {
  test('freezes the logical storage domains and the latest-backup slots', async () => {
    const contracts = await import('./contracts');

    expect(contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION).toBeTypeOf('string');
    expect(contracts.LOCAL_PERSISTENCE_KEYS).toEqual({
      workspace: {
        draftSnapshot: 'draft-snapshot',
        expandedStateById: 'expanded-state-by-id',
        nodePositionsById: 'node-positions-by-id',
      },
      sensitive: {
        webdavProfile: 'webdav-profile',
        webdavPermissionState: 'webdav-permission-state',
      },
      assets: {
        undoHistory: 'draft-undo-history',
        draftCheckpoints: 'draft-checkpoints',
        latestDraftBackup: 'latest-draft-backup',
        latestBrowserBackup: 'latest-browser-backup',
      },
    });
  });

  test('validates persisted draft session payloads without mixing in browser snapshots', async () => {
    const contracts = await import('./contracts');

    expect(contracts.validatePersistedDraftSession).toBeTypeOf('function');

    const validation = contracts.validatePersistedDraftSession({
      schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
      draftSnapshot: {
        schemaVersion: 'draft-graph/v1',
        snapshotVersion: 7,
        selectedNodeId: 'bookmark-1',
        nodesById: {
          'bookmark-1': {
            internalId: 'bookmark-1',
            sourceType: 'draft',
            nodeType: 'bookmark',
            title: 'Example',
            url: 'https://example.com',
            parentId: null,
            childIds: [],
            pathTokens: ['Example'],
          },
        },
        rootIds: ['bookmark-1'],
      },
      expandedStateById: {
        'bookmark-1': true,
      },
      nodePositionsById: {
        'bookmark-1': {
          x: 120,
          y: 80,
        },
      },
      undoHistory: [
        {
          timestamp: '2026-04-05T12:00:00.000Z',
          mutationType: 'edit-bookmark-url',
          affectedNodeIds: ['bookmark-1'],
          beforeStatePayload: {
            url: 'https://old.example.com',
          },
          afterStatePayload: {
            url: 'https://example.com',
          },
          storageMode: 'patch',
        },
      ],
      checkpoints: [
        {
          createdAt: '2026-04-05T12:00:00.000Z',
          snapshotVersion: 7,
          storageKey: 'draft-checkpoints/7',
          sizeBytes: 512,
        },
      ],
    });

    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value).not.toHaveProperty('browserTree');
      expect(validation.value).not.toHaveProperty('browserSnapshot');
      expect(validation.value).toEqual(
        expect.objectContaining({
          schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
        }),
      );
    }
  });

  test('accepts only frozen backup metadata source origins and required fields', async () => {
    const contracts = await import('./contracts');

    expect(contracts.validateLocalBackupMetadata).toBeTypeOf('function');

    const validMetadata = contracts.validateLocalBackupMetadata({
      artifactId: 'draft-backup-1',
      artifactType: 'draft-restore-backup',
      schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
      createdAt: '2026-04-05T12:00:00.000Z',
      payloadFormat: 'draft-graph-snapshot',
      storageKey: 'latest-draft-backup',
      sizeBytes: 2048,
      sourceObjectType: 'browser',
      targetObjectType: 'draft',
      triggerAction: 'overwrite-draft-from-browser',
      sourceOrigin: 'browser-current-tree',
      sourceVersionId: null,
      sourceVersionLabel: null,
    });

    const invalidMetadata = contracts.validateLocalBackupMetadata({
      artifactId: 'draft-backup-1',
      artifactType: 'draft-restore-backup',
      schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
      createdAt: '2026-04-05T12:00:00.000Z',
      payloadFormat: 'draft-graph-snapshot',
      storageKey: 'latest-draft-backup',
      sizeBytes: 2048,
      sourceObjectType: 'draft',
      targetObjectType: 'draft',
      triggerAction: 'overwrite-draft-from-browser',
      sourceOrigin: 'manual-export',
      sourceVersionId: null,
      sourceVersionLabel: null,
    });

    expect(validMetadata.ok).toBe(true);
    expect(invalidMetadata.ok).toBe(false);
  });

  test('rejects backup metadata pairings outside the frozen artifact and source-origin matrix', async () => {
    const contracts = await import('./contracts');

    const invalidDraftPair = contracts.validateLocalBackupMetadata({
      artifactId: 'draft-backup-2',
      artifactType: 'draft-restore-backup',
      schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
      createdAt: '2026-04-05T12:00:00.000Z',
      payloadFormat: 'draft-graph-snapshot',
      storageKey: 'latest-draft-backup',
      sizeBytes: 2048,
      sourceObjectType: 'draft',
      targetObjectType: 'draft',
      triggerAction: 'restore-draft-backup',
      sourceOrigin: 'draft-sync',
      sourceVersionId: 'version-1',
      sourceVersionLabel: 'Version 1',
    });

    const invalidBrowserPair = contracts.validateLocalBackupMetadata({
      artifactId: 'browser-backup-1',
      artifactType: 'browser-restore-backup',
      schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
      createdAt: '2026-04-05T12:00:00.000Z',
      payloadFormat: 'browser-bookmark-tree',
      storageKey: 'latest-browser-backup',
      sizeBytes: 2048,
      sourceObjectType: 'browser',
      targetObjectType: 'browser',
      triggerAction: 'restore-browser-backup',
      sourceOrigin: 'browser-current-tree',
      sourceVersionId: null,
      sourceVersionLabel: null,
    });

    expect(invalidDraftPair.ok).toBe(false);
    expect(invalidBrowserPair.ok).toBe(false);
  });

  test('rejects backup metadata when sourceObjectType conflicts with sourceOrigin semantics', async () => {
    const contracts = await import('./contracts');

    const validation = contracts.validateLocalBackupMetadata({
      artifactId: 'draft-backup-3',
      artifactType: 'draft-restore-backup',
      schemaVersion: contracts.LOCAL_PERSISTENCE_SCHEMA_VERSION,
      createdAt: '2026-04-05T12:00:00.000Z',
      payloadFormat: 'draft-graph-snapshot',
      storageKey: 'latest-draft-backup',
      sizeBytes: 2048,
      sourceObjectType: 'draft',
      targetObjectType: 'draft',
      triggerAction: 'overwrite-draft-from-browser',
      sourceOrigin: 'browser-current-tree',
      sourceVersionId: null,
      sourceVersionLabel: null,
    });

    expect(validation.ok).toBe(false);
  });
});

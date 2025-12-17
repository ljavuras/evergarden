---
created: 2025-12-16T11:00:11.830+08:00
aliases:
  - Workspace
  - evergarden-workspace
---
# Workspace

Provides workspace-related features.

## Extra workspace events

Two extra event are provided: `leaf-created` and `leaf-detached`. Check out `ProgressUpdateService.js` from [[System/packages/evergarden-library/README|evergarden-library]].

### Workspace.on('leaf-created') method

Triggered when a new [WorkspaceLeaf](https://docs.obsidian.md/Reference/TypeScript+API/WorkspaceLeaf) is created.

Signature:

```ts
on(name 'leaf-created', callback: (leaf: WorkspaceLeaf) => any, ctx?: any): EventRef;
```

When this event is triggered, the newly created leaf is passed to the callback.

### Workspace.on('leaf-detached') method

Triggered when a [WorkspaceLeaf](https://docs.obsidian.md/Reference/TypeScript+API/WorkspaceLeaf) is detached from [Workspace](https://docs.obsidian.md/Reference/TypeScript+API/Workspace).

Signature:

```ts
on(name 'leaf-detached', callback: (leaf: WorkspaceLeaf) => any, ctx?: any): EventRef;
```

When this event is triggered, the detached leaf is passed to the callback.
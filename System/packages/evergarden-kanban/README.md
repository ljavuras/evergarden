---
created: 2025-12-11T15:32:52.257+08:00
aliases:
  - Kanban
  - evergarden-kanban
---
# Kanban

This package doesn't implement a Kanban itself (yet), instead it provides a template used by [[System/packages/evergarden-project/README|Project]] and an API to parse and modify [Kanban](obsidian://show-plugin?id=obsidian-kanban)-formatted Markdown.

## Template

`note.project.kanban` is a [Kanban](obsidian://show-plugin?id=obsidian-kanban) template that creates four lanes: **Backlog**, **Ready**, **In Progress**, and **Done**.

## API

`Kanban.js` parses a Kanban-formatted Markdown, and provides methods to read and write a Kanban board.

Create a `Kanban` object like this:

```ts
const { Kanban } = await cJS();
const kanban = Kanban.get(file);  // Pass in an Obsidian TFile
// Use kanban to read and write the board
```

See the source code at `./customjs/Kanban.js` for the full list of methods.

You can also refer to these examples:

- [[System/packages/evergarden-issue-tracker/README#Issue toolbar|Issue toolbar]] (`datacore/IssueToolbar.tsx`)
- [[System/packages/evergarden-project/README#Kanban slice|Kanban slice]] in [[System/README|Evergarden]] (`System/script/Dataview/project/kanban/Slice`)
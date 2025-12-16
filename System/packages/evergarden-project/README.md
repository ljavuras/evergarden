---
created: 2025-12-09T21:09:30.377+08:00
aliases:
  - Project
  - evergarden-project
---
# Project

A project represents a focused area of work with a determined goal.

Projects are:

- Confined in a folder directly under `Project/`.
- Represented by a main note with project metadata.
- Marked with state such as `active`, `backlog`, or `archived`.

You can check out all projects in the vault in the [[#Project list]].

## Directory structure

```powershell
.                                     # Vault root
└── Project                           # All projects
    └── Project Name                  # Project folder for <Project Name>
        ├── issues/                   # Issue notes (optional)
        ├── notes/                    # Project notes (optional)
        ├── Project Name.md           # Main note
        ├── Issues - Project Name.md  # Issue tracker (optional)
        └── Kanban - Project Name.md  # Kanban (optional)
```

Each project is a separate folder named `Project Name` under `Project/`, with a [[#Main note]] also named `Project Name`. All notes related to the project goes into this folder. By convention, issue notes go into `issues/` and other notes go into `notes/`.

### Main note

The project main note keeps 3 properties of a project in frontmatter:

- `project/state`: Current state of the project (`active`, `backlog`, `archived`, etc.).
- `project/issue-tracker`: A link to the project's [[System/packages/evergarden-issue-tracker/README|Issue Tracker]].
- `project/kanban`: A link to the project's kanban.

The filename matches the project name, is tagged with `#a/project`, and represents a project itself.

### Project notes

#### Properties of project notes

- `project/main`: Link to [[#Main note]], to represent relation on graph view, and appear as main note's backlink.

#### Creating project notes

Project notes can be created by:

- Creating a note under a project folder.
- Clicking on an unresolved link in a project note.

The [[System/packages/violet-templater/README#Template resolver|template resolver]] will automatically apply `note.project.notes` template, and move the file to `Project/Project Name/notes/`.

Additionally, if the created note is conformed to the [format](https://momentjs.com/docs/#/displaying/format/) `[meeting.]YYYY-MM-DD`, template `note.project.notes.meeting` will be applied.

### Issue notes

Issue notes are created by a project's [[System/packages/evergarden-issue-tracker/README|Issue Tracker]]. The typical workflow is to create an issue, then send the issue to kanban directly by [[System/packages/evergarden-issue-tracker/README#Changing an issue's Kanban lane|issue toolbar]].

## Project list

All projects are listed in [[Projects]], grouped by project state.

## Commands

### Creating a new project

- [Package] Project: Create new project

![[Create project screenshot.png]]

This command prompts you for a new project name and creates the project folder and main note under `Project/`.

```powershell
.                           # Vault root
└── Project                 # All projects
    └── New Project         # Project folder
        └── New Project.md  # Main note
```

## Components

### Project navigation

Every project note template includes a navigation bar at the top.

![[Project navigation bar screenshot.png]]

The tabs provides links to:

- The project [[#Main note]].
- The project's [[System/packages/evergarden-issue-tracker/README|Issue Tracker]], showing the number of currently `open` issues.
- The project's kanban, showing the number of cards currently `In Progress`.

If no issue tracker or kanban is exists for the project, clicking on the corresponding tab will create one automatically for the project:

![[Project navigation without issue tracker and kanban.png]]

#### Using project navigation in Datacore

Project `Navigation` component doesn't take any props; it determines the project current note belongs to based on file path. 

```tsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```

### Kanban slice

Lists all cards currently *In Progress* from active projects' kanbans in the vault.

> [!ATTENTION]
> This component hasn't being packaged into this folder because it's still implemented with *Dataview*. So it remains in [[System/README|Evergarden]] under the path: `System/script/Dataview/project/kanban/Slice`

![[Kanban slice screenshot.png]]

#### Using kanban slice in Dataview

```js
dv.view("System/script/Dataview/project/kanban/Slice", {
    containerEl: YourEl,  // Optional container to render into
});
```
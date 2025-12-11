---
created: 2025-12-08T22:46:52.051+08:00
aliases:
  - Issue Tracker
  - evergarden-issue-tracker
---
# Issue Tracker

A working issue tracker in *Obsidian*. Each issue represented as a single note stored in a sub-folder where an issue tracker monitors.

> [!CAUTION]
> This package is not yet fully complete. Some older implementations still relies on *Dataview* and remain in *Evergarden*:
> 
> - Issue Tracker: `System/script/Dataview/IssueTracker/`
> - Project Navigation Bar: `System/script/Dataview/project/Navigation/`

## Directory layout

This is the default layout when used with [[System/packages/evergarden-project/README|Project]]. Issues ares stored in `issues/`, and Kanban file is provided by `evergarden-project` so that issues can be sent directly to the Kanban board.

```powershell
.
└── Project
    └── Project Name
        ├── issues/                   # Issue notes
        ├── notes/                    # Project notes
        ├── Project Name.md           # Project main note
        ├── Issues - Project Name.md  # Porject issue tracker
        └── Kanban - Project Name.md  # Project kanban
```

## Features

- List issues
- Create issues
- Filter & search issues

### Issue tracker view

Display all issues contained in the folder it monitors, and provides UI to search and create issues.

![[Issue tracker screenshot.png]]

#### Quick filtering

The UI includes clickable controls to help you filter issues faster:

- **Open/Closed** button: Apply or switch between `is:open` and `is:closed` in search query.
- **Label** chips: Toggle label filters `label:label-name` in search query.

#### Search bar

The search bar (to the left of **New Issue** button) supports both free-text search and filtering.

##### Free-text search

Typing a term matches issues whose title or content contain the term. For example, `evergarden` matches issues with "evergarden" in their title or content.

Search criteria is separated by space, cases are ignored, and hit **Enter** to apply search.

##### Preserve spacing

Use quotes `" "` to preserve spacing: `"Violet Evergarden"`.

##### Filters

Use `<type>:<search-term>` syntax to search for status, label and title.

| Type   | Example                                                |
| ------ | ------------------------------------------------------ |
| Status | `is:open`, `is:closed`, `status:open`, `status:closed` |
| Label  | `label:bug`, `label:"good first issue"`                |
| Title  | `title:package`, `title:"weather widget"`              |

### Issue toolbar

The issue toolbar displays the issue's open/close status, labels, and provides controls to:

- Close or reopen the issue.
- Change the issue's Kanban lane (when Kanban board exists).

![[Issue toolbar screenshot.png]]
![[Issue toolbar closed screenshot.png]]

#### Changing an issue's Kanban lane

If a Kanban board exists for a project, you send the issue directly to the board or move it between lanes.

![[Send to kanban example.png]]
![[Change lane example.png]]

## Usage

> [!ATTENTION]
> This guide assumes you already [[Project Violet#Usage|get packages working]]. If not, you can manually copy files to their appropriate locations in your vault.

### Using it with `evergarden-project` package (Recommended)

When used with [[System/packages/evergarden-project/README|Project]], you can create an issue tracker automatically:

1. Open a project.
2. Click **Issues** in the project navigation bar.
3. A new issues tracker is generated from `note.project.issue-tracker` template.

![[Creating issue tracker with project navitaion bar.png]]

### Using without `evergarden-project`

Currently, `evergarden-issue-tracker` is integrated with [[System/packages/evergarden-project/README|evergarden-project]], additional adjustments are required to use it independently. 

- Remove project navigation bars.
- Remove `Project` dependencies in issue toolbar, used to find project kanban.

Please report an issue if you can't get it working after completing the adjustments.

### Configuration options for issue tracker

You can configure the issue tracker by passing options to `dv.view()`:

````
```dataviewjs
await dv.view("System/script/Dataview/IssueTracker", {
    obsidian: obsidian,

    // Name of project, displayed when creating new issue.
    // project_name: <your project name>,

    // Sub-folder where issue notes go.
    // issue_folder: "issues/",

    // Template name, a template that exists in your templater folder.
    // issue_template: "note.project.issue",

    // Default query that shows up in the search bar.
    // default_query: "is:open",

    // Locale used for displaying date and time.
    // locale: "en-US",
});
```
````
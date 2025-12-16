---
created: 2025-12-09T23:09:36.715+08:00
aliases:
  - Periodic
  - evergarden-periodic
---
# Periodic

Creates periodic notes (daily, weekly, monthly, quarterly, and yearly), along with a few extra features.

## Folder structure

I usually navigate with calendar and [[#Navigation header]], so I keep periodic notes in a flat folder structure and rarely open them.

```powershell
.                   # Vault root
└── Periodic
    ├── daily/
    ├── monthly/
    ├── quarterly/
    ├── weekly/
    └── yearly/
```

## Templates

All templates can be found under `template/`.

I haven't established a workflow for my diaries yet, so only `note.periodic.daily` is actively in use. The other templates are deserted, even containing ancient `toggl` code block for [Toggl Track](obsidian://show-plugin?id=obsidian-toggl-integration), which I abandoned in favor of [[System/README#Markdown first|readability]].

Periodic notes are highly personal, so feel free to modify them to suit your own needs.

### Navigation header

Navigation headers are included in all template notes. They link to associated periodic notes, allowing you to quickly navigate between daily, weekly, monthly, quarterly, and yearly notes.

![[Periodic header recording.gif]]

## Commands

The package introduces 7 commands:

- [Package] Periodic: Open daily note
- [Package] Periodic: Open weekly note
- [Package] Periodic: Open monthly note
- [Package] Periodic: Open quarterly note
- [Package] Periodic: Open yearly note
- [Package] Periodic: Navigate forward
- [Package] Periodic: Navigate backwards

The *navigate forward* and *navigate backwards* command takes you to the next or previous note of the same periodic type. For example, if you're focused on a daily note, they'll take you to the next or previous daily note; the same applies to weekly, monthly, quarterly, and yearly notes.

### Configuration

#### Filename format

Format settings can be configured in `settings.json`:

```json
{
    "format": {
        "yearly": "YYYY",
        "quarterly": "YYYY-[Q]Q",
        "monthly": "YYYY-MM",
        "weekly": "gggg-[W]ww",
        "daily": "YYYY-MM-DD"
    },
    /* ... */
}
```

#### File path

Modify *CustomJS* script `Periodic.js` to change where periodic notes are stored:

- Base path for all periodic notes: `Periodic._path`.
- Path for each periodic type: `Periodic.PeriodicType.path`.

If you are using multiple periodic types of notes, please share your folder structure to help shape future configuration options.

## Roll over tasks from previous periodic note

*CustomJS* script `Periodic.js` provides `rolloverTask()` method to roll over tasks from last periodic note:

```js
customjs.Periodic.rolloverTask(period, header, force = false)
```

- `period`: The filename of the current periodic note you want tasks to roll over to. Tasks are rolled over from the last periodic note of the same type. For example, yesterday's tasks roll over to today, last week's tasks roll over to this week, and similar to monthly, quarterly, and yearly notes.
- `header`: The header section where tasks are rolled over from.
- `force` (optional): Forces rollover even when the tasks are completed. Set this to `true` if you want tasks to recur.

### Example

The following *Templater* template creates tasks that occur daily and task that were incomplete yesterday.

```
## Task
### Daily
<% Periodic.rolloverTask(tp.file.title, 'Daily', true) %>

### Today
<% Periodic.rolloverTask(tp.file.title, 'Today') %>
```

## Automatic template insertion

Any note whose file name conforms to [[#Filename format]] will be identified by [[System/packages/violet-templater/README#Template resolver|template resolver]] and created using their corresponding template.
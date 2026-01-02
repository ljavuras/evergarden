---
created: 2025-12-16T21:27:37.198+08:00
---
# Installed plugins

## Critical plugins

Plugins that has effect on the actual Markdown, and won't work properly if the plugin is disabled

### CustomJS

| Setting          | Value                                           | Description                                                            |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Individual files | System/packages/violet-core/customjs/_Violet.js | Executes `_Violet.js` to enable [[Violet Package]]                     |
| Folder           | System/script/CustomJS                          | Path for [[System/README#`System/script/` User scripts\|user scripts]] |

### Templater

| Setting                                | Value           | Description                                                                                |
| -------------------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Template folder location               | System/template | [[System/README#`System/template/` *Templater* templates\|Evergarden directory structure]] |
| Automatic jump to cursor               | true            | Why not?                                                                                   |
| Trigger Templater on new file creation | true            | To enable [[System/packages/violet-templater/README#Template resolver\|template resolver]] |
| Enable folder templates                | true            | To enable [[System/packages/violet-templater/README#Template resolver\|template resolver]] |

Under folder templates, add a folder `/` with template `System/packages/violet-templater/template/system.main.md`.

Autocomplete might not list this path as an available option, because it's not under `Template folder location`, but *Templater* actually doesn't cares and can still execute the template.

`system.main.md` will trigger the [[System/packages/violet-templater/README#Template resolver|template resolver]], and find the appropriate template for the newly created note.

### Dataview

| Setting                          | Value            | Description                                                                               |
| -------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| Enable JavaScript queries        | true             | Enables custom UI like [[System/packages/evergarden-issue-tracker/README\|Issue Tracker]] |
| Enable inline JavaScript queries | true             |                                                                                           |
| Display result count             | false            |                                                                                           |
| Date format                      | yyyy/MM/dd       | ISO 8601                                                                                  |
| Date + time format               | yyyy/MM/dd HH:mm | Similar to ISO 8601                                                                       |
| Primary column name              | Note             |                                                                                           |

### Datacore

| Setting                  | Value               | Description                                           |
| ------------------------ | ------------------- | ----------------------------------------------------- |
| Default date format      | YYYY/MM/dd          | ISO 8601                                              |
| Default date/time format | YYYY/MM/dd HH:mm ZZ | Similar to ISO 8601                                   |
| Inline fields            | false               | Avoid [[System/README#Markdown first\|custom syntax]] |

### CodeScript Toolkit

| Setting             | Value                                 | Description                                                                 |
| ------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Script modules root | System/script/CodeScriptToolkit/.root | Put scripts under `.root/` prevents *Obsidian* from indexing `node_modules` |

## Helper plugins

Plugins that have an effect on workflow, but do not have an impact on the actual content of the files. The vault will still work if the plugin is disabled, but with some inconvenience.

### Kanban

Settings for kanban doesn't really effect the workflow, and is purely personal preference.

## Cosmetic plugins

Purely for appearance, improves UI, but do not have any impact on workflow or file content.
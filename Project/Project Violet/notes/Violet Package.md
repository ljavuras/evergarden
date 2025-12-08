---
created: 2025-01-06T18:06:10.880+08:00
template/name: "[[note.project.notes]]"
template/version: 3
project/main: "[[Project Violet]]"
---
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# Violet Package

A package is a folder that contains user scripts (*Templater* templates, *CustomJS* scripts, *Datacore* scripts...etc), which implements a workflow. Drop the folder into your designated directory, and the workflow becomes available in your vault.

## Difference between package and plugin

- Plugins are updated only by its developers while packages are meant to be modified and adapted into users' own vault
- Package doesn't have to be executable scripts, they can be a collection of CSS snippets, templates, or even just a list of dependencies that includes other packages, creating a complete vault experience: a **vault distro**.

## Features

- Modular, only install workflows you need
- Code sharing between packages, similar to *npm* packages
- Empowers user to modify and create customized workflows
- Combine and release **distros** (a package simply lists multiple packages as dependencies)
- Register required files, folders, plugins, plugin settings, tags, and frontmatter
- Download, install, update from GitHub, fetch dependencies and resolve conflict with local files
- Uninstall, detect broken notes?

## Package design goals

- Modular
    - Does one thing at a time
    - Works with other packages
        - Provides interface
- Works with users' vaults
    - Does not require users to modify their vault to adopt new workflows
    - Provides settings to fit into user's vault
        - Path
        - Tag
        - Frontmatter
        - Definition of certain type of file
        - Measure to query files of certain type

### Package format

#### `package.json`

Package definition, used by [[Violet Package Service]] to provide various features.

```json:package.json
{
    "id": "package-id",
    "name": "Name",
    "version": "0.0.1",
    "description": "Package description",
    "author": "Author Name",
    "source": "https://github.com/user/repository-name",
    "dependencies": {
        "required": [
            "required-package-id": {
                "version": "^1.0.0",
            }
        ],
        "recommended": []
    }
}
```

#### `settings.json`

Package settings, changed by user to customize package behavior. 

```json:settings.json
{
    "settings-1": "value",
    "settings-2": "value",
    "friend": {
        "friend-package-id-1": {
            "settings-1": "value",
            "settings-2": "value"
        }
    }
}
```

Friend settings are settings exposed by friendly packages to guide their behavior. For example, this `settings.json` from package `evergarden-area`, tells `violet-datacore` that their *Datacore* scripts are under `path/to/packages/evergarden-area/datacore/`:

```json:settings.json
{
    "friend": {
        "violet-datacore": {
            "folders": [
                "datacore"
            ]
        }
    }
}
```
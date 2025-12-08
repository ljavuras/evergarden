---
created: 2025-01-06T18:09:27.410+08:00
template/name: "[[note.project.notes]]"
template/version: 3
project/main: "[[Project Violet]]"
---
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```

> [!ATTENTION]
> The plugin is still **under development**, none of the features described in this note are released, please **DO NOT** follow instructions from [[#Migrate scripts from *CustomJS*]].
> 
> This document is only a reference, a roadmap for myself and a proposal to the community for feedback.

# Violet Package Service

*Violet <!-- Postal -->Package Service* is a package manager plugin for [[Violet Package|violet packages]].

## Features

- Download packages.
    - Discover packages from package listings.
    - Fetch packages and their dependencies automatically.
- Execute *CustomJS* scripts, with some modifications:
    - Features:
        - Additional `packageFolder` argument passed into class constructor.
        - Provides global variable `VPS` to access *Violet Package Service* api.
        - Provides `VPS.Package` class.
        - Only reload modified script, instead of reloading every script like *CustomJS* does.
        - Use `VPS.require('package-id')` to access class instances instead.
            - Class instances still exists under `customJS` global variable for compatibility.
            - `VPS.cJS()` and `VPS.customJS` exist for migration purpose
            - `VPS.cJS()` and `VPS.customJS` doesn't resolve class name clashes between packages.
            - Packages should phase out and adopt `VPS.require()`
    - Breaking change:
        - Doesn't load classes by alphabetical order.
        - **No invocable function**, use `addCommand()` instead.
        - **No startup scripts**, use `constructor()` or `onload()` instead.

## Migrate scripts from *CustomJS*

> [!ATTENTION]
> **DO NOT** follow this guide, [[Violet Package Service]] is still under development, and this instruction **doesn't work** with current implementation.
> 
> If you wish to start developing packages now, check out *CustomJS* scripts from `evergarden-*` packages for examples and [[Project Violet#Package existing scripts]].

```js
class CustomClass extends VPS.Package {
    onload() {
        // Creates command: [Package] Package Name: Execute invoke function
        this.addCommand({
            id: "custom-class-invoke",
            name: "Execute invoke function",
            callback: this.invoke
        });

        // If you invoke on startup
        invoke();
    }

    async invoke() { /* Your invoke function */ }
}
```

### Request file from GitHub
- [obsidian42-brat/src/features/githubUtils.ts](https://github.com/TfTHacker/obsidian42-brat/blob/671a14ff04caeed3dff9a9b418c57a85a0d8aed8/src/features/githubUtils.ts)
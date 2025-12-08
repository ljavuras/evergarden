---
created: 2025-04-13T00:53:29.744+08:00
project/state: active
tags:
  - a/project
template/name: "[[note.project.main]]"
template/version: 3
project/kanban: "[[Kanban - Project Violet]]"
---
```datacoretsx
await cJS(({ Datacore }) => dc = Datacore.wrap(dc));
return await dc.require("evergarden-project", "Navigation");
```
# Project Violet

A project focused on creating **modular** and **shareable** user scripts for *Obsidian*.

## Problem

There's an abundance of great starter vaults, scripts, and templates being shared in the community, but often times, I can't really apply them. They require a specific folder structure, tag and frontmatter conventions that doesn't fit into my active vault.

The reverse is also true, my vault is developed to cater my own needs. It's very specific and people might not want every feature of it. It's a shame when people can't adopt it just because a part of it clash with their workflow.

[Obsidian Power Tools](https://github.com/ljavuras/obsidian-power-tools) is my previous effort to share my work, ripping of dependencies allowing people to adapt. Which is a huge effort to maintain, because it basically creates two versions of the same set of features.

## Solution

My solution is to create a framework, allowing related scripts to be bundled into [[Violet Package|violet packages]], sharing simply becomes a drag and drop.

Even better is to have [[Violet Package Service]] (under development) to work as a package manager, handle downloading and dependency, allowing people to explore new packages through package listings, just like community plugins.

## Usage

It is still in its early stages of development, but basics are established. If you wish adopt packages in your own vault, and start developing packages, these are the steps:

1. Copy `Obsidian.js` and `Script.js` from `System/scripts/` to your *CustomJS* folder.
2. Copy packages `violet-core`, `violet-templater` and `violet-datacore` to a directory you wish to store packages.
3. Change `violet-core`'s `packagesPath` setting to the path of your packages' directory in `settings.json`.
4. Add `path/to/packages/violet-core/customjs/_Violet.js` to your `Individual files` settings in *CustomJS*.
5. If you wish to use `evergarden-*` packages, check the code, and copy depending packages and *CustomJS* scripts to your vault. %% (Yeah, it's horrible, so I released the whole vault:/) %%
6. File an issue if you followed the above steps, but still couldn't get packages working.

After setting up, you may now bundle *CustomJS scripts*, *Templater templates* and *Datacore components* into a single folder. Other plugins aren't supported yet. %% (Because I don't use them. *Dataview* scripts still exist in *Evergarden*, but I'm slowly migrating them to *Datacore*, so I didn't bother to implement `violet-dataview`.) %%

### Package existing scripts

1. Setup `package.json` and `settings.json` described in [[Violet Package#Package format]]. Check out `evergarden-*` packages for examples of friend settings.
2. Move *Templater* templates, *CustomJS* scripts and *Datacore* components into your package folder (and their respective subdirectories, that's what I did with `evergarden-*` packages). *Templater* templates should work out of the box.
3. *CustomJS* scripts mostly will work, except if you implement *invocable function* `invoke()` or setup *startup scripts*, then you'll have to modify it as follows:
   ```js
    class CustomClass extends customJS.Violet.Package {
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
4. *Datacore* scripts doesn't need any modification, but `datacore[jt]sx?` code blocks has to be updated, you may simply update `dc.require()` path to:
    ```tsx
    const Component = await dc.require("new/path/to/Component.tsx");
    ```
    Or take advantage of the new feature `violet-datacore` provides:
    ```tsx
    await cJS(({Datacore}) => dc = Datacore.wrap(dc));  // Inject new features
    const Component = await dc.require("package-id", "Component");
    ```
    This new `require()` makes your code path-independent, and will even apply `Component.css` for you, if it is found under the same directory.

## Current Implementation

The trick to bundle different scripts under a folder, are these three packages:

- `violet-core`: Scans across packages, and instantiate classes of *CustomJS* scripts it picks up.
- `violet-template`: Scans across packages, keep track of templates and triggers *Templater*'s internal functions to insert templates.
- `violet-datacore`: Scans across packages, builds components objects, and return them when users require them by `dc.require("package-id", "ComponentName")`.

## Future goals

The end goal is to have [[Violet Package Service]] published as community plugin. Adopting packages would be simplified down to installing another plugin.

![[Minimal working product#Minimal working product]]
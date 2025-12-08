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

There's an abundance of great starter vaults, scripts, and templates shared within the community, but I often can't apply them. They require specific folder structures, tag/frontmatter conventions that don't fit into my active vault.

The reverse is also true: my vault is developed to cater my own needs. It's very specific and people might not want every feature of it. It's a shame when people can't adopt it just because a part of it clashes with their workflow.

[Obsidian Power Tools](https://github.com/ljavuras/obsidian-power-tools) was my previous effort to share my work by stripping out dependencies so people could adapt it. That was difficult to maintain, because it effectively creates two versions of the same code.

## Solution

My solution is to create a framework that allows related scripts to be bundled into [[Violet Package|violet packages]], making sharing as simple as drag-and-drop.

The final goal, is to have [[Violet Package Service]] (under development) serve as package manager, handle downloading, dependency and browsing similar to community plugins.

## Usage

It is still in early stages of development, but foundations are established. If you wish adopt packages in your own vault or begin developing packages, follow these steps:

1. Copy `Obsidian.js` and `Script.js` from `System/scripts/` into your *CustomJS* folder.
2. Copy packages `violet-core`, `violet-templater` and `violet-datacore` to a directory you plan to store packages.
3. Change `violet-core`'s `packagesPath` settings in `settings.json` to `path/to/your/packages/`.
4. Add `path/to/packages/violet-core/customjs/_Violet.js` to your `CustomJS > Individual files` settings.
5. If you want to use `evergarden-*` packages, review the code and copy dependent packages and *CustomJS* scripts to your vault. %% (Yeah, it's horrible, so I released the whole vault:/) %%
6. File an issue if you followed all the steps but still can't get packages working.

After setup, you can bundle *CustomJS scripts*, *Templater templates* and *Datacore components* into a single folder. Other plugins aren't supported yet. %% (Because I don't use them. *Dataview* scripts still exist in *Evergarden*, but I'm slowly migrating them to *Datacore*, so I didn't bother implementing `violet-dataview`.) %%

### Building packages

1. Setup `package.json` and `settings.json` described in [[Violet Package#Package format]]. Check out `evergarden-*` packages for examples of `friend` settings.
2. Move related *Templater* templates, *CustomJS* scripts and *Datacore* components into your package folder and update `settings.json` accordingly. Check out `evergarden-*` packages for examples. *Templater* templates should work out of the box.
3. *CustomJS* scripts mostly will work, except if you implement *invocable function* `invoke()` or utilize *startup scripts*. In that case, modify them as follows:
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
1. *Datacore* scripts requires no modification, but `datacore[jt]sx?` code blocks has to be updated, you can simply update `dc.require()` path to:
    ```tsx
    const Component = await dc.require("new/path/to/Component.tsx");
    ```
    Or use the new feature `violet-datacore` provides:
    ```tsx
    await cJS(({Datacore}) => dc = Datacore.wrap(dc));  // Inject new features
    const Component = await dc.require("package-id", "Component");
    ```
    This new `require()` makes your code path-independent, and will automatically apply `Component.css` if it exists in the same directory.

## Current Implementation

The trick to bundling different scripts inside a package folder lies in these three packages:

- `violet-core`: Scans packages and instantiate *CustomJS* script classes.
- `violet-template`: Scans packages, tracks templates and triggers *Templater*'s internal functions to insert templates.
- `violet-datacore`: Scans packages, locates the exact component and their stylesheet when users call `dc.require("package-id", "ComponentName")`.

## State of the project

Currently, *Project Violet* is only a proof of concept. It's not ready to ship, but it demonstrates a potential future of user scripting in *Obsidian*.

### Future goal

The end goal is release [[Violet Package Service]] as community plugin and build a thriving ecosystem around it.

![[Minimal working product#Minimal working product]]
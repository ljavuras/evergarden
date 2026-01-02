---
created: 2025-12-02T22:08:00.049+08:00
aliases:
  - Evergarden
---
# Evergarden

Vault *Evergarden* is mirrored directly from my working vault and reflects the exact workflow I use. It's built with a strong focus on [[#Goal|automation]] and [[#Maintainability]], allowing the vault to grow with me as my needs change.

## Goals

I love **automation** and **streamlined UI**, so this is the result. %% I know, it's [bad](https://xkcd.com/1319/) and [not worth it](https://xkcd.com/1205/). %%

## Design choices

While [[#Goals|automation]] is fun, I still want my content to remain **future-proof**. These goals often conflict, so choices have to be made.

### Markdown first

Files should remain readable outside *Obsidian*.

- Avoid plugins that create huge chunks of unreadable text.
- Stick closely to plain Markdown and avoid custom syntax, including *Dataview*'s `key::value` inline field.
- [[Headings should form tables of contents]].

### Minimize dependency

Automation and UI are built only on well-supported, popular plugins, notably:

- [Dataview](obsidian://show-plugin?id=dataview)/[Datacore](obsidian://show-plugin?id=datacore)
- [Templater](obsidian://show-plugin?id=templater-obsidian)
- [CustomJS](obsidian://show-plugin?id=customjs)
- [CodeScript Toolkit](obsidian://show-plugin?id=fix-require-modules)

Other plugins I use are non-intrusive and do not affect actual text.

[Kanban](obsidian://show-plugin?id=obsidian-kanban) is an exception, because its format is mostly Markdown, and it provides significant convenience, but syntax specific to *Kanban* are avoided.

[[Properties#Creating structured metadata|Nested YAML are also avoided]].

### Maintainability

Preferences and workflows change, and I want the ability to restructure the vault accordingly. Therefore, maintainability is a major priority, ensuring the vault can be **refactored** and **further developed**.

- Establish conventions that favor programmatic manipulation, so [[Mass edit notes without plugins]] is possible.
    - [[Tags#Why not use tags for content?]]
- Continuing on this path, [[Templates]] is the final product: every note in the vault is generated from a template and can be updated to match the latest version of its originating template.
- [[Project Violet]], accomplishing modular and packaged user scripts, creating shareable workflows.

### Seamless

UI and workflow should look and feel native to *Obsidian*. Familiar, consistent patterns reduce cognitive load and create a smoother and intuitive experience.

## Folder Structure

Everything related to operating the vault goes into `System/`, thus *Evergarden* is mostly a mirror of `System/` folder from my working vault.

Contents generally goes in the root folder `/`, unless it's highly structured and unambiguous, e.g., `Project/` and [[System/packages/evergarden-periodic/README#Folder structure|Periodic/]]. Non-text content goes into `Attachment/`.

```powershell
.
├── .obsidian/snippets  # CSS snippets
│   └── ...
├── Attachment/         # Images, PDFs...etc
├── Periodic/           # Daily, weekly, monthly, quarterly, yearly notes
├── Project/            # Project folders
│   ├── Demo Project/   # Each project is given a separate folder
│   └── ...
├── System              # Everything that is not content
│   ├── bin/            # Executables required for some plugins to work
│   ├── clipper/        # Templates for Obsidian Web Clipper
│   ├── docs/           # Documentation on the system
│   ├── packages/       # Violet packages, see [[Project Violet]]
│   ├── script/         # User scripts for various plugins
│   ├── template/       # Templater templates
│   ├── README.md       # Overview of Evergarden
│   └── ...             # Non-content, functional pages, e.g., homepage.
└── ...                 # All content goes here
```

### `System/script/`: User scripts

Various plugins allow users to execute JavaScript code, those belongs to `script/` folder. Each plugin has its own quirks in how their scripts are written, so they are organized by plugin.

```powershell
.
└── System                       # Evergarden system files
    └── script                   # User scripts
        ├── CustomJS/            # CustomJS scripts
        ├── Datacore/            # Not used, migrated to packages
        ├── Dataview/            # Dataview scripts
        │   └── path/to/script/  # Each Dataview script gets a separate folder
        │       ├── view.js      # DataviewJS script
        │       └── view.css/    # DataviewJS stylesheet
        └── QuickAdd/            # QuickAdd scripts, migrated to packages
```

Conveniently, *CustomJS*'s `Folder` settings is `System/script/CustomJS`.

### `System/template/`: *Templater* templates

*Templater* is the most popular templating plugin and it does the job, so it's the only plugin I use to template, even the core plugin *Templates* is disabled.

Templates live under `System/template/`, which is also set as *Templater*'s `Template folder location` settings.

#### Naming templates

Template names follow a strict pattern [inspired by *Dendron*](https://blog.dendron.so/notes/3dd58f62-fee5-4f93-b9f1-b0f0f59a9b64/#finding-the-truth). This schema groups related templates together and creates hierarchy, especially since *Templater* disregards folders.

This naming scheme also provides convenience for automation, `bug.*`, `depr.*`, `system.*` are easily filtered out for users, and `*.update.\d+` are recognized as updater templates.

| Name             | Description                               |
| ---------------- | ----------------------------------------- |
| `inline.*`       | Templates that do not take a full line.   |
| `block.*`        | Templates that take up full lines.        |
| `note.*`         | Templates that occupies a full page.      |
| `note.project.*` | Project notes.                            |
| `system.*`       | Templates used by scripts and automation. |
| `depr.*`         | Deprecated templates.                     |
| `bug.*`          | Templates for reproducing bugs.           |
| `(.*?).update.1` | Updater for version 1 of `$1` template.   |

### `System/packages`: Violet packages

[[Project Violet]] is my ultimate answer to [[#Maintainability]]. It bundles complete workflows into single, shareable folder.

Take the *Project* feature (`evergarden-project`), as an example. The full workflow includes:

- A *CustomJS* script powering automation,
- A *Datacore* component that renders navigation UI, and 
- *Templater* templates for note creation.

Previously, anyone who wanted to adopt this workflow had to copy files to three separate locations, and adjust the *Datacore* `dc.require` path inside templates, which is tedious and error-prone. With [[Project Violet]], you simply drop the package folder into your designated packages directory, and everything just works.

You can start [[Project Violet#Building packages|building packages]] right now, as the [[Violet Package#Package format|package format]] is expected to remain relatively stable for the foreseeable future.

## Tags and properties

*Evergarden* is opinionated and biased towards [[#Goals|automation]], utilizing tags and properties with scripting in mind:

- [[Tags]]: note classification, because [[Tags#Why not use tags for content?|scripts are good at filtering with tags]].
- [[Properties]]: store data managed by scripts.

## Why I publish this vault

- To gain early feedback on [[Project Violet]] and [[Project Violet#State of the project|guide its development]]. So do reach out because I'd love to hear your thoughts!
- I've already [[#Goals|sunk time]] into building it. Sharing the product may help others, makes my time spent a little more worthwhile.
- [[Project Violet#Using packages|Package dependencies]] aren't fully sorted out yet, publishing the whole vault ensures everything work, so people can start playing with it.
- To invite people to [[Project Violet#Building packages|join]] the [[Project Violet#Future goal|ecosystem]], and maybe even developing packages that fit straight into my vault.
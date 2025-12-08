---
created: 2025-12-05T18:18:53.132+08:00
---
#zettel/permanent 

# Properties

Properties in [[System/README|Evergarden]] are intended to power [[System/README#Goals|automation]].

## Properties are mostly managed by scripts

[[#Properties are easily manipulated by scripts]] and [[#Properties are hidden away|hidden away]], if you need to edit them, a [[System/README#Goals|tailored UI]] is preferred over the [[#Editing properties manually|old fashioned way]].

## Properties are easily manipulated by scripts

*Obsidian* provides APIs for reading and writing frontmatter, *Dataview* and *Datacore* even supplies parsed metadata, which is very convenient for [[System/README#Goals|building automation]].

## Properties are hidden away

The amount of metadata stored across notes can vary greatly, creating visual inconsistency. Some notes even store up to 20 properties, which can greatly interfere with reading, so they are hidden away.

If you prefer seeing properties on top of notes, change the setting in `Editor > Properties in document`.

### Editing properties manually

When I do need to edit properties directly, I keep the *Files properties* panel on the side. It provides enough space to lay out properties, and doesn't interfere with content of the note.

## Naming convention

To prevent naming conflicts between multiple scripts, properties are suggested to be **namespaced**. For example:

- Package `evergarden-issue-tracker` uses `issue` namespace, storing issue number in `issue/no`.
- When package `evergarden-library` also decides to store its `no` property, they won't conflict, because it's stored as `library/series/no`.

### Creating structured metadata

*Obsidian* doesn't support [structured frontmatter](https://help.obsidian.md/properties#Not+supported), but we can extend further and create deeper hierarchies ourselves. For example, package `evergarden-library` stores publisher and publish date as:

- `library/publish/publisher`
- `library/publish/date`

#### Long property names

This can create long names like `library/rating/community/count`, but don't worry, because properties are mostly [[#Properties are mostly managed by scripts|managed by scripts]] and [[#Properties are hidden away|hidden away]].
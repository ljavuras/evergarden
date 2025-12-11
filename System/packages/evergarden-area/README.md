---
created: 2025-12-05T16:14:11.952+08:00
aliases:
  - Area
  - evergarden-area
---
# Area

*Area* are special notes used to tag content. They can represent topics, themes, or anything else depending on your use case.

Any note that links to an *area*, i.e., `[[a-Area Name]]`, is considered part of that *area* and will appear in the *area note*.

![[Area screenshot.png]]

Do not confuse it with the Area from PARA, it's more similar to a dynamic version of MOC (Maps of Content) or structure notes from Zettelkasten.

## Usage

> [!ATTENTION]
> This guide assumes you already [[Project Violet#Usage|get packages working]]. If not, you still can make it work by copying files to their appropriate location in your vault.

Create an *area* note with the template `note.area`.

If you downloaded the whole [[System/README|Evergarden]] vault, clicking on any unresolved link starting with `a-`, will automatically create an *area* note for you.

## Super areas

Each *area* can specify one or more *super-areas* by putting links in `area/super` property, making itself their *sub-area*. Notes tagged with an *area* will also appear in its *super-area*.

![[Super-area screenshot.png]]

## Displaying all existing areas

Check out [[Areas]].

## Convention and assumptions

Currently, *area* notes are expected to start their filenames with `a-`, identify themselves with `#note/area` tag, and specify *super-areas* by `area/super` property.

This convention won't work for everyone, and configuration options will be provided in the future. For now, you can modify the source code yourself, and fix bugs in other workflows caused by these assumptions.

## Bugs

Areas should form directed acyclic graph. Cycle detection isn't been implemented yet. **DO NOT** create circular *super-areas*, I didn't dare to test it, but it could result in an infinite loop and freeze *Obsidian*.
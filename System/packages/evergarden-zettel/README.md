---
created: 2025-12-11T20:36:08.924+08:00
aliases:
  - Zettel
  - evergarden-zettel
---
# Zettel

A Zettelkasten workflow built for [[System/README|Evergarden]].

There are 3 types of notes, each identified by a different tag:

- `#zettel/fleeting`: Short, quick note that serve as a reminders of ideas that pop up.
- `#zettel/literature`: Consumed ideas from `#a/source`, but written in your own words.
- `#zettel/permanent`: Insights that can be used for publish.

## Fleeting note

Be quick, be frictionless, so you can do it without resistance, and by habit every time an idea comes across your mind.

It isn't a full description of an idea, it's merely a reminder, to be discarded later on after fully fledged as permanent note.

### Creating fleeting notes

`Create new note from template` `note.fleeting`.

## Literature note

Rewrite ideas from a source in your own words, and in the context of your own interest and research, that is, your web of [[#Permanent note|permanent notes]].

Be selective, don't just copy any quote or sentences you want to remember, only collect insights that can be published. The goal is to build permanent notes to critical mass.

### Referencing sources

Literature keeps references with two properties:

- `literature/reference`: A list of links to `#a/source` notes.
- `literature/reference/locator`: A list of locators identifying specific parts the being cited (e.g., page numbers, timestamps).

Using lists gives literature notes the ability to reference multiple sources, which is especially useful when dealing with [[System/packages/evergarden-library/README#Multiple editions|multiple editions]]:

```yaml
literature/reference:
  - "[[Source 1]]"
  - "[[Source 2]]"
literature/reference/locator:
  - p. 12
  - p. 21-22
```

This literature note cites page 12 from `[[Source 1]]` and page 21-22 from `[[Source 2]]`. It will appear as an associated [[System/packages/evergarden-library/README#Display associated literature notes|literature note]] in both sources.

### Creating literature notes

`Create new note from template` `note.literature`.

The template prompts you for locator upon creation, so you don't need to edit `literature/reference/locator` manually.

### Referencing sources automatically

The template `note.literature` can automatically fill in `literature/reference` upon creation if:

- A `#a/source` note is focused. The focused note is automatically added to `literature/reference`.
- A `#zettel/literature` note is focused. The `literature/reference` of the previous literature note is copied to the new note.

The intended workflow is to pin a source note on one side and focus on it. [[#Creating literature notes]], will automatically link the source note, and prompt you for locator, avoiding editing properties manually.

Once you start writing literature notes, subsequence literature notes will inherit the reference from previous literature notes.

## Permanent note

The goal is to develop ideas, make connections, and think about it in terms of the relations of existing notes in your Zettelkasten.

Write about insights you want to publish, and do so in an atomic fashion, so ideas can be played around, restructure like Lego blocks.

### Creating permanent notes

- `Create new note from template` `note.permanent`.
- Clicking on unresolved links in permanent notes creates permanent notes by [[System/packages/violet-templater/README#Template resolver|template resolver]].
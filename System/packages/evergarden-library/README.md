---
created: 2025-12-11T18:31:25.973+08:00
aliases:
  - Library
  - evergarden-library
---
# Library

The library package creates a complete book-reading workflow, covering collecting, reading, and taking literature notes.

## Collecting books

### Clipping from Goodreads

Use the [Obsidian Web Clipper](https://obsidian.md/clipper) with the provided clipper template (`goodreads-clipper.json`) to collect books as notes in *Obsidian*.

## The library

`Library.base` displays all books clipped from Goodreads. Books are identified by the tag `#a/source/book`.

![[Library screenshot.png]]

## Book note

Each book is represented as a note created by the [[#Clipping from Goodreads|Goodreads clipper template]].

### Book overview

Each book note includes a `BookOverview` *Datacore* component that displays information about the book.

![[Book overview screenshot.png]]

Genres actually are [[System/packages/evergarden-area/README|Area]] notes (notes starts with `a-`), clicking on a genre automatically creates an area note by [[System/packages/violet-templater/README#Template resolver|template resolver]].

A lot of information is stored in the frontmatter to display in the `BookOverview`. Most properties do not need to be managed, except for the following:

| Property           | Description                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `library/file`     | Link to the PDF book in your vault. Allows the *Read now* button to open the PDF file if provided. Edit manually via *Obsidian*'s property view. |
| `library/rating`   | Your personal rating. Edit manually via *Obsidian*'s property view.                                                                              |
| `library/status`   | One of: `not owned`, `on wishlist`, `borrowed`, `owned`, `lent out`                                                                              |
| `library/stage`    | One of: `to read`, `reading`, `finished`, `on hold`, `abandoned`                                                                                 |
| `library/progress` | Current page you are currently on. Details are described in the following section.                                                               |
If the total page (`library/length`) is incorrect, you can click on the total page number above the progress bar to update it.

Clicking the ISBN copies it to your clipboard.

#### Track reading progress

Reading progress **updates automatically** when using *Obsidian*'s built-in PDF reader. *CustomJS* script `ProgressUpdateService.js` listens for `PDF.js`'s `PageChangeEvent` and updates`library/progress` in associated book notes.

You can also update progress manually by clicking the page number above the progress bar.

### Multiple editions

If there are multiple editions of a same book, they will appear in the **More editions** section through an embedded `editions.base`. Books are identified as same if they share the same `aliases` property.

![[Editions bases screenshot.png]]

There are many nuances in identifying books as different editions of the same work, and I haven't found a reliable way to do it automatically. For now, `aliases` have to be managed manually.

### Display associated literature notes

This feature works together with [[System/packages/evergarden-zettel/README#Literature note|literature notes]]. It display literature notes that [[System/packages/evergarden-zettel/README#Linking literature note to sources|links]] the book from their `literature/reference` property.

![[Literature notes screenshot.png]]

### Taking literature notes

When focused on a book note, creating a [[System/packages/evergarden-zettel/README#Literature note|literature note]] automatically links it to the book, and prompts for a locator up front, eliminating the need to edit from the property view.

## Book series

If a book belongs to a series, it will appear as a link to `[[Series Name (Series)]]`.

![[Book with series screenshot.png]]

### Creating a series note

Series are notes with filenames end with ` (Series)`. Clicking a series link automatically creates a series note from template `note.library.series` by [[System/packages/violet-templater/README#Template resolver|template resolver]].

![[Series screenshot.png]]


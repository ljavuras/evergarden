---
created: 2025-12-05T15:19:09.651+08:00
---
#zettel/permanent 

# Tags

In [[System/README|Evergarden]], tags are used to label **properties** of a note, not to describe its **content**. For example:

- `#a/source/book`: The note is about a book.
- `#is/personal`: The note is personal.
- `#status/pending`: The note is waiting to be revisited.

## Tags used in Evergarden

These are some of the tags used in [[System/README|Evergarden]].

| Tag                | Description                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `note/*`           | Used by various automation for filtering their responsible notes.                                                                                                                   |
| `note/periodic/*`  | Periodic notes managed by `evergarden-periodic`.                                                                                                                                    |
| `note/issue`       | An issue note, fetched by issue tracker.                                                                                                                                            |
| `note/area`        | An area note, used by `evergarden-area`.                                                                                                                                            |
| `note/tag`         | A note documenting tags; tag pages are provided by *Tag Wrangler*.                                                                                                                  |
| `is/personal`      | The note is personal and not meant to be seen by others                                                                                                                             |
| `is/dynamic`       | The displayed content largely depends on other notes, e.g., dashboards. Automatically toggles reading mode by [[System/packages/evergarden-auto-view-mode/README\|Auto View Mode]]. |
| `zettel/*`         | Zettelkasten notes.                                                                                                                                                                 |
| `a/*`              | Nouns.                                                                                                                                                                              |
| `a/source/*`       | The note represents an information source.                                                                                                                                          |
| `a/source/book`    | The note is about a book.                                                                                                                                                           |
| `a/source/website` | The note contains metadata of a website, or is a clipping of a webpage                                                                                                              |
| `a/project`        | A project, used by `evergarden-project`.                                                                                                                                            |
| `depr/*`           | Deprecated tags.                                                                                                                                                                    |

## Where to place tags?

For characteristics to **do not change**, place them in frontmatter under `tags`, such as `#note/*`, `#a/*`. They are meant to be managed by automation and therefore are [[Properties#Properties are hidden away|hidden out of the view.]]

For tags that **may change**, e.g., `#zette/*`, place them above [[Headings should form tables of contents|H1 title]], so they can be managed manually, but also could be hidden when embedding by header.

For tags that can **target specific blocks**, e.g., `#is/personal`, `#is/nsfw`, place them inline. The surrounding text shows up in search panel, and plugins like *Datacore* could target down to block level.

## Why not use tags for content?

Tags are very powerful for filtering notes, so they are reserved to support [[System/README#Goals|automation]], for example:

```js
// In dataviewJS
const pages = dv.pages("#a/source/book");  // All books in the vault
```

### Tags are hierarchical in nature

Related tags group together naturally. This makes it easy to glance at the vault's overall status in *Tags* panel provided by *Tags view* core plugin:

```
status              62
    pending         33
    processing      20
    archived         9
```

Content, on the other hand, doesn't fit well into strict hierarchies, for example: `Note-taking` could both belong to both `Learning` and `Writing`.

Instead of tagging by content, **links** are used to associate notes with thematic categories. Linked notes can also hold additional information about a category. This forms the basis of the [[System/packages/evergarden-area/README|Area]] system.
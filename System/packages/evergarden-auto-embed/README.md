---
created: 2025-12-30T21:07:01.255+08:00
aliases:
  - evergarden-auto-embed
  - Auto Embed
---
# Auto Embed

Automatically embed UI elements into your notes without altering the Markdown source. Position custom embeds as headers, footers, and [[#order|much more]].

Automatic embeds will show in **Preview mode** and **Live Preview mode**. Switching to **Source mode** reveals the original document without embeds (top bar and bottom bar embeds that are outside the viewport will still remain).

![[Auto Embed example document.png]]
[[Example]] in Preview mode, Live Preview mode, and Source mode, the embeds are defined in `AutoEmbedExample.js`.

## Creating embeds

Auto Embed does not provide a UI for settings configuration. Instead, it provides an API that allows users to define conditions and render UI elements in JavaScript.

If you're unfamiliar with programming but want similar features, see [[#Alternatives]].

### Register embeds

`customJS.AutoEmbed` provides `registerEmbed` and `unregisterEmbed` methods to manage embeds. See [[#embedSpec]] for a detailed description of the format.

```js
// CustomJS script
class AutoEmbedExample {
    embedSpec = {
        id: "auto-embed-example",
        order: -5,
        shouldEmbed: (view) => view.path === "path/to/Example.md",
        renderEmbed: (containerEl, view) => {
            containerEl.createDiv({ text: Embed after properties });
        }
    }
    constructor() {
        customJS.AutoEmbed.registerEmbed(this.embedSpec);
    }
    deconstructor() {
        customJS.AutoEmbed.unregisterEmbed(this.embedSpec.id);
    }
}
```

#### Register embeds with package

[[Violet Package]] provides `registerEmbed` and `unregisterEmbed` methods that are identical in usage, with additional benefits:

- Automatic re-registers embeds when `AutoEmbed` reloads.
- `id` doesn't have to be globally unique, only unique within the package.

```js
// CustomJS script of a package
class AutoEmbedExample extends customJS.Violet.Package {
    onload() {
        // Automatically unregisters when unload
        this.embeds.forEach(embedSpec => this.registerEmbed(embedSpec));
    }
    embeds = [/* embedSpec definitions */];
}
```

### embedSpec

Embeds are defined by `embedSpec`, which can then be registered and rendered by Auto Embed.

| Property                  | Type                                                                                                                                                                              | Description                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| id                        | string                                                                                                                                                                            | Unique id. Embeds with existing `id` will be rejected.                             |
| [[#order]]                | number                                                                                                                                                                            | Determines where the embed is positioned.                                          |
| [[#shouldEmbed]]          | (view: [[#MarkdownView]]) => boolean                                                                                                                                              | Return `true` if the embed should be displayed.                                    |
| [[#renderEmbed]]          | (containerEl: HTMLElement, view: [[#MarkdownView]]) => null                                                                                                                       | Renders the embed into `containerEl`.                                              |
| [[#locatePreviewAnchor]]  | (renderer: [[#MarkdownPreviewRenderer]]) => {anchorEl: HTMLElement, order: number}                                                                                                | (Optional) Required when `order` is `0`, positions the embed in Preview mode.      |
| [[#locateSourcePosition]] | (tree: [Tree](https://lezer.codemirror.net/docs/ref/#common.Tree), editorState: [EditorState](https://codemirror.net/docs/ref/#state.EditorState)) => {pos: number, side: number} | (Optional) Required when `order` is `0`, positions the embed in Live Preview mode. |

#### order

```ts
order: number
```

Embeds with larger `order` appear after those with smaller `order`. The document is defined as `order = 0`.

|            Order | Position                              |
| ---------------: | ------------------------------------- |
| (-Infinity, -40) | Before title bar                      |
|       [-40, -30) | After title bar                       |
|       [-30, -20) | Before inline title, within viewport  |
|       [-20, -10) | After inline title, before properties |
|         [-10, 0) | After properties, before document     |
|                0 | Within Markdown document              |
|          (0, 10) | After document, before footnotes      |
|         [10, 20) | After footnotes, before backlinks     |
|         [20, 30) | After backlinks, within viewport      |
|   [30, Infinity) | Bottom bar                            |

If `embedSpec.order` is `0`, Auto Embed cannot automatically determine placement. In this case, you must provide both [[#locatePreviewAnchor]] and [[#locateSourcePosition]].

> [!NOTE]
> Auto embeds outside the range [-10, 20), i.e., before properties and after backlinks, will not appear in hover preview and embedded notes.

#### shouldEmbed

```ts
shouldEmbed: (view: MarkdownView) => boolean
```

Returns `true` if the embed should be displayed in the given [[#MarkdownView]].

#### renderEmbed

```ts
renderEmbed: (containerEl: HTMLElement, view: MarkdownView) => null
```

Renders the embed into `containerEl`.

##### Render Markdown

Use [MarkdownRenderer.Render()](https://docs.obsidian.md/Reference/TypeScript+API/MarkdownRenderer/render). The `obsidian` variable is available in *CustomJS* scripts.

```js
renderEmbed: (containerEl, view) => {
    obsidian.MarkdownRenderer.render(
        this.app,
        `markdownString`,
        containerEl,
        view.path,
        view
    );
}
```

##### Render Datacore code blocks

```js
renderEmbed: (containerEl, view) => {
    datacore.executeJsx(
        `return await dc.require("path/to/Component.jsx")`,
        containerEl,
        view,
        view.path
    )
}
```

##### Render Dataview code blocks

[Dataview Query Language (DQL)](https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/#dataview-query-language-dql):

```js
renderEmbed: (containerEl, view) => {
    const query = ``;  // Dataview query here
    DataviewAPI.execute(query, containerEl, view, view.path);
}
```

[Dataview JS](https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/#dataview-js):

```js
renderEmbed: (containerEl, view) => {
    DataviewAPI.executeJs(`dv.view("path/to/script")`, containerEl, view, view.path);
}
```

#### locatePreviewAnchor

```js
locatePreviewAnchor: (renderer: MarkdownPreviewRenderer) => {anchorEl: HTMLElement, order: number}
```

Returns:
- `anchorEl`: The element where the embed should be placed before or after in Preview mode.
- `order`: If `order` is negative, the embed is placed before `anchorEl`, otherwise it is placed after `anchorEl`. When multiple embeds are anchored to the same element, embeds with smaller `order` are placed before embeds with larger `order`.

Elements that appear within the Preview mode viewport can be found in `renderer.sections`. See [[#MarkdownPreviewRenderer]] for more information.
##### Example: position after first H1 header

```js
locatePreviewAnchor: (renderer) => (
    anchorEl: renderer.sections.find(s => s.level === 1)?.el,
    order: 1
)
```

#### locateSourcePosition

```js
locateSourcePosition: (
    tree: import('@lezer/common').Tree,
    editorState: import('@codemirror/state').EditorState
) => {pos: number, side: number}
```

Returns:
- `pos`: The document character offset where the embed is inserted.
- `side`: If `side` is negative, the embed is placed before `pos`; otherwise, it is placed after `pos`.

`tree` is a [Tree](https://lezer.codemirror.net/docs/ref/#common.Tree) returned by *CodeMirror*'s [syntaxTree](https://codemirror.net/docs/ref/#language.syntaxTree) function. Use `Tree.iterate` to traverse the document.
`editorState` is a *CodeMirror* [EditorState](https://codemirror.net/docs/ref/#state.EditorState). [[#MarkdownView]] can be accessed by `editorState.field(obsidian.editorViewField)`, and current document content by [editorState.doc](https://codemirror.net/docs/ref/#state.EditorState.doc).

##### Example: position before first H1 header

```js
locateSourcePosition: (tree, editorState) => {
    let pos;
    tree.iterate({
        enter: (node) => {
            if (pos === undefined && node.name.includes("header-1"))
                pos = node.from;
        }
    });
    if (pos)
        return { pos: pos, side: -1 };
}
```

##### Example: position after the first header titled "More editions"

```js
locateSourcePosition: (tree, editorState) => {
    let pos;
    tree.iterate({
        enter: (node) => {
            if (pos === undefined
                && node.name.includes("header")
                && editorState.doc.sliceString(node.from, node.to) === "More editions"
            )
                pos = node.to;
        }
    });
    if (pos)
        return { pos: pos, side: 1 };
}
```

## Tips

### MarkdownView

Official docs: [MarkdownView - Developer Documentation](https://docs.obsidian.md/Reference/TypeScript+API/MarkdownView)

 To see an example of the full contents of a `MarkdownView`, try this command in console:

```js
app.workspace.getActiveFileView().leaf.view
```

### MarkdownPreviewRenderer

Official docs: [MarkdownPreviewRenderer - Developer Documentation](https://docs.obsidian.md/Reference/TypeScript+API/MarkdownPreviewRenderer)

To see an example of the full contents of a `MarkdownPreviewRenderer`, try this command in console:

```js
app.workspace.getActiveFileView().leaf.view.previewMode.renderer
```

## Limitations

- Paragraphs written after footnotes are interpreted as part of footnote by [Lezer](https://lezer.codemirror.net/) (the syntax parser used by *CodeMirror*), which can create unexpected behavior in Live Preview mode.
- Inline embeds are not supported.
- An `embedSpec` can only create one embed and cannot create embeds dynamically, for example, inserting a decoration after every header.
- Creating embeds with excessive height messes with the preview renderer, causing janky behavior or even prevent scrolling.

# Alternatives

[Note Toolbar](https://github.com/chrisgurney/obsidian-note-toolbar)
[Virtual Content](https://github.com/Signynt/virtual-content)
[Obsidian Typing](https://konodyuk.github.io/obsidian-typing/)
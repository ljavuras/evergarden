---
created: 2025-12-22T16:46:29.266+08:00
---
# Example

This file demonstrates automatic embedding[^1] in *Obsidian*. The purple blocks are rendered UI elements and do not exist in the Markdown source. They are injected at render time, are only visible in **Reading mode** and **Live Preview mode**, and do not alter the original text.[^2]

Auto-embed positions are determined by the `order` property. This file demonstrates every possible location an embed can occupy, including an embed that inserts itself after the first H1 heading.

To learn how the embeds shown in this file are defined, see `AutoEmbedExample.js`.

> [!TIP]
> Turn on Source mode in the editor to view the original Markdown without embeds.
> 
> Embeds positioned **before title bar**, **after title bar**, and in **bottom bar** are still shown in Source mode because they are outside viewport and do not affect document flow.

[^1]: Embeds before footnotes appear after all non-footnote Markdown blocks.

This paragraph is interpreted as part of footnote by Lezer, thus embeds before footnote appears before this paragraph in Live Preview mode.

[^2]: Embeds after footnotes appear after the entire Markdown document.
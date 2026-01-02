/**
 * Automatically embed Datacore code blocks into notes
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class AutoEmbedExample extends customJS.Violet.Package {
    onload() {
        this.embeds.forEach((embedSpec) => this.registerEmbed(embedSpec));
    }

    isExampleNote(path) {
        return path === `${this.path}/Example.md`;
    }

    embedStyle = 
    `padding: var(--size-4-1) var(--size-4-2);
    background: rgba(var(--color-purple-rgb), 0.2);`;
    embeds = [
        {
            id: `test:-45`,
            order: -45,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "Before title bar: order < -40",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:-35`,
            order: -35,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "After title bar: -40 <= order < -30",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:-25`,
            order: -25,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "Before inline title: -30 <= order < -20",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:-15`,
            order: -15,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "After inline title, before properties: -20 <= order < -10",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:-5`,
            order: -5,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "After properties, before document: -10 <= order < 0",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:after-first-header`,
            order: 0,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.style = this.embedStyle;
                el.createEl('div', {
                    text: "Within markdown document: order === 0"
                });
                const content = el.createEl('div');
                content.appendText("Embeds with order === 0 has to provide ");
                content.createEl('code', { text: "locatePreviewAnchor" });
                content.appendText(" and ");
                content.createEl('code', { text: "locateSourcePosition" });
                content.appendText(" for embeds to position themselves in the document.");
                el.createEl('div', {
                    text: "This embed positions itself after the first H1 header."
                });
            },
            locatePreviewAnchor: (renderer) => ({
                // First H1 header in the document
                anchorEl: renderer.sections.find(s => s.level === 1)?.el,
                order: 1
            }),
            locateSourcePosition: (tree, editorState) => {
                let pos;
                tree.iterate({
                    enter: (node) => {
                        // First H1 header in the document
                        if (pos === undefined
                            && node.name.includes("header-1")
                        ) {
                            pos = node.to;
                        }
                    }
                });
                if (pos) {
                    return { pos: pos, side: 1 };
                }
            }
        },
        {
            id: `test:5`,
            order: 5,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "After document, before footnotes: 0 < order < 10",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:15`,
            order: 15,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "After footnotes, before backlinks: 10 <= order < 20",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:25`,
            order: 25,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "After backlinks: 20 <= order < 30",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
        {
            id: `test:35`,
            order: 35,
            shouldEmbed: (view) => this.isExampleNote(view.path),
            renderEmbed: (el, view) => {
                el.createDiv({
                    text: "Bottom bar: 30 <= order",
                    attr: {
                        style: this.embedStyle
                    },
                });
            },
        },
    ]
}
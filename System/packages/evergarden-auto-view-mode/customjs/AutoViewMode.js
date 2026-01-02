/**
 * Automatically set view mode for `#is/dynamic` notes
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class AutoViewMode extends customJS.Violet.Package {
    onload() {
        this.app.workspace.onLayoutReady(() => {
            this.app.workspace.iterateAllLeaves((leaf) => {
                this.checkAndChangeMode(leaf);
            })

            this.registerEvent(
                this.app.workspace.on('active-leaf-change', (leaf) => {
                    this.checkAndChangeMode(leaf);
                })
            )
        });
    }

    checkAndChangeMode(leaf) {
        const { Obsidian } = customJS;
        const state = leaf.getViewState();

        // Filter MarkdownView
        if (state.type !== "markdown") { return; }

        if (state.state.mode === "source"
        && Obsidian.file.getTags(Obsidian.vault.getFile(state.state.file))
        ?.some((tag) => {
            return tag === "#is/dynamic"
                || tag.startsWith("#is/dynamic/");
        })) {
            this.toggleReadingMode(leaf);
        }
    }

    toggleReadingMode(leaf) {
        const state = leaf.getViewState();

        state.state.mode = "preview";
        leaf.setViewState(state);
    }
}
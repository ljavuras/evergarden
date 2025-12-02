/**
 * Updates book progress automatically if viewed in Obsidian's PDF viewer.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class ProgressUpdateService extends customJS.Violet.Package {
    FRONTMATTER_FILE = "library/file";
    FRONTMATTER_PROGRESS = "library/progress";
    _registeredLeaves = new Set();

    registerPDFPageChangeEvent = (leaf) => {
        if (leaf.view.getViewType() != "pdf") { return; }

        /**
         * Update source files' progress tracker on page-change
         * @param {*} event - Page change event
         */
        leaf.pageChangeHandler = (event) => {
            let sourceFiles = [];
            const backLinks = customJS.Obsidian.file.getBackLinks(leaf.view.file);

            // Find source files, whose FRONTMATTER_FILE links to pdf of this leaf
            for (const path of backLinks.keys()) {
                for (const link of backLinks.get(path)) {
                    if (link.key == this.FRONTMATTER_FILE) {
                        sourceFiles.push(customJS.Obsidian.vault.getFile(path));
                    }
                }
            }
            sourceFiles.forEach((sourceFile) => {
                customJS.Obsidian.frontmatter.set(
                    sourceFile,
                    { [this.FRONTMATTER_PROGRESS]: event.pageNumber }
                );
            })
        };

        leaf.view.viewer.child.pdfViewer.eventBus
            .on('pagechanging', leaf.pageChangeHandler);
        this._registeredLeaves.add(leaf);
    };

    unregisterPDFPageChangeEvent = (leaf) => {
        if (leaf.view.getViewType() != "pdf") { return; }

        leaf.view.viewer.child.pdfViewer.eventBus
            .off('pagechanging', leaf.pageChangeHandler);
        delete leaf.pageChangeHandler;
        
        this._registeredLeaves.delete(leaf);
    }
    
    // Register page-change event handlers when a new leaf is created 
    onload() {
        const onLayoutReady = () => {
            this.app.workspace.iterateAllLeaves((leaf) => {
                this.registerPDFPageChangeEvent(leaf);
            });
            this.registerEvent(
                this.app.workspace.on('leaf-created', (leaf) => {
                    this.registerPDFPageChangeEvent(leaf);
                })
            );
            this.registerEvent(
                this.app.workspace.on('leaf-detached', (leaf) => {
                    this.unregisterPDFPageChangeEvent(leaf);
                })
            );
        };
        
        this.app.workspace.layoutReady
            ? onLayoutReady()
            : this.app.workspace.onLayoutReady(onLayoutReady);
    }

    // Unregister all existing page-change event handlers
    onunload() {
        this._registeredLeaves.forEach((leaf) => {
            this.unregisterPDFPageChangeEvent(leaf);
        });
    }
}
/**
 * Provides extra events for workspace
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class WorkspaceEvents extends customJS.Violet.Package {
    onload() {
        // Find differences for each layout-change event, emit leaf-created
        // and leaf-detached event
        let leaves = new Set();
        const onLayoutReady = () => {
            this.app.workspace.iterateAllLeaves((leaf) => {leaves.add(leaf)});
            let event_ref = this.app.workspace.on('layout-change', () => {
                let leaves_next = new Set();
                this.app.workspace.iterateAllLeaves((leaf) => {leaves_next.add(leaf)});
                const created = leaves_next.difference(leaves);
                const detached = leaves.difference(leaves_next);
                if (created.size) {
                    created.forEach((leaf) => {
                        this.app.workspace.trigger('leaf-created', leaf);
                    })
                }
                if (detached.size) {
                    detached.forEach((leaf) => {
                        this.app.workspace.trigger('leaf-detached', leaf);
                    })
                }
                leaves = leaves_next;
            });
            this.registerEvent(event_ref);
        }

        if (this.app.workspace.layoutReady) {
            onLayoutReady();
        } else {
            this.app.workspace.onLayoutReady(onLayoutReady);
        }
    }
}
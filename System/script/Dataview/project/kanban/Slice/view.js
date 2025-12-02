/**
 * Creates a slice of kanban cards across all project kanbans
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Obsidian, Projects, Kanban } = await cJS();
const containerEl = input?.containerEl ?? dv.container;

// Get "In Progress" lanes from all active project
/** @type customJS.Kanban.Lane[] */
let lanes = Projects.getProjects("active")
.map((project) => {
    if (project.kanban) {
        return Kanban.get(project.kanban);
    }
})
.filter(kanban => kanban)  // Remove undefined kanban
.map(kanban => kanban.getLaneByName("In Progress"))
.filter(lane => lane.length);  // Remove empty lanes

containerEl.addClass("kanban-slice")

// Render top bar
let titleEl = containerEl.createDiv("kanban-slice__title");
titleEl.createSpan({
    cls: "kanban-slice__title-option",
    text: "In Progress"
});
titleEl.appendText(" items in ");
titleEl.createSpan({
    cls: "kanban-slice__title-option",
    text: "active projects"
});
 
let statusEl = containerEl.createDiv("kanban-slice__status");
statusEl.createEl("strong", { text: lanes.reduce((acc, lane) => acc + lane.length, 0) });
statusEl.appendText(" items accross ");
statusEl.createEl("strong", { text: lanes.length });
statusEl.appendText(" projects");

// Render lanes
let lanesEl = containerEl.createDiv("kanban-slice__lanes");
for (const lane of lanes) {
    let laneEl = lanesEl.createDiv("kanban-slice__lane");
    let laneTitleEl = lane.kanban.link.toAnchor(true);
    laneTitleEl.addClass("kanban-slice__lane-title");
    laneEl.appendChild(laneTitleEl);
    laneTitleEl.createDiv({
        cls: "kanban-slice__lane-title-project",
        text: lane.project.name
    })
    laneTitleEl.createSpan({
        cls: "kanban-slice__lane-title-counter",
        text: lane.length
    });
    for (const card of lane.cards) {
        let cardEl = laneEl.createDiv("kanban-slice__card");
        Obsidian.renderMarkdown(
            await card.content,
            cardEl,
            card.kanban.file.path,
            dv.component
        );
    }
}

// Allow lanesEl to spill horizontally to the width of view-content
const obsidianViewContent = Obsidian.workspace
    .getLeafByFilePath(dv.currentFilePath)  // Get workspaceLeaf
    .view.contentEl;

// Allow lanes to spill from dataviewjs container width to view content width
function resizeLanesSpill() {
    let spillPx = (obsidianViewContent.clientWidth - dv.container.offsetWidth) / 2;
    spillPx = spillPx < 32 ? 32 : spillPx;
    const spillStyle = `--kanban-slice-lanes-spill-js: ${spillPx}px;`;
    lanesEl.setAttr("style", spillStyle);
}

// Resize and register listener on initialization
if (!dv.component.hasLanesSpillListener) {
    dv.component.registerEvent(
        app.workspace.on('resize', resizeLanesSpill)
    );
    dv.component.hasLanesSpillListener = true;
    resizeLanesSpill();
}
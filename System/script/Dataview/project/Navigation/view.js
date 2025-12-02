/**
 * Top bar navigation for project notes
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { obsidian, Obsidian, Projects, Kanban } = await cJS();
const containerEl = input?.containerEl ?? dv.container

// TODO: handle project error
const project = Projects.getProjectByPath(dv.currentFilePath);

class Tab {
    constructor(name, iconId, file, fullName, createFn, countFn) {
        let tabEl;
        if (file) {
            tabEl = new Obsidian.Link(file, dv.currentFilePath).toAnchor();
            tabEl.setText("");
        } else {
            tabEl = createFragment().createDiv();
            tabEl.onclick = () => {
                new this.createNoteModal(project, fullName, createFn).open();
            }
        }
        tabEl.addClass("project-navigation__tab");
        if (dv.currentFilePath == file?.path) {
            tabEl.addClass("selected");
        }

        if (iconId) { obsidian.setIcon(tabEl.createDiv("icon-wrap"), iconId); }
        tabEl.createSpan({ text: name });

        // Run countFn() if file exists and countFn is function
        if (file && countFn && {}.toString.call(countFn) === '[object Function]') {
            tabEl.createSpan({ cls: "project-navigation__tab-count" })
                .setText(countFn());
        }

        if (!file) {
            tabEl.addClass("disabled");
            obsidian.setIcon(tabEl.createDiv("icon-wrap"), "plus");
            obsidian.setTooltip(tabEl, `Create ${fullName}`);
        }

        return tabEl;
    }

    createNoteModal = class extends obsidian.Modal {
        constructor(project, noteName, createFn) {
            super(app);
            this.project = project;
            this.name = noteName;
            this.createFn = createFn;
        }

        onOpen() {
            this.contentEl.createEl("style", { attr: { scope: "" }, text: `
                .actions-container {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--size-4-1);
                }
                `
            });
            this.contentEl.createEl("p", {
                text: `Create ${this.name} for project ${this.project.name}?`,
            });
            
            let actionsEl = this.contentEl.createDiv("actions-container");
            actionsEl.createEl("button", { text: "Create", cls: "mod-cta" })
                .onclick = async () => {
                    this.close();
                    let note = await this.createFn();
                    Obsidian.vault.openFile(note, "new-tab");
                }
            
            actionsEl.createEl("button", { text: "Cancel" })
                .onclick = () => {
                    this.close();
                }
        }

        onClose() {
            this.contentEl.empty();
        }
    }
}

const tabs = [
    new Tab(project.name, "home", project.file),
    new Tab(
        "Issues",
        "circle-dot",
        project.issueTracker,
        "Issue Tracker",
        async () => { return await project.createIssueTracker(); },
        () => {
            return dv.pages(`"${project.path}"`)
                .filter(p => p['issue/status'] == "open")
                .length;
        }
    ),
    new Tab(
        "Kanban",
        "kanban-square",
        project.kanban,
        "Kanban",
        async () => { return project.createKanban(); },
        () => {
            return Kanban.get(project.kanban)
                .getLaneByName("In Progress")?.length ?? 0;
        }
    ),
]

const navigationEl = containerEl.createEl('nav', { cls: "project-navigation" });
const tabsEl = navigationEl.createEl('ul', { cls: "project-navigation__tabs-container" });
for (let tab of tabs) {
    tabsEl.createEl('li', { cls: "project-navigation__tab-container" })
        .appendChild(tab);
}
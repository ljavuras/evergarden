/**
 * Issue tracker built upon Dataview plugin
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 * ======================================== */

const { obsidian, Obsidian, Projects, Kanban } = await cJS();

let options = {
    locale: 'en-US',
}

const containerEl = dv.container;  // dv is exposed by `dv.view()`

const issueTFile = Obsidian.vault.getFile(dv.currentFilePath);
const issueInfo = {
    ...dv.current(),
};

class kanbanBadge {
    constructor(containerEl) {
        let project = Projects.getProjectByFile(issueTFile);
        let kanban = project.kanban && Kanban.get(
            Projects.getProjectByFile(issueTFile).kanban
        );
        let card = kanban && kanban.getCardByFile(issueTFile);

        // Render badge
        this.el = containerEl.createDiv("kanban-badge");
        if (card) {
            // Issue is on kanban
            this.el.createDiv({ cls: "badge-title", text: "Kanban" });
            let badgeContent = this.el.createDiv({
                cls: "badge-content",
                text: card.lane.title
            });
            this.laneSuggest = new Obsidian.PopoverSuggest(
                dv.app,
                undefined,
                badgeContent,
                () => {
                    return [...kanban.lanes
                        .filter(lane => lane.title != card.lane.title)
                        .map(lane => lane.title),
                        "Remove from kanban"];
                },
                (lane, el) => { el.setText(lane); },
                async (selectedLane) => {
                    if (selectedLane == "Remove from kanban") {
                        card.remove();
                    } else {
                        await card.moveToLane(selectedLane);
                    }
                },
            );
            this.el.onclick = () => {
                this.laneSuggest.toggle();
            }
        } else if (kanban) {
            // Issue isn't on kanban
            this.el.createDiv({ cls: "badge-content", text: "Send to kanban"});
            this.el.onclick = () => {
                kanban.insertLink(kanban.lanes[0].title, issueTFile)
            }
        } else {
            // Kanban doesn't exist
        }
    }
}

class LabelChip {
    constructor(containerEl, labelText) {
        this.el = containerEl.createSpan({ cls: "label-chip" });
        this.el.setAttribute("label", labelText);
        this.el.innerHTML = labelText;
    }
}

/** Returns a SVGElement */
const getIcon = {
    open: () => {
        let icon = obsidian.getIcon('circle-dot');
        icon.addClass("issue-open");
        return icon;
    },
    closed: () => {
        let icon = obsidian.getIcon('check-circle');
        icon.addClass("issue-closed");
        return icon;
    },
}

class StatusDisplay {
    constructor(containerEl) {
        this.el = containerEl.createDiv({
            cls: `status-display status-${issueInfo['issue/status']}`
        });
        this.el.appendChild(getIcon[issueInfo['issue/status']]());
        this.el.appendChild(
            // Captalize first letter
            new Text(issueInfo['issue/status'].charAt(0).toUpperCase()
                   + issueInfo['issue/status'].slice(1))
        );
    }
}

class StatusToggle {
    constructor(containerEl) {
        this.el = containerEl.createEl('button', {
            cls:  "status-toggle",
        });
        if (issueInfo['issue/status'] == "open") {
            this.el.addClass("status-open");
            this.el.innerHTML = "Close Issue";
        } else {
            this.el.addClass("status-closed");
            this.el.innerHTML = "Reopen Issue";
        }

        this.el.onclick = () => {
            app.fileManager.processFrontMatter(issueTFile, (frontmatter) => {
                if (frontmatter['issue/status'] == "open") {
                    frontmatter['issue/status'] = "closed";
                } else {
                    frontmatter['issue/status'] = "open";
                }
            })
        }
    }
}

containerEl.addClass("issueTracker-issue");

let topBarEl = containerEl.createDiv({ cls: "issue-topBar" });
new kanbanBadge(topBarEl);
for (const labelText of (issueInfo['issue/labels'] || [])) {
    new LabelChip(topBarEl, labelText);
}

let widgetsEl = containerEl.createDiv({ cls: "issue-widgets"});
new StatusDisplay(widgetsEl);
widgetsEl.createDiv({
    cls:  "issue-info",
    text: `#${issueInfo['issue/no']} opened ${issueInfo
                .created
                .setLocale(options.locale)
                .toRelativeCalendar()}`
    });
new StatusToggle(widgetsEl);
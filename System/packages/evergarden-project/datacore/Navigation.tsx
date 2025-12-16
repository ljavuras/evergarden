/**
 * Project navigation bar
 */

const { obsidian, Obsidian, Projects, Kanban, Datacore } = await cJS();

class createNoteModal extends obsidian.Modal {
    constructor(message, createFn) {
        super(dc.app);
        this.message = message;
        this.createFn = createFn;
    }

    onOpen() {
        dc.preact.render(
            <>
            <style scope=" ">{`
                .actions-container {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--size-4-1);
                }`}
            </style>
            <p>{this.message}</p>
            <div class="actions-container">
                <button
                    className="mod-cta"
                    onClick={async () => {
                        this.close();
                        let note = await this.createFn();
                        Obsidian.vault.openFile(note, "new-tab");
                    }}
                >
                    Create
                </button>
                <button onClick={() => this.close()}>Cancel</button>
            </div>
            </>,
            this.contentEl
        );
    }

    onClose() {
        this.contentEl.empty();
    }
}

function Anchor({ link, className, children }) {
    return <a
                aria-label={link.displayOrDefault()}
                className={"internal-link " + className}
                target="_blank"
                rel="noopener"
                data-tooltip-position="top"
                data-href={link.obsidianLink()}
                href={link.obsidianLink()}
            >
                {children}
            </a>
}

function DisabledTab({ className, onClick, children }) {
    return (
        <div onClick={onClick} className={`${className} disabled`}>
            {children}
        </div>
    );
}

function Tab({ name, icon, link, count, onClick, selected }) {
    const tabClass = "tab";
    return link.path
        ? (
            <Anchor
                className={tabClass + (selected? " selected" : "")}
                link={link}
            >
                <dc.Icon icon={icon} />
                {name}
                {typeof count === "number" &&
                    <span className="counter">{count}</span>
                }
            </Anchor>
        )
        : (
            <DisabledTab className={tabClass} onClick={onClick}>
                <dc.Icon icon={icon} />
                {name}
                <dc.Icon icon="plus" />
            </DisabledTab>
        )
}

function useProject() {
    const project = Projects.getProjectByPath(dc.useCurrentPath());
    dc.useFile(project?.file.path);
    return project;
}

function IssueTrackerTab({ project }) {
    const issueTracker = project?.issueTracker;

    const openIssueCount = dc.useQuery(
        `@page and path("${project?.path}") and $row["issue/status"] = "open"`
    ).length;
    const createIssueTracker = dc.useCallback(() => {
        new createNoteModal(
            `Create issue tracker for project ${project?.name}?`,
            async () => await project?.createIssueTracker()
        ).open();
    }, []);

    return (
        <Tab
            name="Issues"
            icon="circle-dot"
            link={dc.fileLink(issueTracker?.path)}
            count={openIssueCount}
            onClick={createIssueTracker}
            selected={dc.currentPath() === issueTracker?.path}
        />
    )
}

function KanbanTab({ project }) {
    // const kanban = useKanban(project);
    const kanban = project?.kanban;

    const kanbanRevision = dc.useFile(kanban?.path)?.$revision;
    const inProgressCount = dc.useMemo(() => {
        return Kanban.get(kanban)?.getLaneByName("In Progress")?.length ?? 0;
    }, [kanbanRevision]);
    const createKanban = dc.useCallback(() => {
        new createNoteModal(
            `Create kanban for project ${project?.name}?`,
            async () => await project?.createKanban()
        ).open()
    }, []);

    return (
        <Tab
            name="Kanban"
            icon="kanban-square"
            link={dc.fileLink(kanban?.path)}
            count={inProgressCount}
            onClick={createKanban}
            selected={dc.currentPath() === kanban?.path}
        />
    )
}

function ProjectNavigation() {
    const project = useProject();

    return (
        <nav className="project-navigation">
            <ul className="tabs-container">
                {[
                    <Tab
                        name={project?.name}
                        icon="home"
                        link={dc.fileLink(project?.file.path)}
                        selected={dc.currentPath() === project?.file?.path}
                    />,
                    <IssueTrackerTab project={project} />,
                    <KanbanTab project={project} />
                ]
                .map((tab) => <li className="tab-container">{tab}</li>)}
            </ul>
        </nav>
    )
}

return ProjectNavigation;
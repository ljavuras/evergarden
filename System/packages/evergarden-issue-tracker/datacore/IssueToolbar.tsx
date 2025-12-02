const { app, obsidian, Obsidian, Projects, Kanban } = await cJS();
const { useRef, useMemo, useEffect, useCallback, useState } = dc;

const options = {
    locale: 'en-US',
};

function useProject() {
    const fileRevision = dc.useCurrentFile()?.$revision;
    const projectRef = useRef(Projects.getProjectByPath(dc.currentPath()));
    const projectRevision = dc.useFile(projectRef.current?.path)?.$revision;

    useEffect(() => {
        projectRef.current = Projects.getProjectByPath(dc.currentPath());
    }, [fileRevision, projectRevision]);

    return projectRef.current;
}

function KanbanBadge() {
    const issueFile = useRef(app.vault.getFileByPath(dc.currentPath())).current;
    const project = useProject();

    const kanbanRevision = dc.useFile(project?.kanban?.path).$revision;
    const kanbanRef = useRef(Kanban.get(project.kanban));
    const cardRef = useRef(kanbanRef.current.getCardByFile(issueFile));
    useEffect(() => {
        kanbanRef.current = Kanban.get(project.kanban);
        cardRef.current = kanbanRef.current.getCardByFile(issueFile);
    }, [kanbanRevision]);

    let laneSuggest;
    const badgeRef = useRef();
    const badgeClickHandler = useCallback(
        cardRef.current
            ? () => {
                laneSuggest = laneSuggest ?? new Obsidian.PopoverSuggest(
                    app,
                    undefined,
                    badgeRef.current,
                    () => {
                        return [...kanbanRef.current.lanes
                            .map(lane => lane.title),
                            "Remove from kanban"];
                    },
                    (lane, el) => { el.setText(lane); },
                    (selectedLane) => {
                        if (selectedLane === "Remove from kanban") {
                            cardRef.current.remove();
                        } else {
                            cardRef.current.moveToLane(selectedLane);
                        }
                    },
                );
                laneSuggest.toggle();
            }
            : () => {
                kanbanRef.current.insertLink(kanbanRef.current.lanes[0].title, issueFile);
            },
        [!!cardRef.current]
    );

    return (
        <div className="kanban-badge">
            {kanbanRef.current &&
                <>
                {cardRef.current && <div className="badge-title">Kanban</div>}
                <div
                    className="badge-content"
                    ref={badgeRef}
                    onClick={badgeClickHandler}
                >
                    {cardRef.current? cardRef.current.lane.title : "Send to kanban"}
                </div>
                </>
            }
        </div>
    )
}

const statusIcon = {
    open: "circle-dot",
    closed: "check-circle"
};

function StatusDisplay({ status }) {
    // Capitalize first letter
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    return (
        <div className={"status-display status-" + status}>
            <dc.Icon icon={statusIcon[status]} />
            {statusText}
        </div>
    )
}

function StatusToggle({ status, setStatus }) {
    const currentFile = app.vault.getFileByPath(dc.currentPath());
    return (
        <button
            className={"status-toggle status-" + status}
            onClick={() => {
                const newStatus = status === "open"? "closed" : "open";
                setStatus(newStatus);
                Obsidian.frontmatter.set(
                    currentFile,
                    { "issue/status": newStatus }
                );
            }}
        >
            { status === "open"? "Close Issue" : "Reopen Issue" }
        </button>
    )
}

return function IssueToolbar() {
    const frontmatter = dc.useCurrentFile()?.$frontmatter;
    const [status, setStatus] = useState(frontmatter["issue/status"]?.value);
    const labels = frontmatter?.["issue/labels"]?.value;
    return (
        <div className="issueTracker-issue">
            <div className="issue-topBar">
                <KanbanBadge />
                {labels?.map((label) => (
                    <span className="label-chip" label={label}>{label}</span>
                ))}
            </div>
            <div className="issue-widgets">
                <StatusDisplay status={status} />
                <div className="issue-info">
                    {`#${frontmatter["issue/no"].value} opened ${
                        frontmatter.created.value
                            .setLocale(options.locale)
                            .toRelativeCalendar()
                    }`}
                </div>
                <StatusToggle status={status} setStatus={setStatus} />
            </div>
        </div>
    );
}
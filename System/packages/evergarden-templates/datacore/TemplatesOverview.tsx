/**
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { obsidian, app, Script } = await cJS();
const { Templates } = VPS.require("evergarden-templates");

const {
    Pill,
    SelfHandledInternalLink,
    ClickableIcon,
    Button,
} = await dc.require("evergarden-design-system", "Primitive");
const { useState, useEffect, useRef } = dc;

const FM_TEMPLATE_NAME = Templates.getFrontmatterKey("template");
const FM_TEMPLATE_VERSION = Templates.getFrontmatterKey("templateVersion");

/** Group header, grouping templates from the same package or plugin */
function TemplateSource({ source } : { source: {type: string, id: string} }) {
    if (!source) return;
    const name = source.type === "package"
        ? globalThis.VPS.getPackageNameById(source.id)
        : app.plugins.plugins[source.id].manifest.name;
    const path = (source.type === "plugin" && source.id === "templater-obsidian")
        ? app.plugins.plugins[source.id].settings.templates_folder
        : null;
    return (
        <div className="template-source">
            <Pill>{source.type}</Pill>
            <span className="name">{name}</span>
            {path? <code className="path">{path}</code> : <></>}
            <span className="id">{source.id}</span>
        </div>
    )
}

function TemplateBasename({ templateInfo }) {
    const ref = useRef();
    useEffect(() => {
        if (ref.current) {
            ref.current.parentElement.parentElement
                .onclick = () => new TemplateDetailModal(templateInfo).open()
        }
    }, [ref.current])
    return (
        <div ref={ref}>
            {templateInfo.file.basename}
        </div>
    )
}

function TemplateVersion({ templateInfo }) {
    return (
        <div className="version">{
            templateInfo.version
                ? <>
                    <span className="text-faint">Version</span> {templateInfo.version}
                </>
                : <></>
        }</div>
    );
}

function OutdateIndicator({ templateInfo }) {
    const outdatedNotes = templateInfo.notes.outdated;

    // Set tooltip
    const ref = useRef();
    useEffect(() => {
        ref.current && obsidian.setTooltip(ref.current, "Missing updater");
    }, [ref.current]);

    return outdatedNotes.size > 0
        ? <div ref={ref} className="outdated-indicator">
            <dc.Icon icon="alert-triangle" />
            {outdatedNotes.size}
        </div>
        : <></>
}

function UpdateIndicator({ templateInfo }) {
    const updatableNotes = templateInfo.notes.updatable;

    // Set tooltip
    const ref = useRef();
    useEffect(() => {
        ref.current && obsidian.setTooltip(ref.current, "Update available");
    }, [ref.current]);

    return updatableNotes.size > 0
        ? <div ref={ref} className="updatable-indicator">
            <dc.Icon icon="arrow-up-circle" />
            {updatableNotes.size}
        </div>
        : <></>
}

function NoteCount({ templateInfo }) {
    return (
        <div className="note-count">{
            templateInfo.notes.length
                ? <>
                    {templateInfo.notes.length} <span className="text-faint">Notes</span>
                </>
                : <></>
        }</div>
    );
}

function useTemplateInfo() {
    const notes = dc.useQuery(`@page and exists("${FM_TEMPLATE_NAME}")`);
    const [templateInfos, setTemplateInfos] = useState([]);

    function setEqual(set1: Set<object>, set2: Set<object>) {
        return set1.size === set2.size
            && Array.from(set1).every((i) => set2.has(i));
    }

    const userTemplates = Templates.getUserTemplates();
    const allTemplates = userTemplates
        .union(Templates.getParsers())
        .union(Templates.getComposers());

    const userTemplatesRef = useRef(userTemplates);
    const allTemplatesRef = useRef(allTemplates);
    if (!setEqual(userTemplates, userTemplatesRef.current))
        userTemplatesRef.current = userTemplates;
    if (!setEqual(allTemplates, allTemplatesRef.current))
        allTemplatesRef.current = allTemplates;

    const revisionSum = Array.from(userTemplates).reduce((acc, templateInfo) => {
        return acc + (datacore.page(templateInfo.file.path)?.$revision ?? -1);
    }, 0);

    // Get templates and category them by status
    useEffect(async () => {
        const templates = await Promise.all(
            Array.from(userTemplates).map(async (templateInfo: object) => {
                // Get template version and excerpt
                const script = Script.get(templateInfo.file);
                templateInfo.version = await script.getVersion();
                templateInfo.excerpt = await script.getExcerpt();

                // Get notes, updatable notes, and outdated notes
                templateInfo.updatableVersions = new Set();
                templateInfo.notes = notes.filter(
                    note => note.field(FM_TEMPLATE_NAME).value.path === templateInfo.file.path
                ) ?? [];
                templateInfo.notes.latest = new Set();
                templateInfo.notes.updatable = new Set();
                templateInfo.notes.outdated = new Set();
                await Promise.all(templateInfo.notes.map(
                    async (note: _MarkdownPage) => {
                        const file = app.vault.getFileByPath(note.$path);
                        const version = note.field(FM_TEMPLATE_VERSION).value;
                        if (version >= templateInfo.version) {
                            templateInfo.notes.latest.add(note);
                        }
                        else if (templateInfo.updatableVersions.has(version)) {
                            templateInfo.notes.updatable.add(note);
                        }
                        else if (
                            (await Templates.tryUpdate(file, templateInfo.version)).success
                        ) {
                            templateInfo.notes.updatable.add(note);
                            templateInfo.updatableVersions.add(version);
                        } else {
                            templateInfo.notes.outdated.add(note);
                        }
                    }
                ));
                return templateInfo;
            })
        );
        setTemplateInfos(templates);
    }, [
        notes,
        userTemplatesRef.current,
        allTemplatesRef.current,
        revisionSum,
    ]);

    return templateInfos;
}

/**
 * Overview of user templates, lists information:
 * - Notes of each template
 * - Current version
 * - Updatable and outdate indicators
 */
function TemplatesOverview() {
    const templateInfos = useTemplateInfo();
    const groupedTemplateInfo = dc.useArray(
            templateInfos,
            array => array.groupBy(template => template.source)
        );

    const ROWS = groupedTemplateInfo;
    const COLUMNS = [
        {
            id: "basename",
            value: row => <TemplateBasename templateInfo={row} />
        },
        {
            id: "version",
            value: row => <TemplateVersion templateInfo={row} />
        },
        {
            id: "outdate-indicator",
            value: row => <OutdateIndicator templateInfo={row} />
        },
        {
            id: "update-indicator",
            value: row => <UpdateIndicator templateInfo={row} />
        },
        {
            id: "count",
            value: row => <NoteCount templateInfo={row} />,
        }
    ];

    return (
        <div className="evergarden templates">
            <h1>Templates</h1>
            <dc.Table
                rows={ROWS}
                columns={COLUMNS}
                groupings={key => <TemplateSource source={key} />}
            />
        </div>
    )
}

class TemplateDetailModal extends obsidian.Modal {
    constructor(templateInfo) {
        super(app);
        this.setTitle(templateInfo.file.basename);
        dc.render(TemplateDetail, { templateInfo }, this.contentEl);
    }

    onClose() {
        // Unmount components
        dc.render(null, {}, this.contentEl);
    }
}

function NoteList({ templateInfo }) {
    const NoteRow = ({ note } : { note: _MarkdownPage }) => {
        const outdated = templateInfo.notes.outdated.has(note);
        const latest = templateInfo.notes.latest.has(note);
        return (
            <SelfHandledInternalLink
                className="note"
                link={note.$link}
            >
                <span className="title">{note.$name}</span>
                <span className="version">
                    <span className="text-faint">
                        Version
                    </span> {
                        note.field(FM_TEMPLATE_VERSION).value
                    }
                </span>
                <ClickableIcon
                    className="update-note"
                    icon={latest
                        ? "circle-check-big"
                        : outdated
                            ? "x"
                            : "arrow-big-up-dash"
                    }
                    disabled={latest || outdated}
                    label={latest
                        ? "Up to date"
                        : outdated
                            ? "Missing updater"
                            : "Update"
                    }
                    onMouseOver={e => e.stopPropagation()}
                    onClick={e => {
                        e.stopPropagation();
                        Templates.update(app.vault.getFileByPath(note.$path));
                    }}
                />
            </SelfHandledInternalLink>
        )
    };

    templateInfo.notes.sort((a, b) => {
        if (a.$path > b.$path)
            return 1;
        else if (a.$path < b.$path)
            return -1;
        return 0;
    });
    return templateInfo.notes?.length
    ? <div className="note-list">
        {templateInfo.notes.map(note => <NoteRow note={note} />)}
    </div>
    : <></>
}

function TemplateProgress(
    { latest, updatable, outdated }
    : { latest: number, updatable: number, outdated: number }
) {
    const total = latest + updatable + outdated;
    const legends = {
        latest: "Up to date",
        updatable: "Update available",
        outdated: "Outdated",
    }
    const progressItems = [];
    const progressLegends = [];
    for (const [key, value] of Object.entries({ latest, updatable, outdated })) {
        if (value) {
            progressItems.push(
                <div
                    className={`progress-item ${key}`}
                    style={{ width: `${(value/total)*100}%` }}
                />
            );
            progressLegends.push(
                <li className={`legend ${key}`}>
                    <span className="label">
                        {legends[key]}
                    </span> {value}
                </li>
            );
        }
    }
    return (
        (latest || updatable || outdated)
        ? <div className="template-progress">
            <div className="progress">
                {progressItems}
            </div>
            <ul className="progress-legend">
                {progressLegends}
            </ul>
        </div>
        : <></>
    )
}

function UpdateAllButton({ templateInfo }) {
    const [isUpdating, setIsUpdating] = useState(false);
    return (
        <Button
            mod="cta"
            className="update-all"
            disabled={!templateInfo.notes.updatable.size}
            isLoading={isUpdating}
            onClick={async () => {
                let updateNotice = new obsidian.Notice("", 0);
                let amount = templateInfo.notes.updatable.size;
                let count = 0;
                updateNotice.noticeEl.addClass("is-loading");
                setIsUpdating(true);
                for (const note of templateInfo.notes.updatable) {
                    count += 1;
                    updateNotice.setMessage(
                        `[Package] evergarden-templates\n` +
                        `Updating notes (${count}/${amount})\n` +
                        `Template: ${templateInfo.file.basename}\n` +
                        `File: ${note.$name}.${note.$extension}`
                    );
                    await Templates.update(app.vault.getFileByPath(note.$path));
                }
                updateNotice.noticeEl.removeClass("is-loading");
                setIsUpdating(false);
                setTimeout(() => { updateNotice.hide() }, 4000);
                new obsidian.Notice(
                    `[Package] evergarden-templates\n` +
                    `${amount} notes updated to latest version of template ${templateInfo.file.basename}`
                );
            }}
        >
            Update all
        </Button>
    )
}

/**
 * Show details of a single template
 * - Numbers of updatable and outdated notes
 * - Notes generated by this template
 */
function TemplateDetail({ templateInfo }) {
    const summary = <div className="summary">
        {templateInfo.notes.length} notes in total
    </div>

    return (
        <div className="evergarden template-detail markdown-rendered">
            <div className="excerpt">{templateInfo.excerpt}</div>
            {summary}
            <TemplateProgress
                latest={templateInfo.notes.latest.size}
                updatable={templateInfo.notes.updatable.size}
                outdated={templateInfo.notes.outdated.size}
            />
            <UpdateAllButton templateInfo={templateInfo} />
            <NoteList templateInfo={templateInfo} />
        </div>
    )
}

return {
    TemplatesOverview,
    TemplateDetail,  // Export so it can be discovered in scriptCache then wrapped
};